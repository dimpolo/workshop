# Claude Code Workshop Site

A website where every workshop participant vibe-codes one page, using Claude Code.
Each page lives in its own folder, so everyone can work in parallel without stepping
on each other's changes.

Once your pull request is merged, the site rebuilds and your page goes live at:

```
https://dimpolo.github.io/workshop/<your-name>/
```

## Prerequisites

- Git
- Python 3
- `pip install jinja2`

## Steps

1. Clone the repo and create a branch for yourself:

   ```
   git clone https://github.com/dimpolo/workshop.git
   cd workshop
   git checkout -b <your-name>
   ```

2. Copy the example page into your own folder (use your first name, lowercase):

   ```
   cp -r pages/_example pages/<your-name>
   ```

3. Edit your page with Claude Code:
   - `pages/<your-name>/meta.py` - your page's title and description (shown on the homepage)
   - `pages/<your-name>/index.html.j2` - your page's content
   - `pages/<your-name>/style.css` - your page's styling (or add more files as you like)

   Build whatever you want on your page - it's entirely up to you.

   Only touch files inside your own `pages/<your-name>/` folder - everything else
   (`templates/`, `build.py`, other people's folders) is shared, so leave it alone.

4. Preview your page locally:

   ```
   python build.py
   python -m http.server 8000 --directory dist
   ```

   Then open http://localhost:8000/<your-name>/ in your browser. Re-run `python build.py`
   after each change and refresh.

5. Commit and push your branch, then open a pull request against `main`.

6. Once your PR is reviewed and merged, GitHub Actions automatically rebuilds and
   deploys the site - your page will be live within a minute or two.

## How it works

- `pages/<name>/` - one folder per participant, auto-discovered by `build.py`
- `templates/base.html.j2` - shared header/footer/nav that every page extends
- `build.py` - renders every page in `pages/` into static HTML in `dist/`
- `.github/workflows/build-check.yml` - runs `build.py` on every PR to catch errors early
- `.github/workflows/deploy.yml` - runs `build.py` and deploys `dist/` to GitHub Pages on every push to `main`
