# AdSense approval log — kanbanai.dev

Running record of changes made after Google AdSense rejected the site for **low quality content** (2026-08-17). Use this file when requesting a new review: what was wrong, what shipped, and what is still open.

Do **not** request a new AdSense review until the items in [Ready for review](#ready-for-review) are all true, then wait **2–4 weeks** after production deploy so Google recrawls.

## Why the first review failed

AdSense reviewers (and crawlers that skip JS) were not seeing the content that exists in React. Post-build prerender wrote unique titles for public URLs, but **body copy was stubs**:

| Surface | What Google got | What existed in the app |
|---|---|---|
| Homepage `/` | ~20 words | Full marketing landing (A/B variants) |
| Docs articles `/docs/*` | Title + excerpt only (~20 words) | Full markdown in `documentationBodies.ts` |
| Contact / privacy / terms | 1–2 sentences | Full React pages |
| Blog posts | Full articles (OK) | Same |

Ads were also injected on docs pages whose static HTML had almost no article body.

## Ready for review

- [ ] Production HTML for a docs URL includes the **full article**, not just the excerpt (`curl` the live URL and count words in `#root`)
- [ ] Production homepage HTML includes feature / pricing / how-it-works copy (not a 20-word stub)
- [ ] Production privacy + terms HTML includes the full policy/terms text
- [ ] Ads are **not** on docs (or other thin) pages
- [ ] Deploy has been live **2–4 weeks** with recrawl (Search Console URL inspection on `/`, a docs article, and a blog post)
- [ ] Optional but recommended: older thin blog posts expanded (see [Still open](#still-open))

## Changelog

### 2026-08-17 — Prerender real public copy; ads off docs

**Goal:** Make the static HTML AdSense and Googlebot fetch match the real public content, and stop showing ads on documentation pages.

**Code**

- `frontend/scripts/prerender.mjs`
  - Load full docs markdown from `documentationBodies.ts` and inject it into `/docs/:slug` HTML (was excerpt-only).
  - Expand crawlable HTML for `/`, `/contact`, `/privacy-policy`, `/terms-of-service`, and `/connect`.
  - Support numbered lists and blockquotes in the markdown→HTML converter (docs use both).
  - Docs articles now get Documentation breadcrumbs in JSON-LD (were incorrectly labeled Blog).
  - Build fails if landing, legal, or docs prerender bodies fall below a word-count floor.
- `frontend/src/documentation-board-feature/DocumentationArticle.tsx`
  - Removed `AdSlot` from docs articles so help pages are not ad-supported until the site is approved.
- `frontend/src/App.tsx` + `frontend/vercel.json`
  - `/privacy` → `/privacy-policy` and `/terms` → `/terms-of-service` so those URLs no longer serve the homepage shell.
- `frontend/SEO_SETUP.md`
  - Document that docs prerender includes full article bodies.

**How to verify locally** (after `cd frontend && npm run build`):

```bash
python3 - <<'PY'
import pathlib, re
root = pathlib.Path('dist')
def words(rel):
    html = (root / rel).read_text()
    m = re.search(r'<div id="root">([\s\S]*?)</div>', html)
    text = re.sub(r'<[^>]+>', ' ', m.group(1) if m else '')
    return len(text.split())
print('home', words('index.html'))
print('docs overview', words('docs/overview/index.html'))
print('privacy', words('privacy-policy/index.html'))
print('terms', words('terms-of-service/index.html'))
print('contact', words('contact/index.html'))
PY
```

**Local verify** (`frontend/npm run build`, 2026-08-17) — crawlable words in `#root`:

| Route | Words (was ~20) |
|---|---|
| `/` | 463 |
| `/docs/overview` | 203 |
| `/docs/connect-mcp-claude-cursor` | 456 |
| `/privacy-policy` | 324 |
| `/terms-of-service` | 387 |
| `/contact` | 171 |

All 15 docs articles now prerender full markdown (shortest ~134 words). Ads removed from docs article source.

**After deploy**, confirm production (not just `dist/`):

```bash
curl -s https://kanbanai.dev/docs/overview | grep -o 'Mental model'
curl -s https://kanbanai.dev/privacy-policy | grep -o 'Information We Collect'
curl -s https://kanbanai.dev/ | grep -o 'Smart Sprint Planning'
```

## Still open

These are **not** done in the 2026-08-17 prerender pass. Track them here before the next AdSense window:

1. **Thin blog posts** (often &lt; 800 words, several dated 2024): `top-5-free-kanban-boards`, `kanbanai-v0-1-launch`, `kanban-vs-scrum-tools`, `best-kanban-tools-for-small-teams`, and similar listicles. Expand with original how-to detail, or noindex the weakest ones.
2. **More original articles** that are not product pitches (guides, comparisons with first-hand use).
3. **Landing ads:** `AdSlot` remains on the marketing landing and on blog posts. Revisit if a later review still cites ads vs. content.
4. **Wait for recrawl** after the prerender deploy before hitting “request review” in AdSense.

## Decision log

- **Prerender instead of rewriting docs in HTML by hand** — bodies already live in `documentationBodies.ts`; duplicating them would drift.
- **Ads off docs, on blog** — blog posts already prerender full markdown; docs were the thin-page + ad combination.
- **Fail the build on thin docs/legal/home** — so a future prerender regression cannot silently ship stub HTML again.
