# ADR-4-localised-text: per-language mappings that must cover every declared language

- Status: ACCEPTED (frozen) -- 2026-09-03
- Issue: #4 -- Architecture: freeze the Tree file format and schema
- Spec: `docs/specs/tree-format.md`, sections 3.3, 9; rules V-LANG, V-L10N

## Context

Every piece of user-facing text is held per language inside the Node; which languages
a Tree provides is up to its author; a Dutch-only Tree or a Tree with German added must
load without breaking (core document 3.1, 9, 10.4). The frontend must never break on
a third-party Tree.

## Decision

- The manifest declares `languages`: a non-empty ordered list of lowercase BCP 47
  tags. The first is the default language.
- Every user-facing string is a **localised text**: a mapping from language tag to
  string. It must contain a non-empty value for **every** declared language and **no**
  other keys. This applies even to a single-language Tree (a bare string is invalid).
- Not localised: ids, file names, URLs, credits, metadata.
- Source URLs are one string for all languages.

## Alternatives rejected

- **Fallback to the default language when a translation is missing.** Lets a
  half-translated Tree load, so the frontend must handle mixed-language screens and
  authors never find out which strings they forgot. Strict coverage moves the failure
  to validation time, where the message names the file and key. "Add German" is done
  when the validator passes, not when someone notices a Dutch sentence on the German
  screen.
- **Bare string allowed when the Tree has one language.** Two shapes for one concept;
  every consumer branches on it, and adding a second language later means rewriting
  every field. One shape, always.
- **Separate translation files per language** (`nodes/start.yaml` + `i18n/nl.yaml`).
  Standard in software localisation, wrong for this audience: the owner edits a Node
  and expects to see both languages side by side; it also contradicts the core
  document's rule that text lives inside the Node.
- **Per-language Source URLs.** EUR-Lex has language-specific pages, but the
  `/eli/...` addresses negotiate the reader's language, and a mapping-or-string union
  type widens the interface for one caller. Authors choose language-neutral URLs.

## Consequences

- The frontend can assume that any Node has every language the manifest lists; the
  language switch is built from the manifest alone.
- A translation is either complete or absent. Work in progress stays outside `nodes/`
  or in version control branches.
- Extra languages in the data are errors, which also catches typos like `nk:`.
