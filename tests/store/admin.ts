/**
 * **[#135]** The environment every store a test opens needs: a store with no administrator
 * refuses to start without `ELSA_ADMIN_PASSWORD` (docs/specs/application.md 20.3).
 */
export const ADMIN_PASSWORD = 'test administrator password'

export const ADMIN = { ELSA_ADMIN_PASSWORD: ADMIN_PASSWORD } as const
