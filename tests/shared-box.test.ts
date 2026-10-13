/**
 * **[#252]** The copy of the data directory the shared box's deploy takes before a release
 * starts (`deploy/shared-box/snapshot.sh`, docs/deployment.md "Putting a new version"), run for
 * real, and the order in `deploy/shared-box/deploy.sh`: the copy and the release without
 * `trees/` before the swap and the restart.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, test } from 'vitest'

const sharedBox = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'deploy', 'shared-box')
const snapshot = path.join(sharedBox, 'snapshot.sh')

/**
 * The bash that runs the box's scripts here: on Windows Git for Windows' own, found from
 * `git --exec-path`, since `bash` on its PATH starts WSL; elsewhere `bash`.
 */
function bash(): string {
  if (process.platform !== 'win32') return 'bash'
  const execPath = execFileSync('git', ['--exec-path'], { encoding: 'utf8' }).trim()
  return path.resolve(execPath, '..', '..', '..', 'bin', 'bash.exe')
}

/** A path as bash takes it: forward slashes (`C:/...` on Windows, which tar reads with `--force-local`). */
function posix(file: string): string {
  return file.split(path.sep).join('/')
}

/** Runs `script` with `args` under bash; answers its exit status and what it printed. */
function run(script: string, ...args: string[]): { status: number | null; stdout: string; stderr: string } {
  const { status, stdout, stderr } = spawnSync(bash(), [posix(script), ...args.map(posix)], { encoding: 'utf8' })
  return { status, stdout, stderr }
}

/** Every file under `dir`, by its path inside `dir`, with its bytes. */
async function filesOf(dir: string): Promise<Record<string, Buffer>> {
  const files: Record<string, Buffer> = {}
  for (const name of await readdir(dir, { recursive: true })) {
    const file = path.join(dir, name)
    if ((await stat(file)).isFile()) files[name.split(path.sep).join('/')] = await readFile(file)
  }
  return files
}

const made: string[] = []

/** A fresh empty folder, removed after the test. */
async function folder(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'elsa-shared-box-'))
  made.push(dir)
  return dir
}

/** A small data directory: accounts, a Tree with its draft, meta and a picture. */
async function dataDirectory(): Promise<string> {
  const data = await folder()
  await mkdir(path.join(data, 'trees', 'one', 'images'), { recursive: true })
  await writeFile(path.join(data, 'accounts.json'), '{"accounts":[]}\n')
  await writeFile(path.join(data, 'lock'), '4242\n')
  await writeFile(path.join(data, 'trees', 'one', 'tree.json'), '{"format":"elsa-tree/7"}\n')
  await writeFile(path.join(data, 'trees', 'one', 'draft.json'), '{"format":"elsa-tree/7","draft":true}\n')
  await writeFile(path.join(data, 'trees', 'one', 'meta.json'), '{"creator":"a"}\n')
  await writeFile(path.join(data, 'trees', 'one', 'images', 'photo.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 1, 2, 255]))
  return data
}

afterEach(async () => {
  for (const dir of made.splice(0)) await rm(dir, { recursive: true, force: true })
})

// Git Bash on Windows takes about a second a run.
describe('snapshot.sh', { timeout: 60_000 }, () => {
  test('a data folder becomes an archive that unpacks to the same files and bytes', async () => {
    const data = await dataDirectory()
    const backups = path.join(await folder(), 'backups')

    const result = run(snapshot, data, backups, 'pre-deploy-20261013T093000Z-0123456789ab')

    expect(result.stderr).toBe('')
    expect(result.status).toBe(0)
    expect(await readdir(backups)).toEqual(['pre-deploy-20261013T093000Z-0123456789ab.tar.gz'])
    // 0700: the archive holds password hashes. Windows keeps no such mode bits.
    if (process.platform !== 'win32') expect((await stat(backups)).mode & 0o777).toBe(0o700)
    const unpacked = await folder()
    const archive = path.join(backups, 'pre-deploy-20261013T093000Z-0123456789ab.tar.gz')
    const untar = spawnSync(bash(), ['-c', 'tar --force-local -xzf "$1" -C "$2"', 'untar', posix(archive), posix(unpacked)], { encoding: 'utf8' })
    expect(untar.status, untar.stderr).toBe(0)
    expect(await filesOf(unpacked)).toEqual(await filesOf(data))
  })

  test('an eleventh archive removes the oldest by name, and the ten newest stay', async () => {
    const data = await dataDirectory()
    const backups = path.join(await folder(), 'backups')
    const labels = Array.from({ length: 11 }, (_, i) => `pre-deploy-20261013T${String(i).padStart(2, '0')}0000Z-0123456789ab`)

    for (const label of labels) expect(run(snapshot, data, backups, label).status).toBe(0)

    expect((await readdir(backups)).sort()).toEqual(labels.slice(1).map((label) => `${label}.tar.gz`))
  })

  test('a label whose archive exists already is refused, and that archive is untouched', async () => {
    const data = await dataDirectory()
    const backups = path.join(await folder(), 'backups')
    expect(run(snapshot, data, backups, 'pre-deploy-same').status).toBe(0)
    const archive = path.join(backups, 'pre-deploy-same.tar.gz')
    const bytes = await readFile(archive)
    await writeFile(path.join(data, 'accounts.json'), '{"accounts":["changed"]}\n')

    const again = run(snapshot, data, backups, 'pre-deploy-same')

    expect(again.status).not.toBe(0)
    expect(again.stderr).toContain('exists already')
    expect(await readFile(archive)).toEqual(bytes)
    expect(await readdir(backups)).toEqual(['pre-deploy-same.tar.gz'])
  })

  test('a backup folder path that is a regular file fails the step, and leaves no archive', async () => {
    const data = await dataDirectory()
    const parent = await folder()
    const backups = path.join(parent, 'backups')
    await writeFile(backups, 'a file, not a folder\n')

    const result = run(snapshot, data, backups, 'pre-deploy-blocked')

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('cannot make the backup folder')
    expect(await readdir(parent)).toEqual(['backups'])
    expect(await readFile(backups, 'utf8')).toBe('a file, not a folder\n')
  })

  test('a label that is not a plain file name is refused, before anything is written', async () => {
    const data = await dataDirectory()
    const parent = await folder()

    for (const label of ['../outside', 'a/b', '', '.hidden']) {
      expect(run(snapshot, data, path.join(parent, 'backups'), label).status, label).toBe(2)
    }
    expect(await readdir(parent)).toEqual([])
  })
})

describe('deploy.sh', () => {
  test('the copy and the release without trees/ stand after the build and before the swap and the restart; a failed copy stops it', async () => {
    const lines = (await readFile(path.join(sharedBox, 'deploy.sh'), 'utf8')).split('\n')
    /** The index of the one line that is not a comment and contains `text`. */
    const at = (text: string): number => {
      const found = lines.flatMap((line, i) => (!line.trimStart().startsWith('#') && line.includes(text) ? [i] : []))
      expect(found, text).toHaveLength(1)
      return found[0]!
    }
    const build = at('npm run build')
    const copy = at('snapshot.sh"')
    const trees = at('rm -rf "$CURRENT.next/trees"')
    const swap = at('mv "$CURRENT.next" "$CURRENT"')
    const restart = at('systemctl restart')

    for (const step of [copy, trees]) {
      expect(step).toBeGreaterThan(build)
      expect(step).toBeLessThan(swap)
      expect(step).toBeLessThan(restart)
    }
    expect(lines[copy]).toMatch(/^if ! /)
    expect(lines.slice(copy, swap).join('\n')).not.toMatch(/\|\|\s*(true|:)/)
  })
})
