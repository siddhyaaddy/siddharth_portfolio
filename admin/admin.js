/**
 * admin.js — schema-driven editor over the PROFILE object.
 *
 * Every section is described once in SECTIONS below; the forms are generated
 * from that. Adding a field to data.js means adding one line here, not writing
 * another form.
 */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const ICONS = ["sparkles", "database", "chart", "users", "code", "brain", "cloud", "tools", "bolt", "sigma", "book", "briefcase"];
const ACCENTS = ["primary", "cyan", "violet", "amber", "rose"];

/* ── schema ───────────────────────────────────────────────────────────────── */

const SECTIONS = [
  {
    key: "__basics", label: "Profile", group: "Core", type: "object",
    desc: "Name, role, contact details and links. Shown in the hero, nav and contact section.",
    fields: [
      { k: "name", label: "Display name", t: "text", hint: "Split across two lines in the hero" },
      { k: "fullName", label: "Full legal name", t: "text" },
      { k: "initials", label: "Initials", t: "text" },
      { k: "role", label: "Primary role", t: "text" },
      { k: "tagline", label: "Hero tagline", t: "textarea" },
      { k: "summary", label: "Summary", t: "textarea", hint: "Used by the AI assistant" },
      { k: "location", label: "Location", t: "text" },
      { k: "email", label: "Email", t: "text" },
      { k: "phone", label: "Phone", t: "text" },
      { k: "availability", label: "Availability", t: "text" },
      { k: "resume", label: "Résumé path", t: "text" },
      { k: "github", label: "GitHub username", t: "text" },
      { k: "links.github", label: "GitHub URL", t: "text" },
      { k: "links.linkedin", label: "LinkedIn URL", t: "text" },
      { k: "links.kaggle", label: "Kaggle URL", t: "text" },
      { k: "links.email", label: "mailto link", t: "text" },
    ],
  },
  {
    key: "roleAlternates", label: "Rotating roles", group: "Core", type: "strings",
    desc: "Cycles under your name in the hero.",
  },
  {
    key: "metrics", label: "Hero metrics", group: "Core", type: "array",
    desc: "The counter strip under the hero. Four reads best.",
    title: (m) => `${m.value ?? ""}${m.suffix ?? ""} — ${m.label ?? ""}`,
    sub: (m) => m.detail,
    blank: () => ({ value: 0, suffix: "+", label: "", detail: "", decimals: 0 }),
    fields: [
      { k: "value", label: "Number", t: "number" },
      { k: "suffix", label: "Suffix", t: "text", hint: "K+, %, M+" },
      { k: "decimals", label: "Decimal places", t: "number" },
      { k: "label", label: "Label", t: "text" },
      { k: "detail", label: "Detail line", t: "text" },
    ],
  },
  {
    key: "__about", label: "About", group: "Core", type: "object",
    desc: "The About section. Paragraphs accept inline HTML such as <strong>.",
    fields: [
      { k: "about.heading", label: "Heading", t: "text" },
      { k: "about.paragraphs", label: "Paragraphs", t: "strings", area: true, hint: "First one is the large statement" },
    ],
  },
  {
    key: "about.highlights", label: "About highlights", group: "Core", type: "array",
    desc: "The four small tiles beside the About text.",
    title: (h) => h.value, sub: (h) => h.label,
    blank: () => ({ icon: "sparkles", value: "", label: "" }),
    fields: [
      { k: "icon", label: "Icon", t: "select", opts: ICONS },
      { k: "value", label: "Title", t: "text" },
      { k: "label", label: "Description", t: "text" },
    ],
  },
  {
    key: "stack", label: "Ticker items", group: "Core", type: "strings",
    desc: "The scrolling strip under the hero.",
  },
  {
    key: "experience", label: "Experience", group: "Content", type: "array",
    desc: "Roles, newest first. Bullet points accept inline HTML.",
    title: (e) => e.company, sub: (e) => `${e.role} · ${e.period}`,
    blank: () => ({ company: "", role: "", period: "", current: false, location: "", blurb: "", points: [], tags: [], accent: "primary" }),
    fields: [
      { k: "company", label: "Company", t: "text" },
      { k: "role", label: "Role", t: "text" },
      { k: "period", label: "Period", t: "text", hint: "May 2026 — Present" },
      { k: "location", label: "Location", t: "text" },
      { k: "current", label: "Currently here (shows the live badge)", t: "bool" },
      { k: "blurb", label: "One-line summary", t: "textarea" },
      { k: "points", label: "Bullet points", t: "strings", area: true },
      { k: "tags", label: "Tags", t: "strings" },
      { k: "accent", label: "Accent", t: "select", opts: ACCENTS },
    ],
  },
  {
    key: "projects", label: "Projects", group: "Content", type: "array",
    desc: "The horizontal work gallery. Category drives the filter chips.",
    title: (p) => p.title, sub: (p) => `${p.category} · ${p.period}`,
    blank: () => ({ title: "", period: "", category: "", summary: "", points: [], stats: [], tags: [], link: "", accent: "primary", featured: false }),
    fields: [
      { k: "title", label: "Title", t: "text" },
      { k: "category", label: "Category", t: "text", hint: "Becomes a filter chip" },
      { k: "period", label: "Period", t: "text" },
      { k: "link", label: "Repository URL", t: "text" },
      { k: "featured", label: "Featured", t: "bool" },
      { k: "summary", label: "Summary", t: "textarea" },
      { k: "stats", label: "Stats", t: "objects", of: [{ k: "k", label: "Value" }, { k: "v", label: "Caption" }], blank: () => ({ k: "", v: "" }), hint: "Three fit the card" },
      { k: "points", label: "Detail points", t: "strings", area: true, hint: "Feeds the AI assistant" },
      { k: "tags", label: "Tags", t: "strings" },
      { k: "accent", label: "Accent", t: "select", opts: ACCENTS },
    ],
  },
  {
    key: "skillGroups", label: "Toolkit", group: "Content", type: "array",
    desc: "Skill groups. Also feed the Capabilities section.",
    title: (g) => g.name, sub: (g) => `${(g.items || []).length} items`,
    blank: () => ({ name: "", icon: "code", accent: "primary", items: [] }),
    fields: [
      { k: "name", label: "Group name", t: "text" },
      { k: "icon", label: "Icon", t: "select", opts: ICONS },
      { k: "accent", label: "Accent", t: "select", opts: ACCENTS },
      { k: "items", label: "Skills", t: "strings" },
    ],
  },
  {
    key: "radar", label: "Depth radar", group: "Content", type: "array",
    desc: "Self-assessed, 0–100. Six axes render best.",
    title: (r) => r.axis, sub: (r) => `${r.value}/100`,
    blank: () => ({ axis: "", value: 70 }),
    fields: [
      { k: "axis", label: "Axis", t: "text" },
      { k: "value", label: "Value (0–100)", t: "number" },
    ],
  },
  {
    key: "education", label: "Education", group: "Content", type: "array",
    title: (e) => e.degree, sub: (e) => e.school,
    blank: () => ({ degree: "", school: "", period: "", location: "", detail: "", badge: "", accent: "primary", courses: [] }),
    fields: [
      { k: "degree", label: "Degree", t: "text" },
      { k: "school", label: "Institution", t: "text" },
      { k: "period", label: "Period", t: "text" },
      { k: "location", label: "Location", t: "text" },
      { k: "detail", label: "Detail", t: "text", hint: "GPA, minor…" },
      { k: "badge", label: "Badge", t: "text", hint: "MS, BE" },
      { k: "accent", label: "Accent", t: "select", opts: ACCENTS },
      { k: "courses", label: "Coursework", t: "strings" },
    ],
  },
  {
    key: "certifications", label: "Certifications", group: "Content", type: "array",
    title: (c) => c.name, sub: (c) => `${c.issuer} · ${c.year}`,
    blank: () => ({ name: "", issuer: "", year: "", icon: "brain", accent: "primary" }),
    fields: [
      { k: "name", label: "Name", t: "text" },
      { k: "issuer", label: "Issuer", t: "text" },
      { k: "year", label: "Year", t: "text" },
      { k: "icon", label: "Icon", t: "select", opts: ICONS },
      { k: "accent", label: "Accent", t: "select", opts: ACCENTS },
    ],
  },
];

/* ── state ────────────────────────────────────────────────────────────────── */

const state = { profile: null, current: SECTIONS[0].key, dirty: false, collapsed: new Set() };

const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
function set(obj, path, value) {
  const parts = path.split(".");
  const last = parts.pop();
  const target = parts.reduce((o, k) => (o[k] ??= {}), obj);
  target[last] = value;
}

const api = async (url, opts = {}) => {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};

let toastTimer;
function toast(msg, kind = "") {
  const el = $("#toast");
  el.textContent = msg;
  el.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.className = "toast"), 3200);
}

function markDirty() {
  state.dirty = true;
  $("#btnSave").textContent = "Save to file •";
}

/* ── field renderers ──────────────────────────────────────────────────────── */

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function fieldEl(def, value, onChange) {
  const wrap = document.createElement("label");
  wrap.className = "field";
  const hint = def.hint ? ` <span class="hint">— ${esc(def.hint)}</span>` : "";
  wrap.innerHTML = `<span>${esc(def.label)}${hint}</span>`;

  if (def.t === "bool") {
    wrap.className = "check";
    wrap.innerHTML = "";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = Boolean(value);
    cb.addEventListener("change", () => onChange(cb.checked));
    wrap.append(cb, Object.assign(document.createElement("span"), { textContent: def.label }));
    return wrap;
  }

  if (def.t === "select") {
    const sel = document.createElement("select");
    sel.innerHTML = def.opts.map((o) => `<option value="${esc(o)}"${o === value ? " selected" : ""}>${esc(o)}</option>`).join("");
    sel.addEventListener("change", () => onChange(sel.value));
    wrap.append(sel);
    return wrap;
  }

  if (def.t === "textarea") {
    const ta = document.createElement("textarea");
    ta.value = value ?? "";
    ta.addEventListener("input", () => onChange(ta.value));
    wrap.append(ta);
    return wrap;
  }

  if (def.t === "number") {
    const inp = document.createElement("input");
    inp.type = "number";
    inp.step = "any";
    inp.value = value ?? 0;
    inp.addEventListener("input", () => onChange(inp.value === "" ? 0 : Number(inp.value)));
    wrap.append(inp);
    return wrap;
  }

  if (def.t === "strings") {
    wrap.append(stringListEl(value || [], onChange, def.area));
    return wrap;
  }

  if (def.t === "objects") {
    wrap.append(objectListEl(value || [], def, onChange));
    return wrap;
  }

  const inp = document.createElement("input");
  inp.type = "text";
  inp.value = value ?? "";
  inp.addEventListener("input", () => onChange(inp.value));
  wrap.append(inp);
  return wrap;
}

function miniBtn(label, cls, fn) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = `mini ${cls}`;
  b.textContent = label;
  b.addEventListener("click", fn);
  return b;
}

function stringListEl(list, onChange, area) {
  const box = document.createElement("div");
  box.className = "slist";
  const rerender = () => {
    box.innerHTML = "";
    list.forEach((val, i) => {
      const row = document.createElement("div");
      row.className = "slist-row";
      const input = document.createElement(area ? "textarea" : "input");
      if (!area) input.type = "text";
      input.value = val ?? "";
      input.addEventListener("input", () => { list[i] = input.value; onChange(list); });
      row.append(
        input,
        miniBtn("↑", "up", () => { if (i > 0) { [list[i - 1], list[i]] = [list[i], list[i - 1]]; onChange(list); rerender(); } }),
        miniBtn("↓", "down", () => { if (i < list.length - 1) { [list[i + 1], list[i]] = [list[i], list[i + 1]]; onChange(list); rerender(); } }),
        miniBtn("×", "", () => { list.splice(i, 1); onChange(list); rerender(); })
      );
      box.append(row);
    });
    const add = document.createElement("button");
    add.type = "button";
    add.className = "add";
    add.textContent = "+ Add";
    add.addEventListener("click", () => { list.push(""); onChange(list); rerender(); });
    box.append(add);
  };
  rerender();
  return box;
}

function objectListEl(list, def, onChange) {
  const box = document.createElement("div");
  box.className = "slist";
  const rerender = () => {
    box.innerHTML = "";
    list.forEach((obj, i) => {
      const row = document.createElement("div");
      row.className = "slist-row";
      def.of.forEach((sub) => {
        const inp = document.createElement("input");
        inp.type = "text";
        inp.placeholder = sub.label;
        inp.value = obj[sub.k] ?? "";
        inp.addEventListener("input", () => { obj[sub.k] = inp.value; onChange(list); });
        row.append(inp);
      });
      row.append(
        miniBtn("↑", "up", () => { if (i > 0) { [list[i - 1], list[i]] = [list[i], list[i - 1]]; onChange(list); rerender(); } }),
        miniBtn("×", "", () => { list.splice(i, 1); onChange(list); rerender(); })
      );
      box.append(row);
    });
    const add = document.createElement("button");
    add.type = "button";
    add.className = "add";
    add.textContent = "+ Add";
    add.addEventListener("click", () => { list.push(def.blank()); onChange(list); rerender(); });
    box.append(add);
  };
  rerender();
  return box;
}

/* ── section rendering ────────────────────────────────────────────────────── */

function renderNav() {
  const nav = $("#nav");
  nav.innerHTML = "";
  let lastGroup = null;
  SECTIONS.forEach((s) => {
    if (s.group && s.group !== lastGroup) {
      const h = document.createElement("h4");
      h.textContent = s.group;
      nav.append(h);
      lastGroup = s.group;
    }
    const b = document.createElement("button");
    b.type = "button";
    b.className = s.key === state.current ? "on" : "";
    const arr = s.type === "array" || s.type === "strings" ? get(state.profile, s.key) : null;
    b.innerHTML = `<span>${esc(s.label)}</span>${arr ? `<span class="count">${arr.length}</span>` : ""}`;
    b.addEventListener("click", () => { state.current = s.key; renderNav(); renderSection(); });
    nav.append(b);
  });
}

function renderSection() {
  const s = SECTIONS.find((x) => x.key === state.current);
  const work = $("#work");
  work.innerHTML = "";

  const head = document.createElement("div");
  head.className = "sec-head";
  head.innerHTML = `<div><div class="sec-title">${esc(s.label)}</div>${s.desc ? `<div class="sec-desc">${esc(s.desc)}</div>` : ""}</div>`;
  work.append(head);

  if (s.type === "object") {
    const body = document.createElement("div");
    body.className = "item"; body.style.padding = "1.2rem";
    const grid = document.createElement("div");
    grid.className = "row";
    s.fields.forEach((f) => {
      const wide = ["textarea", "strings", "objects"].includes(f.t);
      const el = fieldEl(f, get(state.profile, f.k), (v) => { set(state.profile, f.k, v); markDirty(); });
      if (wide) el.style.gridColumn = "1 / -1";
      grid.append(el);
    });
    body.append(grid);
    work.append(body);
    return;
  }

  if (s.type === "strings") {
    const body = document.createElement("div");
    body.className = "item"; body.style.padding = "1.2rem";
    body.append(stringListEl(get(state.profile, s.key), (v) => { set(state.profile, s.key, v); markDirty(); renderNav(); }));
    work.append(body);
    return;
  }

  // array of objects
  const list = get(state.profile, s.key) || [];
  const addTop = document.createElement("button");
  addTop.type = "button";
  addTop.className = "btn";
  addTop.textContent = "+ Add new";
  addTop.addEventListener("click", () => {
    list.unshift(s.blank());
    markDirty(); renderNav(); renderSection();
  });
  head.append(addTop);

  list.forEach((item, i) => {
    const card = document.createElement("div");
    const id = `${s.key}:${i}`;
    card.className = "item" + (state.collapsed.has(id) ? " collapsed" : "");

    const h = document.createElement("div");
    h.className = "item-head";
    h.innerHTML = `
      <span class="chev">▾</span>
      <span class="item-idx">${String(i + 1).padStart(2, "0")}</span>
      <span class="item-title">${esc(s.title?.(item) || "Untitled")}</span>
      <span class="item-sub">${esc(s.sub?.(item) || "")}</span>`;
    h.addEventListener("click", (ev) => {
      if (ev.target.closest(".item-tools")) return;
      state.collapsed.has(id) ? state.collapsed.delete(id) : state.collapsed.add(id);
      card.classList.toggle("collapsed");
    });

    const tools = document.createElement("span");
    tools.className = "item-tools";
    tools.append(
      miniBtn("↑", "up", () => { if (i > 0) { [list[i - 1], list[i]] = [list[i], list[i - 1]]; markDirty(); renderSection(); } }),
      miniBtn("↓", "down", () => { if (i < list.length - 1) { [list[i + 1], list[i]] = [list[i], list[i + 1]]; markDirty(); renderSection(); } }),
      miniBtn("×", "", () => {
        if (!confirm(`Delete "${s.title?.(item) || "this item"}"?`)) return;
        list.splice(i, 1); markDirty(); renderNav(); renderSection();
      })
    );
    h.append(tools);

    const body = document.createElement("div");
    body.className = "item-body";
    const grid = document.createElement("div");
    grid.className = "row";
    s.fields.forEach((f) => {
      const wide = ["textarea", "strings", "objects"].includes(f.t);
      const el = fieldEl(f, item[f.k], (v) => {
        item[f.k] = v;
        markDirty();
        $(".item-title", h).textContent = s.title?.(item) || "Untitled";
        $(".item-sub", h).textContent = s.sub?.(item) || "";
      });
      if (wide) el.style.gridColumn = "1 / -1";
      grid.append(el);
    });
    body.append(grid);

    card.append(h, body);
    work.append(card);
  });

  if (!list.length) {
    const e = document.createElement("div");
    e.className = "empty";
    e.textContent = "Nothing here yet — use “Add new”.";
    work.append(e);
  }
}

/* ── git status ───────────────────────────────────────────────────────────── */

async function refreshGit() {
  try {
    const g = await api("/api/git");
    const clean = !g.dirty.length;
    $("#gitStatus").innerHTML = `
      <span>branch <b>${esc(g.branch)}</b></span>
      <span class="pill ${clean ? "clean" : "dirty"}">${clean ? "committed" : `${g.dirty.length} changed`}</span>
      ${g.ahead ? `<span class="pill dirty">${g.ahead} to push</span>` : `<span class="pill clean">pushed</span>`}`;
    return g;
  } catch (e) {
    $("#gitStatus").textContent = "git unavailable";
  }
}

/* ── actions ──────────────────────────────────────────────────────────────── */

async function save() {
  try {
    await api("/api/data", { method: "PUT", body: JSON.stringify({ profile: state.profile }) });
    state.dirty = false;
    $("#btnSave").textContent = "Save to file";
    toast("Saved to data.js", "ok");
    refreshGit();
    reloadPreview();
  } catch (e) {
    toast(`Save failed: ${e.message}`, "err");
  }
}

function reloadPreview() {
  const f = $("#previewFrame");
  if (!$("#previewPane").hidden) f.src = `/site/index.html?cb=${Date.now()}`;
}

$("#btnSave").addEventListener("click", save);

$("#btnPreview").addEventListener("click", () => {
  const pane = $("#previewPane");
  pane.hidden = !pane.hidden;
  if (!pane.hidden) reloadPreview();
});
$("#btnClosePreview").addEventListener("click", () => ($("#previewPane").hidden = true));
$("#btnReload").addEventListener("click", reloadPreview);

$("#btnRevert").addEventListener("click", async () => {
  if (!confirm("Discard all unsaved and uncommitted changes to data.js?")) return;
  try {
    const { profile } = await api("/api/revert", { method: "POST" });
    state.profile = profile;
    state.dirty = false;
    $("#btnSave").textContent = "Save to file";
    renderNav(); renderSection(); refreshGit(); reloadPreview();
    toast("Reverted to last commit", "ok");
  } catch (e) {
    toast(`Revert failed: ${e.message}`, "err");
  }
});

$("#btnPublish").addEventListener("click", async () => {
  if (state.dirty) await save();
  const g = await refreshGit();
  $("#modalDiff").textContent = g && (g.dirty.length || g.ahead)
    ? [...g.dirty, g.ahead ? `${g.ahead} commit(s) waiting to push` : ""].filter(Boolean).join("\n")
    : "Nothing to publish — working tree clean and everything pushed.";
  $("#commitMsg").value = "";
  $("#modal").hidden = false;
  $("#commitMsg").focus();
});

$("#modalCancel").addEventListener("click", () => ($("#modal").hidden = true));
$("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") $("#modal").hidden = true; });

$("#modalConfirm").addEventListener("click", async () => {
  const btn = $("#modalConfirm");
  btn.disabled = true;
  btn.textContent = "Publishing…";
  try {
    const r = await api("/api/publish", { method: "POST", body: JSON.stringify({ message: $("#commitMsg").value }) });
    $("#modal").hidden = true;
    toast(r.noop ? r.message : `Published ${r.sha} — Vercel is redeploying`, "ok");
    refreshGit();
  } catch (e) {
    toast(`Publish failed: ${e.message}`, "err");
  } finally {
    btn.disabled = false;
    btn.textContent = "Commit & push";
  }
});

document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
  if (e.key === "Escape") $("#modal").hidden = true;
});

window.addEventListener("beforeunload", (e) => {
  if (state.dirty) { e.preventDefault(); e.returnValue = ""; }
});

/* ── boot ─────────────────────────────────────────────────────────────────── */

(async function boot() {
  try {
    const { profile } = await api("/api/data");
    state.profile = profile;
    renderNav();
    renderSection();
    refreshGit();
    setInterval(refreshGit, 15000);
  } catch (e) {
    $("#work").innerHTML = `<div class="empty">Could not load data.js — ${esc(e.message)}</div>`;
  }
})();
