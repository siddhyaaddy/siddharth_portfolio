# Siddharth Adhikari — Portfolio

Data scientist portfolio. Hand-built: no framework, no page builder, no CSS or JS
library loaded at runtime.

## Structure

```
index.html                  Semantic shell + inline SVG icon sprite
assets/
  css/
    base.css                Tokens, reset, type scale, motion primitives
    components.css          Nav, rails, buttons, cards, palette, chat panel
    sections.css            Per-section composition
  js/
    data.js                 ← ALL CONTENT LIVES HERE. Edit this, not the HTML.
    render.js               Builds every section from data.js
    ui.js                   Loader, theme, reveals, counters, gallery, palette, canvas
    chat.js                 The AI assistant (retrieval engine + optional LLM mode)
  img/                      photo.jpeg (hero), photo2.jpg (about)
  docs/                     Résumé PDF served by the download buttons
api/
  chat.js                   Optional serverless proxy — free open-weight LLM
```

**To update anything on the site — a new job, project, skill, or link — edit
[`assets/js/data.js`](assets/js/data.js).** Every section, the command palette, and the
AI assistant's knowledge base are generated from that one object, so they can't drift apart.

## Sections

`hero → ticker → about → capabilities → experience → work → toolkit → education → contact`

- **Hero** — per-character name reveal with a gradient wave, rolling role flipper, animated
  metric strip, portrait "portal" with a violet rim-light wash
- **Capabilities** — three numbered rows, tags derived from the skill groups in `data.js`
- **Experience** — sticky index rail on the left that tracks scroll position
- **Work** — horizontal gallery: drag, scroll, arrow keys or buttons, plus category filters
- **Toolkit** — six grouped cards and a hand-drawn SVG radar (no chart library)
- **AI assistant** — floating panel, grounded in the résumé
- **Command palette** — `⌘K` / `Ctrl-K` for any section, project or action
- **Light/dark theme**, remembered in `localStorage`

## Design language

Near-black violet ground, **one accent** (`--ac`), and very large uppercase display type
carrying the hierarchy. Discipline matters more than variety: a single accent used sparingly
— one word per heading, the metric suffixes, the active index — is what makes it read premium
rather than busy. Adding a second accent colour is the fastest way to cheapen it.

Layout is deliberately asymmetric: type owns the left, imagery the right, and every section
header pairs a giant title with a short right-aligned note so no row is ever half empty.

## Motion system

One mechanism, so it stays consistent and cheap:

| Piece | How |
|---|---|
| Reveals | `data-anim="up\|clip\|pop\|fade"` + an IntersectionObserver that adds `.in` |
| Stagger | `--i` (index) and `--d` (extra delay) custom properties feed `transition-delay` |
| Kinetic type | JS splits text into `.ch` / `.w` spans, each with a `--ci` index |
| Cards | Pointer-tracked spotlight via `--mx` / `--my` |
| Background | One canvas drift field, paused when the tab is hidden |

`prefers-reduced-motion` disables all of it.

### Gotchas baked into this code

1. **`background-clip: text` cannot clip to a child that has its own `transform`** — the
   glyphs render empty. That's why each character of the gradient name carries its own
   gradient (with a staggered `animation-delay` for the colour wave) rather than inheriting
   one from the parent span.
2. **A `clip-path`-hidden element can't reveal itself.** `inset(0 0 103% 0)` gives it a
   zero-area intersection rect, so IntersectionObserver never fires and it stays invisible
   forever. `data-anim="clip"` elements observe their *parent* as a proxy (`proxyFor()` in
   `ui.js`).
3. **Every `<svg>` using the sprite needs `viewBox="0 0 24 24"`.** Without it there's no
   coordinate mapping, so a 24×24 icon in a 16px box is cropped to its top-left corner
   instead of scaled — icons show up as fragments.
4. **Don't index a multi-card carousel by scroll ratio.** With ~2.5 cards visible the last
   card reaches the end long before it is the Nth step, so the counter lies. `sync()` uses the
   leftmost still-visible card and a proportional thumb instead.

## Running locally

Any static server — the JS is plain scripts, but `fetch` needs http rather than `file://`:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## The AI assistant

Two modes, and it picks between them by itself.

**Local (always available)** — a BM25 retrieval engine over a knowledge base built from
`data.js` at page load. Every visitor can use it. No API key, no backend, no cost, works on
any host including GitHub Pages.

**Free open-weight LLM (when a backend is present)** — the retrieval step still runs in the
browser to select context, then that context plus the question go to `api/chat.js`, which
calls a free open-weight model.

On load the page does one cheap `GET /api/chat`. If it answers `{configured: true}` the
assistant upgrades itself; a 404 (GitHub Pages), a 503 (no key set) or a timeout leaves it in
local mode. If a live call later fails or gets rate-limited, it falls back to local for that
answer rather than showing an error. A recruiter never sees a broken widget.

### Deploying the LLM mode on Vercel

1. Get a free key — [openrouter.ai/keys](https://openrouter.ai/keys) or
   [console.groq.com/keys](https://console.groq.com/keys)
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add one environment variable: `LLM_API_KEY`
4. Deploy

That's the whole thing. **No code edit, no `package.json`, no CORS list, no `vercel.json`.**
`CHAT.endpoint` is the relative path `/api/chat`, so on Vercel the function is same-origin and
just works; on GitHub Pages the same code finds nothing and stays local.

### Choosing a model

Free tiers are **shared pools that rate-limit without warning**, so `LLM_MODEL` is a
comma-separated *chain* tried in order — the first model that answers wins. Default:
`openai/gpt-oss-20b:free,google/gemma-4-26b-a4b-it:free`. Swap with env vars alone:

| Want | `LLM_BASE_URL` | `LLM_MODEL` |
|---|---|---|
| Default chain (open weights) | *(unset)* | *(unset)* |
| **Qwen** — Groq hosts it, and is the fastest free tier | `https://api.groq.com/openai/v1` | `qwen/qwen3-32b` |
| Single model only | *(unset)* | `openai/gpt-oss-20b:free` |
| Fully local, no key | `http://localhost:11434/v1` | `qwen2.5:7b` |

Free-tier lineups change often, and models rate-limit without warning — that is why the chain
exists and why nothing is hardcoded. Avoid reasoning-tuned models in the chain: several emit
their chain-of-thought as the answer. Every provider above speaks the OpenAI-compatible
`/chat/completions` shape, which is why `api/chat.js` is one plain `fetch` with no SDK.

### Guardrails

`RATE_PER_IP_HOUR` (default 20) and `RATE_GLOBAL_DAY` (default 500) cap usage.

> **CORS is not access control.** It stops other websites embedding the endpoint; it does not
> stop someone calling the URL directly with a script. The rate caps are the actual protection.
> They're in-memory, so on serverless they're best-effort — move them to Vercel KV if the site
> ever gets real traffic.

> A static site cannot hold a secret. Never put an API key in `chat.js`; anything in the
> browser bundle is public. The proxy exists so the key stays server-side.

## Admin panel (local CMS)

CRUD for every section of the site, with no hosting and no database. It edits
`assets/js/data.js`, then commits and pushes — Vercel is connected to the repo, so
**pushing is what publishes**. Every content change is therefore an ordinary git commit:
diffable, revertable, and impossible to lose.

```bash
node admin/server.cjs        # → http://localhost:4321
```

| Button | What it does |
|---|---|
| **Save to file** | Writes the edited PROFILE back into `data.js` (⌘S also works) |
| **Preview** | Live iframe of the real site, served from your working copy |
| **Discard changes** | `git checkout` on `data.js` — back to the last commit |
| **Publish →** | Commit + push. Vercel redeploys in ~30s |

Editable: profile and links, rotating roles, hero metrics, about text and highlights,
ticker, experience, projects, toolkit, radar, education, certifications — with add,
delete and reorder on every list.

### How it stays safe

- Binds to `127.0.0.1` only, so it is not reachable from another machine. There is no
  auth; do not expose it through a tunnel.
- `data.js` is re-parsed in a sandbox **before** anything is written — a change that
  would break the file is rejected rather than saved.
- The PROFILE literal is located by brace-matching that skips strings and comments, so
  content containing `}` or quotes round-trips intact.
- `.vercelignore` keeps `admin/` out of the deployment — the panel never ships publicly.
- The AI assistant's knowledge base is rebuilt from PROFILE at page load, so edits reach
  the assistant with no extra step.

### Adding a field

Sections are described once in the `SECTIONS` schema in `admin/admin.js`; the forms are
generated from it. A new field in `data.js` needs one line there, not a new form.

## Notes

- Skill radar values are self-assessed and labelled as such on the card.
- Layout is capped at `--wrap: 1680px` with fluid gutters, so it fills large displays
  instead of stranding content in a narrow column.
