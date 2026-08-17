/**
 * render.js — turns PROFILE into DOM. No content lives here.
 */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const icon = (n) => `<svg viewBox="0 0 24 24"><use href="#i-${n}"/></svg>`;
const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pad = (n) => String(n).padStart(2, "0");

/** Per-character spans so the hero type can stagger in. */
function splitChars(el, text, start = 0) {
  el.innerHTML = [...text]
    .map((c, i) =>
      c === " " ? `<span class="sp"></span>` : `<span class="ch" style="--ci:${start + i}">${esc(c)}</span>`
    )
    .join("");
}

/** Per-word spans for a softer cascade. */
function splitWords(el, text) {
  el.innerHTML = text
    .split(" ")
    .map((w, i) => `<span class="w" style="--ci:${i}">${esc(w)}</span>`)
    .join(" ");
}

/* ---------------- Hero ---------------- */
function renderHero(p) {
  const [first, ...rest] = p.name.split(" ");
  splitChars($("#heroFirst"), first, 0);
  splitChars($("#heroLast"), rest.join(" "), first.length);
  splitWords($("#heroTagline"), p.tagline);

  $("#portalRole").textContent = `${p.role} · ${p.location.split("·")[0].trim()}`;

  /* Image paths live in data.js so the admin panel can swap them. */
  if (p.images?.hero) $("#heroPhoto").src = p.images.hero;
  if (p.images?.about) $("#aboutPhoto").src = p.images.about;
  $("#navMail").textContent = p.email;
  $("#navMail").href = p.links.email;
  $("#railResume").href = p.resume;

  /* Role flipper — duplicate the first entry at the end so the loop can
     roll forward continuously and snap back invisibly. */
  const roles = p.roleAlternates;
  $("#roleTrack").innerHTML = [...roles, roles[0]]
    .map((r) => `<span>${esc(r)}</span>`)
    .join("");
  $("#roleSr").textContent = roles.join(", ");

  $("#railSocial").innerHTML = [
    ["github", p.links.github, "GitHub"],
    ["linkedin", p.links.linkedin, "LinkedIn"],
    ["kaggle", p.links.kaggle, "Kaggle"],
    ["mail", p.links.email, "Email"],
  ]
    .map(([ic, href, label]) => `<a href="${href}" target="_blank" rel="noopener" aria-label="${label}">${icon(ic)}</a>`)
    .join("");

  $("#metrics").innerHTML = p.metrics
    .map(
      (m, i) => `
      <div class="metric" data-anim="up" style="--i:${i};--d:700ms">
        <div class="metric-v"><span data-count="${m.value}" data-dec="${m.decimals || 0}">0</span><span class="suf">${esc(m.suffix)}</span></div>
        <div class="metric-l">${esc(m.label)}</div>
        <div class="metric-d">${esc(m.detail)}</div>
      </div>`
    )
    .join("");

  const row = p.stack.map((s) => `<span class="ticker-item">${esc(s)}</span>`).join("");
  $("#ticker").innerHTML = row + row; // duplicated for a seamless -50% loop
}

/* ---------------- About ---------------- */
function renderAbout(p) {
  $("#aboutStatement").innerHTML = p.about.paragraphs[0];
  $("#aboutText").innerHTML = p.about.paragraphs
    .slice(1)
    .map((t, i) => `<p data-anim="up" style="--i:${i}">${t}</p>`)
    .join("");

  $("#aboutHighlights").innerHTML = p.about.highlights
    .map(
      (h, i) => `
      <div class="hl" data-anim="up" style="--i:${i}">
        <span class="tile">${icon(h.icon)}</span>
        <div><div class="hl-v">${esc(h.value)}</div><div class="hl-l">${esc(h.label)}</div></div>
      </div>`
    )
    .join("");
}

/* ---------------- Capabilities ----------------
   Derived from the skill groups so it can never drift from the data. */
function renderCapabilities(p) {
  const picks = [
    { t: "AI / ML Engineering", d: "RAG pipelines, transformer fine-tuning and evaluation discipline — from a notebook benchmark to an indexed, automated retrieval system.", from: ["Machine Learning & Experimentation"] },
    { t: "Data Engineering", d: "ETL that doesn't silently break: schema design, incremental loads, CI/CD, and pipelines that hold up over 500K+ documents.", from: ["Cloud & Data Infrastructure", "Big Data & Storage"] },
    { t: "Analytics & Experimentation", d: "Cohort analysis, A/B testing with real significance testing, and reporting a non-technical stakeholder can read in thirty seconds.", from: ["Statistics & Visualization"] },
  ];

  $("#capList").innerHTML = picks
    .map((c, i) => {
      const tags = p.skillGroups
        .filter((g) => c.from.includes(g.name))
        .flatMap((g) => g.items)
        .slice(0, 6);
      return `
      <article class="cap" data-anim="up" style="--i:${i}">
        <span class="cap-n">${pad(i + 1)}</span>
        <h3 class="cap-t">${esc(c.t)}</h3>
        <div>
          <p class="cap-d">${esc(c.d)}</p>
          <div class="chip-row cap-tags">${tags.map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>
        </div>
      </article>`;
    })
    .join("");
}

/* ---------------- Experience ---------------- */
function renderExperience(p) {
  $("#expIndex").innerHTML = p.experience
    .map(
      (e, i) => `
      <button class="exp-idx-item${i === 0 ? " on" : ""}" type="button" data-goto="exp-${i}">
        <i></i><span>${esc(e.company)}</span>
      </button>`
    )
    .join("");

  $("#expStack").innerHTML = p.experience
    .map(
      (e, i) => `
      <article class="card exp-card" id="exp-${i}" data-anim="up" style="--i:${i}">
        <div class="exp-top">
          <h3 class="exp-co">${esc(e.company)}</h3>
          <span class="exp-period">${esc(e.period)}</span>
        </div>
        <div class="exp-role">
          <span>${esc(e.role)}</span><span class="sep">·</span><span>${esc(e.location)}</span>
          ${e.current ? '<span class="live-badge"><span class="dot-live"></span>Current</span>' : ""}
        </div>
        <p class="exp-blurb">${esc(e.blurb)}</p>
        <ul class="exp-points">${e.points.map((pt) => `<li>${pt}</li>`).join("")}</ul>
        <div class="chip-row">${e.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>
      </article>`
    )
    .join("");
}

/* ---------------- Work gallery ---------------- */
function renderWork(p) {
  const cats = ["All", ...new Set(p.projects.map((x) => x.category))];
  $("#filters").innerHTML = cats
    .map((c, i) => `<button class="filter${i === 0 ? " on" : ""}" type="button" data-filter="${esc(c)}">${esc(c)}</button>`)
    .join("");

  $("#workRail").innerHTML = p.projects
    .map(
      (pr, i) => `
      <article class="card work-card" data-category="${esc(pr.category)}">
        <span class="work-n" aria-hidden="true">${pad(i + 1)}</span>
        <span class="work-cat">${esc(pr.category)}</span>
        <h3 class="work-title">${esc(pr.title)}</h3>
        <span class="work-period">${esc(pr.period)}</span>
        <p class="work-sum">${esc(pr.summary)}</p>
        <div class="work-stats">
          ${pr.stats.map((s) => `<div><div class="work-k">${esc(s.k)}</div><div class="work-vv">${esc(s.v)}</div></div>`).join("")}
        </div>
        <div class="chip-row">${pr.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>
        <div class="work-foot">
          <a class="arrow-link" href="${pr.link}" target="_blank" rel="noopener">View repository ${icon("external")}</a>
        </div>
      </article>`
    )
    .join("");
}

/* ---------------- Toolkit ---------------- */
function renderToolkit(p) {
  $("#kitGrid").innerHTML = p.skillGroups
    .map(
      (g, i) => `
      <div class="card kit-card" data-anim="up" style="--i:${i % 3}">
        <div class="kit-top">
          <span class="tile">${icon(g.icon)}</span>
          <h3 class="kit-name">${esc(g.name)}</h3>
        </div>
        <div class="chip-row">${g.items.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div>
      </div>`
    )
    .join("");

  $("#radar").innerHTML = radarChart(p.radar);
}

/** Hand-rolled SVG radar — no chart library. */
function radarChart(data) {
  const size = 320, cx = size / 2, cy = size / 2, r = 104, n = data.length;
  const ang = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i, rad) => [cx + Math.cos(ang(i)) * rad, cy + Math.sin(ang(i)) * rad];

  const rings = [0.25, 0.5, 0.75, 1]
    .map((f) => `<polygon class="radar-ring" points="${data.map((_, i) => pt(i, r * f).map((v) => v.toFixed(1)).join(",")).join(" ")}"/>`)
    .join("");

  const axes = data
    .map((_, i) => {
      const [x, y] = pt(i, r);
      return `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
    })
    .join("");

  const shape = data.map((d, i) => pt(i, (r * d.value) / 100).map((v) => v.toFixed(1)).join(",")).join(" ");

  const dots = data
    .map((d, i) => {
      const [x, y] = pt(i, (r * d.value) / 100);
      return `<circle class="radar-dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3"><title>${esc(d.axis)}: ${d.value}</title></circle>`;
    })
    .join("");

  const labels = data
    .map((d, i) => {
      const [x, y] = pt(i, r + 24);
      const anchor = Math.abs(x - cx) < 12 ? "middle" : x > cx ? "start" : "end";
      return `<text class="radar-label" x="${x.toFixed(1)}" y="${(y + 3).toFixed(1)}" text-anchor="${anchor}">${esc(d.axis)}</text>`;
    })
    .join("");

  return `<svg class="radar" viewBox="-28 -16 ${size + 56} ${size + 32}" role="img" aria-label="Skill depth radar chart">
    ${rings}${axes}
    <polygon class="radar-shape" id="radarShape" points="${shape}" style="opacity:0;transform-origin:${cx}px ${cy}px"/>
    ${dots}${labels}
  </svg>`;
}

/* ---------------- Education ---------------- */
function renderEducation(p) {
  $("#eduList").innerHTML = p.education
    .map(
      (e, i) => `
      <article class="card edu" data-anim="up" style="--i:${i}">
        <span class="edu-badge">${esc(e.badge)}</span>
        <div>
          <h3 class="edu-degree">${esc(e.degree)}</h3>
          <p class="edu-school">${esc(e.school)}</p>
          <p class="edu-detail">${esc(e.detail)} · ${esc(e.location)}</p>
          <div class="chip-row">${e.courses.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div>
        </div>
        <span class="edu-when">${esc(e.period)}</span>
      </article>`
    )
    .join("");

  $("#certGrid").innerHTML = p.certifications
    .map(
      (c, i) => `
      <div class="card cert" data-anim="up" style="--i:${i % 4}">
        <span class="tile">${icon(c.icon)}</span>
        <h3 class="cert-name">${esc(c.name)}</h3>
        <p class="cert-issuer">${esc(c.issuer)}</p>
        <span class="cert-year">${esc(c.year)}</span>
      </div>`
    )
    .join("");
}

/* ---------------- Contact + footer ---------------- */
function renderContact(p) {
  $("#contactMail").textContent = p.email;
  $("#contactMail").href = p.links.email;
  $("#contactMailBtn").href = p.links.email;
  $("#contactResume").href = p.resume;

  $("#contactMeta").innerHTML = [
    [icon("phone"), p.phone],
    [icon("pin"), p.location],
    [icon("briefcase"), p.availability],
  ]
    .map(([ic, text]) => `<span>${ic}${esc(text)}</span>`)
    .join("");

  $("#footerNote").textContent = `© ${new Date().getFullYear()} ${p.name} — built from scratch`;
  $("#footerLinks").innerHTML = [
    ["GitHub", p.links.github],
    ["LinkedIn", p.links.linkedin],
    ["Kaggle", p.links.kaggle],
  ]
    .map(([label, href]) => `<a href="${href}" target="_blank" rel="noopener">${label}</a>`)
    .join("");
}

/* ---------------- Boot ---------------- */
renderHero(PROFILE);
renderAbout(PROFILE);
renderCapabilities(PROFILE);
renderExperience(PROFILE);
renderWork(PROFILE);
renderToolkit(PROFILE);
renderEducation(PROFILE);
renderContact(PROFILE);
