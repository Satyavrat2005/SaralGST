# WhatsApp Integration Plan — SaralGST

> **Purpose of this doc:** A self-contained implementation plan so a fresh Claude
> session (with no prior context) can generate the code. Hand this whole file to
> Claude and say "implement this."

---

## 0. TL;DR (the one decision that matters)

**Slide by Synquic is a dumb pipe. Your Vercel app is the brain.**

- Slide (slide.synquic.com) is a *no-code automation OS for Instagram & WhatsApp*.
  It can receive a WhatsApp message + attachment and send replies, but it
  **cannot** OCR a PDF, validate a GSTIN, check tax math, or decide if an invoice
  is "correct." So **do not** put validation logic inside Slide.
- All validation/decision logic lives in **your Next.js API routes on Vercel**,
  reusing code that already exists in this repo.
- An invoice only reaches the dashboard tab **after** it passes validation. Until
  then it sits in a quarantine status and the vendor is asked (over WhatsApp) to
  fix and resend.

---

## 1. Goal

### Inbound (vendor → us)
A vendor sends an invoice (PDF/image) to our WhatsApp Business number. The system:
1. Receives it via Slide → our webhook.
2. Validates it **on the spot** (OCR → AI extraction → GST validation).
3. If there are discrepancies → **auto-replies on WhatsApp** listing the exact
   problems and asks the vendor to correct & resend. The invoice does **NOT**
   appear in the dashboard tab.
4. When a corrected version passes → it is saved to the database and **now appears
   in the tab**, and we send a "✅ received & validated" confirmation.

### Outbound (us → vendor) — "same structure"
From various places in the app we send simple WhatsApp messages/documents:
- "Please send invoice for period X" (chasing missing invoices)
- "Discrepancy found during reconciliation — please clarify/correct"
- General notifications (validated, reminders, etc.)

These are *simple* sends (a message or a document). The only real engineering is
the inbound validation-gate loop.

---

## 2. Current architecture (what already exists — REUSE IT)

- **Framework:** Next.js 15 (App Router) on Vercel. API routes in `app/api/**/route.ts`
  are the backend (serverless functions).
- **Storage/DB:** Supabase (Storage bucket for files + Postgres tables).
- **Auth:** Clerk.
- **AI:** Gemini (vision + text) for OCR & extraction.

### Existing invoice pipeline — `app/api/invoice/process/route.ts`
This is the reference flow. It already does, in order:
1. `createPurchaseInvoice()` — initial record, status `pending`
2. `uploadInvoiceToStorage(file, invoiceId)` — save file to Supabase Storage
3. `extractInvoiceDataFromImage()` (Gemini vision) with fallback to
   `extractTextFromInvoice()` (OCR) + `extractInvoiceData()` (LLM)
4. `validateInvoiceData(extractedData)` — returns `{ isValid, errors[], warnings[] }`
5. `updatePurchaseInvoice()` — write extracted fields + status (`extracted` if
   valid, else `pending`)
6. `createPurchaseRemark()` — store each validation error as a remark

### Key files/functions to reuse
- `lib/services/purchaseInvoiceService.ts`
  - `uploadInvoiceToStorage`, `createPurchaseInvoice`, `updatePurchaseInvoice`,
    `createPurchaseRemark`, `getPurchaseInvoices(filters)` (supports a `status` filter)
- `lib/services/ocrService.ts` → `extractTextFromInvoice`
- `lib/services/llmExtractionService.ts` → `extractInvoiceData`, `extractInvoiceDataFromImage`
- `lib/services/validationService.ts` → `validateInvoiceData`, `getStateCodeFromGSTIN`
- `app/api/invoice/purchase/route.ts` → GET already accepts a `status` filter
- `app/dashboard/sme/invoices/upload/page.tsx` → the UI (WhatsApp tab already stubbed)

### Scope note
**Single-user / single-tenant for now** (confirmed). Every inbound invoice belongs
to the one account. No org/number→tenant mapping needed yet. Design the WhatsApp
number config as a single set of env vars; leave a TODO for multi-tenant later.

---

## 3. Inbound flow — detailed design

### 3.1 Sequence

```
Vendor sends PDF/image to WhatsApp Business number
        │
        ▼
Slide automation: "on new message with attachment" → HTTP Request
        │  POST https://<app>.vercel.app/api/whatsapp/webhook
        ▼
/api/whatsapp/webhook (NEW)
   1. Verify shared secret (reject if missing/wrong)
   2. Ack fast: respond 200 immediately ("got it, validating…")
   3. Process async (waitUntil / queue):
        a. Download media (fetch media_url) OR read bytes from payload
        b. processInvoiceFile(file, source='whatsapp')  ← shared pipeline
        c. Read validation result
   4a. VALID   → promote status to 'extracted' (shows in tab)
                 → send WhatsApp: "✅ Invoice <no> received & validated"
   4b. INVALID → keep status 'wa_quarantine' (hidden from tab)
                 → send WhatsApp: list exact problems + "please resend"
```

### 3.2 The quarantine gate (how "only correct ones reach the tab" works)

This is **not** a separate system — it's a status + a filtered query.

1. **New status:** `wa_quarantine` (invoice received via WhatsApp, not yet passed).
   - Add it to the `invoice_status` allowed values / type used by
     `PurchaseRegister` in `lib/services/purchaseInvoiceService.ts`.
2. **Hide quarantined from the tab:** the dashboard calls `GET /api/invoice/purchase`,
   which calls `getPurchaseInvoices(filters)`. Ensure the default query **excludes**
   `wa_quarantine` (and any `error`/intake-only states). Either:
   - Add an explicit `status NOT IN ('wa_quarantine')` to `getPurchaseInvoices`, or
   - Have the dashboard pass a status filter for "visible" statuses only.
3. **Promote on success:** when validation passes, update status →
   `extracted` (the existing "visible" state). It now appears in the tab.

### 3.3 What "validation" checks at intake (intrinsic correctness only)

At the moment of receiving a single invoice, we can only check it **intrinsically**
(self-contained). `validateInvoiceData()` already covers most of this — extend if needed:

- Is it readable / a real invoice? (OCR confidence threshold)
- Required fields present: supplier GSTIN, invoice number, invoice date,
  taxable value, tax amounts
- GSTIN **format/checksum** valid
- Tax math consistency: CGST + SGST + IGST add up; total = taxable + taxes
- **Duplicate** detection: same supplier + invoice number already received

> **NOT possible at intake:** "doesn't match GSTR-2B / portal." That is a
> *period-level reconciliation* check done later against portal data — see the
> outbound flow (§4). Keep these two concepts separate.

### 3.4 The correction / resend loop (don't let it run forever)

- A resend arrives as a **new webhook call**. Re-run the pipeline.
- **Correlate** to the previous attempt by `sender_phone + invoice_number`; track an
  `attempt_count` on the record (or a small `whatsapp_intake` table).
- After ~2–3 failed attempts → **escalate**: stop auto-rejecting, set status to
  `needs_review`, surface it in a "Needs Manual Review" view, and reply
  *"Our team will review this manually."* This prevents an infinite loop on a
  genuinely odd-but-valid invoice.

### 3.5 Turning validation errors into a WhatsApp message

`validateInvoiceData()` returns `errors[]` with `{ field, issue_type, message }`.
Map these into a human reply. Example:

```
⚠️ We couldn't accept this invoice:
1. Supplier GSTIN is missing or invalid
2. Tax mismatch: CGST + SGST (₹900) doesn't match taxable value × rate
3. Invoice date not found

Please correct and resend. 🙏
```

**Optional upgrade (recommended, low effort):** make one extra Gemini call that
turns `errors[] + extractedData` into a friendly, specific natural-language
correction message. Same brain you already use, nicer tone.

### 3.6 Platform constraints (must handle)

- **Vercel timeout:** OCR + Gemini takes seconds; long serverless functions get
  killed. So the webhook must **respond 200 fast**, then process in the background
  (`waitUntil()` from `next/server` / Vercel, or a queue like Upstash QStash /
  Inngest). Do NOT block the HTTP response on OCR.
- **WhatsApp 24-hour window:** business-initiated messages (outside 24h of the
  vendor's last message) must be **pre-approved templates**. Replies *within* the
  conversation are free-form. Manage templates in Slide.
- **Security:** the webhook MUST verify a shared secret / signature header set in
  Slide's webhook config — otherwise anyone can POST fake invoices.

---

## 4. Outbound flow — "same structure"

Simple sends from anywhere server-side. One helper, called in a few places.

### 4.1 The helper — `lib/services/whatsappService.ts` (NEW)

```ts
// Pseudocode — fill real endpoint/auth from Slide dev page (see §6)
export async function sendWhatsAppMessage(to: string, template: string, params: Record<string, string>) { ... }
export async function sendWhatsAppDocument(to: string, fileUrl: string, caption?: string) { ... }
```

Two possible patterns depending on what Slide exposes (confirm in §6):
- **(A) Slide has a REST send endpoint** → call it directly from `whatsappService`.
- **(B) Slide only sends from inside its flows** → create a Slide automation with an
  "External Request" trigger, and have `whatsappService` POST to Slide to kick it off.

### 4.2 Where it gets called

- **Request a missing invoice:** from a "chase vendor" action / reconciliation gap
  → `sendWhatsAppMessage(vendorPhone, 'request_invoice', { period })`
- **Reconciliation discrepancy found:** from the reconciliation flow
  (`lib/reconciliation/*`, `app/api/reconciliation/*`) when a mismatch vs GSTR-2B is
  detected → `sendWhatsAppMessage(vendorPhone, 'discrepancy_found', { invoiceNo, detail })`
- **Intake confirmation/rejection:** sent by the inbound webhook (§3).

### 4.3 Templates to register in Slide
- `request_invoice`
- `discrepancy_found`
- `invoice_validated` (confirmation)
- `invoice_rejected` (with reasons) — or send free-form within the 24h window

---

## 5. Data model changes

- **`purchase_register` (existing table):**
  - Allow new status value `wa_quarantine` in the `invoice_status` type/enum used by
    `PurchaseRegister`.
  - Add columns (or a side table — see below) to support the loop:
    - `wa_sender_phone` (text, nullable)
    - `wa_attempt_count` (int, default 0)
  - `source` already supports `'whatsapp'`.
- **Optional side table `whatsapp_intake`** (cleaner than overloading purchase_register):
  - `id`, `sender_phone`, `invoice_number`, `attempt_count`, `last_status`,
    `last_error_summary`, `linked_purchase_id`, timestamps.
  - Use this to correlate resends before promoting into `purchase_register`.
- Migration SQL goes in `migrations/` (repo already keeps SQL there).

---

## 6. Synquic / Slide unknowns to fill before coding the HTTP calls

The Slide developer page (`slide.synquic.com/developers`) is a client-side-rendered
SPA, so it could not be auto-read. Before wiring the actual HTTP calls, collect these
**four** things from that page (or paste them to Claude):

1. **Inbound webhook payload shape** — does it POST a `media_url` (download link) or
   the **raw file bytes** (base64/multipart)? Exact field names (`from`, `file`,
   `mime_type`, etc.).
2. **Inbound webhook auth** — what secret/header/signature can we verify on incoming
   requests?
3. **Outbound send API** — is there a REST endpoint to send a message/document?
   URL + auth (API key?) + request body format. (Decides pattern A vs B in §4.1.)
4. **Templates** — how are templates created/referenced (by name? id?).

Everything else in this plan can be built without these (the validation gate, the
quarantine status, the pipeline refactor, the tab filter). The four items only affect
the thin HTTP layer at the edges.

---

## 7. Environment variables (add to Vercel + `.env.local`)

```
SLIDE_API_BASE_URL=      # Slide/Synquic API base (from dev page)
SLIDE_API_KEY=           # auth for outbound sends
WHATSAPP_WEBHOOK_SECRET= # shared secret to verify inbound webhooks
WHATSAPP_BUSINESS_NUMBER= # our WA number (single-tenant for now)
```

---

## 8. Implementation checklist (file by file)

1. **Refactor pipeline (do first, no Slide deps):**
   - Extract steps 2–9 of `app/api/invoice/process/route.ts` into a reusable
     `processInvoiceFile(file: File, source: string): Promise<{ invoiceId, validation, invoice }>`
     in e.g. `lib/services/invoicePipeline.ts`.
   - Make the manual-upload route call the new function (no behavior change).
2. **Add quarantine status + tab filter:**
   - Add `wa_quarantine` to the status type in `purchaseInvoiceService.ts`.
   - Make `getPurchaseInvoices()` exclude `wa_quarantine` by default (so the tab in
     `app/dashboard/sme/invoices/upload/page.tsx` never shows unvalidated WA invoices).
3. **Inbound webhook — `app/api/whatsapp/webhook/route.ts` (NEW):**
   - Verify `WHATSAPP_WEBHOOK_SECRET`.
   - Respond 200 fast; process via `waitUntil()`/queue.
   - Download media → `processInvoiceFile(file, 'whatsapp')` → branch on
     `validation.isValid`:
     - valid → promote to `extracted` + send confirmation
     - invalid → keep `wa_quarantine` + send error reply (+ resend loop / escalation)
4. **Outbound helper — `lib/services/whatsappService.ts` (NEW):**
   - `sendWhatsAppMessage`, `sendWhatsAppDocument` (pattern A or B per §6).
5. **Wire outbound calls** into reconciliation (`app/api/reconciliation/*`,
   `lib/reconciliation/*`) for `discrepancy_found`, and add a "request invoice" action.
6. **DB migration** in `migrations/` for new status + columns / `whatsapp_intake` table.
7. **(Optional) Gemini-composed correction message** for nicer WhatsApp replies.
8. **Update the WhatsApp tab UI** in `app/dashboard/sme/invoices/upload/page.tsx`
   (currently mock data) to show the real connected number + pending/quarantine queue.

---

## 9. Quick reference — the mental model

| Layer | Responsibility |
|-------|----------------|
| **Slide (Synquic)** | Transport only: receive WhatsApp file → POST our webhook; send our replies |
| **`/api/whatsapp/webhook`** | Verify, ack fast, run pipeline, decide valid/invalid, reply |
| **`processInvoiceFile()`** | Shared brain: OCR → Gemini extract → validate → store |
| **`wa_quarantine` status** | The gate: hidden from tab until it passes |
| **`whatsappService`** | Outbound sends (request invoice, discrepancy, confirmations) |
| **Reconciliation flow** | Period-level discrepancies → trigger outbound messages |

> Keep the original goal (only correct invoices reach the tab) — but the mechanism
> lives in **our code**, not in Slide. Slide just relays the file and relays our reply.
