# ADR-5-chrome-languages: chrome in English and Dutch as typed strings in the code; follows the content language, falls back to English

- Status: ACCEPTED (frozen) -- 2026-09-03; decides core document OPEN 10.20
- Issue: #5 -- Architecture: freeze the application contracts
- Spec: `docs/specs/application.md`, section 3

## Context

The UI chrome -- the yes/no labels, the disclaimer, the share button, the Trail
heading, the language switch, the 404 page -- is text the *frontend* owns, not the
Tree. Open item 10.20 asks which languages it ships in and what to show when the user
picks a Tree language the chrome does not have; the Planner expected English and Dutch
with a fallback to English. A Tree declares its own languages, open-ended
(`ADR-4-localised-text.md`); a German-only Tree must load without breaking (core
document 9). There are no cookies, so a language choice lives in the URL
(`ADR-5-url-scheme.md`).

## Decision

- Chrome ships in **English (`en`) and Dutch (`nl`)**.
- The strings live in **one TypeScript module, `src/chrome.ts`**, as a record keyed by
  language, typed so that a key missing from one language is a compile error. No
  translation library, no message files, no runtime loading.
- **The chrome language follows the content language**: if the content language's
  primary subtag (the part before the first hyphen: `nl-be` gives `nl`) is a chrome
  language, chrome is shown in it; **otherwise chrome is shown in English**. The
  content language is never affected by this rule; only the chrome falls back.
- The `<html lang>` attribute is the content language. Chrome elements whose language
  differs from it carry their own `lang` attribute, so screen readers pronounce both
  correctly.
- Adding a chrome language is a code change: a third key in `src/chrome.ts`, with
  every string. It needs no ADR.

## Alternatives rejected

- **Letting the Tree supply chrome strings.** Would give a German Tree German chrome,
  but it widens the frozen `elsa-tree/1` format for a need nobody has yet, and every
  third-party author would have to translate the frontend's words. If it is ever
  wanted, it is an `elsa-tree/2` question, not a frontend one.
- **An i18n library (next-intl, i18next) with message files.** Built for hundreds of
  keys, plural rules and lazy-loaded catalogues. The chrome has about twenty short
  strings; a typed record gives compile-time completeness that message files do not.
- **Chrome from the browser's `Accept-Language`.** Would mix languages on one screen
  (Dutch content, English buttons for a visitor whose browser says English) and make
  the same share link look different to two recipients. The content language is the
  user's explicit choice; chrome follows it.
- **Fall back to the Tree's default language's chrome, then English.** For a Tree in
  `[de, nl]` viewed in German this would show Dutch chrome instead of English. English
  is the language most of a broad international audience of AI developers can read;
  one rule, one fallback.

## Consequences

- A Tree in any language renders: content in that language, chrome in English or
  Dutch. The interoperability test (`ADR-5-testing-approach.md`) asserts exactly this.
- The build issues share one list of chrome keys (spec section 3.2); the UI issue may
  add keys, in both languages, without touching this decision.
