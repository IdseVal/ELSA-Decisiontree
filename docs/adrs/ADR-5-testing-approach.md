# ADR-5-testing-approach: Vitest; fixtures are Tree folders opened through the loader; one interoperability test renders foreign-language Trees

- Status: ACCEPTED (frozen) -- 2026-09-03
- Issue: #5 -- Architecture: freeze the application contracts
- Spec: `docs/specs/application.md`, section 7

## Context

The build issues ship tests in the same PR and the CI Verifier runs "everything that
exists", so the runner and the way a Tree fixture is loaded must be the same in every
issue. The core document requires that a third-party Tree with one language, or with
languages other than English and Dutch, never breaks the frontend (9); that must be a
test, not a promise. The loader's interface is the test surface for the validity rules
(`ADR-4-validity-rules.md`); views are synchronous and take data
(`ADR-5-repository-layout.md`).

## Decision

- **Runner: Vitest**, run by `npm test` (`vitest run`), Node environment. Test files
  are `tests/**/*.test.ts` and `.test.tsx`. Type checking (`tsc --noEmit`) and the
  production build (`next build`) are part of CI alongside the tests.
- **A fixture is a Tree folder, opened through the loader's own interface:**
  `openTree(path.join(__dirname, 'fixtures', '<name>'))`. Tests never construct a
  `Tree` or a `Node` by hand and never read YAML themselves. The complete valid fixture
  is the spec's example, `trees/ai-act-example/`. `tests/fixtures/` holds:
  `single-language/` (Dutch only), `other-languages/` (German and French, neither a
  chrome language), and `invalid/<rule>/` -- one minimal Tree per validity rule, each
  breaking exactly that rule.
- **Views are tested by rendering to a string** with `react-dom/server`'s
  `renderToStaticMarkup`, given data obtained through the loader. No browser, no DOM
  library, for the contract-level tests; the UI issue may add jsdom and Testing
  Library for its client components.
- **The interoperability test (`tests/interop.test.tsx`)** is the executable form of
  core document section 9. For `single-language/` and `other-languages/`, and for
  every language each declares, it opens the Tree, renders the Node view for every
  Node of the fixture (their ids are known to the test) with an empty Trail and with a
  full Trail, and asserts: no exception; the Node title in that language is present;
  the disclaimer is present in Dutch for `nl` and in English for `de` and `fr`; the
  language switch lists exactly the manifest's languages; the markup contains neither
  `undefined` nor `[object Object]`.
- **The URL module** is tested as a pure function: parse and build are inverses over
  the fixture's ids; each 404 condition of `ADR-5-url-scheme.md` has a case.
- **End-to-end browser tests are not part of the contract.** The `webapp-testing`
  skill may be used by the Verifier to probe a running app; a Playwright suite can be
  added by a later issue if the UI grows.

## Alternatives rejected

- **Jest.** Needs a transform for TypeScript and ESM that Vitest ships without
  configuration; nothing here needs Jest's ecosystem.
- **Hand-built `Node` objects in tests.** Faster to write, but they test the view
  against the author's idea of a Node, not against what the loader produces from a
  real file. Fixtures through the loader test the seam as callers use it.
- **A snapshot of the rendered HTML as the interoperability test.** A snapshot fails
  whenever the design changes and says nothing about *why*; the named assertions
  above survive a redesign and state the requirement.
- **Mocking the file system.** The Trees are small folders in the repository; reading
  them is faster than maintaining a fake, and a fake that behaves better than the
  real thing proves nothing.
- **Playwright from the start.** A second toolchain (browsers, a running server) for
  an app that is server-rendered HTML with two client components. Deferred until
  there is client behaviour worth driving.

## Consequences

- Every build issue adds its tests under `tests/` against the loader's interface and
  the components' props; none needs test infrastructure of its own.
- The Verifier can run `npm ci && npm test && npm run build` on a fresh runner; the
  CI toolchain block in `.github/workflows/agent-pipeline.yml` is uncommented for
  Node 22 and npm by the scaffold issue.
- The `invalid/<rule>/` fixtures double as documentation of what each rule rejects.
