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
 *   3. Deploy, then set `endpoint` in assets/js/chat.js to
 *      https://<your-project>.vercel.app/api/chat
 *
 * ── Providers (all have a free tier) ────────────────────────────────────────
 *   OpenRouter (default)  https://openrouter.ai/keys
 *     LLM_BASE_URL = https://openrouter.ai/api/v1
 *     LLM_MODEL    = google/gemma-4-31b-it:free
 *                  | openai/gpt-oss-20b:free
 *                  | nvidia/nemotron-3-super-120b-a12b:free
 *
 *   Groq (fastest; this is where Qwen lives)   https://console.groq.com/keys
 *     LLM_BASE_URL = https://api.groq.com/openai/v1
 *     LLM_MODEL    = qwen/qwen3-32b   (check the console for current names)
 *
 *   Ollama on your own box (fully local, no key at all)
 *     LLM_BASE_URL = http://localhost:11434/v1
 *     LLM_MODEL    = qwen2.5:7b
 *
 * Free tiers change often — if a model 404s, pick another from the provider's
 * model list and update LLM_MODEL. No code change needed.
 */

const BASE_URL = process.env.LLM_BASE_URL || "https://openrouter.ai/api/v1";
const MODEL = process.env.LLM_MODEL || "google/gemma-4-31b-it:free";
const API_KEY = process.env.LLM_API_KEY;

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
      model: API_KEY ? MODEL : null,
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

    const upstream = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
        // OpenRouter asks for these; harmless elsewhere.
        "HTTP-Referer": origin || "https://siddhyaaddy.github.io",
        "X-Title": "Siddharth Adhikari — Portfolio",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        temperature: 0.3,
        messages: [
          { role: "system", content: SYSTEM },
          ...priorTurns,
          {
            role: "user",
            content: `CONTEXT (from Siddharth's résumé and project notes):\n${context}\n\nQUESTION: ${question}`,
          },
        ],
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      console.error("LLM upstream error", upstream.status, detail.slice(0, 400));
      // The browser falls back to the local retrieval engine on any non-200.
      return res.status(502).json({ error: "Assistant backend unavailable" });
    }

    const data = await upstream.json();
    const answer = data?.choices?.[0]?.message?.content?.trim();

    return res.status(200).json({
      answer: answer || "I don't have that in my notes.",
      model: MODEL,
    });
  } catch (err) {
    console.error("Unexpected error", err);
    return res.status(500).json({ error: "Internal error" });
  }
};
