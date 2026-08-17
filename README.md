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

Two modes, set at the top of [`assets/js/chat.js`](assets/js/chat.js).

**Local (default, `endpoint: null`)** — a BM25 retrieval engine over a knowledge base built
from `data.js` at page load. Every visitor can use it. No API key, no backend, no cost, works
on any host. This is what's live today.

**Free open-weight LLM (`endpoint: "https://…/api/chat"`)** — the retrieval step still runs in
the browser to select context, then that context plus the question go to the serverless
function, which calls a free open-weight model. Deploy on Vercel and set one env var:

```
LLM_API_KEY = <free key from openrouter.ai/keys or console.groq.com/keys>
```

No `package.json` and no dependencies — every supported provider speaks the OpenAI-compatible
`/chat/completions` shape, so `api/chat.js` is one plain `fetch`. Swap provider or model with
env vars alone (`LLM_BASE_URL`, `LLM_MODEL`); current options are listed in that file's header.
If the backend is down, rate-limited or unconfigured, the widget silently falls back to local
mode — a recruiter never sees an error.

> **CORS is not access control.** It stops other websites embedding the endpoint; it does not
> stop someone calling the URL directly with a script. The per-IP hourly cap and global daily
> cap in `api/chat.js` are the actual protection. They're in-memory, so they're best-effort on
> serverless — move them to Vercel KV if the site ever gets real traffic.

> A static site cannot hold a secret. Never put an API key in `chat.js`; anything in the
> browser bundle is public. The proxy exists so the key stays server-side.

## Notes

- Skill radar values are self-assessed and labelled as such on the card.
- Layout is capped at `--wrap: 1680px` with fluid gutters, so it fills large displays
  instead of stranding content in a narrow column.
