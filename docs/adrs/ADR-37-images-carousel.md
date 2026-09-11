# ADR-37-images-carousel: the Image list is unchanged; the Carousel's order is the list order and its caption is the description; only a count is added

- Status: ACCEPTED (frozen) -- 2026-09-10
- Issue: #37 -- Architecture: freeze elsa-tree/2
- Spec: `docs/specs/tree-format.md`, section 5.2, 5.4; rules V-IMAGE, V-COUNT
- Keeps: `docs/adrs/ADR-4-image-reference.md`

## Context

The owner (issue #35): "where are the images? I told you there should be image
carrousells below the node bubble." `elsa-tree/1` carries Images -- a file name, a
localised description, a required credit, an optional pointer to a Source -- on Nodes
and on Options; the first Tree was authored without any (content issue #45). The core
document (3.2, 10.6, revised 2026-09-09) reverses the 0.1 "thumbnails, no chrome"
decision: Images are shown as a Carousel below the Bubble; clicking one shows it
larger with its description and credit. Issue #37 asks whether an Image list needs
anything for a Carousel: an order, a caption.

## Decision

**Nothing is added to an Image, and nothing is removed.** The Carousel shows a Node's
Images in the order of its `images` list, first entry first; the caption under a
picture is its `description`; the credit is shown with it. There is no `order` key, no
`caption` key, no `cover` key. The only change is the count of section 5.7: at most 10
Images on a Node and 3 on an Option, so the strip and its controls stay bounded, in
step with the other limits. Whether Option Images join the Node's Carousel or appear
with their Option is the frontend's decision (#38); the data is the same either way.

## Alternatives rejected

- **An `order` number per Image.** The list already has an order, and a number per
  entry is the list-index pointer `ADR-4-image-reference.md` rejected for Sources:
  it breaks silently when an entry is inserted and says nothing the position does not.
- **A separate `caption` next to `description`.** A caption is what the picture shows,
  in the reader's language; that is the description, which is also the accessible
  alternative text. Two fields that say the same thing drift; one that serves both
  roles is what the 0.1 format already had and what every Image in the repository
  already fills in.
- **A `cover` flag for the picture shown first.** Move it to the top of the list.
- **Dropping Images from Options** because the Carousel hangs off the Node. The owner's
  own description of the high-risk lists -- each piece of legislation "with an image
  showing what kind of product it covers" (core document 3.3) -- is an Image on an
  Option; where the frontend shows it is a view decision, not a data one.
- **No count limit on Images**, since only one is on screen at a time. The Carousel
  still needs a control per picture or a counter, and the descriptions are downloaded
  with the Node; ten pictures on one Node is plenty, and a Node that wants more has a
  list of Options waiting to be written.

## Consequences

- Every Image written against `elsa-tree/1` is valid `elsa-tree/2` as it stands, and
  the migration does not touch `images/`.
- #45 sources pictures into the existing shape; #43 builds the Carousel against a
  contract that has not moved since 2026-09-03.
