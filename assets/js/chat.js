/**
 * chat.js — the AI assistant.
 *
 * Two modes:
 *   1. LOCAL (default)  — a BM25-style retrieval engine over KNOWLEDGE (built from data.js).
 *                         Zero setup, zero cost, works on GitHub Pages.
 *   2. REMOTE           — set CHAT.endpoint to your deployed /api/chat function and every
 *                         question is answered by a free open-weight LLM (Gemma, gpt-oss,
 *                         Qwen on Groq, …), grounded in the same corpus.
 *
 * To switch on the real LLM: deploy api/chat.js (see README), then set endpoint below.
 */

const CHAT = {
  /* Relative on purpose: on Vercel the function is same-origin, so there is
     nothing to configure after deploying and no CORS list to maintain.
     The page probes it once on load — if it isn't there (GitHub Pages) or has
     no API key set, the assistant quietly stays in local retrieval mode.
     Set to null to force local mode; set to an absolute URL to call a proxy
     hosted somewhere other than the site itself. */
  endpoint: "/api/chat",
  /* Shown in the panel header once the remote backend answers the probe. */
  remoteLabel: "Open-weight LLM · live",
  greeting: `Hi — I'm Siddharth's assistant. I've read his résumé and project notes, so ask me anything: what he built at **ASM International**, how the DeBERTa fine-tune scored, which parts of the stack he actually uses day to day.`,
  suggestions: [
    "What is he doing at ASM International?",
    "Walk me through his best project",
    "Is he strong on LLMs and RAG?",
    "What's his data engineering experience?",
    "How do I get in touch?",
  ],
};

/* ============================================================
   Retrieval — BM25-ish scoring over the KNOWLEDGE corpus
   ============================================================ */
const STOPWORDS = new Set(
  "a an the is are was were be been do does did of to in on for with and or but at by from as it its his her he she they them this that what which who whom how why when where can could would should tell me about you your".split(" ")
);

const tokenize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9+#./\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));

/* Precompute document frequency once. */
const CORPUS = KNOWLEDGE.map((doc) => ({
  ...doc,
  terms: tokenize(`${doc.topic} ${doc.text} ${doc.tags.join(" ")}`),
}));

const DF = (() => {
  const df = new Map();
  CORPUS.forEach((doc) => {
    new Set(doc.terms).forEach((t) => df.set(t, (df.get(t) || 0) + 1));
  });
  return df;
})();

const AVG_LEN = CORPUS.reduce((n, d) => n + d.terms.length, 0) / CORPUS.length;
const N_DOCS = CORPUS.length;

function retrieve(query, k = 3) {
  const qTerms = tokenize(query);
  if (!qTerms.length) return [];

  const k1 = 1.5, b = 0.75;
  const scored = CORPUS.map((doc) => {
    let score = 0;
    for (const term of qTerms) {
      const tf = doc.terms.filter((t) => t === term || t.startsWith(term)).length;
      if (!tf) continue;
      const idf = Math.log(1 + (N_DOCS - (DF.get(term) || 0) + 0.5) / ((DF.get(term) || 0) + 0.5));
      score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * doc.terms.length) / AVG_LEN)));
      // tag hits are strong intent signals
      if (doc.tags.some((tag) => tag === term || tag.includes(term))) score += 1.4;
    }
    return { doc, score };
  })
    .filter((r) => r.score > 0.35)
    .sort((a, b2) => b2.score - a.score);

  return scored.slice(0, k);
}

/* ============================================================
   Local answer composition
   ============================================================ */
function localAnswer(question) {
  const q = question.toLowerCase();

  if (/^(hi|hey|hello|yo|sup|howdy)\b/.test(q.trim())) {
    return {
      text: `Hey! Ask me about Siddharth's work at ASM International or Youro, his projects, or his stack. I'll pull the answer straight from his résumé.`,
      sources: [],
    };
  }

  if (/thank|thanks|cheers|nice|cool|awesome/.test(q) && q.length < 40) {
    return { text: `Anytime. If you'd like to talk to Siddharth directly: **${PROFILE.email}**.`, sources: [] };
  }

  const hits = retrieve(question, 3);

  if (!hits.length) {
    return {
      text:
        `I don't have that in my notes. I can speak confidently about:\n` +
        `- His roles at **ASM International**, **Youro LLC** and **NoZanZat**\n` +
        `- Projects: ${PROFILE.projects.slice(0, 3).map((p) => p.title).join(", ")}\n` +
        `- His stack, education, and how to reach him\n\n` +
        `For anything else, email him at **${PROFILE.email}**.`,
      sources: [],
    };
  }

  const primary = hits[0].doc;
  const body = hits.map((h) => h.doc.text).join(" ");

  // Trim to the most relevant sentences so answers stay conversational, not a data dump.
  const qTerms = new Set(tokenize(question));
  const sentences = body.split(/(?<=[.!?])\s+/).filter((s) => s.length > 25);
  const ranked = sentences
    .map((s) => {
      const overlap = tokenize(s).filter((t) => qTerms.has(t)).length;
      return { s, overlap };
    })
    .sort((a, b) => b.overlap - a.overlap);

  const picked = ranked.slice(0, 4).filter((r, i) => i === 0 || r.overlap > 0).map((r) => r.s);
  const ordered = sentences.filter((s) => picked.includes(s));

  let text = ordered.join(" ");
  if (text.length > 720) text = text.slice(0, 700).replace(/\s\S*$/, "") + "…";

  // A short lead-in so it reads like a reply rather than a search result.
  const lead =
    { contact: "Easiest route —", strengths: "Short version —" }[primary.id] ||
    (primary.id.startsWith("exp-") ? "" : primary.id.startsWith("proj-") ? "" : "");

  return {
    text: lead ? `${lead} ${text}` : text,
    sources: hits.map((h) => h.doc.topic),
  };
}

/* ============================================================
   Remote mode — free open-weight LLM via the serverless proxy
   ============================================================ */
/**
 * Is a configured backend actually there? Answered once, cheaply, via GET.
 * Anything other than a clear yes means local mode — a missing function
 * (404 on GitHub Pages), a missing API key (503), or no network at all.
 */
async function probeRemote() {
  if (!CHAT.endpoint) return false;
  try {
    const res = await fetch(CHAT.endpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.configured === true;
  } catch {
    return false;
  }
}

async function remoteAnswer(question, history) {
  const hits = retrieve(question, 4);
  const context = hits.map((h) => `## ${h.doc.topic}\n${h.doc.text}`).join("\n\n");

  const res = await fetch(CHAT.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, context, history: history.slice(-6) }),
  });
  if (!res.ok) throw new Error(`Assistant backend returned ${res.status}`);

  const data = await res.json();
  return { text: data.answer, sources: hits.map((h) => h.doc.topic) };
}

/* ============================================================
   UI wiring
   ============================================================ */
(function chatUI() {
  const panel = $("#chatPanel");
  const fab = $("#chatFab");
  const log = $("#chatLog");
  const form = $("#chatForm");
  const input = $("#chatInput");
  const send = $("#chatSend");
  const history = [];
  let busy = false;
  let greeted = false;

  /* Local until proven otherwise, so the label is never optimistic. */
  let remoteReady = false;
  $("#chatMode").textContent = "Local knowledge base";
  probeRemote().then((ok) => {
    remoteReady = ok;
    if (ok) $("#chatMode").textContent = CHAT.remoteLabel;
  });

  /* Minimal markdown: **bold**, links, - lists, newlines */
  function md(text) {
    const safe = esc(text);
    const withLists = safe
      .split("\n")
      .map((line) => (/^\s*[-•]\s+/.test(line) ? `<li>${line.replace(/^\s*[-•]\s+/, "")}</li>` : line))
      .join("\n")
      .replace(/(<li>[\s\S]*?<\/li>)(?!\n?<li>)/g, "<ul>$1</ul>");

    return withLists
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/\n{2,}/g, "</p><p>")
      .replace(/\n/g, "<br>")
      .replace(/^/, "<p>")
      .replace(/$/, "</p>")
      .replace(/<p><\/p>/g, "");
  }

  function bubble(role, html, sources = []) {
    const el = document.createElement("div");
    el.className = `msg msg-${role}`;
    el.innerHTML = `<div class="msg-bubble">${html}${
      sources.length
        ? `<div class="msg-sources">${sources.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div>`
        : ""
    }</div>`;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  function thinking() {
    const el = bubble("bot", `<span class="typing"><i></i><i></i><i></i></span>`);
    return el;
  }

  /** Reveal a reply progressively so it feels like it's being written. */
  function stream(el, text, sources) {
    const target = md(text);
    if (reduceMotion) {
      el.querySelector(".msg-bubble").innerHTML =
        target + (sources.length ? `<div class="msg-sources">${sources.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div>` : "");
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const words = text.split(" ");
      let i = 0;
      const bub = el.querySelector(".msg-bubble");
      const tick = () => {
        i += Math.max(1, Math.round(words.length / 45));
        bub.innerHTML = md(words.slice(0, i).join(" "));
        log.scrollTop = log.scrollHeight;
        if (i < words.length) {
          setTimeout(tick, 28);
        } else {
          bub.innerHTML =
            target +
            (sources.length
              ? `<div class="msg-sources">${sources.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div>`
              : "");
          log.scrollTop = log.scrollHeight;
          resolve();
        }
      };
      tick();
    });
  }

  async function ask(question) {
    if (busy || !question.trim()) return;
    busy = true;
    send.disabled = true;

    bubble("user", md(question));
    history.push({ role: "user", content: question });
    input.value = "";
    input.style.height = "auto";

    const placeholder = thinking();
    await new Promise((r) => setTimeout(r, 320));

    let reply;
    try {
      reply = remoteReady ? await remoteAnswer(question, history) : localAnswer(question);
    } catch (err) {
      // Backend down, rate-limited or slow: answer locally rather than error.
      reply = localAnswer(question);
      $("#chatMode").textContent = "Local knowledge base";
      remoteReady = false;
    }

    await stream(placeholder, reply.text, reply.sources);
    history.push({ role: "assistant", content: reply.text });
    busy = false;
    send.disabled = false;
    input.focus();
  }

  function openChat() {
    panel.classList.add("open");
    fab.classList.add("hidden");
    if (!greeted) {
      greeted = true;
      bubble("bot", md(CHAT.greeting));
      $("#chatSuggest").innerHTML = CHAT.suggestions
        .map((s) => `<button type="button">${esc(s)}</button>`)
        .join("");
    }
    setTimeout(() => input.focus(), 260);
  }
  function closeChat() {
    panel.classList.remove("open");
    fab.classList.remove("hidden");
  }
  window.openChat = openChat;

  $$("[data-open-chat]").forEach((b) => b.addEventListener("click", openChat));
  $("#chatClose").addEventListener("click", closeChat);

  $("#chatSuggest").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (btn) ask(btn.textContent);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    ask(input.value);
  });

  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 110) + "px";
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(input.value);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("open")) closeChat();
  });
})();
