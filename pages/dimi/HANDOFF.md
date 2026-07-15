# Handoff: Dimi's workshop page — emoji photo mosaic

## Status
Nothing has been built yet. This directory contains only this handoff doc.
The previous session ran a full design interview (via the `grilling` skill) and
reached agreement on every major decision below, but stopped before writing any
code — the user then ran `/handoff` instead of saying "go ahead."

Next session should start by implementing the plan below, then delete this file
once the page is built (it's a handoff artifact, not project documentation).

## Repo context
This is `dimpolo/workshop`, a zero-build static site where each workshop
participant gets one page under `pages/<name>/`. Read `README.md` at the repo
root first — it covers the required structure (`index.html` + `style.css` per
page, entry in root `pages.json`, `shared/layout.js` include) and the hard
constraint that **everything must run client-side** (no backend, no build
step, deployed as-is to GitHub Pages). See `pages/_example/` for the scaffold
every page is copied from.

## The feature: photo → emoji mosaic
User uploads a photo; the page regenerates it as a mosaic of emoji, each
emoji chosen to color-match the corresponding region of the original image.

### Decisions locked in during grilling (do not re-litigate these)
- **Emoji palette**: broad curated set (~120–150 diverse emoji — faces,
  animals, food, objects, hearts, etc.), each hand-assigned a representative
  RGB color. Chosen over a small accurate color-swatch set (🟥🟩🟦 etc.)
  because the goal is a fun, recognizable "emoji art" look, not color
  precision.
- **Rendering**: draw emoji as text onto a single `<canvas>` (not a DOM grid
  of `<span>`s). This is what makes a one-click PNG download possible via
  `canvas.toDataURL()` and avoids DOM bloat at high grid density.
- **Grid density**: adjustable via a slider (coarse ↔ fine columns; rows
  derived from image aspect ratio), live-recomputing on change (debounce the
  recompute so dragging the slider stays smooth).
- **Per-cell color sampling**: average RGB of all pixels in the cell (not
  dominant/most-frequent color) — cheaper, smoother, and avoids muddy/noisy
  results in the workshop's likely use case (photos of faces).
- **Color matching**: nearest emoji in the palette by simple RGB Euclidean
  distance (no need for perceptual/Lab distance — not discussed as necessary).
- **Layout**: original photo and emoji mosaic shown side-by-side (stacked on
  mobile), so the before/after comparison is immediate.
- **Upload UX**: a dropzone that's both clickable (opens file picker) and
  drag-and-drop.
- **Download**: yes — a "Download image" button exporting the canvas as PNG.
- **Page copy**: minimal frame — short heading + one-line intro ("Hi, I'm
  Dimi — upload a photo..."), then the tool is the main content. No fuller
  bio was supplied.
- **Known caveat to surface in the UI copy**: emoji glyphs render differently
  across OS/browser fonts (Windows/Mac/mobile), so the mosaic's exact look
  varies by viewer platform — inherent to system emoji fonts, not a bug to
  fix.

### Not yet decided (use judgment, or ask if it materially changes the design)
- Exact slider range/default (a reasonable starting point: 15–80 columns,
  default ~40, not yet confirmed with the user).
- Max upload resolution / downscale-before-processing safeguard for
  performance — not discussed, just needs a sane default.
- Exact composition of the ~120–150 emoji palette and their assigned colors —
  not discussed in detail, left to implementation.
- File/error handling for non-image uploads — not discussed.

## Files to create
- `pages/dimi/index.html` — page content, `<title>`, includes
  `../../shared/style.css`, own `style.css`, `shared/layout.js` (see
  `pages/_example/index.html` for the exact include pattern/relative paths).
- `pages/dimi/style.css` — page-specific styling (dropzone, side-by-side
  layout, slider, buttons).
- `pages/dimi/script.js` — upload handling, canvas drawing, color sampling,
  nearest-emoji matching, download.
- Add `{ "name": "dimi", "title": "...", "description": "..." }` to root
  `pages.json` (title/description copy not yet chosen).

## Suggested skills for next session
- **`run`** — launch/preview the static site locally (e.g. `python -m
  http.server`) to visually check the page as it's built, not just read the
  code.
- **`verify`** — after implementing, actually exercise the upload → mosaic →
  download flow end-to-end rather than relying on eyeballing the code.
- **`code-review`** — run before considering the page done, since this is
  non-trivial client-side logic (canvas, color math) worth a correctness pass.
- Do **not** re-run `grilling` on the decisions already listed above as
  locked in — only grill genuinely new/open questions if they come up.
