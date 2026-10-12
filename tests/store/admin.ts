/**
 * **[#135]** The environment every store a test opens needs: a store with no administrator
 * refuses to start without `ELSA_ADMIN_PASSWORD` (docs/specs/application.md 20.3), **[#196]** or
 * without `ELSA_ADMIN_EMAIL`, set beside it in a domain RFC 2606 reserves for examples (38.3).
 */
export const ADMIN_PASSWORD = 'test administrator password'

/** **[#196]** The address the administrator of every test store logs in with (35.3, 38.10). */
export const ADMIN_EMAIL = 'admin@example.org'

export const ADMIN = { ELSA_ADMIN_EMAIL: ADMIN_EMAIL, ELSA_ADMIN_PASSWORD: ADMIN_PASSWORD } as const
