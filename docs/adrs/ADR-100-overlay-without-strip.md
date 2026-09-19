# ADR-100-overlay-without-strip: an Overlay shows its explanation Node's Interior and Options and no strip, because its panel has no room for one

- Status: ACCEPTED (frozen) -- 2026-09-19
- Issue: #100 -- Architecture: amend 10.9 where the build of #80 departs from it
- Spec: `docs/specs/application.md` 10.9 (the pre-rendering bullet), 11.4 (its last paragraph); 11.5 and 12 unchanged
- Core document: 3.2 ("This overlay should just contain the larger explainer that would be displayed in the side-node"), section 8 (a credit on every Image), 10.26
- Amends: `ADR-78-overlay.md` decision 2 and `ADR-78-fan-out-and-option-picture.md` decision 2, as far as they name "a closed Overlay's strip pictures"
- Built by: #80 (`Overlay` in `src/components/TreeView.tsx`, PR #99)

## Context

`application.md` 10.9 describes the Overlay as the `Sheet` with one page: the target's
**Interior** (main image, title, description, Sources under their heading) and, under
it, the target's own Options as a list of plain links. It gives the panel exactly: 760 x
608, 640 x 560 of content, "the Interior's 392, a gap of 8 and 160 of list". Its
pre-rendering bullet then says the Overlay's "strip pictures are `loading="lazy"`,
requested only once it is open", and 11.4's last paragraph repeats it. `ADR-78-overlay.md`
decision 2 and `ADR-78-fan-out-and-option-picture.md` decision 2 say the same.

Nothing in 10.9 places a strip, and there is nowhere to put one: 392 + 8 + 160 is the
whole 560, and the strip of 12.2 is a row of 48-pixel thumbnails. The build of #80
(PR #99) renders the Interior and the Options and no strip; the Reviewer found the
departure measured (point 1 on head `2e2e47a`). This ADR decides which of the two
sentences is the contract.

## Decision

**An Overlay has no strip.** It shows its explanation Node's Interior -- the main image
among it, the file the Option button already shows -- and its Options, and nothing of
the Node's Images after the first. 10.9's pre-rendering bullet and 11.4's last paragraph
say so; an aside names no image URL but its main image's, open or closed.

The explanation Node's later Images are drawn where it is the centre of a page and has
its own Carousel (10.3): at `/<tree>/<explanation-id>`, and as the first of three
explanation Nodes ending a path (`ADR-100-bounded-centre.md`). On 2026-09-19 no
explanation Node of either Tree has more than one Image (counted with a script over
both `tree.yaml` files), so nothing a reader of either Tree could see is lost.

## Alternatives rejected

- **Give the panel the room, below the Options.** Rejected: the panel is 608 pixels tall
  at the guaranteed 640 (10.4), and a strip adds at least its 48 pixels and a gap. The
  room would have to come from the Interior, whose 392 are the format's limits with two
  pixels to spare (10.7, `ADR-78-main-image-and-row-budget.md`), or from the list of eight
  Options, whose 160 are eight 20-pixel lines. Either cut changes a format limit or the
  Overlay fixture's maxima, for pictures no Tree has.
- **Give the panel the room beside the Interior**, as a vertical column of thumbnails in
  the width the 1280-pixel viewport has spare. Rejected: it is a second form of the
  Carousel -- vertical where 12.2's is horizontal -- and a second element allowed to
  scroll, where 10.6 allows exactly one; and it would need its own step in the
  degradation order of 10.5, below which the panel's width is gone.
- **Keep the pictures, without room, as a strip that overlaps the panel's rim.**
  Rejected for the same reason the Bubble's strip is measured to the pixel: the no-scroll
  test (10.6) measures every element of the open Overlay, and an overlap that holds at
  one Tree's maxima is a guess at another's.
- **Any strip in an Overlay at all.** Beyond the room: a strip's pictures show their
  credits only in the enlarged view (12.3, 10.26), and the enlarged view is a `Sheet`;
  one Sheet is open at a time (10.9), so a picture enlarged from inside an Overlay would
  close the Overlay it came from. And the owner asked of the Overlay only "the larger
  explainer that would be displayed in the side-node", with its main image above its
  title (#75, core document 3.2).

## Consequences

- `application.md` 10.9 and 11.4 are amended. **11.5 is unchanged**: its row "after an
  Overlay is opened, may: the image files of the Node in the Overlay" still bounds what
  may be fetched, and with no strip the one file it amounts to is the main image the
  button already fetched. Narrowing that row is not needed for this decision and would
  change what `transition.spec.ts` may assert, so it is left.
- `ADR-78-overlay.md` decision 2 and `ADR-78-fan-out-and-option-picture.md` decision 2
  point here where they name an Overlay's strip pictures.
- The Overlay in `src/components/TreeView.tsx` is the rule as written; its comment can
  drop its pointer to #100 and cite 10.9. Nothing in the build changes.
- An author who gives an explanation Node more than one Image should know the later ones
  are seen only on a page centred on it. If the owner wants them in the Overlay, that is
  a new `architecture` issue that must first find the 56 pixels this ADR could not.
