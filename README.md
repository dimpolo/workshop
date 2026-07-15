# Vibe Coding Workshop Site

A website where every workshop participant vibe-codes one page, using Claude Code.
Each page lives in its own folder, so everyone can work in parallel without stepping
on each other's changes.

Once your pull request is merged, the site redeploys and your page goes live at:

```
https://WMT-GmbH.github.io/workshop/pages/<your-name>/
```

## Client-side only

This is a zero-build static site: there is no build step and no backend/server running
in production, on GitHub Pages or locally. Every page's interactivity (image uploads,
canvas drawing, API calls, etc.) must run entirely in the visitor's browser via
JavaScript. If a page idea seems to need a real backend (persisting data across users,
keeping secrets server-side, per-request server logic), it isn't possible with this
setup.

## Prerequisites

- Git
- A browser
- Something to serve the folder locally, e.g. Python's built-in `python -m http.server`
  or `npx serve` - no install/build tooling needed beyond that.

## Steps

1. Clone the repo and create a branch for yourself:

   ```
   git clone https://github.com/WMT-GmbH/workshop.git
   cd workshop
   git checkout -b <your-name>
   ```

   **If you use SSH keys:** Change the remote to SSH instead of HTTPS:
   ```
   git remote set-url origin git@github.com:WMT-GmbH/workshop.git
   ```

2. Copy the example page into your own folder (use your first name, lowercase):

   ```
   cp -r pages/_example pages/<your-name>
   ```

3. Add your page to `pages.json` (the list at the repo root) so it shows up on the
   homepage and in the nav:

   ```json
   { "name": "<your-name>", "title": "Your Title", "description": "One-line description" }
   ```

4. Edit your page with Claude Code:
   - `pages/<your-name>/index.html` - your page's content and `<title>`
   - `pages/<your-name>/style.css` - your page's styling (or add more files, e.g. a
     `script.js`, as you like)

   Build whatever you want on your page - it's entirely up to you, as long as it runs
   client-side (see above).

   Only touch files inside your own `pages/<your-name>/` folder, plus your one entry in
   `pages.json` - everything else (`shared/`, other people's folders) is shared, so
   leave it alone.

5. Preview locally:

   ```
   python -m http.server 8000
   ```

   Then open http://localhost:8000/pages/<your-name>/ in your browser. Just refresh
   after each change - there's nothing to rebuild.

6. Commit and push your branch, then open a pull request against `main`.

7. Once your PR is reviewed and merged, GitHub Actions automatically deploys the
   site - your page will be live within a minute or two.

## How it works

- `pages/<name>/` - one folder per participant, listed by hand in `pages.json`
- `pages.json` - the manifest of live pages (name, title, description) that drives the
  homepage list and the shared nav
- `shared/layout.js` - injects the header/nav into every page at runtime by
  fetching `pages.json`; include it with a relative path to `shared/layout.js` from your
  page
- `shared/style.css` - base styles shared by every page
- `.github/workflows/check.yml` - runs `node scripts/check-pages.mjs` on every PR to
  make sure `pages.json` and `pages/` stay in sync
- `.github/workflows/deploy.yml` - copies the site files into a clean folder and
  deploys them to GitHub Pages on every push to `main`
