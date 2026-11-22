// Sensee messages: practitioner accounts + short-lived personal messages for clients.
//
// Public:        GET    /m/:id                      -> { text, from, to, deck }
// Practitioner:  POST   /messages                   -> { id }            (Authorization: Bearer <pid.secret>)
//                GET    /messages                   -> [{ id, to, deck, created, expires }]
//                DELETE /messages/:id
//                POST   /draft                      { note, to? } -> { drafts: [3 strings] }   (needs the Workers AI binding "AI")
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
const REACTIONS = ["helpful", "tried", "help"];   // fixed set: no free text is ever accepted from clients
const AI_DAILY_LIMIT = 20;                   // drafts per practitioner per day
const AI_MODEL = "@cf/meta/llama-3.2-3b-instruct";   // small model on Cloudflare Workers AI
const AI_SYSTEM = [
  "You help a health or movement practitioner (kinesiologist, physiologist, chiropractor and similar) write a short, warm text message to one of their clients.",
  "Write exactly 3 different versions of the message, each 1 to 3 sentences and under 300 characters.",
  "Use plain, friendly language in the same language as the practitioner's note. Sound human, not corporate. No emojis unless the note uses them. No hashtags, no links.",
  "Only use facts that appear in the note. Never give medical advice, diagnose, name exercises or doses, promise results, or comment on injuries or pain beyond what the note says.",
  "Never start with a greeting such as Hi, Hello or Hey, and do not start with the client's name: the page already greets the client before the message. Start straight with the message itself. Do not sign off with a name.",
  "Output only the 3 versions, separated by a line containing only ---. No numbering, no quotes, no explanations.",
].join(" ");
// ---- extra cards: suggested by the small model, approved one by one by the admin, then served to the site
const CARD_LABELS = { everyday: ["Do", "Notice", "Thank"], movement: ["Move", "Mindset", "Habit", "Reflect"], nourish: ["Add", "Sip", "Savour", "Prep", "Feel"], calm: ["Breathe", "Ground", "Soften", "Reset"] };
const CARD_EXAMPLES = {
  everyday: ["Do | Open a window for one minute and let the outside in.", "Notice | Listen for the farthest sound you can hear, then the closest.", "Thank | Name someone who made your week easier. Tell them today."],
  movement: ["Move | Take a two-minute walk, even if it is just around the room.", "Mindset | Progress is built from small, ordinary days. Today is one of them.", "Habit | Lay out your workout clothes tonight so tomorrow's start is easier.", "Reflect | What felt a little easier this week than last week?"],
  nourish: ["Add | Add one extra vegetable to your next meal, any kind, any way you like it.", "Sip | Pour a full glass of water and drink it slowly.", "Savour | Take your first three bites slowly and notice the taste and texture.", "Prep | Fill a water bottle tonight and leave it where you will see it in the morning.", "Feel | An hour after eating, notice your energy and mood. No judging, just noticing."],
  calm: ["Breathe | Breathe in for four, out for six. Do it three times.", "Ground | Press your feet into the floor and notice the support under you.", "Soften | Take a sip of something warm and notice it all the way down.", "Reset | Look away from every screen for one minute."],
};
const CARDS_PER_DECK = 60, SUGGEST_DAILY_LIMIT = 30;
const CARD_BLOCK = /\b(diagnos\w*|cure[sd]?|heal\w*|treat\w*|injur\w*|pain\w*|medic\w*|doctor\w*|therap\w*|prescri\w*|dose\w*|symptom\w*|disease\w*|cancer|surgery|rehab\w*|guarantee\w*)\b|https?:|www\.|@/i;
// Food cards: only gentle, additive, mindful ideas. Nothing that counts, restricts, compares or labels foods.
const NOURISH_BLOCK = /\b(calor\w*|diet\w*|weigh\w*|fat|fats|lose|loss|slim\w*|detox\w*|cleans\w*|fast|fasting|purg\w*|skip\w*|binge\w*|junk|cheat\w*|guilt\w*|restrict\w*|macros?|keto|carbs?|sugar|sugary|clean eating|healthy|unhealthy|bad|good for you|avoid|cut out|eliminate|portion\w*|grams?|ounces?|supplement\w*|vitamin\w*|burn\w*|earn\w*|deserve\w*)\b/i;
const normCard = (t) => t.toLowerCase().replace(/[^a-z0-9 ]+/g, "").replace(/\s+/g, " ").trim();
function validCard(deck, label, text) {
  if (!CARD_LABELS[deck] || !CARD_LABELS[deck].includes(label)) return false;
  if (text.length < 15 || text.length > 160) return false;
  if (deck === "nourish" && NOURISH_BLOCK.test(text)) return false;
  return !CARD_BLOCK.test(text);
}
async function aiText(env, system, user, maxTokens, temperature) {
  const res = await env.AI.run(env.AI_MODEL || AI_MODEL, { messages: [{ role: "system", content: system }, { role: "user", content: user }], max_tokens: maxTokens, temperature });
  return String((res && (res.response || (res.choices && res.choices[0] && res.choices[0].message && res.choices[0].message.content))) || "");
}
const DECKS = ["everyday", "movement", "calm", "nourish"];
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
        return out({ text: m.text, from: m.from, to: m.to, deck: m.deck, react: m.react || [] });
      }

      // ---- public: approved extra cards, merged into the decks by the site
      if (request.method === "GET" && parts[0] === "cards" && !parts[1]) {
        return out((await getJson(env, "cards")) || {}, 200, { "Cache-Control": "public, max-age=300" });
      }

      // ---- public: client taps a one-tap reaction (no account, no free text)
      if (request.method === "POST" && parts[0] === "m" && parts[1] && parts[2] === "react") {
        const id = parts[1].toLowerCase(), key = "m:" + id;
        const body = await readJson(request);
        if (!REACTIONS.includes(body.r)) return out({ error: "bad_reaction" }, 400);
        const m = await getJson(env, key);
        if (!m || Date.now() - m.created > MAX_AGE_MS) return out({ error: "not_found" }, 404);
        const have = m.react || [];
        if (!have.includes(body.r)) {
          m.react = have.concat(body.r);
          const left = Math.max(60, Math.ceil((m.created + MAX_AGE_MS - Date.now()) / 1000));   // keep the original expiry
          await env.SENSEE.put(key, JSON.stringify(m), { expirationTtl: left });
          const idx = liveIndex((await getJson(env, "idx:" + m.pid)) || []);
          const row = idx.find((r) => r.id === id);
          if (row) { row.react = m.react; await env.SENSEE.put("idx:" + m.pid, JSON.stringify(idx), { expirationTtl: left }); }
        }
        return out({ ok: true, react: m.react || have });
      }

      // ---- practitioner: draft help from a small language model (Cloudflare Workers AI)
      if (request.method === "POST" && parts[0] === "draft" && !parts[1]) {
        const who = await practitioner(bearer, env);
        if (!who) return out({ error: "unauthorized" }, 401);
        if (!env.AI) return out({ error: "ai_unavailable" }, 503);
        const body = await readJson(request);
        const note = clean(body.note, 300), to = clean(body.to, 40);
        if (note.length < 3) return out({ error: "note_required" }, 400);
        const key = "ai:" + who.pid + ":" + today();
        const used = parseInt((await env.SENSEE.get(key)) || "0", 10);
        if (used >= AI_DAILY_LIMIT) return out({ error: "daily_limit" }, 429);
        await env.SENSEE.put(key, String(used + 1), { expirationTtl: 172800 });
        let raw = "";
        try {
          const res = await env.AI.run(env.AI_MODEL || AI_MODEL, {
            messages: [
              { role: "system", content: AI_SYSTEM },
              { role: "user", content: (to ? "Client's first name: " + to + "\n" : "") + "Practitioner's note: " + note },
            ],
            max_tokens: 400,
            temperature: 0.7,
          });
          raw = String((res && (res.response || (res.choices && res.choices[0] && res.choices[0].message && res.choices[0].message.content))) || "");
        } catch (e) {
          console.error("draft model error:", e && e.message);
          return out({ error: "ai_failed", detail: clean(e && e.message, 160) }, 502);
        }
        // The model is only a drafting helper: keep plain text, drop links, cap length, never trust its format.
        const drafts = raw.split(/\n\s*-{3,}\s*\n|\n{2,}/).map((t) => clean(t.replace(/^\s*(?:\d+[.)]|[-*])\s*/, "").replace(/^["\u201c]+|["\u201d]+$/g, ""), 300))
          .map(stripGreeting).filter((t) => t.length >= 8 && !/https?:|www\./i.test(t)).slice(0, 3);
        if (!drafts.length) { console.error("draft: unusable model output"); return out({ error: "ai_failed", detail: "unusable output" }, 502); }
        return out({ drafts, left: AI_DAILY_LIMIT - used - 1 });
      }

      // ---- admin
      if (parts[0] === "admin") {
        if (!(await isAdmin(bearer, env))) return out({ error: "unauthorized" }, 401);
        if (parts[1] === "cards") {
          const pool = (await getJson(env, "cards")) || {};
          if (request.method === "GET" && !parts[2]) return out(pool);
          if (request.method === "POST" && parts[2] === "suggest") {
            if (!env.AI) return out({ error: "ai_unavailable" }, 503);
            const body = await readJson(request);
            const deck = body.deck;
            if (!CARD_LABELS[deck]) return out({ error: "bad_deck" }, 400);
            const key = "ai:cards:" + today();
            const used = parseInt((await env.SENSEE.get(key)) || "0", 10);
            if (used >= SUGGEST_DAILY_LIMIT) return out({ error: "daily_limit" }, 429);
            await env.SENSEE.put(key, String(used + 1), { expirationTtl: 172800 });
            const labels = CARD_LABELS[deck];
            const system = [
              "You write short cards for Sensee, a gentle app that gives people one small thing to try in under a minute.",
              "Write exactly 8 new cards. Each card is one line in the form: Label | text",
              "Label must be one of: " + labels.join(", ") + ". Mix the labels.",
              "Text is one or two plain sentences, 15 to 140 characters, friendly and concrete, something a person can do right now with no equipment.",
              "Never give medical advice, mention injuries, pain, conditions or treatment, make promises about results, or include links, names or statistics.",
              (deck === "nourish" ? "These are food and drink cards. Frame everything as adding, enjoying, noticing and preparing. Never count, measure, weigh, restrict, compare or label foods as good or bad, never mention calories, diets, weight, fasting, portions or supplements, and never suggest skipping or cutting anything. " : "") +
              "Do not repeat the examples. Output only the 8 lines. No numbering, no extra words.",
              "Examples of the style:\n" + CARD_EXAMPLES[deck].join("\n"),
            ].join(" ");
            let raw = "";
            try { raw = await aiText(env, system, "Write 8 new cards for the " + deck + " deck.", 700, 0.9); }
            catch (e) { console.error("cards model error:", e && e.message); return out({ error: "ai_failed", detail: clean(e && e.message, 160) }, 502); }
            const seen = new Set((pool[deck] || []).map((c) => normCard(c[1])).concat(CARD_EXAMPLES[deck].map((e) => normCard(e.split("|")[1] || ""))));
            const found = [];
            for (const line of raw.split("\n")) {
              const m = /^\s*(?:\d+[.)]\s*|[-*]\s*)?\**\s*([A-Za-z]+)\s*\**\s*[|:]\s*(.+?)\s*$/.exec(line);
              if (!m) continue;
              const label = labels.find((l) => l.toLowerCase() === m[1].toLowerCase());
              const text = clean(m[2].replace(/^["\u201c]+|["\u201d]+$/g, ""), 160);
              if (!label || !validCard(deck, label, text) || seen.has(normCard(text))) continue;
              seen.add(normCard(text)); found.push([label, text]);
            }
            if (!found.length) return out({ error: "ai_failed", detail: "no usable cards" }, 502);
            return out({ deck, cards: found.slice(0, 8) });
          }
          if (request.method === "POST" && !parts[2]) {
            const body = await readJson(request);
            const deck = body.deck, label = clean(body.label, 20), text = clean(body.text, 160);
            if (!validCard(deck, label, text)) return out({ error: "invalid_card" }, 400);
            const list = pool[deck] || [];
            if (list.some((c) => normCard(c[1]) === normCard(text))) return out({ error: "duplicate" }, 409);
            if (list.length >= CARDS_PER_DECK) return out({ error: "deck_full" }, 409);
            pool[deck] = list.concat([[label, text]]);
            await env.SENSEE.put("cards", JSON.stringify(pool));
            return out(pool);
          }
          if (request.method === "DELETE" && parts[2] && parts[3] !== undefined) {
            const list = pool[parts[2]], i = parseInt(parts[3], 10);
            if (!Array.isArray(list) || !(i >= 0 && i < list.length)) return out({ error: "not_found" }, 404);
            list.splice(i, 1);
            await env.SENSEE.put("cards", JSON.stringify(pool));
            return out(pool);
          }
          return out({ error: "not_found" }, 404);
        }
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
      console.error("server error:", e && e.message);
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
// The page already says "Hi <name>." above the message, so drafts must not open with their own greeting.
const stripGreeting = (t) => {
  const s = t.replace(/^\s*(?:hi|hello|hey|dear|good (?:morning|afternoon|evening))\b[^.!?,:;\n\u2014-]{0,30}[,.!:;\u2014-]+\s*/i, "");
  return s.length >= 8 ? s.charAt(0).toUpperCase() + s.slice(1) : t;
};
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
