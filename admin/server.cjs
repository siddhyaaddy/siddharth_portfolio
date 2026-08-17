/**
 * admin/server.cjs — local-only CMS for the portfolio. Zero dependencies.
 *
 *   node admin/server.cjs        →  http://localhost:4321
 *
 * How it works: the panel reads and writes the PROFILE object inside
 * assets/js/data.js, then commits and pushes. Vercel is connected to the repo,
 * so pushing is what publishes. That means every content change is an ordinary
 * git commit — diffable, revertable, no database, nothing to host.
 *
 * Binds to 127.0.0.1 only. It has no auth because it is not reachable from
 * outside this machine; do not put it behind a public tunnel.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFile } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DATA_FILE = path.join(ROOT, "assets", "js", "data.js");
const PORT = Number(process.env.ADMIN_PORT || 4321);

/* ── data.js read / write ─────────────────────────────────────────────────── */

/** Evaluate data.js in a sandbox and hand back the PROFILE object. */
function readProfile() {
  const src = fs.readFileSync(DATA_FILE, "utf8");
  // The file's last expression becomes the script's completion value.
  return vm.runInNewContext(`${src}\n;PROFILE`, {}, { timeout: 3000 });
}

/**
 * Find the span of the PROFILE object literal, brace-matching while skipping
 * strings, template literals and comments — a naive brace count would stop at
 * the first `}` inside a string like "a } b".
 */
function profileSpan(src) {
  const start = src.indexOf("const PROFILE = {");
  if (start === -1) throw new Error("Could not find `const PROFILE = {` in data.js");
  const open = src.indexOf("{", start);

  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    const next = src[i + 1];

    if (c === "/" && next === "/") { i = src.indexOf("\n", i); if (i === -1) break; continue; }
    if (c === "/" && next === "*") { i = src.indexOf("*/", i + 2) + 1; continue; }

    if (c === '"' || c === "'" || c === "`") {
      const quote = c;
      i++;
      while (i < src.length) {
        if (src[i] === "\\") { i += 2; continue; }
        if (src[i] === quote) break;
        i++;
      }
      continue;
    }

    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return { open, close: i };
    }
  }
  throw new Error("Unbalanced braces while scanning PROFILE");
}

/** Splice a new PROFILE literal into data.js, leaving the rest of the file alone. */
function writeProfile(profile) {
  const src = fs.readFileSync(DATA_FILE, "utf8");
  const { open, close } = profileSpan(src);
  const literal = JSON.stringify(profile, null, 2);
  const updated = src.slice(0, open) + literal + src.slice(close + 1);

  // Never write a file that cannot be parsed — verify before touching disk.
  vm.runInNewContext(`${updated}\n;PROFILE`, {}, { timeout: 3000 });

  fs.writeFileSync(DATA_FILE, updated, "utf8");
}

/* ── git ──────────────────────────────────────────────────────────────────── */

const git = (args) =>
  new Promise((resolve, reject) =>
    execFile("git", args, { cwd: ROOT, timeout: 60000 }, (err, stdout, stderr) =>
      err ? reject(new Error(stderr || err.message)) : resolve(stdout.trim())
    )
  );

async function gitStatus() {
  const [branch, porcelain] = await Promise.all([
    git(["rev-parse", "--abbrev-ref", "HEAD"]),
    git(["status", "--porcelain"]),
  ]);
  let ahead = 0;
  try {
    ahead = Number(await git(["rev-list", "--count", "@{u}..HEAD"])) || 0;
  } catch { /* no upstream configured */ }
  return {
    branch,
    dirty: porcelain.split("\n").filter(Boolean).map((l) => l.trim()),
    ahead,
  };
}

/* ── images ───────────────────────────────────────────────────────────────── */

const IMG_DIR = path.join(ROOT, "assets", "img");
const IMG_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

/** Only ever touch a plain filename inside assets/img — no paths, no traversal. */
function safeImageName(name) {
  const base = path.basename(String(name || "")).replace(/[^\w.\- ]/g, "_").trim();
  if (!base || base.startsWith(".")) return null;
  if (!IMG_EXT.has(path.extname(base).toLowerCase())) return null;
  return base;
}

function listImages() {
  if (!fs.existsSync(IMG_DIR)) return [];
  return fs
    .readdirSync(IMG_DIR)
    .filter((f) => IMG_EXT.has(path.extname(f).toLowerCase()))
    .map((f) => {
      const st = fs.statSync(path.join(IMG_DIR, f));
      return { name: f, path: `./assets/img/${f}`, bytes: st.size, modified: st.mtime.toISOString() };
    })
    .sort((a, b) => b.modified.localeCompare(a.modified));
}

/** Which data.js fields point at this file, so the UI can warn before deleting. */
function imageUsage(profile, rel) {
  const used = [];
  for (const [slot, val] of Object.entries(profile.images || {})) {
    if (val === rel) used.push(slot);
  }
  return used;
}

/* ── static serving ───────────────────────────────────────────────────────── */

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".pdf": "application/pdf",
  ".woff2": "font/woff2",
};

function sendFile(res, file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404).end("Not found");
    return;
  }
  res.writeHead(200, {
    "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(file).pipe(res);
}

const json = (res, code, body) => {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 5e6) reject(new Error("Body too large"));
    });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); }
    });
  });

/** Keep path traversal out of the static handlers. */
function safeJoin(base, rel) {
  const target = path.resolve(base, "." + path.posix.normalize("/" + rel));
  if (target !== base && !target.startsWith(base + path.sep)) return null;
  return target;
}

/* ── routes ───────────────────────────────────────────────────────────────── */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const p = url.pathname;

  try {
    if (p === "/api/data" && req.method === "GET") {
      return json(res, 200, { profile: readProfile() });
    }

    if (p === "/api/data" && req.method === "PUT") {
      const { profile } = await readBody(req);
      if (!profile || typeof profile !== "object") return json(res, 400, { error: "profile required" });
      writeProfile(profile);
      return json(res, 200, { ok: true, saved: new Date().toISOString() });
    }

    if (p === "/api/images" && req.method === "GET") {
      const profile = readProfile();
      return json(res, 200, {
        images: listImages().map((im) => ({ ...im, usedBy: imageUsage(profile, im.path) })),
        slots: profile.images || {},
      });
    }

    /* Upload. The browser resizes and re-encodes before sending, so this only
       ever receives a modest data URL — no multipart parser needed. */
    if (p === "/api/images" && req.method === "POST") {
      const { name, dataUrl } = await readBody(req);
      const safe = safeImageName(name);
      if (!safe) return json(res, 400, { error: "Name must be a plain .jpg/.png/.webp/.gif/.avif file" });

      const m = /^data:image\/[a-z+]+;base64,(.+)$/i.exec(dataUrl || "");
      if (!m) return json(res, 400, { error: "Expected a base64 image data URL" });

      const buf = Buffer.from(m[1], "base64");
      if (buf.length > 8e6) return json(res, 400, { error: "Image is larger than 8 MB after processing" });

      fs.mkdirSync(IMG_DIR, { recursive: true });
      let final = safe;
      // Never silently clobber an existing file.
      if (fs.existsSync(path.join(IMG_DIR, final))) {
        const ext = path.extname(final);
        final = `${path.basename(final, ext)}-${Date.now().toString(36)}${ext}`;
      }
      fs.writeFileSync(path.join(IMG_DIR, final), buf);
      return json(res, 200, { ok: true, name: final, path: `./assets/img/${final}`, bytes: buf.length });
    }

    if (p === "/api/images" && req.method === "DELETE") {
      const { name } = await readBody(req);
      const safe = safeImageName(name);
      if (!safe) return json(res, 400, { error: "Bad filename" });

      const rel = `./assets/img/${safe}`;
      const used = imageUsage(readProfile(), rel);
      if (used.length) {
        return json(res, 409, { error: `Still used by: ${used.join(", ")}. Point that slot elsewhere first.` });
      }
      const file = path.join(IMG_DIR, safe);
      if (!fs.existsSync(file)) return json(res, 404, { error: "Not found" });
      fs.unlinkSync(file);
      return json(res, 200, { ok: true });
    }

    /* Assign an image to a slot (hero / about). */
    if (p === "/api/images/slot" && req.method === "PUT") {
      const { slot, path: rel } = await readBody(req);
      if (!slot || !rel) return json(res, 400, { error: "slot and path required" });
      const profile = readProfile();
      profile.images = { ...(profile.images || {}), [slot]: rel };
      writeProfile(profile);
      return json(res, 200, { ok: true, slots: profile.images });
    }

    if (p === "/api/git" && req.method === "GET") {
      return json(res, 200, await gitStatus());
    }

    if (p === "/api/publish" && req.method === "POST") {
      const { message } = await readBody(req);
      const msg = (message || "").trim() || "Update portfolio content via admin panel";
      const before = await gitStatus();
      if (!before.dirty.length && !before.ahead) {
        return json(res, 200, { ok: true, noop: true, message: "Nothing to publish — already up to date." });
      }
      if (before.dirty.length) {
        await git(["add", "-A"]);
        await git(["commit", "-m", msg]);
      }
      await git(["push"]);
      const after = await gitStatus();
      const sha = await git(["rev-parse", "--short", "HEAD"]);
      return json(res, 200, { ok: true, sha, status: after });
    }

    if (p === "/api/revert" && req.method === "POST") {
      await git(["checkout", "--", "assets/js/data.js"]);
      return json(res, 200, { ok: true, profile: readProfile() });
    }

    // Live preview of the real site, so edits can be eyeballed before publishing.
    if (p.startsWith("/site/")) {
      const rel = p.slice("/site".length) || "/index.html";
      const file = safeJoin(ROOT, rel === "/" ? "/index.html" : rel);
      if (!file) return res.writeHead(400).end("Bad path");
      return sendFile(res, file);
    }

    // Admin UI
    const rel = p === "/" ? "/index.html" : p;
    const file = safeJoin(__dirname, rel);
    if (!file) return res.writeHead(400).end("Bad path");
    return sendFile(res, file);
  } catch (err) {
    console.error(err);
    return json(res, 500, { error: err.message });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`\n  Portfolio admin  →  http://localhost:${PORT}`);
  console.log(`  Editing          →  ${path.relative(process.cwd(), DATA_FILE)}`);
  console.log(`  Publish          →  git commit + push (Vercel auto-deploys)\n`);
});
