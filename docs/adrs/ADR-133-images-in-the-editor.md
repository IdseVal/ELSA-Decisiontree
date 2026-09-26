# ADR-133-images-in-the-editor: the empty slot and a + thumbnail at the strip's end are the pickers and the drop targets; an upload is attached only with a credit, asked for in a Sheet; the enlarged view is where an Image is described, reordered, made the main image and removed; a draft's pictures come through the admin image route

- Status: ACCEPTED (frozen) -- 2026-09-26
- Issue: #133 -- Architecture: freeze the editor contracts
- Spec: `docs/specs/application.md` section 31 (new)
- Amends: `docs/adrs/ADR-78-carousel.md` (the enlarged view gains its edit mode),
  `ADR-78-main-image-and-row-budget.md` (the empty slot is a control in the editor)
- Depends on: `docs/adrs/ADR-132-editor-api.md` (the upload route, `add-image`,
  `remove-image`, `move-image`, the admin image route), `ADR-133-reuse-rule.md` (the image
  URL builder as a parameter), `ADR-133-bubble-edited-in-place.md`

## Context

The owner: "images can be uploaded". Every Node leads with its first Image above the title
(10.3) and shows the rest as the strip of 12; every Image has a `description` (its
alternative text) and a **required `credit`** (core document 10.12, 10.26: "We write it in
the alt text, that is a final decision"), both shown whole in the enlarged view a click
opens (12.3). #132 froze the upload: one file per request, sniffed, renamed by the server,
5 MiB, four raster types, then a separate `add-image` operation attaches it to a Node
(22.6); a draft's picture is served only to a reader with a role, at `GET
/admin/api/trees/<t>/images/<file>`, so the Bubble "takes its image URL builder as a
parameter". An Option button shows its target's main image (10.29).

## Decision

1. **Two pickers, in the two places a picture appears.** In edit mode the **empty slot** of
   10.3 (the faint circle where a Node has no Image) is a button: a `+` in it, the label
   `addPicture`, a file input behind it accepting `image/png, image/jpeg, image/gif,
   image/webp`, and a drop target for one file. The **strip** gains, after the last
   thumbnail (or alone, on a Node with one Image), a `+` thumbnail of the same 48 pixels,
   outlined dashed, the same input and drop target; it is absent at ten Images (V-COUNT).
   A Node with no Image has the slot's `+` only: the first upload becomes the main image
   because it is the first entry (5.2). Dropping a file anywhere else on the page does
   nothing.

2. **An upload is two requests, and nothing is attached without a credit.** The script
   sends the file as `multipart/form-data` to `POST .../images` (22.6) and, on 201, opens
   the **attach Sheet**: the picture (from the admin image route, decision 5), the file
   name the server gave, a field `credit` (120 characters, plain, **required**: the
   `attach` button is disabled while it is empty), a field `description` for the page's
   language (120, plain, may be left for later), and `attach` / `cancel`. `attach` sends
   `add-image { file, credit, description: { <lang>: ... } }` through the queue
   (`ADR-133-autosave.md`) and the page repaints from the response: the main image or the
   new thumbnail appears. `cancel` sends `DELETE .../images/<file>` so the folder holds no
   picture nobody named (a 409 -- the same bytes already attached elsewhere -- is ignored:
   the file is somebody's). The store would accept an empty credit as V-IMAGE's advisory
   (19.2); the editor does not send one, because the owner's rule is "required for every
   Image without exception" (5.2) and the one moment a creator has the source in front of
   them is when they upload it. A description in the other languages is written in the
   enlarged view (decision 3), and its absence is V-L10N's to-do.

3. **The enlarged view is the Image's editor.** The Sheet of 12.3 -- the full picture, its
   description and credit beneath, `previous` and `next` -- stays, and in edit mode the two
   lines beneath the picture are `Field`s: `images[i].description.<lang>` (120) and
   `images[i].credit` (120, not localised), with the rim's counter and tags beside them
   (`ADR-133-bubble-edited-in-place.md`, decision 3). Under them a row of four controls:
   `makeMain` (`move-image` to index 0; absent on the main image), `moveEarlier` and
   `moveLater` (`move-image` by one; absent at the ends), and `removeImage`. The strip and
   the slot repaint from the response, so making a picture the main image moves the old
   main image to the strip's first place, as 5.2's "the array is the order" says.

4. **Removing an Image is `remove-image` then, best effort, the file.** The operation
   removes the entry (and the `images` key when it was the last, 22.4); the script then
   sends `DELETE .../images/<file>`, which the store refuses with 409 while the draft or the
   published copy still names the file (another Node's Image, or the public copy until the
   next publish, 22.6) -- the editor ignores that answer, because the store deletes every
   unreferenced file after a publish anyway. No confirmation: the picture is one upload
   away and a removed entry does not delete the bytes at once.

5. **A draft's pictures come through the admin image route.** In edit mode every `<img>` and
   every enlarge link of the Bubble, the strip, the Overlay and the Option buttons is built
   by `links.image(file)` = `adminImageHref(treeId, file)` (`ADR-133-reuse-rule.md`,
   decision 3; `ADR-132-editor-api.md`, decision 8) instead of `imageHref`, so a picture
   uploaded a second ago is on screen before any publish, and a hidden Tree's pictures are
   seen by its creators and by nobody else. The public page is untouched.

6. **The Option button's picture follows the aside.** When an Image is attached to, moved
   on or removed from the Node in an open Overlay, the response's Node repaints the
   Overlay's Interior and the **Option button's 48-pixel picture** on the same page (10.29:
   the target's first Image), so the owner's "the moment it is uploaded" holds without a
   reload. The width and height the upload route returns are not used by the strip, whose
   thumbnails are 48 x 48 (12.2), nor by the main image's 3 : 2 box (10.3); they are kept
   for the enlarged view's `<img width height>`, so the picture lays out before it loads.

7. **Errors are shown at the picker.** 413 → `fileTooLarge` ("at most 5 MiB"); 415 →
   `fileTypeRefused` ("PNG, JPEG, GIF or WebP"); a 422 → its message; each under the slot
   or the strip in the indicator (`ADR-133-autosave.md`, decision 3), the picker staying
   where it was. The tenth Image's `+` is absent, so V-COUNT is never asked for; the
   attach of an eleventh by two collaborators at once is stored and reported as V-COUNT's
   advisory, like every count.

8. **Not offered**: cropping, resizing, rotating (#140's OUT OF SCOPE), an Image's `source`
   pointer to a Source (`ADR-133-bubble-edited-in-place.md`, decision 8), a picture on an
   Option itself (an Option has none, 5.4), the Theme's logo (#144, if promoted).

## Alternatives rejected

- **A single upload control in the top panel** with an "attach to this Node" list. The
  owner's picture is uploaded where it is seen; a panel is where nothing is seen.
- **Attaching first and asking for the credit afterwards** (the store allows it). A
  picture without a credit on screen for a day is the state 10.26 was decided against; the
  Sheet costs one field before the picture appears.
- **A confirmation before removing an Image.** The bytes stay until a publish sweeps them,
  and the entry is one upload away; a confirmation on every small removal trains creators
  to click through it.
- **Drag-to-reorder in the strip.** A drag on 48-pixel thumbnails inside a scroll-snap
  strip, on a touch device, with a keyboard alternative still needed; two buttons in the
  enlarged view are the keyboard alternative and work everywhere.
- **Reordering by editing the position as a number.** Numbers on ten pictures; earlier and
  later are what a creator means.
- **Serving a draft's pictures through the public route with a session check.** The
  public route reads no `Cookie` (20.5) and must not start to; #132 put the draft's route
  under `/admin/api` for that reason.

## Consequences

- #140 builds `src/editor/ImageSlot.tsx` (the slot and the strip's `+`, the input, the
  drop), `AttachSheet.tsx`, and the edit mode of `EnlargedView.tsx` (the two fields and
  the four controls, rendered only when the `edit` seam is set, so the public enlarged
  view's markup is unchanged and `views.test.tsx` says so).
- `src/chrome.ts` gains `addPicture`, `attach`, `makeMain`, `moveEarlier`, `moveLater`,
  `removeImage`, `fileTooLarge`, `fileTypeRefused` (#140); `credit` and `enlarge` exist.
- `tests/browser/upload.spec.ts` (#140) asserts: an upload through the slot opens the
  attach Sheet with `attach` disabled until a credit is typed; the attached picture is
  above the title and, after publishing through #136's route, on the public page, whose
  request list is exactly 11.5's set; a second upload lands in the strip; `makeMain`
  swaps them; `removeImage` empties the strip; an SVG and a 6 MiB file show their errors
  at the picker; the Option button's picture appears the moment an aside's main image is
  attached in its Overlay; every `<img>` on the editor page is under
  `/admin/api/trees/<t>/images/` and none under `/<t>/images/`.
