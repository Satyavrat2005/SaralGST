# OpenWA setup for SaralGST

SaralGST receives invoices via **OpenWA** (self-hosted at `http://localhost:2785` by default) and replies with validation results on WhatsApp.

## Prerequisites

1. OpenWA running (Docker or local) with a connected session (QR scanned).
2. API key from OpenWA dashboard.
3. SaralGST env vars (`.env.local`):

```env
OPENWA_BASE_URL=http://localhost:2785
OPENWA_API_KEY=owa_your_key_here
OPENWA_SESSION_ID=default

WHATSAPP_WEBHOOK_SECRET=your-shared-secret
OPENWA_WEBHOOK_SECRET=your-hmac-secret

BUSINESS_GSTIN=22AAAAA0000A1Z5
WHATSAPP_BUSINESS_NUMBER=+919876543210
GEMINI_API_KEY=...
```

4. Run Supabase migrations:
   - `migrations/database_migration_whatsapp_intake.sql` (purchase WhatsApp, if not applied)
   - `migrations/database_migration_openwa_sales_whatsapp.sql` (sales + pending media)

## Register webhook in OpenWA

OpenWA must reach your SaralGST app over **HTTPS** (use ngrok or Cloudflare Tunnel for local dev).

**Critical:** The webhook URL must be the **full API path**, not the ngrok homepage root.

| Wrong | Right |
|-------|-------|
| `https://xxxx.ngrok-free.app/` | `https://xxxx.ngrok-free.app/api/whatsapp/webhook?secret=URL_ENCODED_SECRET` |

If OpenWA only posts to `/`, SaralGST never runs invoice processing (you will see `POST /` in ngrok, not `POST /api/whatsapp/webhook`).

URL-encode `WHATSAPP_WEBHOOK_SECRET` if it contains `+` or `/` (PowerShell: `[uri]::EscapeDataString($secret)`).

```bash
# Example: public URL after tunnel
PUBLIC_URL=https://abc123.ngrok-free.app
SECRET=your-shared-secret
HMAC_SECRET=your-hmac-secret
SESSION_ID=default
API_KEY=owa_...

curl -X POST "http://localhost:2785/api/sessions/${SESSION_ID}/webhooks" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"${PUBLIC_URL}/api/whatsapp/webhook?secret=${SECRET}\",
    \"events\": [\"message.received\"],
    \"secret\": \"${HMAC_SECRET}\"
  }"
```

Test delivery:

```bash
curl -X POST "http://localhost:2785/api/sessions/${SESSION_ID}/webhooks/<webhookId>/test" \
  -H "X-API-Key: ${API_KEY}"
```

Swagger UI: [http://localhost:2785/api/docs](http://localhost:2785/api/docs)

## Inbound flow

1. User sends PDF/image to your WhatsApp number.
2. OpenWA POSTs `message.received` to `/api/whatsapp/webhook`.
3. SaralGST validates secret/HMAC, processes in background, runs purchase or sales pipeline.
4. User receives WhatsApp text: success, errors, or “Reply PURCHASE or SALES”.

### Routing purchase vs sales

1. Caption/body keywords: `purchase`, `buy`, `sales`, `sell`.
2. Else compare extracted GSTINs to `BUSINESS_GSTIN`.
3. Else ask user to reply PURCHASE or SALES (pending media stored 24h).

## Manual upload

Dashboard upload tabs are unchanged — WhatsApp is an additional channel.

## Troubleshooting

| Issue | Check |
|-------|--------|
| No webhook hits | Tunnel URL, webhook URL includes `?secret=`, OpenWA session connected |
| 401 Unauthorized | `WHATSAPP_WEBHOOK_SECRET` and `OPENWA_WEBHOOK_SECRET` match registration |
| Sends skipped | `OPENWA_*` env vars, session id, API key |
| Wrong register | Set `BUSINESS_GSTIN`; use caption keywords |
| DB errors | Run both SQL migrations on Supabase |

## Unofficial API notice

OpenWA uses `whatsapp-web.js`. Using unofficial WhatsApp automation may violate WhatsApp Terms of Service; use for internal/demo at your own risk.
