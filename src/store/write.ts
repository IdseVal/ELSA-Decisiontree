/**
 * The store's one way of writing a file (docs/specs/application.md 17.3,
 * ADR-132-data-directory decision 4): whole, atomically, and in the order the writes were
 * accepted.
 *
 * A write goes to `<file>.tmp` in the same folder and is then `rename`d over the original,
 * which POSIX makes atomic: a reader sees the old bytes or the new ones, never a mix, and a
 * crash leaves at most a `.tmp` that the next start deletes. Writes to one file are chained
 * on one promise, so two of them never interleave on that `.tmp`; writes to two files run
 * side by side.
 */
import { rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

/** The last write accepted per file, which the next write to that file waits for. */
const queues = new Map<string, Promise<void>>()

/**
 * Replaces `file` with `data`, after every write to `file` accepted before this one has
 * landed. Resolves once the new bytes are in place; rejects with the file system's error,
 * which does not stop the writes queued behind it.
 */
export function writeAtomic(file: string, data: string | Uint8Array): Promise<void> {
  const target = path.resolve(/* turbopackIgnore: true */ file)
  const previous = queues.get(target) ?? Promise.resolve()
  const next = previous.catch(() => undefined).then(() => replace(target, data))
  queues.set(target, next)
  // Forget a settled queue, unless another write has joined it since.
  const forget = (): void => {
    if (queues.get(target) === next) queues.delete(target)
  }
  next.then(forget, forget)
  return next
}

/** How often a refused rename is tried again, 20 ms apart. */
const RENAME_ATTEMPTS = 25

async function replace(target: string, data: string | Uint8Array): Promise<void> {
  const temporary = `${target}.tmp`
  await writeFile(temporary, data)
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await rename(temporary, target)
    } catch (error) {
      // Windows refuses to replace a file another handle is reading, for as long as it
      // reads; POSIX never does. `next dev` on a Windows machine is a real deployment of
      // this code, so the write waits the reader out rather than failing the save.
      const code = (error as NodeJS.ErrnoException).code
      if (attempt >= RENAME_ATTEMPTS || (code !== 'EPERM' && code !== 'EBUSY' && code !== 'EACCES')) throw error
      await new Promise((wake) => setTimeout(wake, 20))
    }
  }
}
