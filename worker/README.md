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
