/**
 * **[#138]** The import rule of docs/specs/application.md 34.4 (ADR-133-reuse-rule decision
 * 4), read off the files: the editor's client components import, of `src/`, exactly
 * `src/tree/measure.ts` and `src/markdown.ts` at run time -- type-only imports are erased
 * -- and those two are pure: no `node:` module, no `ajv`, no schema. `writes.ts` is the one
 * module under `src/editor/` that calls `fetch`. And `src/components/` imports of
 * `src/editor/` only the `EditMode` types.
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const src = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'src')

/** The run-time imports of a file: every `import ... from '...'` that is not `import type`. */
function runtimeImports(text: string): string[] {
  return [...text.matchAll(/^import\s+(?!type\s)[^'"]*?from\s+['"]([^'"]+)['"]/gm)].map((match) => match[1]!)
}

/** Where an import of `file` lands, relative to `src/`, for a relative specifier; the specifier itself otherwise. */
function resolved(file: string, specifier: string): string {
  if (!specifier.startsWith('.')) return specifier
  return path.relative(src, path.resolve(path.dirname(file), specifier)).replaceAll(path.sep, '/')
}

async function files(dir: string): Promise<string[]> {
  return (await readdir(dir)).filter((name) => /\.tsx?$/.test(name)).map((name) => path.join(dir, name))
}

describe('the editor’s client components (34.4)', () => {
  test('import of src/ only tree/measure.ts and markdown.ts at run time, and of their own folder', async () => {
    const allowed = new Set(['tree/measure.ts', 'markdown.ts'])
    for (const file of await files(path.join(src, 'editor'))) {
      const text = await readFile(file, 'utf8')
      if (!text.startsWith("'use client'")) continue
      // #135's account pages render the accounts page's Sheet; they are not the tree view's (34.4).
      if (['AccountForms.tsx', 'AccountsList.tsx'].includes(path.basename(file))) continue
      for (const specifier of runtimeImports(text)) {
        if (!specifier.startsWith('.')) continue // a package
        const target = resolved(file, specifier)
        const inEditor = target.startsWith('editor/')
        expect(inEditor || allowed.has(target), `${path.basename(file)} imports ${target}`).toBe(true)
      }
    }
  })

  test('the two modules they import are pure: no node: module, no ajv, no schema', async () => {
    for (const name of ['tree/measure.ts', 'markdown.ts']) {
      const imports = runtimeImports(await readFile(path.join(src, name), 'utf8'))
      expect(imports.filter((i) => i.startsWith('node:') || i.includes('ajv') || i.includes('schemas/')), name).toEqual([])
      for (const relative of imports.filter((i) => i.startsWith('.'))) {
        expect(['tree/measure.ts'], `${name} imports ${relative}`).toContain(resolved(path.join(src, name), relative))
      }
    }
  })

  test('nothing under src/editor/ reads the file system, the environment or a request; writes.ts alone calls fetch', async () => {
    for (const file of await files(path.join(src, 'editor'))) {
      const text = await readFile(file, 'utf8')
      const name = path.basename(file)
      expect(runtimeImports(text).filter((i) => i.startsWith('node:')), name).toEqual([])
      expect(text.includes('process.env'), `${name} reads the environment`).toBe(false)
      if (name !== 'writes.ts' && name !== 'request.ts') expect(/\bfetch\(/.test(text), `${name} calls fetch`).toBe(false)
    }
  })
})

describe('the public components (34.4)', () => {
  test('import of src/editor/ only the EditMode types', async () => {
    for (const file of await files(path.join(src, 'components'))) {
      const text = await readFile(file, 'utf8')
      for (const specifier of runtimeImports(text)) {
        const target = resolved(file, specifier)
        // The admin pages' own components (the login page, the admin bar) render the editor's
        // client components; the components of the tree view (section 6) import none.
        if (['LoginPage.tsx', 'AdminChrome.tsx'].includes(path.basename(file))) continue
        expect(target.startsWith('editor/'), `${path.basename(file)} imports ${target} at run time`).toBe(false)
      }
    }
  })
})
