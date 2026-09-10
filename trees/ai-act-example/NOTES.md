# Notes on the example Tree

`tree.yaml` is section 8 of `docs/specs/tree-format.md` verbatim: the complete example
Tree of the `elsa-tree/2` contract, in English and Dutch. It is the development default
and the Tree the loader tests load, so it is kept identical to the spec -- change the
spec first, then this file. Its legal content is simplified and not to be relied on.

It was written rather than converted from its `elsa-tree/1` folder, as
`docs/specs/tree-format.md` 12.3 asks (#39): its old Nodes exceeded the new length
limits, and section 8 is the rewritten content.

## The Theme's files

| File | What it is |
|---|---|
| `elsa-lab-logo.svg`, `elsa-lab-logo-white.svg` | **Placeholders**, drawn for this example: a wordmark in the Theme's own colours, dark for a light background and white for a dark one. ai4sfs.org publishes no vector logo (`docs/research/issue-36-ai4sfs-visual-identity.md` section 2), so a real logo is #40's, with the lab's permission. |
| `open-sans-400.woff2`, `open-sans-700.woff2` | Open Sans, latin subset, from Google Fonts. Open Sans is one **variable** font file covering both weights, so both names hold the same file; each `@font-face` picks its weight out of it. |
| `nova-square-400.woff2` | Nova Square, latin subset, from Google Fonts. |
| `ofl-open-sans.txt`, `ofl-nova-square.txt` | The SIL Open Font License 1.1 texts the two families are redistributed under. The Theme names them in its `licence` lines but does not reference them as files, so the loader ignores them and `themePath` never serves them (`docs/specs/application.md` 5.1). |
