/**
 * **[#138]** The write queue (docs/specs/application.md 29.1, 29.2, 29.5, 29.6;
 * ADR-133-autosave decisions 1, 2, 5, 6) against a fake `send` and fake timers: the 600 ms
 * debounce and the flush on blur, one request in flight in the order accepted with a newer
 * value queued behind the one in flight, the retry ladder of 5, 10, 20, 40, 60, 60 seconds
 * and the `retry` button, and the pause on 401 that resumes with the same request.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { DEBOUNCE_MS, WriteQueue, type QueueState, type Write } from '../../src/editor/queue.ts'
import type { Answer } from '../../src/editor/writes.ts'

/** A `send` the test controls: every request is recorded, and answered when the test says. */
function fakeSend() {
  const sent: Array<{ write: Write; answer: (answer: Answer) => void }> = []
  const send = (write: Write): Promise<Answer> => new Promise((answer) => sent.push({ write, answer }))
  return { sent, send }
}

const ok: Answer = { status: 200, body: null }

function queueWith(send: (write: Write) => Promise<Answer>) {
  const states: QueueState[] = []
  const answers: Array<{ write: Write; answer: Answer }> = []
  const queue = new WriteQueue(send, {
    onState: (state) => states.push(state),
    onAnswer: (write, answer) => answers.push({ write, answer }),
  })
  return { queue, states, answers, last: () => states[states.length - 1]! }
}

/** Lets the promise chain after a settled `send` run. */
const settled = () => vi.advanceTimersByTimeAsync(0)

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('when a write is sent (29.1)', () => {
  test('a field value goes 600 ms after the last keystroke, once, with the last value', async () => {
    const { sent, send } = fakeSend()
    const { queue, last } = queueWith(send)

    queue.field('start', 'title.en', 'H')
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS - 100)
    queue.field('start', 'title.en', 'He')
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS - 100)
    expect(sent).toHaveLength(0)
    expect(last().saving).toBe(true)

    await vi.advanceTimersByTimeAsync(100)
    expect(sent.map((s) => s.write.change)).toEqual([{ path: 'title.en', value: 'He' }])
  })

  test('a blur flushes the pending value at once', async () => {
    const { sent, send } = fakeSend()
    const { queue } = queueWith(send)

    queue.field('start', 'title.en', 'Hello')
    queue.flush('start', 'title.en')
    expect(sent).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS)
    expect(sent).toHaveLength(1)
  })

  test('an operation goes at once', () => {
    const { sent, send } = fakeSend()
    const { queue } = queueWith(send)

    queue.operation('start', { op: 'add-source', kind: 'legal', label: {}, url: 'https://example.org/' })
    expect(sent).toHaveLength(1)
    expect(sent[0]!.write.key).toBeNull()
  })

  test('a value that changes again while its write is in flight is queued behind it, not cancelled', async () => {
    const { sent, send } = fakeSend()
    const { queue, answers } = queueWith(send)

    queue.field('start', 'title.en', 'first')
    queue.flush('start', 'title.en')
    queue.field('start', 'title.en', 'second')
    queue.flush('start', 'title.en')
    expect(sent).toHaveLength(1)
    expect(queue.hasWrite('start', 'title.en')).toBe(true)

    sent[0]!.answer(ok)
    await settled()
    expect(sent).toHaveLength(2)
    expect(sent[1]!.write.change).toEqual({ path: 'title.en', value: 'second' })
    expect(answers).toHaveLength(1)
    sent[1]!.answer(ok)
    await settled()
    expect(queue.hasWrite('start', 'title.en')).toBe(false)
  })
})

describe('one queue per page, in order (29.2)', () => {
  test('one request in flight at a time, in the order accepted; a newer value of a queued field replaces it in place', async () => {
    const { sent, send } = fakeSend()
    const { queue, last } = queueWith(send)

    queue.field('start', 'title.en', 'A')
    queue.flush('start', 'title.en')
    queue.field('start', 'description.en', 'B')
    queue.flush('start', 'description.en')
    queue.operation('start', { op: 'add-source', kind: 'legal', label: {}, url: 'https://example.org/' })
    queue.field('start', 'description.en', 'B2')
    queue.flush('start', 'description.en')
    expect(sent).toHaveLength(1)

    sent[0]!.answer(ok)
    await settled()
    expect(sent).toHaveLength(2)
    expect(sent[1]!.write.change).toEqual({ path: 'description.en', value: 'B2' })
    sent[1]!.answer(ok)
    await settled()
    expect(sent).toHaveLength(3)
    expect(sent[2]!.write.change).toMatchObject({ op: 'add-source' })
    sent[2]!.answer(ok)
    await settled()
    expect(sent).toHaveLength(3)
    expect(last().saving).toBe(false)
    expect(last().savedAt).not.toBeNull()
  })
})

describe('a failed request is retried (29.5)', () => {
  test('after 5, 10, 20, 40, 60 and then every 60 seconds, the indicator told each time; a 2xx clears it', async () => {
    const { sent, send } = fakeSend()
    const { queue, last, answers } = queueWith(send)

    queue.operation('start', { op: 'add-source' })
    const waits = [5_000, 10_000, 20_000, 40_000, 60_000, 60_000, 60_000]
    for (const [index, wait] of waits.entries()) {
      expect(sent).toHaveLength(index + 1)
      sent[index]!.answer({ status: index % 2 === 0 ? 0 : 503, body: null })
      await settled()
      expect(last().failure).toEqual({ attempt: index + 1, retryAt: Date.now() + wait })
      expect(answers).toHaveLength(0)
      await vi.advanceTimersByTimeAsync(wait - 1)
      expect(sent).toHaveLength(index + 1)
      await vi.advanceTimersByTimeAsync(1)
    }
    expect(sent).toHaveLength(waits.length + 1)
    sent[waits.length]!.answer(ok)
    await settled()
    expect(last().failure).toBeNull()
    expect(last().saving).toBe(false)
    expect(answers).toHaveLength(1)
  })

  test('the retry button sends the failed write now, and a later failure starts the ladder afresh after a success', async () => {
    const { sent, send } = fakeSend()
    const { queue, last } = queueWith(send)

    queue.operation('start', { op: 'add-source' })
    sent[0]!.answer({ status: 500, body: null })
    await settled()
    expect(last().failure?.attempt).toBe(1)
    queue.retry()
    expect(sent).toHaveLength(2)
    expect(last().failure).toBeNull()
    sent[1]!.answer(ok)
    await settled()

    queue.operation('start', { op: 'add-source' })
    sent[2]!.answer({ status: 0, body: null })
    await settled()
    expect(last().failure).toEqual({ attempt: 1, retryAt: Date.now() + 5_000 })
  })

  test('while a write is not accepted the queue is busy; a refusal is not retried', async () => {
    const { sent, send } = fakeSend()
    const { queue, answers } = queueWith(send)

    queue.field('start', 'description.en', '<script')
    expect(queue.busy()).toBe(true)
    queue.flush('start', 'description.en')
    sent[0]!.answer({ status: 422, body: { error: 'blocking', violations: [] } })
    await settled()
    expect(queue.busy()).toBe(false)
    expect(answers[0]?.answer.status).toBe(422)
    expect(sent).toHaveLength(1)
  })
})

describe('a session that expires (29.6)', () => {
  test('a 401 pauses the queue with the write kept, and resume sends the same request again', async () => {
    const { sent, send } = fakeSend()
    const { queue, last, answers } = queueWith(send)

    queue.field('start', 'title.en', 'kept')
    queue.flush('start', 'title.en')
    queue.field('start', 'description.en', 'also kept')
    queue.flush('start', 'description.en')
    sent[0]!.answer({ status: 401, body: null })
    await settled()
    expect(last().paused).toBe(true)
    expect(answers.map((a) => a.answer.status)).toEqual([401])
    expect(sent).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(120_000)
    expect(sent).toHaveLength(1)

    queue.resume()
    expect(last().paused).toBe(false)
    expect(sent).toHaveLength(2)
    expect(sent[1]!.write.change).toEqual({ path: 'title.en', value: 'kept' })
    sent[1]!.answer(ok)
    await settled()
    expect(sent[2]!.write.change).toEqual({ path: 'description.en', value: 'also kept' })
  })
})
