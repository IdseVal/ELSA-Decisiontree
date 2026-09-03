import { defineConfig } from 'vitest/config'

// docs/specs/application.md section 7: Node environment, tests under tests/.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
})
