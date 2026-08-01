# TempMail

Self-hosted disposable email service: a catch-all SMTP server accepts mail for
any address at your domain, messages are stored in MongoDB with a 10-day TTL,
and a React inbox lets anyone who knows the address view it (no auth — same
model as tempmail.plus).

## Components

- `packages/shared` — Mongoose schema + domain/address validation shared by both backend services.
- `packages/smtp-receiver` — catch-all SMTP server (`smtp-server` + `mailparser`), receive-only, never relays.
- `packages/api-server` — Express REST API + SSE for the frontend.
- `packages/web` — React (Vite) inbox UI.

## Local development

```bash
npm install

# .env for local dev (create at repo root, or export these directly)
cp .env.example .env
# set MAIL_DOMAIN=test.local for local testing (no real domain needed yet)
```

Run each service in its own terminal:

```bash
npm run dev:smtp   # SMTP receiver on SMTP_PORT (default 2525)
npm run dev:api    # API server on API_PORT (default 3001)
npm run dev:web    # Vite dev server, proxies /api -> localhost:3001
```

You need a local MongoDB running (`mongod` or `docker run -p 27017:27017 mongo:7`).

Open the Vite dev URL, copy the generated address, then in another terminal:

```bash
MAIL_DOMAIN=test.local scripts/test-smtp-local.sh
```

This sends a test email via `swaks` (`brew install swaks`) directly to the
receiver on port 2525 and also verifies the anti-relay rejection path. Watch
the inbox update live via SSE.

### Security tests to run manually

- Send an email with `<script>alert(1)</script>` and `<img src=x onerror=alert(1)>`
  in the HTML body; open it in the UI and confirm nothing executes (DOMPurify +
  sandboxed iframe in `MessageViewer.jsx`).
- Call `GET /api/messages/:id?address=` with the *wrong* address for a real
  message id — should 404, not return the message (ownership check in
  `messageService.js`).

## Production deployment

1. **Provision a VPS** and verify it allows **inbound** port 25 *before*
   committing to it — this is separate from the common outbound-port-25
   blocking most clouds apply to prevent spam sending. Test with
   `nc -l 25` on the VPS and `telnet <vps-ip> 25` from another network.
   DigitalOcean/Hetzner/Linode/OVH/Vultr are typically friendlier for this
   than AWS/GCP/Azure, but verify per account.

2. **Point DNS at the VPS** — see the Namecheap section below.

3. **Deploy**:
   ```bash
   cp .env.example .env   # fill in MAIL_DOMAIN=yourdomain.com and other values
   docker compose up -d --build
   ```
   This starts `mongo`, `smtp-receiver` (host port 25), `api-server` (internal
   only), and `nginx` (host ports 80/443, serves the React build and proxies
   `/api`).

4. **TLS for the web app** (not for SMTP): once DNS resolves and port 80 is
   reachable, issue a certificate with certbot's webroot method against the
   running `nginx` container, then update `nginx/default.conf` to add a
   `listen 443 ssl` server block pointing at the issued cert/key paths, and
   rebuild. (Not pre-wired into `docker-compose.yml` because the cert must
   exist before nginx can reference it — chicken-and-egg on first run.)

5. **Verify end-to-end** with a real external sender (e.g. Gmail) to a test
   address before relying on it, since real-world mail servers behave
   slightly differently from `swaks` in protocol edge cases.

## Live deployment (Vultr, 149.28.137.52)

Deployed natively (no Docker) on the existing Vultr instance, alongside the
pre-existing `polyusvault.com` app, because that box has no Docker installed
and ports 80/443 were already in use by nginx there.

- **MongoDB Atlas** (`cluster0.oamuvrz.mongodb.net`) is used for storage —
  not a local database. A local MongoDB 8.0 was initially installed on the
  VPS for this, but has since been **stopped and disabled**
  (`systemctl disable mongod`) now that both services point at Atlas, to
  free up RAM on the 1.9GB box. There is no Docker anywhere in this
  deployment.
- Code lives at `/var/www/tempmail` (synced from this repo).
- `tempmail-smtp` and `tempmail-api` run as PM2 processes
  (`/var/www/tempmail/ecosystem.config.cjs` — **not** committed to this repo,
  since it holds the real Atlas connection string; `chmod 600` on the
  server), same pattern as the existing `backend`/`polyus-backend` apps.
  PM2's systemd startup hook (`pm2-root.service`) was already present from
  the existing apps; `pm2 save` was re-run so the two new processes are
  included in what gets restored on reboot.
- nginx got one **new** site file, `/etc/nginx/sites-available/mail.digiaccess.shop`
  (symlinked into `sites-enabled`, then upgraded to HTTPS via
  `certbot --nginx -d mail.digiaccess.shop`), serving the React build from
  `/var/www/tempmail/packages/web/dist` and reverse-proxying `/api/*` to
  `127.0.0.1:3001` — the existing `polyusvault.com`/`api.polyusvault.com`
  site files were not touched.
- `ufw allow 25/tcp` was added; 22/80/443 rules were left as-is.
- `packages/api-server/src/app.js` sets `app.set("trust proxy", 1)` — required
  once traffic started coming through nginx, otherwise `express-rate-limit`
  either throws `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` or keys every request
  off nginx's own IP instead of the real client.
- Verified end-to-end multiple times, including from an external network
  (not just loopback) and via the real `mail.digiaccess.shop` hostname over
  HTTPS once DNS propagated — **Vultr does not block inbound port 25** on
  this instance, no support ticket was needed.

Live at **https://mail.digiaccess.shop**.

## Namecheap DNS setup — digiaccess.shop (subdomain `mail`)

Using a dedicated subdomain, `mail.digiaccess.shop`, as the tempmail domain
(`MAIL_DOMAIN=mail.digiaccess.shop`) instead of the bare root domain. This
keeps it fully isolated from anything else already running on
`digiaccess.shop` (website, any existing email) — none of the records below
touch or override root-domain (`@`) records. Addresses will look like
`randomname@mail.digiaccess.shop`. The VPS (149.28.137.52) is already
deployed and tested (see above) — DNS is the only remaining step. Use Host
`mail` for every record below, **not** `@` — `@` is the root domain and
already has other records on it.

1. Namecheap → **Domain List** → **Manage** on `digiaccess.shop` →
   **Advanced DNS** tab (only available if the domain uses Namecheap's own
   nameservers — BasicDNS/PremiumDNS/FreeDNS).
2. Add these host records (everything else on the domain stays untouched):

   | Type | Host          | Value                   | Priority | TTL       |
   |------|---------------|--------------------------|----------|-----------|
   | A    | `mail`        | `149.28.137.52`          | —        | Automatic |
   | MX   | `mail`        | `mail.digiaccess.shop.`  | `10`     | Automatic |
   | TXT  | `mail`        | `v=spf1 -all`            | —        | Automatic |
   | TXT  | `_dmarc.mail` | `v=DMARC1; p=reject`     | —        | Automatic |

   Notes:
   - The **A** record makes `mail.digiaccess.shop` resolve to your VPS.
   - The **MX** record's Host is also `mail` (the mailbox domain receiving
     `@mail.digiaccess.shop` mail); its Value points at that same hostname,
     which is valid since the A record above gives it an IP. If Namecheap's
     UI rejects the value without a trailing dot, add one
     (`mail.digiaccess.shop.`).
   - SPF/TXT and DMARC are optional anti-spoofing hardening, not required
     for mail to be received — only add DMARC alongside SPF, not alone.
   - `<VPS_PUBLIC_IP>` is a placeholder until a VPS is provisioned — verify
     it allows **inbound** port 25 (see step 1 above) before pointing this
     record at it.
3. Save. Propagation is usually fast (minutes, up to ~30 min–a few hours).
   Verify before relying on it:
   ```bash
   dig A mail.digiaccess.shop
   dig MX mail.digiaccess.shop
   ```
4. Set `MAIL_DOMAIN=mail.digiaccess.shop` in `.env` for deployment.
5. Test with `swaks`/a real external sender against `mail.digiaccess.shop`
   once DNS resolves, before treating it as production-ready.

## Security notes

- The SMTP receiver has no code path that sends or forwards mail at all —
  the anti-relay boundary is the strict domain check in `onRcptTo`
  (`packages/smtp-receiver/src/server.js`).
- There is no authentication anywhere in this system by design (matches how
  tempmail.plus works) — knowledge of the address is the only access
  control. All list/get/delete endpoints check that a message's stored `to`
  matches the caller-supplied address, and all endpoints are rate-limited,
  to make guessing/enumerating other people's addresses impractical rather
  than trivial.
- Email HTML is untrusted input and is sanitized (DOMPurify) and rendered in
  a sandboxed iframe before display — never rendered directly.
# Temp-mail-creating-server
