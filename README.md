# Gearwell website

Static rebuild of gearwell.webflow.io with no Webflow or jQuery dependency.

## Preview

    python3 -m http.server 8642
    open http://localhost:8642

Paths are root-relative (`/css/...`, `/images/...`), so serve the folder rather than opening the files directly.

## Structure

- `contact/`: parts-quote form, handled by Netlify Forms (form name `parts-quote`), which redirects to `thanks/` (noindex).
- `index.html`, `<page>/index.html`: one folder per URL, so `/parts-repair` keeps working on any static host (Netlify, Vercel, Cloudflare Pages, S3).
- `css/gearwell.css`: the original Webflow stylesheet, with asset URLs pointing at local files.
- `js/site.js`: replaces the Webflow runtime (scroll-in animations, mobile nav, dropdowns, hero slider, tabs).
- `images/`: every image pulled from the Webflow CDN.
- `.claude/agents/gearwell-copy-editor.md`: the brand-voice guide (who the buyers are, how they talk, banned words, credibility rules) as a Claude Code agent. Use it for any copy change.
- `_migration/migrate.py`: the script that produced all of the above. Re-running it overwrites the HTML and CSS with the live Webflow versions.

## Open items

- **Typography (edited after migration):** the whole site uses Inter (Google Fonts, weights 300–900). Headings that used Akira Expanded now use Inter at their original weight (700/800) with `text-transform: uppercase`, because Akira only has capitals. The Akira font files were removed. Re-running `migrate.py` brings Akira back.
- **CTAs:** every button now goes to a real page. Quote and contact buttons open `/contact/`, some with `?request=emergency|planned|exchange|technical` to preselect the request type.
- **Resources removed:** there are no blog posts or resources yet, so the Resources page, its six placeholder articles, and the Resources links in the top nav and footer were removed. Re-running `migrate.py` would bring them back.
- **Logo:** the only logo file is the 413×63 PNG from Webflow (white wordmark, grey gear). It's 1x, so it looks soft on retina screens. Get the master logo files (SVG plus 2x/3x PNG, every colorway) from the designer. The brand guide PDF contains only small gear renders, with the largest at 296px.
- **SEO tags (edited after migration):** Home, Parts & Repair, Why Gearwell and Our Process use the page title and meta description from their content docs, also copied to the og: and twitter: tags. Resources, Contact and the articles have no doc copy yet, so they keep their Webflow titles.
- **Copy (edited after migration):** all four pages were reworded for the buyer audience using `.claude/agents/gearwell-copy-editor.md`. No facts were changed. Every page's FAQ now comes from its own content doc: Home gained a new FAQ section, the Why Gearwell FAQ was replaced with that page's own questions, and the "Answer goes here." placeholders were filled in.
- **SEO (initial pass):**
  - Canonical URLs, Open Graph and Twitter tags, and Organization, WebPage and FAQPage structured data are on every page.
  - `robots.txt` and `sitemap.xml` are included. They assume the production domain is `https://www.gearwell.com`; if that changes, update the canonical tags, the sitemap and `robots.txt`.
  - Each page has exactly one H1. On the inner pages the keyword headline is the H1.
  - Alt text is set on relevant photos; decorative images have empty alt text.
  - Photos are WebP (24 MB down to 2 MB), and internal links use trailing slashes.
- **Imagery:** several photos are generic stock that doesn't match the business (a car factory, a wind-turbine office, abstract business graphics). The client's own photo shoot (about 60 images) should replace them.
