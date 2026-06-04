# WhatsApp Invoice Intake — Evolution API Setup

This wires WhatsApp into the existing invoice pipeline. When a vendor sends a
PDF/JPG/PNG to your WhatsApp number, the system automatically:

1. **Receives** the file (Evolution → our webhook).
2. **Extracts** GST fields (Gemini Vision + OCR fallback).
3. **Validates** for discrepancies (GSTIN format, mandatory fields, tax math,
   dates, duplicates).
4. **If valid** → saves to `purchase_register` (status `extracted`, visible in
   the dashboard) and replies "✅ received & validated".
5. **If it has discrepancies** → keeps it hidden in `wa_quarantine` and immediately
   replies to the vendor (AI-written) listing exactly what to fix and asking them
   to resend. After 3 failed attempts it escalates to `needs_review` for a human.

Everything except the provider layer was already built; this just talks to
Evolution API instead of the old provider.

---

## 1. Prerequisites

- A running **Evolution API** server (v2) with a **connected instance**
  (a WhatsApp number paired via QR). See https://github.com/EvolutionAPI/evolution-api
- The DB migration applied (adds `wa_sender_phone`, `wa_attempt_count`,
  `wa_quarantine` status, and the `whatsapp_intake` table):
  `migrations/database_migration_whatsapp_intake.sql`

## 2. Environment variables (`.env`)

```env
EVOLUTION_API_URL=https://your-evolution-server.com   # no trailing slash
EVOLUTION_API_KEY=your-evolution-apikey
EVOLUTION_INSTANCE=your-instance-name
WHATSAPP_WEBHOOK_SECRET=<long-random-string>          # already set
WHATSAPP_BUSINESS_NUMBER=918591159889                 # display only
```

## 3. Register the webhook

Once the env vars are set and the server is running on a **publicly reachable**
URL, register the webhook on your Evolution instance:

```bash
curl -X POST https://your-domain.com/api/whatsapp/setup \
  -H "Content-Type: application/json" \
  -d '{ "publicUrl": "https://your-domain.com" }'
```

This calls Evolution's `webhook/set/{instance}` for you with:
- URL: `https://your-domain.com/api/whatsapp/webhook?secret=<WHATSAPP_WEBHOOK_SECRET>`
- `base64: true` (Evolution inlines media so we usually skip a second fetch)
- events: `MESSAGES_UPSERT`

Check status anytime:

```bash
curl https://your-domain.com/api/whatsapp/setup     # connectionState + webhook config
```

### Local testing
Evolution can't reach `localhost`. Expose your dev server with a tunnel
(`ngrok http 3000` / `cloudflared tunnel`) and pass that as `publicUrl`.

## 4. Test the flow

1. From any phone, send a **PDF invoice** to your WhatsApp number.
2. A clean invoice → you get "✅ Invoice … received & validated", and it appears
   in **Dashboard → Invoices → Upload → WhatsApp** (and the purchase register).
3. A bad invoice (wrong GSTIN, missing fields, totals don't add up) → you get a
   correction message listing the problems; it shows under **"Held for Correction
   (WhatsApp)"** as *Awaiting Resend*. After 3 tries it becomes *Needs Review*.

---

## Files

| Concern | File |
|---|---|
| Outbound send + media download (Evolution) | `lib/services/whatsappService.ts` |
| Inbound webhook (parse `messages.upsert`, run pipeline, reply) | `app/api/whatsapp/webhook/route.ts` |
| One-shot webhook registration + status | `app/api/whatsapp/setup/route.ts` |
| Dashboard config (connected badge) | `app/api/whatsapp/config/route.ts` |
| Manual outbound (chase invoice / discrepancy) | `app/api/whatsapp/send/route.ts` |
| Extraction + validation + DB save (unchanged) | `lib/services/invoicePipeline.ts`, `validationService.ts`, `purchaseInvoiceService.ts` |

## Notes / gotchas
- **Numbers** are normalised to digits-only with country code (`919876543210`).
  Inbound JIDs already include the country code; we reply to the exact sender.
- **Auth**: the webhook accepts `?secret=` (recommended), an `x-webhook-secret`
  header, or `apikey: <EVOLUTION_API_KEY>` as a fallback.
- **Groups & own messages** are ignored — only 1:1 inbound media is processed.
- If `base64:true` isn't honoured by your Evolution version, the worker falls
  back to `POST /chat/getBase64FromMediaMessage/{instance}` to fetch the bytes.
- Sends **no-op gracefully** (logged, skipped) when env vars are missing, so dev
  flows don't crash.
