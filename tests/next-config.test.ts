/**
 * Build configuration (docs/specs/application.md section 1): the settings in
 * next.config.ts that a later edit must not silently drop.
 */
import { describe, expect, test } from 'vitest'
import config from '../next.config.ts'

describe('next.config.ts', () => {
  test('the build output is a self-contained folder and no framework header is sent', () => {
    expect(config.output).toBe('standalone')
    expect(config.poweredByHeader).toBe(false)
  })

  test('Next.js does not write AGENTS.md or CLAUDE.md into the repository root', () => {
    // `next dev` scaffolds both files when it detects an AI coding agent. The root
    // CLAUDE.md is what the agents in .orca/ read as project instructions, so a
    // generated one-liner would silently become this project's instructions.
    expect(config.agentRules).toBe(false)
  })
})
