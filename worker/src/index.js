// Sensee messages: practitioner accounts + short-lived personal messages for clients.
//
// Public:        GET    /m/:id                      -> { text, from, to, deck }
// Practitioner:  POST   /messages                   -> { id }            (Authorization: Bearer <pid.secret>)
//                GET    /messages                   -> [{ id, to, deck, created, expires }]
//                DELETE /messages/:id
// Admin:         GET    /admin/practitioners
//                POST   /admin/practitioners        { name } -> { pid, code }  (code shown once)
//                POST   /admin/practitioners/:pid   { active: true|false }
//                DELETE /admin/practitioners/:pid
//                (Authorization: Bearer <ADMIN_TOKEN>)

const ORIGINS = ["https://sensee.ca", "https://www.sensee.ca"];
const TTL_SECONDS = 60 * 60 * 24 * 30;      // messages expire after 30 days
const DAILY_LIMIT = 50;                      // messages per practitioner per day
const MAX_INDEX = 200;
const MAX_AGE_MS = TTL_SECONDS * 1000;
const DECKS = ["everyday", "movement", "calm"];
const ID_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ORIGINS.includes(origin) ? origin : ORIGINS[0],
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const out = (data, status = 200, extra = {}) =>
      new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...cors, ...extra } });

    try {
      const url = new URL(request.url);
      const parts = url.pathname.split("/").filter(Boolean);
      const bearer = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");

      // ---- public: read one message
      if (request.method === "GET" && parts[0] === "m" && parts[1]) {
        const key = "m:" + parts[1].toLowerCase();
        const m = await getJson(env, key);
        if (!m) return out({ error: "not_found" }, 404);
        if (Date.now() - m.created > MAX_AGE_MS) { await env.SENSEE.delete(key); return out({ error: "not_found" }, 404); }
        return out({ text: m.text, from: m.from, to: m.to, deck: m.deck });
      }

      // ---- admin
      if (parts[0] === "admin") {
        if (!(await isAdmin(bearer, env))) return out({ error: "unauthorized" }, 401);
        if (parts[1] !== "practitioners") return out({ error: "not_found" }, 404);
        if (request.method === "GET" && !parts[2]) {
          const list = await env.SENSEE.list({ prefix: "p:" });
          const rows = [];
          for (const k of list.keys) { const p = await getJson(env, k.name); if (p) rows.push({ pid: k.name.slice(2), name: p.name, active: p.active, created: p.created }); }
          return out(rows);
        }
        if (request.method === "POST" && !parts[2]) {
          const body = await readJson(request);
          const name = clean(body.name, 60);
          if (!name) return out({ error: "name_required" }, 400);
          const pid = randomId(8), secret = randomId(24);
          await env.SENSEE.put("p:" + pid, JSON.stringify({ name, hash: await hashSecret(pid, secret), active: true, created: today() }));
          return out({ pid, name, code: pid + "." + secret });
        }
        if (parts[2]) {
          const p = await getJson(env, "p:" + parts[2]);
          if (!p) return out({ error: "not_found" }, 404);
          if (request.method === "POST") { const body = await readJson(request); p.active = body.active !== false; await env.SENSEE.put("p:" + parts[2], JSON.stringify(p)); return out({ ok: true, active: p.active }); }
          if (request.method === "DELETE") { await env.SENSEE.delete("p:" + parts[2]); return out({ ok: true }); }
        }
        return out({ error: "not_found" }, 404);
      }

      // ---- practitioner
      if (parts[0] === "messages") {
        const who = await practitioner(bearer, env);
        const isAdm = !who && (await isAdmin(bearer, env));
        if (!who && !isAdm) return out({ error: "unauthorized" }, 401);

        if (request.method === "POST" && !parts[1]) {
          if (!who) return out({ error: "practitioner_required" }, 403);
          const body = await readJson(request);
          const text = clean(body.text, 400), to = clean(body.to, 40), deck = DECKS.includes(body.deck) ? body.deck : "everyday";
          if (!text) return out({ error: "text_required" }, 400);
          const key = "rate:" + who.pid + ":" + today();
          const used = parseInt((await env.SENSEE.get(key)) || "0", 10);
          if (used >= DAILY_LIMIT) return out({ error: "daily_limit" }, 429);
          await env.SENSEE.put(key, String(used + 1), { expirationTtl: 172800 });
          const id = randomId(8);
          const created = Date.now();
          await env.SENSEE.put("m:" + id, JSON.stringify({ pid: who.pid, from: who.name, to, text, deck, created }), { expirationTtl: TTL_SECONDS });
          const idx = liveIndex((await getJson(env, "idx:" + who.pid)) || []);
          idx.push({ id, to, deck, created, expires: created + MAX_AGE_MS });
          // The index key expires on its own too, so client first names never outlive the newest message.
          await env.SENSEE.put("idx:" + who.pid, JSON.stringify(idx.slice(-MAX_INDEX)), { expirationTtl: TTL_SECONDS });
          return out({ id, expires: created + TTL_SECONDS * 1000 });
        }
        if (request.method === "GET" && !parts[1]) {
          if (!who) return out([]);
          const all = (await getJson(env, "idx:" + who.pid)) || [];
          const idx = liveIndex(all);
          if (idx.length !== all.length) await saveIndex(env, who.pid, idx);
          return out(idx.slice().reverse());
        }
        if (request.method === "DELETE" && parts[1]) {
          const id = parts[1].toLowerCase();
          const m = await getJson(env, "m:" + id);
          if (!m) return out({ error: "not_found" }, 404);
          if (!isAdm && m.pid !== who.pid) return out({ error: "forbidden" }, 403);
          await env.SENSEE.delete("m:" + id);
          const idx = liveIndex((await getJson(env, "idx:" + m.pid)) || []).filter((r) => r.id !== id);
          await saveIndex(env, m.pid, idx);
          return out({ ok: true });
        }
      }
      return out({ error: "not_found" }, 404);
    } catch (e) {
      return out({ error: "server_error" }, 500);
    }
  },
};

const liveIndex = (list) => list.filter((r) => r.expires > Date.now());
async function saveIndex(env, pid, idx) {
  if (!idx.length) await env.SENSEE.delete("idx:" + pid);
  else await env.SENSEE.put("idx:" + pid, JSON.stringify(idx), { expirationTtl: TTL_SECONDS });
}
async function getJson(env, key) { const raw = await env.SENSEE.get(key); try { return raw ? JSON.parse(raw) : null; } catch { return null; } }
async function readJson(request) { try { return await request.json(); } catch { return {}; } }
const clean = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, n);
const today = () => new Date().toISOString().slice(0, 10);
function randomId(n) {
  const bytes = new Uint8Array(n); crypto.getRandomValues(bytes);
  let s = ""; for (const b of bytes) s += ID_CHARS[b % ID_CHARS.length]; return s;
}
async function sha(s) { return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))); }
const hex = (u8) => Array.from(u8, (b) => b.toString(16).padStart(2, "0")).join("");
async function hashSecret(pid, secret) { return hex(await sha(pid + ":" + secret)); }
function sameBytes(a, b) { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0; }
async function isAdmin(token, env) {
  if (!env.ADMIN_TOKEN || !token) return false;
  return sameBytes(await sha(token), await sha(env.ADMIN_TOKEN));
}
async function practitioner(token, env) {
  const dot = token.indexOf(".");
  if (dot < 1) return null;
  const pid = token.slice(0, dot), secret = token.slice(dot + 1);
  const p = await getJson(env, "p:" + pid);
  if (!p || !p.active) return null;
  const given = await sha(pid + ":" + secret);
  const want = new Uint8Array((p.hash.match(/../g) || []).map((h) => parseInt(h, 16)));
  return sameBytes(given, want) ? { pid, name: p.name } : null;
}
