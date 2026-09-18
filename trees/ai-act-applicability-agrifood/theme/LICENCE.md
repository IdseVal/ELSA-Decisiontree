# Licence and ownership of the files in this folder

Every file this Tree's `theme` block names is listed below with the terms it is here
under, as `docs/specs/tree-format.md` 4.3 requires of a Tree that ships a Theme. The
fonts also carry their licence line in the manifest itself; this file is where the logo
and the tab icon are accounted for, because the format has no key for a logo's licence.

Provenance for every file: downloaded from https://ai4sfs.org on 2026-09-10 by the
implementer run for issue #40. Each SHA-256 below is the one issue #36's research
recorded on 2026-09-09 (`docs/research/issue-36-ai4sfs-visual-identity.md` section 8), so
the bytes here are the bytes that were measured.

## Fonts -- SIL Open Font License 1.1

`open-sans-400.woff2`, `open-sans-600.woff2`, `open-sans-700.woff2` are the latin subset
of **Open Sans**, weights 400, 600 and 700, as served by ai4sfs.org from its own server.

> Copyright 2020 The Open Sans Project Authors
> (https://github.com/googlefonts/opensans)
>
> This Font Software is licensed under the SIL Open Font License, Version 1.1.

The full licence text is `ofl-open-sans.txt` in this folder, which the OFL requires to
accompany the files. The files declare `fsType = 0` (installable embedding, no
restriction). Open Sans carries no Reserved Font Name, so redistributing these subsets
under their own name is permitted.

Only the latin subset is shipped: this Tree is in English and Dutch, whose characters are
all below U+0100. Nova Square, which ai4sfs.org loads for one oversized display heading,
is deliberately **not** shipped -- the frontend has no such heading, and its Reserved Font
Name "NovaSquare" makes a re-subsetted copy a licence question this Tree does not need to
raise (`ADR-37-theme-block.md`, Consequences).

    0e44026ad31376af1b56593cd4acb4f353f8e8789c51759e18f64578e4ef296a  open-sans-400.woff2
    a97a6ed7ef9f75c495e9224f5c59b2271d826e4a4345b738b390b0c76cc9f412  open-sans-600.woff2
    594a622208d1dad5d1dd58aef74f212ce7132d8f0aa5bacea6cfeb86d308c17a  open-sans-700.woff2
    fbbbcfef55318de350562559b671360de6d597112ecc5c73881b05092db89602  ofl-open-sans.txt

## Logo and tab icon -- the owner's own lab's mark

`elsa-lab-logo.png` is the desktop header logo of https://ai4sfs.org and `favicon.png` is
that site's tab icon. They are the mark of the **ELSA-Lab for sustainable food systems**
at Wageningen University -- the lab this project belongs to (`docs/CORE_DOCUMENT.md`
section 1) -- and the project owner asked in issue #35 for the application to display it.
ai4sfs.org carries no copyright line, colophon or terms page, so the licence line below is
the owner's own statement, not a published licence.

**Licence line** (the owner, on issue #73, 2026-09-18; core-document item 10.25):

> This is our logo, we have the right to use it it stays in the repo.

Both files stay in this repository. Whether they may also be published with it when it
goes public was asked in the same question and is not separately confirmed (see below and
issue #12).

    debeef5b5b35ab9571c0b7b4b170fbcc586361c5d94da96c72a9dcb584e1e74d  elsa-lab-logo.png
    53d5d494e7efe8e4f3dc9f8c4ed9a1d487d1437605d7f143af897e50802cd15a  favicon.png

The owner's words settle the right to use the logo. These questions put to the owner on
#73 were not answered and are recorded as such:

- Whether both files may be published with the repository when it goes public (#12): **not
  answered** -- the owner said the logo stays in the repository.
- Who "we" is, and whether anyone other than the owner (the lab, the university's
  communications department) must agree, and whether that agreement exists: **not
  answered**.
- Whether the mark is a registered trademark of Wageningen University & Research, and
  whether WUR's corporate-identity rules constrain how it is shown (minimum clear space,
  minimum size, permitted backgrounds): **not answered**.
- Whether the apple artwork inside the logo is stock material: **not answered**.
- Whether a transparent or vector master exists: **not answered**. Both files served have
  an **opaque background baked into the pixels** (white for the logo, `#ffc600` for the
  mobile variant). This Tree's palette has a white `background`, so the logo merges with
  the page; a Tree whose palette is dark, or a frontend that ever places the logo on a
  coloured surface, needs a master this lab has not published. That is why this Theme
  names no `logo.dark`.

Until those are answered, these two files travel with this Tree and with nothing else.
