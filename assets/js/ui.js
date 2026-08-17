/**
 * ui.js — behaviour: loader, theme, reveal, counters, role flipper,
 * experience index, horizontal work gallery, palette, ambient canvas.
 * No frameworks.
 */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- Loader ---------------- */
(function loader() {
  const el = $("#loader"), num = $("#loaderNum"), bar = $("#loaderBar");
  let v = 0;
  const tick = setInterval(() => {
    v = Math.min(100, v + Math.random() * 18 + 6);
    num.textContent = String(Math.floor(v)).padStart(2, "0");
    bar.style.width = v + "%";
    if (v >= 100) {
      clearInterval(tick);
      setTimeout(() => {
        el.classList.add("done");
        document.body.dataset.ready = "1";
        // Hero type animates only once the curtain is up.
        $$("#hero .split, #hero .words, #heroHello, #hero [data-anim]").forEach((n) => n.classList.add("in"));
      }, 260);
    }
  }, reduceMotion ? 20 : 130);
})();

/* ---------------- Theme ---------------- */
const THEME_KEY = "sa-theme";
function applyTheme(mode) {
  document.documentElement.setAttribute("data-theme", mode);
  $("#themeIcon").innerHTML = `<use href="#i-${mode === "dark" ? "sun" : "moon"}"/>`;
  document.querySelector('meta[name="theme-color"]').content = mode === "dark" ? "#0a070e" : "#f7f5fa";
  localStorage.setItem(THEME_KEY, mode);
}
applyTheme(
  localStorage.getItem(THEME_KEY) ||
    (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
);
$("#themeToggle").addEventListener("click", () =>
  applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark")
);

/* ---------------- Toast ---------------- */
let toastTimer;
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}
$("#copyMail").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(PROFILE.email);
    toast("Email copied to clipboard");
  } catch {
    toast(PROFILE.email);
  }
});

/* ---------------- Nav: progress + scroll-spy ---------------- */
const nav = $("#nav"), progress = $("#progress");
const sections = $$("main section[id]");
const navLinks = $$(".nav-link");

const chatFabEl = $("#chatFab");

function onScroll() {
  const y = window.scrollY;
  nav.classList.toggle("stuck", y > 30);
  // Collapse the assistant to a disc past the hero so it stops covering content.
  chatFabEl.classList.toggle("mini", y > window.innerHeight * 0.7);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

  let current = "";
  for (const s of sections) if (s.offsetTop - 160 <= y) current = s.id;
  navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${current}`));
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------------- Mobile drawer ---------------- */
const drawer = $("#drawer");
const toggleDrawer = (open) => {
  drawer.classList.toggle("open", open);
  $("#menuBtn").setAttribute("aria-expanded", String(open));
  document.body.style.overflow = open ? "hidden" : "";
};
$("#menuBtn").addEventListener("click", () => toggleDrawer(true));
$("#drawerClose").addEventListener("click", () => toggleDrawer(false));
$$("#drawer a").forEach((a) => a.addEventListener("click", () => toggleDrawer(false)));

/* ---------------- Reveal engine ----------------
 * A `clip` element starts at inset(0 0 103% 0), which gives it a zero-area
 * intersection rect — it could never trigger its own reveal and would stay
 * invisible forever. Those observe a parent proxy instead.
 */
const proxyFor = (el) => (el.dataset.anim === "clip" ? el.parentElement || el : el);
const pending = new Map();

$$("[data-anim], .split, .words").forEach((el) => {
  const p = proxyFor(el);
  if (!pending.has(p)) pending.set(p, []);
  pending.get(p).push(el);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      (pending.get(e.target) || []).forEach((el) => el.classList.add("in"));
      pending.delete(e.target);
      revealObserver.unobserve(e.target);
    });
  },
  { threshold: 0, rootMargin: "0px 0px -12% 0px" }
);
pending.forEach((_t, proxy) => revealObserver.observe(proxy));

/* ---------------- Counters ---------------- */
function animateCount(el) {
  const target = parseFloat(el.dataset.count);
  const dec = parseInt(el.dataset.dec, 10) || 0;
  if (reduceMotion) { el.textContent = target.toFixed(dec); return; }
  const dur = 1700, t0 = performance.now();
  const step = (now) => {
    const t = Math.min((now - t0) / dur, 1);
    el.textContent = (target * (1 - Math.pow(1 - t, 4))).toFixed(dec);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const countObserver = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    animateCount(e.target);
    countObserver.unobserve(e.target);
  }),
  { threshold: 0.5 }
);
$$("[data-count]").forEach((el) => countObserver.observe(el));

/* ---------------- Radar reveal ---------------- */
const radarShape = $("#radarShape");
if (radarShape) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      radarShape.animate(
        [{ opacity: 0, transform: "scale(0.3)" }, { opacity: 1, transform: "scale(1)" }],
        { duration: reduceMotion ? 1 : 1000, easing: "cubic-bezier(0.16,1,0.3,1)", fill: "forwards" }
      );
      io.unobserve(e.target);
    });
  }, { threshold: 0.4 });
  io.observe(radarShape);
}

/* ---------------- Role flipper ----------------
 * The track holds roles + a duplicate of the first. Rolling to the duplicate
 * then snapping back (transition off) makes the loop seamless — no crossfade
 * ghosting, which is what makes overlapping role animations look broken.
 */
(function roleFlipper() {
  const track = $("#roleTrack");
  if (!track || reduceMotion) return;
  const n = PROFILE.roleAlternates.length;
  let i = 0;
  setInterval(() => {
    i++;
    track.style.transition = "";
    track.style.transform = `translateY(-${i * 1.5}em)`;
    if (i === n) {
      setTimeout(() => {
        track.style.transition = "none";
        track.style.transform = "translateY(0)";
        i = 0;
        void track.offsetHeight; // force reflow so the next transition applies
      }, 820);
    }
  }, 2600);
})();

/* ---------------- Experience index ---------------- */
(function expIndex() {
  const items = $$(".exp-idx-item");
  const cards = $$(".exp-card");
  if (!items.length) return;

  items.forEach((b) =>
    b.addEventListener("click", () => {
      document.getElementById(b.dataset.goto)?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    })
  );

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const idx = cards.indexOf(e.target);
        items.forEach((b, i) => b.classList.toggle("on", i === idx));
      });
    },
    { rootMargin: "-45% 0px -45% 0px" }
  );
  cards.forEach((c) => io.observe(c));
})();

/* ---------------- Work gallery ---------------- */
(function workGallery() {
  const rail = $("#workRail");
  if (!rail) return;
  const thumb = $("#workThumb"), count = $("#workCount");
  const prev = $("#workPrev"), next = $("#workNext");

  const visible = () => $$(".work-card", rail).filter((c) => !c.classList.contains("hide"));

  function step() {
    const cards = visible();
    if (cards.length < 2) return rail.clientWidth;
    return cards[1].offsetLeft - cards[0].offsetLeft;
  }

  function sync() {
    const cards = visible();
    const total = cards.length || 1;
    const max = rail.scrollWidth - rail.clientWidth;

    /* Index = whichever card sits nearest the rail's centre. Deriving it from
       scrollLeft/maxScroll is wrong whenever more than one card is on screen,
       because the last card reaches the end long before it is the Nth step. */
    /* Label = leftmost still-visible card. With ~2.5 cards on screen the first
       and last can never be centred, so a "nearest to centre" index sticks at
       02…04 and never reaches either end. */
    const left = rail.getBoundingClientRect().left;
    let idx = 0;
    for (let i = 0; i < cards.length; i++) {
      if (cards[i].getBoundingClientRect().right > left + 12) { idx = i; break; }
    }

    /* The thumb is a true proportional scrollbar, not N discrete steps. */
    const frac = rail.scrollWidth > 0 ? rail.clientWidth / rail.scrollWidth : 1;
    const p = max > 0 ? rail.scrollLeft / max : 0;
    thumb.style.width = `${Math.min(100, frac * 100)}%`;
    thumb.style.transform = `translateX(${frac < 1 ? p * ((1 - frac) / frac) * 100 : 0}%)`;

    count.textContent = `${String(idx + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
    prev.disabled = rail.scrollLeft <= 4;
    next.disabled = rail.scrollLeft >= max - 4;
  }

  rail.addEventListener("scroll", sync, { passive: true });
  window.addEventListener("resize", sync);

  const go = (dir) => rail.scrollBy({ left: dir * step(), behavior: reduceMotion ? "auto" : "smooth" });
  next.addEventListener("click", () => go(1));
  prev.addEventListener("click", () => go(-1));

  rail.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
  });

  /* Drag to pan — pointer events so it works with mouse, pen and touch. */
  let down = false, startX = 0, startScroll = 0, moved = 0;
  rail.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // native touch scrolling is better
    down = true; moved = 0;
    startX = e.clientX;
    startScroll = rail.scrollLeft;
    rail.classList.add("dragging");
  });
  rail.addEventListener("pointermove", (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    moved = Math.abs(dx);
    rail.scrollLeft = startScroll - dx;
  });
  const release = () => {
    if (!down) return;
    down = false;
    rail.classList.remove("dragging");
    sync();
  };
  rail.addEventListener("pointerup", release);
  rail.addEventListener("pointerleave", release);
  // Suppress the click that follows a real drag, so cards don't open links.
  rail.addEventListener("click", (e) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);

  /* Category filter */
  $("#filters").addEventListener("click", (e) => {
    const btn = e.target.closest(".filter");
    if (!btn) return;
    $$(".filter").forEach((b) => b.classList.toggle("on", b === btn));
    const want = btn.dataset.filter;
    $$(".work-card", rail).forEach((c) =>
      c.classList.toggle("hide", want !== "All" && c.dataset.category !== want)
    );
    rail.scrollTo({ left: 0, behavior: "auto" });
    sync();
  });

  sync();
})();

/* ---------------- Card pointer glow ---------------- */
$$(".card").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
});

/* ---------------- Ambient canvas ---------------- */
(function background() {
  const canvas = $("#bg-canvas");
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx || reduceMotion) return;

  let w, h, dpr, nodes = [], raf = null;
  const pointer = { x: -9999, y: -9999 };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = window.innerWidth * dpr;
    h = canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    const density = Math.min(80, Math.floor((window.innerWidth * window.innerHeight) / 19000));
    nodes = Array.from({ length: density }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.18 * dpr,
      vy: (Math.random() - 0.5) * 0.18 * dpr,
      r: (Math.random() * 1.3 + 0.5) * dpr,
    }));
  };

  const accent = () => getComputedStyle(document.documentElement).getPropertyValue("--ac").trim() || "#a97bff";

  const frame = () => {
    ctx.clearRect(0, 0, w, h);
    const color = accent();
    const link = 140 * dpr;

    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    }

    ctx.lineWidth = dpr * 0.55;
    ctx.strokeStyle = color;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        const d = Math.hypot(dx, dy);
        if (d > link) continue;
        ctx.globalAlpha = (1 - d / link) * 0.16;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }

    ctx.fillStyle = color;
    for (const n of nodes) {
      const near = Math.hypot(n.x - pointer.x, n.y - pointer.y) < 150 * dpr;
      ctx.globalAlpha = near ? 0.8 : 0.32;
      ctx.beginPath();
      ctx.arc(n.x, n.y, near ? n.r * 1.9 : n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  };

  const start = () => { if (raf === null) frame(); };
  const stop = () => { cancelAnimationFrame(raf); raf = null; };

  resize(); start();
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", (e) => {
    pointer.x = e.clientX * dpr;
    pointer.y = e.clientY * dpr;
  }, { passive: true });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
})();

/* ---------------- Command palette ---------------- */
(function palette() {
  const box = $("#palette"), input = $("#paletteInput"), list = $("#paletteList");
  let items = [], cursor = 0;

  const commands = [
    ...sections.map((s) => ({
      group: "Navigate",
      label: s.id.charAt(0).toUpperCase() + s.id.slice(1),
      hint: "Section",
      icon: "arrow",
      run: () => document.getElementById(s.id).scrollIntoView({ behavior: "smooth" }),
    })),
    ...PROFILE.projects.map((p) => ({
      group: "Projects",
      label: p.title,
      hint: p.category,
      icon: "book",
      run: () => window.open(p.link, "_blank", "noopener"),
    })),
    { group: "Actions", label: "Ask the AI assistant", hint: "Chat", icon: "sparkles", run: () => window.openChat?.() },
    { group: "Actions", label: "Download résumé", hint: "PDF", icon: "download", run: () => window.open(PROFILE.resume, "_blank") },
    {
      group: "Actions", label: "Copy email address", hint: PROFILE.email, icon: "copy",
      run: async () => {
        try { await navigator.clipboard.writeText(PROFILE.email); toast("Email copied to clipboard"); }
        catch { toast(PROFILE.email); }
      },
    },
    { group: "Actions", label: "Toggle light / dark theme", hint: "Theme", icon: "moon", run: () => $("#themeToggle").click() },
    { group: "Links", label: "GitHub", hint: "@" + PROFILE.github, icon: "github", run: () => window.open(PROFILE.links.github, "_blank", "noopener") },
    { group: "Links", label: "LinkedIn", hint: "Profile", icon: "linkedin", run: () => window.open(PROFILE.links.linkedin, "_blank", "noopener") },
    { group: "Links", label: "Kaggle", hint: "Profile", icon: "kaggle", run: () => window.open(PROFILE.links.kaggle, "_blank", "noopener") },
  ];

  function paint(query = "") {
    const q = query.trim().toLowerCase();
    items = q ? commands.filter((c) => (c.label + " " + c.hint + " " + c.group).toLowerCase().includes(q)) : commands;
    cursor = 0;
    if (!items.length) {
      list.innerHTML = `<p class="palette-empty">Nothing matches “${esc(query)}”.</p>`;
      return;
    }
    let html = "", last = "";
    items.forEach((c, i) => {
      if (c.group !== last) { html += `<div class="palette-group">${c.group}</div>`; last = c.group; }
      html += `<button class="palette-item" role="option" data-i="${i}" aria-selected="${i === 0}">
        <svg viewBox="0 0 24 24"><use href="#i-${c.icon}"/></svg><span>${esc(c.label)}</span><small>${esc(c.hint)}</small></button>`;
    });
    list.innerHTML = html;
  }

  const highlight = () =>
    $$(".palette-item", list).forEach((el) => {
      const on = Number(el.dataset.i) === cursor;
      el.setAttribute("aria-selected", String(on));
      if (on) el.scrollIntoView({ block: "nearest" });
    });

  const open = () => { box.classList.add("open"); input.value = ""; paint(); setTimeout(() => input.focus(), 40); };
  const close = () => box.classList.remove("open");

  $("#paletteOpen").addEventListener("click", open);
  input.addEventListener("input", () => paint(input.value));
  list.addEventListener("click", (e) => {
    const el = e.target.closest(".palette-item");
    if (!el) return;
    close();
    items[Number(el.dataset.i)].run();
  });

  document.addEventListener("keydown", (e) => {
    const isOpen = box.classList.contains("open");
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      isOpen ? close() : open();
      return;
    }
    if (!isOpen) return;
    if (e.key === "Escape") return close();
    if (e.key === "ArrowDown") { e.preventDefault(); cursor = (cursor + 1) % items.length; highlight(); }
    if (e.key === "ArrowUp") { e.preventDefault(); cursor = (cursor - 1 + items.length) % items.length; highlight(); }
    if (e.key === "Enter" && items[cursor]) { e.preventDefault(); close(); items[cursor].run(); }
  });

  box.addEventListener("click", (e) => { if (e.target === box) close(); });
})();

/* ---------------- Smooth anchors ---------------- */
$$('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id === "#" || id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", id);
  });
});
