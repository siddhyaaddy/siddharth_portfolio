/**
 * api/chat.js — OPTIONAL serverless proxy that upgrades the portfolio assistant
 * from the local retrieval engine to a real LLM.
 *
 * Uses free, open-weight models. No SDK, no dependencies, no package.json —
 * every provider below speaks the OpenAI-compatible /chat/completions shape,
 * so this is one plain fetch call.
 *
 * ── Deploy (Vercel) ─────────────────────────────────────────────────────────
 *   1. Import the repo at vercel.com/new
 *   2. Add an environment variable:  LLM_API_KEY = <your free key>
 *   3. Deploy. Nothing else — the browser calls /api/chat on the same origin.
 *
 * ── Providers (all have a free tier) ────────────────────────────────────────
 *   OpenRouter (default)  https://openrouter.ai/keys
 *     LLM_BASE_URL = https://openrouter.ai/api/v1
 *     LLM_MODEL    = openai/gpt-oss-20b:free,google/gemma-4-26b-a4b-it:free
 *
 *   Groq (fastest; this is where Qwen lives)   https://console.groq.com/keys
 *     LLM_BASE_URL = https://api.groq.com/openai/v1
 *     LLM_MODEL    = qwen/qwen3-32b   (check the console for current names)
 *
 *   Ollama on your own box (fully local, no key at all)
 *     LLM_BASE_URL = http://localhost:11434/v1
 *     LLM_MODEL    = qwen2.5:7b
 *
 * Free tiers are shared pools and rate-limit without warning, so LLM_MODEL is a
 * comma-separated chain tried in order. Verified behaviour when this was written:
 * reasoning-tuned models (e.g. nemotron-3-nano) emit their chain-of-thought as
 * the answer — don't put those in the chain.
 */

const BASE_URL = process.env.LLM_BASE_URL || "https://openrouter.ai/api/v1";
const API_KEY = process.env.LLM_API_KEY;

/* Free pools are shared and get rate-limited without warning, so try a chain
   rather than a single model — the first one that answers wins. Comma-separate
   LLM_MODEL to override. Keep reasoning models out of the default: several emit
   their chain-of-thought as the answer, which reads terribly on a portfolio. */
const MODELS = (process.env.LLM_MODEL || "openai/gpt-oss-20b:free,google/gemma-4-26b-a4b-it:free")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** Comma-separated in env, e.g. "https://siddharth.vercel.app,https://siddhyaaddy.github.io" */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ||
  "https://siddhyaaddy.github.io,http://localhost:8000,http://127.0.0.1:8000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/* ── Abuse guards ────────────────────────────────────────────────────────────
 * CORS only stops other websites; it does NOT stop someone calling this URL
 * directly with a script. These caps are the actual protection.
 *
 * Caveat: serverless instances are per-region and recycle, so an in-memory
 * counter is best-effort, not exact. It stops casual hammering. If this ever
 * gets real traffic, move the counters to Vercel KV / Upstash Redis.
 */
const PER_IP_PER_HOUR = Number(process.env.RATE_PER_IP_HOUR || 20);
const GLOBAL_PER_DAY = Number(process.env.RATE_GLOBAL_DAY || 500);

const hits = new Map(); // ip -> { n, resetAt }
let day = { n: 0, resetAt: Date.now() + 864e5 };

function allow(ip) {
  const now = Date.now();

  if (now > day.resetAt) day = { n: 0, resetAt: now + 864e5 };
  if (day.n >= GLOBAL_PER_DAY) return "daily";

  const rec = hits.get(ip);
  if (!rec || now > rec.resetAt) {
    hits.set(ip, { n: 1, resetAt: now + 36e5 });
  } else if (rec.n >= PER_IP_PER_HOUR) {
    return "ip";
  } else {
    rec.n++;
  }

  day.n++;
  if (hits.size > 5000) hits.clear(); // crude memory ceiling
  return null;
}

/** Header values must be Latin-1; strip anything a ByteString can't hold. */
const ascii = (s) => String(s).replace(/[^\x20-\x7E]/g, "");

const SYSTEM = `You are the AI assistant embedded in Siddharth Adhikari's portfolio site.

Visitors are usually recruiters, hiring managers, or engineers evaluating him.

Rules:
- Answer ONLY from the CONTEXT block supplied with each question. It is drawn from his résumé and project notes.
- If the context doesn't cover it, say so plainly and point them to siddharthadhikari.workspace@gmail.com. Never invent employers, dates, metrics, or technologies.
- Speak about Siddharth in the third person. Be warm and direct, not salesy.
- Keep answers to 2-4 sentences unless asked for detail. Lead with the answer, then the supporting fact.
- Use **bold** for company names, technologies, and figures.`;

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  /* Health probe. The browser calls this once on load to decide whether to use
     the LLM or stay on the local retrieval engine, so it must stay cheap and
     must never touch the upstream provider. */
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      configured: Boolean(API_KEY),
      models: API_KEY ? MODELS : null,
    });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!API_KEY) {
    return res.status(503).json({ error: "Assistant backend is not configured" });
  }

  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  const blocked = allow(ip);
  if (blocked === "ip") {
    return res.status(429).json({ error: "You've asked a lot of questions — try again in a bit." });
  }
  if (blocked === "daily") {
    return res.status(429).json({ error: "The assistant is resting for today." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { question, context = "", history = [] } = body;

    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ error: "`question` is required" });
    }
    if (question.length > 1000) {
      return res.status(400).json({ error: "Question too long" });
    }

    const priorTurns = history
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-6)
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));

    const messages = [
      { role: "system", content: SYSTEM },
      ...priorTurns,
      {
        role: "user",
        content: `CONTEXT (from Siddharth's résumé and project notes):\n${context}\n\nQUESTION: ${question}`,
      },
    ];

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      /* OpenRouter asks for these; harmless elsewhere. Header values are
         ByteStrings — any character above U+00FF throws when fetch builds the
         request, so keep them strictly ASCII (an em dash here was enough to
         fail every single call). */
      "HTTP-Referer": ascii(origin || "https://siddhyaaddy.github.io"),
      "X-Title": ascii("Siddharth Adhikari Portfolio"),
    };

    let lastStatus = 0;
    for (const model of MODELS) {
      let upstream;
      try {
        upstream = await fetch(`${BASE_URL}/chat/completions`, {
          method: "POST",
          headers,
          body: JSON.stringify({ model, max_tokens: 500, temperature: 0.3, messages }),
        });
      } catch (netErr) {
        console.error("LLM fetch failed", model, netErr.message);
        continue; // try the next model
      }

      if (!upstream.ok) {
        lastStatus = upstream.status;
        const detail = await upstream.text().catch(() => "");
        console.error("LLM upstream error", model, upstream.status, detail.slice(0, 300));
        continue; // rate-limited or down — fall through to the next model
      }

      const data = await upstream.json().catch(() => null);
      const answer = data?.choices?.[0]?.message?.content?.trim();
      if (!answer) {
        console.error("LLM empty answer", model);
        continue;
      }

      return res.status(200).json({ answer, model });
    }

    // Every model failed. The browser falls back to local retrieval on non-200.
    console.error("All models failed", MODELS.join(","), "last status", lastStatus);
    return res.status(502).json({ error: "Assistant backend unavailable" });
  } catch (err) {
    console.error("Unexpected error", err);
    return res.status(500).json({ error: "Internal error" });
  }
};
