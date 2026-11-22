# Sensee messages (Cloudflare Worker)

Stores practitioner accounts and short-lived personal messages so links stay short
(`sensee.ca/#m=k7x2qa9b`) and the message is not in the link.

## Deploy (on your own computer)
1. `cd worker`
2. `npx wrangler login` (opens a browser; no key is pasted anywhere)
3. `npx wrangler kv namespace create SENSEE` and paste the printed id into `wrangler.toml`
4. `npx wrangler secret put ADMIN_TOKEN` (a long random string; this is your admin password)
5. `npx wrangler deploy` and note the URL it prints (https://sensee-messages.<you>.workers.dev)
6. Put that URL in `api-config.js` at the repo root (or send it to Claude to do it). Until then the site keeps using message-in-link.

## Accounts
Open `/admin.html` on the site, enter the admin token, and create a practitioner. The access code is shown once.
Give each practitioner their code; they use it on `/share.html`. You can disable or delete an account at any time.

## Privacy and limits
- Messages are plain text (400 chars), expire after 30 days, and can be deleted early by the practitioner.
- The Worker never logs message text. Cloudflare KV is global storage: check this suits your practice's privacy obligations.
- 50 messages per practitioner per day. Add a Cloudflare rate-limiting rule for extra protection on `GET /m/*`.
- Access codes are stored only as hashes.


## Draft with Sensee (small language model)

The share page has a "Draft with Sensee" button. It calls `POST /draft`, which runs a small model
(`@cf/meta/llama-3.2-3b-instruct`) on Cloudflare Workers AI and returns three short drafts for the practitioner to edit.

- **Dashboard:** Worker -> Settings -> Bindings -> Add -> **Workers AI**, variable name exactly `AI`, then Deploy.
- **Wrangler:** the `[ai]` block in `wrangler.toml` does this.
- Practitioner access code required. 20 drafts per practitioner per day. Output is plain text only; links are dropped.
- Only the practitioner's rough note (and the client's first name if typed) is sent to the model. Nothing is stored.
- Without the binding the route answers 503 and the button says drafting isn't switched on. Everything else keeps working.
- To try another model, set a plain-text variable `AI_MODEL` (for example `@cf/meta/llama-3.1-8b-instruct-fp8`).

## Extra cards (small model + admin approval)

`admin.html` has a **Cards** section. Pick a deck, tap **Suggest cards**, and the small model proposes 8 candidates.
Nothing reaches clients until you tap **Keep**. Kept cards are stored in KV (key `cards`) and served at `GET /cards`;
the site merges them into the built-in decks when it loads (if the Worker is unreachable, the built-in cards still work).

- Labels are fixed per deck (Everyday: Do/Notice/Thank, Movement: Move/Mindset/Habit/Reflect, Calm: Breathe/Ground/Soften/Reset, Nourish: Add/Sip/Savour/Prep/Feel). "Fact" cards are never generated.
- Automatic checks reject links, duplicates, wrong length, and medical or promise-style wording before you even see a candidate.
- Up to 60 extra cards per deck. 30 suggestion requests per day. Remove a card any time from the admin page.
- Needs the same `AI` binding as "Draft with Sensee". Admin token required for everything except reading `/cards`.
- Nourish (food and drink) suggestions get extra filters: anything about calories, diets, weight, fasting, portions, supplements, cutting out foods, or calling foods good/bad is rejected automatically. Keep reviewing each one yourself.

## Cook cards (recipes) and writing your own cards

- A **Cook** card has a one-line idea plus a recipe: `{ time, items (2-8), steps (1-6) }`. The site shows a **See recipe** button on it, and **Copy to send** includes the recipe and an allergy reminder.
- **Suggest recipes** (Nourish deck, admin page): the small model writes 3 simple recipes. Rejected automatically: meat, poultry, fish, raw or runny eggs, links, calories, diets, weight, portions, health claims, and anything too thin. You still keep or discard each one.
- **Write your own** (admin page): add any card, including recipes, by hand. Only the structure and links are checked; the wording is up to you. Handwritten Everyday cards may use the "Fact" kind.
- Needs the Worker code from this version. Cards are stored in the same `cards` KV key, now with an optional third item (the recipe).
