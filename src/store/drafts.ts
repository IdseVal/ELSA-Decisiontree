/**
 * The store's write path (docs/specs/application.md 19, 21, 22; ADR-132-draft-and-publish,
 * ADR-132-editor-api, ADR-132-roles-and-permissions): creating a Tree, the draft and its
 * writes, publishing, the roles, and the pictures.
 *
 * Every Tree's `meta.json` and draft are read into memory when the store opens; reads never
 * touch disk again (17.3). A write to a Tree waits for the one before it on that Tree's own
 * queue, applies the change to a copy of the draft, validates the copy under the draft rules
 * and refuses it whole (422) when a blocking rule breaks; otherwise it writes the draft in
 * the byte form of 3.7 and then `meta.json`, each atomically. While the Tree is published,
 * a draft that also passes the full validation is copied to `tree.json` in the same call and
 * the public set is swapped (19.4).
 *
 * Every member takes the acting account and calls `permit` itself (21.3), so a route that
 * forgot the check is caught here.
 */
import { mkdir, readdir, readFile, rename, rm } from 'node:fs/promises'
import path from 'node:path'
import { draftOf, openTree, type Draft, type Tree } from '../tree/loader.ts'
import { treeBytes } from '../tree/serialise.ts'
import type { DraftNode, LocalisedText, Manifest, Violation } from '../tree/types.ts'
import { isId, isImageFile, validateTree, type Mapping, type RawTree } from '../tree/validate.ts'
import type { Account, Accounts } from './accounts.ts'
import { applyField, applyOperation, createNode, deleteNode, freshNodeId, newDraft, type Field, type Operation } from './edits.ts'
import { malformed, StoreError } from './errors.ts'
import { imageName, MAX_IMAGE_BYTES, sniff } from './images.ts'
import { mayCreate, permit, type Action, type TreeMeta } from './permissions.ts'
import { writeAtomic } from './write.ts'

/** What the admin area is told about one Tree (22.1): its record, its state, its to-do list. */
export interface TreeEntry {
  id: string
  meta: TreeMeta
  /** The draft's manifest; null for an uneditable Tree (19.5). */
  manifest: Manifest | null
  /** Whether `tree.json` exists (17.2). */
  published: boolean
  /** Whether the public routes serve it: published and valid in full (18.3). */
  servable: boolean
  /** False while an invalid draft leaves the last valid public copy in place (19.4). */
  publicCopyCurrent: boolean
  /** The draft's advisory violations: the Publish toggle's count and the to-do list (19.2). */
  advisory: Violation[]
  /** The draft's blocking violations: non-empty only for an uneditable Tree (19.5). */
  blocking: Violation[]
}

/** The answer to every write (22.3). */
export interface WriteResponse {
  revision: number
  node: DraftNode | null
  manifest?: Manifest
  violations: Violation[]
  tree: { advisory: number; published: boolean; publicCopyCurrent: boolean }
  also?: WriteResponse[]
}

/** `GET /admin/api/trees/<t>/nodes/<n>` (22.1): the Node, its to-do list, and the titles its Links need. */
export interface NodeView {
  node: DraftNode
  violations: Violation[]
  titles: Record<string, LocalisedText>
}

/** The members of 19.7. */
export interface Drafts {
  /**
   * 21.3's check a route makes before it touches the store: throws 403 when `by` may not take
   * `action` on the Tree `id`, and 404 to the administrator for an id that is no Tree.
   */
  permitted(by: Account, id: string, action: Action): void
  create(by: Account, id: unknown, languages: unknown, title: unknown): Promise<TreeEntry>
  entry(by: Account, id: string): TreeEntry
  list(by: Account): TreeEntry[]
  draft(by: Account, id: string): Draft
  node(by: Account, id: string, nodeId: string): Promise<NodeView>
  write(by: Account, id: string, nodeId: string | null, change: Field | Operation): Promise<WriteResponse>
  createNode(by: Account, id: string, from: { node: unknown; link: unknown; outcome?: unknown }, title?: unknown, nodeId?: unknown): Promise<WriteResponse>
  deleteNode(by: Account, id: string, nodeId: string): Promise<WriteResponse>
  publish(by: Account, id: string, published: boolean): Promise<TreeEntry>
  delete(by: Account, id: string): Promise<void>
  handOver(by: Account, id: string, to: string): Promise<TreeEntry>
  addCollaborator(by: Account, id: string, accountId: string): Promise<TreeEntry>
  removeCollaborator(by: Account, id: string, accountId: string): Promise<TreeEntry>
  uploadImage(by: Account, id: string, bytes: Uint8Array, clientName: string): Promise<{ file: string; width: number; height: number }>
  removeImage(by: Account, id: string, file: string): Promise<void>
  draftImagePath(by: Account, id: string, file: string): string
  /** Puts a Tree folder the store has just imported (17.4) into the set this module holds. */
  adopt(id: string): Promise<void>
}

/** What the public side of the store is told when a Tree's published copy changes (18.2). */
export type Swap = (id: string, tree: Tree | null) => void

/**
 * Tree ids that would collide with a route (application.md 4.3): the two moved-from file
 * addresses, the schema, and the admin area's whole prefix.
 */
export const RESERVED_TREE_IDS: readonly string[] = ['images', 'theme', 'schemas', 'admin']

/** A Tree as this module holds it between writes. */
interface Held {
  id: string
  dir: string
  meta: TreeMeta
  /** The parsed draft; null when it breaks a blocking rule (19.5). */
  raw: Mapping | null
  advisory: Violation[]
  blocking: Violation[]
  images: Set<string>
  themeFiles: Set<string>
  published: boolean
  /** The pictures the published copy names: never removable while it names them (22.6). */
  publishedImages: Set<string>
  publicCopyCurrent: boolean
  /** The last write accepted on this Tree, which the next one waits for (22.5). */
  queue: Promise<unknown>
}

/**
 * Opens the drafts of every Tree folder in `treesDir` (17.5). A folder whose draft breaks a
 * blocking rule is held as uneditable (19.5), never a start that fails. `swap` is the public
 * set's; `servable` says whether a published Tree passed at start (18.3).
 */
export async function openDrafts(
  treesDir: string,
  accounts: Accounts,
  swap: Swap,
  servable: (id: string) => boolean,
): Promise<Drafts> {
  const held = new Map<string, Held>()
  const admin = (): Account => accounts.all().find((account) => account.administrator)!
  for (const id of await listFolders(treesDir)) {
    if (isId(id)) held.set(id, await load(treesDir, id, admin().id))
  }

  /** The Tree `id` for `by`, when `action` is theirs: 403 without the role, 404 for no such Tree. */
  function allowed(by: Account, id: string, action: Action): Held {
    const tree = held.get(id)
    // An unknown id is 403 to anyone who could not have seen it, as a hidden one is (21.3).
    if (!tree) throw by.administrator && by.active ? new StoreError(404, 'no-tree') : new StoreError(403, 'forbidden')
    if (!permit(by, tree.meta, action)) throw new StoreError(403, 'forbidden')
    return tree
  }

  function editable(tree: Held): Mapping {
    if (!tree.raw) throw new StoreError(409, 'uneditable', tree.blocking)
    return tree.raw
  }

  /** Runs `work` after every earlier write on `tree` has landed, so two never interleave (17.3). */
  function serial<T>(tree: Held, work: () => Promise<T>): Promise<T> {
    const next = tree.queue.catch(() => undefined).then(work)
    tree.queue = next
    return next
  }

  function draftFor(by: Account, id: string): Draft {
    const tree = allowed(by, id, 'read')
    return draftOf(rawOf(tree, editable(tree)), tree.dir, tree.advisory)
  }

  function entryOf(tree: Held): TreeEntry {
    return {
      id: tree.id,
      meta: structuredClone(tree.meta),
      manifest: tree.raw ? draftOf(rawOf(tree, tree.raw), tree.dir, []).manifest : null,
      published: tree.published,
      servable: tree.published && servable(tree.id),
      publicCopyCurrent: tree.publicCopyCurrent,
      advisory: tree.advisory,
      blocking: tree.blocking,
    }
  }

  /**
   * The one way a draft changes: `change` applied to a copy, the copy validated under the
   * draft rules, and written -- or refused whole with the blocking violations (22.3). Then
   * the public copy follows when the Tree is published and the draft valid in full (19.4).
   * Answers the new draft, indexed.
   */
  async function commit(by: Account, tree: Held, change: (draft: Mapping) => void): Promise<Draft> {
    const next = structuredClone(editable(tree))
    change(next)
    const found = validateTree(rawOf(tree, next), 'draft')
    const blocking = found.filter((violation) => !violation.advisory)
    if (blocking.length > 0) throw new StoreError(422, 'blocking', blocking)

    const bytes = treeBytes(next)
    await writeAtomic(path.join(tree.dir, 'draft.json'), bytes)
    tree.raw = next
    tree.advisory = found
    tree.meta = { ...tree.meta, revision: tree.meta.revision + 1, updatedAt: new Date().toISOString(), updatedBy: by.id }
    await writeMeta(tree)
    if (tree.published) {
      tree.publicCopyCurrent = validateTree(rawOf(tree, next)).length === 0
      if (tree.publicCopyCurrent) await copyToPublic(tree, bytes)
    }
    return draftOf(rawOf(tree, next), tree.dir, found)
  }

  /** `tree.json` replaced by the draft's bytes, and the public set swapped in the same call (19.3, 19.4). */
  async function copyToPublic(tree: Held, bytes: string): Promise<void> {
    await writeAtomic(path.join(tree.dir, 'tree.json'), bytes)
    const opened = await openTree(tree.dir)
    tree.publishedImages = namedImages(tree.raw!)
    swap(tree.id, opened)
  }

  async function writeMeta(tree: Held): Promise<void> {
    await writeAtomic(path.join(tree.dir, 'meta.json'), `${JSON.stringify(tree.meta, null, 2)}\n`)
  }

  /** The write response of 22.3 for the Node `nodeId` of `draft`, or the manifest's for null. */
  async function respond(tree: Held, draft: Draft, nodeId: string | null, also: string[] = []): Promise<WriteResponse> {
    const where = nodeId ?? 'manifest'
    const response: WriteResponse = {
      revision: tree.meta.revision,
      node: nodeId === null ? null : await draft.getNode(nodeId),
      violations: draft.advisory.filter((violation) => violation.file === where),
      tree: { advisory: draft.advisory.length, published: tree.published, publicCopyCurrent: tree.publicCopyCurrent },
    }
    if (nodeId === null) response.manifest = draft.manifest
    if (also.length > 0) response.also = await Promise.all(also.map((other) => respond(tree, draft, other)))
    return response
  }

  /** Every account change of a Tree is logged with the acting account, the Tree and the time (20.8). */
  function log(by: Account, what: string, id: string): void {
    console.log(`${new Date().toISOString()} account ${by.id} ${what} Tree "${id}"`)
  }

  return {
    permitted(by, id, action) {
      allowed(by, id, action)
    },

    async create(by, id, languages, title) {
      if (!mayCreate(by)) throw new StoreError(403, 'forbidden')
      if (!isId(id)) throw malformed('manifest', 'id', 'V-DIR', 'an id is lowercase letters, digits and single hyphens, at most 64 (tree-format.md 3.1)')
      if (RESERVED_TREE_IDS.includes(id)) throw malformed('manifest', 'id', 'V-DIR', `"${id}" is a reserved word (application.md 4.3)`)
      if (held.has(id)) throw new StoreError(409, 'tree-id-taken')
      if (!Array.isArray(languages) || languages.length === 0) throw malformed('manifest', 'languages', 'V-LANG', 'languages is a non-empty list of language tags')
      const raw = newDraft(languages as string[], (title ?? {}) as Mapping)
      const dir = path.join(treesDir, id)
      const found = validateTree({ id, tree: raw, images: new Set(), themeFiles: new Set() }, 'draft')
      const blocking = found.filter((violation) => !violation.advisory)
      if (blocking.length > 0) throw new StoreError(422, 'blocking', blocking)

      const now = new Date().toISOString()
      const tree: Held = {
        id,
        dir,
        meta: { creator: by.id, collaborators: [], createdAt: now, updatedAt: now, updatedBy: by.id, publishCount: 0, revision: 0 },
        raw,
        advisory: found,
        blocking: [],
        images: new Set(),
        themeFiles: new Set(),
        published: false,
        publishedImages: new Set(),
        publicCopyCurrent: true,
        queue: Promise.resolve(),
      }
      // Held before the first await, so a second create of the same id is 409, not a race.
      held.set(id, tree)
      try {
        // Assembled beside its place and renamed into it, so a crash never leaves half a Tree.
        const staging = `${dir}.tmp`
        await rm(staging, { recursive: true, force: true })
        await mkdir(staging, { recursive: true })
        await writeAtomic(path.join(staging, 'draft.json'), treeBytes(raw))
        await writeAtomic(path.join(staging, 'meta.json'), `${JSON.stringify(tree.meta, null, 2)}\n`)
        await rename(staging, dir)
      } catch (error) {
        held.delete(id)
        throw error
      }
      log(by, 'created', id)
      return entryOf(tree)
    },

    entry(by, id) {
      return entryOf(allowed(by, id, 'read'))
    },

    list(by) {
      return [...held.values()].filter((tree) => by.active && permit(by, tree.meta, 'read')).map(entryOf)
    },

    draft: draftFor,

    async node(by, id, nodeId) {
      const draft = draftFor(by, id)
      const node = await draft.getNode(nodeId)
      if (!node) throw new StoreError(404, 'no-node')
      const targets = [...Object.values(node.answers ?? {}), ...node.options.map((option) => option.target)]
      const titles: Record<string, LocalisedText> = {}
      for (const target of targets) {
        const title = target === undefined ? null : draft.getTitle(target)
        if (title) titles[target!] = title
      }
      return { node, violations: draft.advisory.filter((violation) => violation.file === nodeId), titles }
    },

    write(by, id, nodeId, change) {
      const tree = allowed(by, id, 'edit')
      return serial(tree, async () => {
        let also: string[] = []
        const draft = await commit(by, tree, (next) => {
          if ('op' in change) {
            if (nodeId === null) throw malformed('manifest', '', 'V-KEYS', 'the manifest takes fields only')
            also = applyOperation(next, nodeId, change as Operation, () => freshNodeId(next))
          } else {
            applyField(next, nodeId, change as Field)
          }
        })
        return respond(tree, draft, nodeId, also)
      })
    },

    createNode(by, id, from, title, nodeId) {
      const tree = allowed(by, id, 'edit')
      return serial(tree, async () => {
        let created = ''
        const draft = await commit(by, tree, (next) => {
          created = createNode(next, from, title, from.link === 'end' ? '' : freshNodeId(next, nodeId))
        })
        const parent = from.node as string
        return respond(tree, draft, created, created === parent ? [] : [parent])
      })
    },

    deleteNode(by, id, nodeId) {
      const tree = allowed(by, id, 'edit')
      return serial(tree, async () => {
        let referrers: string[] = []
        const draft = await commit(by, tree, (next) => {
          referrers = deleteNode(next, nodeId)
        })
        return respond(tree, draft, nodeId, referrers).then((response) => ({ ...response, node: null }))
      })
    },

    publish(by, id, published) {
      const tree = allowed(by, id, 'publish')
      return serial(tree, async () => {
        const raw = editable(tree)
        if (!published) {
          if (tree.published) {
            // Hidden from every public route in the same call (19.3, 23.1).
            await rm(path.join(tree.dir, 'tree.json'), { force: true })
            tree.published = false
            tree.publicCopyCurrent = true
            tree.publishedImages = new Set()
            swap(id, null)
            log(by, 'unpublished', id)
          }
          return entryOf(tree)
        }
        const violations = validateTree(rawOf(tree, raw))
        if (violations.length > 0) throw new StoreError(409, 'invalid', violations)
        const publishCount = tree.meta.publishCount + 1
        await commit(by, tree, (next) => {
          next.metadata = { ...(next.metadata as Mapping), version: String(publishCount) }
        })
        tree.meta = { ...tree.meta, publishCount, publishedAt: new Date().toISOString() }
        await writeMeta(tree)
        tree.published = true
        tree.publicCopyCurrent = true
        await copyToPublic(tree, treeBytes(tree.raw!))
        await sweepImages(tree)
        log(by, 'published', id)
        return entryOf(tree)
      })
    },

    async delete(by, id) {
      const tree = allowed(by, id, 'delete')
      await serial(tree, async () => {
        // Two steps, unpublish then delete, so a public Tree is never deleted by one click (21.2).
        if (tree.published) throw new StoreError(409, 'published')
        const doomed = `${tree.dir}.tmp`
        await rename(tree.dir, doomed)
        held.delete(id)
        await rm(doomed, { recursive: true, force: true })
        log(by, 'deleted', id)
      })
    },

    handOver(by, id, to) {
      const tree = allowed(by, id, 'hand-over')
      return serial(tree, async () => {
        const next = accounts.get(to)
        if (!next || !next.active) throw malformed('meta', 'creator', 'account', 'not an active account')
        const old = tree.meta.creator
        const collaborators = tree.meta.collaborators.filter((account) => account !== to)
        // The old creator keeps what they could see (21.4).
        if (old !== to && !collaborators.includes(old)) collaborators.push(old)
        tree.meta = { ...tree.meta, creator: to, collaborators }
        await writeMeta(tree)
        log(by, `handed to account ${to}`, id)
        return entryOf(tree)
      })
    },

    addCollaborator(by, id, accountId) {
      const tree = allowed(by, id, 'invite')
      return serial(tree, async () => {
        const invited = accounts.get(accountId)
        if (!invited || !invited.active || invited.administrator || invited.id === tree.meta.creator) {
          throw malformed('meta', 'collaborators', 'account', 'not an account that can be invited')
        }
        if (!tree.meta.collaborators.includes(accountId)) {
          tree.meta = { ...tree.meta, collaborators: [...tree.meta.collaborators, accountId] }
          await writeMeta(tree)
          log(by, `invited account ${accountId} to`, id)
        }
        return entryOf(tree)
      })
    },

    removeCollaborator(by, id, accountId) {
      const tree = allowed(by, id, 'invite')
      return serial(tree, async () => {
        if (!accounts.get(accountId)) throw malformed('meta', 'collaborators', 'account', 'not an account')
        if (tree.meta.collaborators.includes(accountId)) {
          tree.meta = { ...tree.meta, collaborators: tree.meta.collaborators.filter((account) => account !== accountId) }
          await writeMeta(tree)
          log(by, `removed account ${accountId} from`, id)
        }
        return entryOf(tree)
      })
    },

    async uploadImage(by, id, bytes, clientName) {
      const tree = allowed(by, id, 'upload')
      editable(tree)
      if (bytes.length > MAX_IMAGE_BYTES) throw new StoreError(413, 'too-large')
      const sniffed = sniff(bytes)
      if (!sniffed) throw new StoreError(415, 'type')
      const file = imageName(clientName, bytes, sniffed.extension)
      const folder = path.join(tree.dir, 'images')
      const target = path.resolve(folder, file)
      // 5.5's second check: whatever the name, the file lands inside this Tree's images/.
      if (path.dirname(target) !== path.resolve(folder)) throw malformed(id, 'file', 'V-IMAGE', 'not a file of images/')
      await serial(tree, async () => {
        if (tree.images.has(file)) return
        await mkdir(folder, { recursive: true })
        await writeAtomic(target, bytes)
        tree.images.add(file)
      })
      return { file, width: sniffed.width, height: sniffed.height }
    },

    async removeImage(by, id, file) {
      const tree = allowed(by, id, 'upload')
      await serial(tree, async () => {
        if (!isImageFile(file) || !tree.images.has(file)) throw new StoreError(404, 'no-image')
        if (namedImages(editable(tree)).has(file) || tree.publishedImages.has(file)) throw new StoreError(409, 'referenced')
        await rm(path.join(tree.dir, 'images', file), { force: true })
        tree.images.delete(file)
      })
    },

    draftImagePath(by, id, file) {
      const tree = allowed(by, id, 'read')
      if (!isImageFile(file) || !tree.images.has(file)) throw new StoreError(404, 'no-image')
      return path.join(tree.dir, 'images', file)
    },

    async adopt(id) {
      const tree = await load(treesDir, id, admin().id)
      held.set(id, tree)
      if (tree.published) swap(id, await openTree(tree.dir))
    },
  }

  /** After a publish, the pictures neither the draft nor the published copy names go (22.6). */
  async function sweepImages(tree: Held): Promise<void> {
    const named = namedImages(tree.raw!)
    for (const file of [...tree.images]) {
      if (named.has(file)) continue
      await rm(path.join(tree.dir, 'images', file), { force: true })
      tree.images.delete(file)
    }
  }
}

/** The draft as the validator reads it: the parsed file and the two folders' names. */
function rawOf(tree: Held, raw: Mapping): RawTree {
  return { id: tree.id, tree: raw, images: tree.images, themeFiles: tree.themeFiles }
}

/** Every picture a draft's Nodes name. */
function namedImages(raw: Mapping): Set<string> {
  const nodes = (raw.nodes as Mapping[] | undefined) ?? []
  return new Set(nodes.flatMap((node) => ((node.images as Mapping[] | undefined) ?? []).map((image) => image.file as string)))
}

/**
 * One Tree folder as `openDrafts` holds it: `meta.json` (a folder without one is the
 * administrator's), the draft under the draft rules, the two folders' file names, and
 * whether the published copy is the draft's bytes.
 */
async function load(treesDir: string, id: string, administrator: string): Promise<Held> {
  const dir = path.join(treesDir, id)
  const metaText = await readText(path.join(dir, 'meta.json'))
  const now = new Date().toISOString()
  let stored: Partial<TreeMeta> | null = {}
  try {
    if (metaText !== null) stored = JSON.parse(metaText) as Partial<TreeMeta>
  } catch {
    stored = null
  }
  const meta: TreeMeta = {
    creator: administrator,
    collaborators: [],
    createdAt: now,
    updatedAt: now,
    updatedBy: administrator,
    publishCount: 0,
    revision: 0,
    ...stored,
  }
  const tree: Held = {
    id,
    dir,
    meta,
    raw: null,
    advisory: [],
    blocking: [],
    images: new Set(await listFiles(path.join(dir, 'images'))),
    themeFiles: new Set(await listFiles(path.join(dir, 'theme'))),
    published: false,
    publishedImages: new Set(),
    publicCopyCurrent: true,
    queue: Promise.resolve(),
  }
  const published = await readText(path.join(dir, 'tree.json'))
  const draftText = await readText(path.join(dir, 'draft.json'))
  tree.published = published !== null
  tree.publicCopyCurrent = !tree.published || published === draftText
  if (published !== null) {
    try {
      tree.publishedImages = namedImages(JSON.parse(published) as Mapping)
    } catch {
      // An unparsable published copy is not served and names nothing (18.3).
    }
  }
  try {
    const draft = await openTree(dir, { draft: true })
    tree.raw = JSON.parse(draftText!) as Mapping
    tree.advisory = draft.advisory
  } catch (error) {
    tree.blocking = (error as { violations?: Violation[] }).violations ?? [
      { file: 'draft.json', keyPath: '', rule: 'V-DIR', message: String(error), advisory: false },
    ]
  }
  // A meta.json that is not JSON names no role anyone can trust: the Tree is not edited (19.5).
  if (stored === null) {
    tree.raw = null
    tree.blocking = [...tree.blocking, { file: 'meta.json', keyPath: '', rule: 'V-JSON', message: 'meta.json is not JSON', advisory: false }]
  }
  return tree
}

async function readText(file: string): Promise<string | null> {
  try {
    return await readFile(file, 'utf8')
  } catch {
    return null
  }
}

async function listFiles(dir: string): Promise<string[]> {
  try {
    return (await readdir(dir, { withFileTypes: true })).filter((entry) => entry.isFile()).map((entry) => entry.name)
  } catch {
    return []
  }
}

async function listFolders(dir: string): Promise<string[]> {
  try {
    return (await readdir(dir, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && !entry.name.endsWith('.tmp'))
      .map((entry) => entry.name)
      .sort()
  } catch {
    return []
  }
}
