"""One-time migration of gearwell.webflow.io to a standalone static site.

Downloads every page, the shared stylesheet and all CDN assets, rewrites URLs
to local paths and swaps the Webflow/jQuery runtime for js/site.js.

    python3 -I _migration/migrate.py
"""
import html
import pathlib
import re
import urllib.parse
import urllib.request

SITE = "https://gearwell.webflow.io"
ROOT = pathlib.Path(__file__).resolve().parent.parent
CDN = re.compile(r'https://cdn\.prod\.website-files\.com/[^"\'\s<>;,]+')
FONT_EXT = (".eot", ".woff", ".woff2", ".ttf", ".otf")

cache = {}


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as r:
        return r.read()


def local_path(url):
    """Map a CDN URL to a site-root path like /images/xyz.png."""
    url = html.unescape(url)
    if url in cache:
        return cache[url]
    name = urllib.parse.unquote(urllib.parse.urlparse(url).path.rsplit("/", 1)[-1])
    name = re.sub(r"[^A-Za-z0-9._-]+", "-", name).strip("-")
    folder = "fonts" if name.lower().endswith(FONT_EXT) else "images"
    dest = ROOT / folder / name
    if not dest.exists():
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(fetch(url))
        print("  got", folder, name)
    cache[url] = f"/{folder}/{name}"
    return cache[url]


def rewrite_urls(text):
    def repl(m):
        # Filenames can contain "(2)", so only trim the ")" that closes a CSS url(...).
        url, tail = m.group(0), ""
        while url.count(")") > url.count("("):
            url, tail = url[:-1], ")" + tail
        return local_path(url) + tail
    return CDN.sub(repl, text)


def migrate_css(url):
    css = fetch(url).decode()
    css = rewrite_urls(css)
    out = ROOT / "css" / "gearwell.css"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(css)


def migrate_page(path):
    """Migrate one page and return the internal paths it links to."""
    print("page", path)
    page = fetch(SITE + path).decode()
    links = set(re.findall(r'href="(/[^"#?]*)', page))

    # Drop Webflow runtime, jQuery and the WebFont loader.
    page = re.sub(r'<script[^>]*src="[^"]*(webflow|jquery|webfont)[^"]*"[^>]*></script>', "", page)
    page = re.sub(r"<script[^>]*>\s*WebFont\.load[\s\S]*?</script>", "", page)
    page = re.sub(r'<meta content="Webflow" name="generator"/>', "", page)
    page = re.sub(r'<link href="https://cdn\.prod\.website-files\.com" rel="preconnect"[^>]*>', "", page)
    page = page.replace('<link href="https://cdn.prod.website-files.com/img/webclip.png" rel="apple-touch-icon"/>', "")
    page = re.sub(r'\s(data-wf-domain|data-wf-page|data-wf-site)="[^"]*"', "", page)

    # Stylesheet: local copy, no SRI hash (it no longer matches).
    page = re.sub(r'<link href="[^"]*gearwell\.webflow\.shared[^"]*\.css"[^>]*>',
                  '<link href="/css/gearwell.css" rel="stylesheet" type="text/css"/>', page)
    page = page.replace(
        '<link href="https://fonts.gstatic.com" rel="preconnect" crossorigin="anonymous"/>',
        '<link href="https://fonts.gstatic.com" rel="preconnect" crossorigin="anonymous"/>'
        '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>')

    page = rewrite_urls(page)
    page = page.replace("</body>", '<script src="/js/site.js" defer></script></body>')

    out = ROOT / path.strip("/") / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(page)
    return {l.rstrip("/") or "/" for l in links if not l.startswith(("/images/", "/fonts/", "/css/", "/js/"))}


if __name__ == "__main__":
    home = fetch(SITE + "/").decode()
    css_url = re.search(r'https://[^"]*gearwell\.webflow\.shared[^"]*\.css', home).group(0)
    migrate_css(css_url)
    # Crawl internal links so CMS items (e.g. /resources/<slug>) come along too.
    todo, done = ["/"], set()
    while todo:
        path = todo.pop()
        if path in done:
            continue
        done.add(path)
        todo.extend(migrate_page(path) - done)
    print(len(done), "pages")
    print(len(cache), "assets")
