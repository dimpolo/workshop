"""Builds the static workshop site from pages/<name>/ into dist/.

Usage:
    python build.py
Then preview with:
    python -m http.server 8000 --directory dist
"""

import importlib.util
import shutil
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

ROOT = Path(__file__).parent
PAGES_DIR = ROOT / "pages"
TEMPLATES_DIR = ROOT / "templates"
DIST_DIR = ROOT / "dist"


def load_meta(page_dir: Path):
    meta_path = page_dir / "meta.py"
    if not meta_path.exists():
        raise SystemExit(f"{page_dir.name}: missing meta.py (see pages/_example/meta.py)")

    spec = importlib.util.spec_from_file_location(f"meta_{page_dir.name}", meta_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    for field in ("TITLE", "DESCRIPTION"):
        if not hasattr(module, field):
            raise SystemExit(f"{page_dir.name}/meta.py: missing {field}")

    return module.TITLE, module.DESCRIPTION


def discover_pages():
    pages = []
    for page_dir in sorted(PAGES_DIR.iterdir()):
        if not page_dir.is_dir():
            continue
        title, description = load_meta(page_dir)
        pages.append({"name": page_dir.name, "title": title, "description": description})
    return pages


def build_nav(pages, from_subpage: bool):
    prefix = "../" if from_subpage else ""
    nav = [{"title": "Home", "href": "./" if not from_subpage else "../"}]
    for page in pages:
        nav.append({"title": page["title"], "href": f"{prefix}{page['name']}/"})
    return nav


def render_home(pages):
    env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)))
    template = env.get_template("index.html.j2")

    home_pages = [{**page, "href": f"{page['name']}/"} for page in pages]
    html = template.render(pages=home_pages, nav=build_nav(pages, from_subpage=False))

    (DIST_DIR / "index.html").write_text(html, encoding="utf-8")


def render_page(page, pages):
    page_dir = PAGES_DIR / page["name"]
    env = Environment(loader=FileSystemLoader([str(page_dir), str(TEMPLATES_DIR)]))
    template = env.get_template("index.html.j2")

    html = template.render(
        title=page["title"],
        description=page["description"],
        nav=build_nav(pages, from_subpage=True),
    )

    out_dir = DIST_DIR / page["name"]
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "index.html").write_text(html, encoding="utf-8")

    # Copy static assets (css, js, images, ...) alongside the rendered page.
    for item in page_dir.iterdir():
        if item.name in ("index.html.j2", "meta.py", "__pycache__"):
            continue
        dest = out_dir / item.name
        if item.is_dir():
            shutil.copytree(item, dest, dirs_exist_ok=True)
        else:
            shutil.copy2(item, dest)


def main():
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    DIST_DIR.mkdir()
    (DIST_DIR / ".nojekyll").touch()

    pages = discover_pages()
    render_home(pages)
    for page in pages:
        render_page(page, pages)

    print(f"Built {len(pages)} page(s) into {DIST_DIR}/")


if __name__ == "__main__":
    main()
