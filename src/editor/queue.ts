/**
 * The write queue of one editor page (docs/specs/application.md 29.1, 29.2, 29.5, 29.6;
 * ADR-133-autosave decisions 1, 2, 5, 6). A field's value is written 600 ms after the last
 * keystroke in it, or when the field is flushed on blur, whichever comes first; an operation
 * at once. Every write goes through one queue, one request in flight at a time, in the order
 * accepted, so the revisions the responses carry rise as seen from this page and a structure
 * write never overtakes the field write before it.
 *
 * The queue owns the transport policy and nothing of the screen: a request that got no
 * answer or a 5xx is retried after 5, 10, 20, 40 and 60 seconds and every 60 after, a 401
 * pauses the queue until `resume`, and every other answer is handed to the page, which
 * decides what the creator sees. Pure and timer-driven, so `tests/editor/queue.test.ts`
 * drives it with a fake `send` and fake timers.
 */
import type { Answer, Change } from './writes.ts'

/** One write of the queue: the Node, the change, and the field it is for (null for an operation). */
export interface Write {
  nodeId: string
  change: Change
  /** `<node id> <key path>` for a field, so a newer value of the same field replaces an older one not yet sent. */
  key: string | null
}

/** What the indicator draws (29.3, 29.5, 29.6). */
export interface QueueState {
  /** A value is typed and not yet accepted: debouncing, queued or in flight. */
  saving: boolean
  /** When the last write was accepted, in milliseconds since the epoch; null before the first. */
  savedAt: number | null
  /** A request failed and will be sent again: which attempt this was and when the next one goes. */
  failure: { attempt: number; retryAt: number } | null
  /** A 401 paused the queue (29.6). */
  paused: boolean
}

/** Milliseconds after the last keystroke before a field's value is written (29.1). */
export const DEBOUNCE_MS = 600

/** The retry ladder of 29.5, in milliseconds; the last rung repeats. */
export const RETRY_LADDER_MS = [5_000, 10_000, 20_000, 40_000, 60_000] as const

export interface QueueEvents {
  /** The state changed. */
  onState(state: QueueState): void
  /**
   * A write got an answer the page must act on: a 2xx, a refusal or the 401 that paused the
   * queue. A request that will be retried is not reported; the state says so.
   */
  onAnswer(write: Write, answer: Answer): void
}

interface Pending {
  write: Write
  timer: ReturnType<typeof setTimeout>
}

export class WriteQueue {
  private readonly send: (write: Write) => Promise<Answer>
  private readonly events: QueueEvents
  /** Field values waiting out their 600 ms, by key. */
  private readonly pending = new Map<string, Pending>()
  /** Writes accepted into the order, the head in flight while `inFlight` is set. */
  private readonly queue: Write[] = []
  private inFlight = false
  private paused = false
  private attempt = 0
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  private retryAt: number | null = null
  private savedAt: number | null = null

  constructor(send: (write: Write) => Promise<Answer>, events: QueueEvents) {
    this.send = send
    this.events = events
  }

  /** The state as the indicator reads it. */
  state(): QueueState {
    return {
      saving: this.pending.size > 0 || this.queue.length > 0,
      savedAt: this.savedAt,
      failure: this.retryAt === null ? null : { attempt: this.attempt, retryAt: this.retryAt },
      paused: this.paused,
    }
  }

  /** A field's value changed: written 600 ms after the last change, or on `flush` (29.1). */
  field(nodeId: string, keyPath: string, value: string): void {
    const key = `${nodeId} ${keyPath}`
    const path = keyPath
    const write: Write = { nodeId, change: { path, value }, key }
    const waiting = this.pending.get(key)
    if (waiting) clearTimeout(waiting.timer)
    const timer = setTimeout(() => {
      this.pending.delete(key)
      this.enqueue(write)
    }, DEBOUNCE_MS)
    this.pending.set(key, { write, timer })
    this.changed()
  }

  /** The field lost the focus: what it holds goes now (29.1). */
  flush(nodeId: string, keyPath: string): void {
    const key = `${nodeId} ${keyPath}`
    const waiting = this.pending.get(key)
    if (!waiting) return
    clearTimeout(waiting.timer)
    this.pending.delete(key)
    this.enqueue(waiting.write)
  }

  /** An operation is written at once (29.1). */
  operation(nodeId: string, change: Change): void {
    this.enqueue({ nodeId, change, key: null })
  }

  /** Whether a value of this field is typed and not yet accepted: the repaint rule of 29.7 leaves it alone. */
  hasWrite(nodeId: string, keyPath: string): boolean {
    const key = `${nodeId} ${keyPath}`
    return this.pending.has(key) || this.queue.some((write) => write.key === key)
  }

  /** Whether anything is not yet accepted: what `beforeunload` asks about (29.5). */
  busy(): boolean {
    return this.pending.size > 0 || this.queue.length > 0
  }

  /** The `retry` button: the failed write goes now (29.5). */
  retry(): void {
    if (this.retryTimer === null) return
    clearTimeout(this.retryTimer)
    this.retryTimer = null
    this.retryAt = null
    this.changed()
    this.pump()
  }

  /** The session is back: the queue goes on with the same requests (29.6). */
  resume(): void {
    if (!this.paused) return
    this.paused = false
    this.changed()
    this.pump()
  }

  /**
   * Puts a write in the order. A field write whose key is already queued and not in flight
   * replaces that one where it stands: the older value would only be overwritten by the
   * newer one a request later, and the order of fields is kept.
   */
  private enqueue(write: Write): void {
    const at = write.key === null ? -1 : this.queue.findIndex((queued, index) => queued.key === write.key && !(index === 0 && this.inFlight))
    if (at >= 0) this.queue[at] = write
    else this.queue.push(write)
    this.changed()
    this.pump()
  }

  /** Sends the head of the queue when nothing stops it: one request in flight, in order (29.2). */
  private pump(): void {
    if (this.inFlight || this.paused || this.retryTimer !== null) return
    const head = this.queue[0]
    if (!head) return
    this.inFlight = true
    void this.send(head).then((answer) => {
      this.inFlight = false
      this.settle(head, answer)
    })
  }

  private settle(write: Write, answer: Answer): void {
    if (answer.status === 0 || answer.status >= 500) {
      // The head stays; the ladder decides when it goes again (29.5).
      const wait = RETRY_LADDER_MS[Math.min(this.attempt, RETRY_LADDER_MS.length - 1)]!
      this.attempt += 1
      this.retryAt = Date.now() + wait
      this.retryTimer = setTimeout(() => {
        this.retryTimer = null
        this.retryAt = null
        this.pump()
      }, wait)
      this.changed()
      return
    }
    this.attempt = 0
    if (answer.status === 401) {
      // The head stays, to be sent again once the creator has signed in (29.6).
      this.paused = true
      this.changed()
      this.events.onAnswer(write, answer)
      return
    }
    this.queue.shift()
    if (answer.status >= 200 && answer.status < 300) this.savedAt = Date.now()
    this.changed()
    this.events.onAnswer(write, answer)
    this.pump()
  }

  private changed(): void {
    this.events.onState(this.state())
  }
}
