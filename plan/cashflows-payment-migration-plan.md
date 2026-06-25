# Stripe to Cashflows Payment Gateway Migration Plan

## Assumption

Use **Cashflows Hosted Checkout Pages via Cashflows Gateway API**, replacing Stripe Checkout. Customers leave the site, pay on Cashflows hosted UI, then return. The application must **not** handle or store card data directly.

---

## 1. Current Stripe touchpoints to replace

Primary files:

- `actions/purchases.ts`
  - Creates Stripe Checkout Session.
  - Returns Stripe checkout URL.
- `lib/stripe.ts`
  - Stripe SDK setup.
- `lib/purchase-processor.ts`
  - Retrieves Stripe session.
  - Checks `payment_status`.
  - Allocates tickets.
  - Creates `Entry` rows using `stripeSessionId`.
  - Sends emails.
- `app/api/stripe/webhook/route.ts`
  - Stripe webhook signature verification.
  - Handles checkout completion.
- `app/api/stripe/session-tickets/route.ts`
  - Polling/recovery endpoint.
- `app/[locale]/competitions/[slug]/success/page.tsx`
  - Verifies Stripe session.
  - Reads `session_id`.
- `components/public/ticket-poller.tsx`
  - Polls `/api/stripe/session-tickets`.
- `prisma/schema.prisma`
  - `Entry.stripeSessionId`.
- `next.config.ts`
  - Stripe CSP domains.
- `package.json`
  - `stripe`, `@stripe/stripe-js`.
- User-facing/legal copy mentioning Stripe.

---

## 2. Target Cashflows payment flow

```txt
User selects tickets
  ↓
User answers skill question
  ↓
Server Action validates auth, age, quantity, competition, answer
  ↓
Create local Payment row: INITIATED
  ↓
POST Cashflows payment job
  ↓
Store Cashflows paymentJobReference/paymentReference/actionUrl
  ↓
Redirect user to Cashflows Hosted Checkout
  ↓
Cashflows processes payment
  ↓
Cashflows sends webhook: PaymentStatusChange
  ↓
Webhook retrieves payment from Cashflows API
  ↓
If status = Paid:
    allocate tickets idempotently
    create entries
    send emails
    revalidate caches
  ↓
User returns to success page
  ↓
Success page shows tickets or polls until webhook/recovery finishes
```

Critical rule: **Cashflows redirect success URL is not proof of payment**. Allocate tickets only after Cashflows payment status retrieval confirms `Paid`.

---

## 3. Environment variables

Replace Stripe variables with:

```env
PAYMENT_PROVIDER="cashflows"

CASHFLOWS_ENV="integration" # integration | production
CASHFLOWS_CONFIGURATION_ID="..."
CASHFLOWS_API_KEY="..."

# Optional operational guard
CASHFLOWS_ALLOWED_WEBHOOK_IPS="54.75.5.171,54.73.83.234,54.74.58.255,52.215.48.101"

NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

Cashflows endpoints:

```ts
integration: "https://gateway-int.cashflows.com"
production: "https://gateway.cashflows.com"
```

---

## 4. Database migration

Use provider-neutral payment tracking instead of directly renaming `stripeSessionId`.

### Add enums

```prisma
enum PaymentProvider {
  CASHFLOWS
  STRIPE
}

enum PaymentStatus {
  INITIATED
  PENDING
  PAID
  FAILED
  CANCELLED
  EXPIRED
  PROCESSING_FAILED
}
```

### Add `Payment` model

```prisma
model Payment {
  id                           String          @id @default(cuid())
  provider                     PaymentProvider
  status                       PaymentStatus   @default(INITIATED)

  orderNumber                  String          @unique
  providerPaymentJobReference  String?         @unique
  providerPaymentReference     String?
  providerActionUrl            String?

  competitionId                String
  competition                  Competition     @relation(fields: [competitionId], references: [id])

  userId                       String
  user                         User            @relation(fields: [userId], references: [id])

  quantity                     Int
  amountPence                  Int
  currency                     String          @default("GBP")
  locale                       String?

  rawCreateResponse            Json?
  rawLastStatusResponse        Json?

  paidAt                       DateTime?
  failedAt                     DateTime?
  createdAt                    DateTime        @default(now())
  updatedAt                    DateTime        @updatedAt

  entries                      Entry[]

  @@index([provider, status])
  @@index([competitionId])
  @@index([userId])
  @@map("payments")
}
```

### Update `Entry`

```prisma
model Entry {
  // existing fields...

  paymentId String?
  payment   Payment? @relation(fields: [paymentId], references: [id])

  stripeSessionId String? // keep temporarily for historical Stripe rows

  @@index([paymentId])
}
```

Later cleanup can remove `stripeSessionId` after old Stripe data no longer matters.

---

## 5. Cashflows client module

Create:

```txt
lib/cashflows.ts
```

Responsibilities:

- Pick integration/production base URL.
- Build SHA-512 request hash.
- Create payment job.
- Retrieve payment status.
- Normalize Cashflows status.

Hash generation:

```ts
// POST/PUT/PATCH with a JSON body
Hash = sha512(CASHFLOWS_API_KEY + exactRequestBodyString)

// GET or any request with an empty body
Hash = sha512(CASHFLOWS_API_KEY)
```

Use the same JSON string for hashing and request body:

```ts
const body = JSON.stringify(payload);
const hash = createHash("sha512")
  .update(`${apiKey}${body}`)
  .digest("hex");
```

For `GET /api/gateway/payment-jobs/{paymentJobReference}/payments/{paymentReference}`:

```ts
const hash = createHash("sha512")
  .update(apiKey)
  .digest("hex");
```

Headers:

```ts
{
  "ConfigurationId": process.env.CASHFLOWS_CONFIGURATION_ID,
  "Hash": hash,
  "Content-Type": "application/json"
}
```

Canonical endpoints:

```ts
POST /api/gateway/payment-jobs
GET  /api/gateway/payment-jobs/{paymentJobReference}/payments/{paymentReference}
```

Successful payment job creation should return `201`. Treat other `2xx` responses as suspicious but parseable, and log them for investigation.

---

## 6. Replace checkout creation

Modify:

```txt
actions/purchases.ts
```

The existing exported function can stay named `createCheckoutSession` temporarily to avoid UI churn, but internally it should create a Cashflows payment job.

### New logic

1. Validate session/auth/age.
2. Validate active competition.
3. Validate draw date.
4. Validate quantity.
5. Validate skill question.
6. Load user email/name.
7. Create local `Payment` row:
   - `provider = CASHFLOWS`
   - `status = INITIATED`
   - generated `orderNumber`, e.g. `LOT-${Date.now()}-${shortId}`
   - `amountPence`
   - `quantity`
   - `competitionId`
   - `userId`
8. Map app locale to a Cashflows-supported locale. Cashflows docs list limited locales such as `en_GB`, `en_US`, `nl_NL`, `es_ES`, `el_GR`. Until Cashflows confirms Polish/Romanian/Bulgarian support, use:

```ts
function toCashflowsLocale(locale: string) {
  switch (locale) {
    case "en": return "en_GB";
    case "pl": return "en_GB";
    case "ro": return "en_GB";
    case "bg": return "en_GB";
    default: return "en_GB";
  }
}
```

9. Create Cashflows payment job:

```ts
{
  type: "Payment",
  amountToCollect: "12.00",
  currency: "GBP",
  locale: toCashflowsLocale(locale),
  paymentMethodsToUse: ["Card"],
  order: {
    orderNumber,
    billingIdentity: {
      emailAddress: user.email
    }
  },
  parameters: {
    // Cashflows API reference lists PascalCase. Hosted Checkout examples show camelCase.
    // Because Cashflows warns capitalization matters, implement PascalCase first and verify in integration.
    ReturnUrlSuccess: `${appUrl}/${locale}/competitions/${slug}/success?payment_id=${payment.id}`,
    ReturnUrlFailed: `${appUrl}/${locale}/competitions/${slug}?payment_failed=true`,
    ReturnUrlCancelled: `${appUrl}/${locale}/competitions/${slug}?payment_cancelled=true`,

    // Portal-level Notification URL remains required. Add per-payment WebhookUrl only if enabled/accepted by the account.
    WebhookUrl: `${appUrl}/api/cashflows/webhook`
  }
}
```

If integration rejects PascalCase return URL keys, test and switch only those keys to the Hosted Checkout guide casing:

```ts
returnUrlSuccess
returnUrlFailed
returnUrlCancelled
```

10. Expect Cashflows `201` response. Store Cashflows response:
   - `data.reference` → `providerPaymentJobReference`
   - first payment reference if present → `providerPaymentReference`
   - `links.action.url` → `providerActionUrl`
   - `data.paymentStatus` or first payment `status` → local `PENDING`
11. Return `{ url: actionUrl, status: 200 }`.

---

## 7. Refactor purchase processing

Current `lib/purchase-processor.ts` is Stripe-specific. Split it into provider-neutral allocation and Cashflows-specific payment confirmation.

### Provider-neutral allocator

Keep or refactor into:

```txt
lib/purchase-processor.ts
```

Expose:

```ts
completePaidPurchase({
  paymentId,
  idempotencyKey,
  competitionId,
  userId,
  quantity,
  amountPence,
}: ...)
```

This function should:

- Check if entries already exist for `paymentId`.
- Atomically increment `ticketsSold`.
- Pick random ticket numbers.
- Create `Ticket` rows.
- Create `Entry` rows with `paymentId`.
- Revalidate tags.
- Send confirmation/admin emails.
- Return ticket numbers.

### Cashflows-specific wrapper

```ts
processCashflowsPayment(paymentJobReference, paymentReference)
```

This should:

1. Retrieve status from Cashflows.
2. Find local `Payment`.
3. Validate:
   - amount matches
   - currency matches
   - order/payment reference matches
4. If `Paid`, mark payment `PAID`.
5. Call `completePaidPurchase`.
6. If failed/cancelled, mark payment accordingly.

---

## 8. Replace webhook endpoint

Create:

```txt
app/api/cashflows/webhook/route.ts
```

Remove later:

```txt
app/api/stripe/webhook/route.ts
```

### Handler behavior

Cashflows webhook body contains references, e.g.:

```json
{
  "notifyType": "PaymentStatusChange",
  "paymentJobReference": "...",
  "paymentReference": "..."
}
```

Webhook logic:

1. Parse JSON.
2. Validate required fields.
3. Optionally validate source IP using `x-forwarded-for` and `CASHFLOWS_ALLOWED_WEBHOOK_IPS`.
4. Retrieve payment from Cashflows API:

```txt
GET /api/gateway/payment-jobs/{paymentJobReference}/payments/{paymentReference}
```

5. Process only confirmed statuses.
6. Acknowledge with HTTP `200` and a JSON body containing both references:

```json
{
  "paymentJobReference": "...",
  "paymentReference": "..."
}
```

Important: Cashflows retries notifications for up to a month if the response does not contain the expected `200` response code and message body, or if there is no response.

- Return `200` with the reference body after successful handling.
- Return `500` only for transient failures where retry is desired.
- For invalid unknown payment refs, return `200` with the reference body but log loudly unless investigation requires retry.

---

## 9. Replace ticket polling/recovery endpoint

Replace:

```txt
app/api/stripe/session-tickets/route.ts
```

With:

```txt
app/api/cashflows/payment-tickets/route.ts
```

Query:

```txt
GET /api/cashflows/payment-tickets?payment_id=...&attempt=...
```

Behavior:

1. Find entries by `paymentId`.
2. If found, return ticket numbers.
3. After N attempts, retrieve latest Cashflows status server-side using the stored `providerPaymentJobReference` and `providerPaymentReference`.
4. If Cashflows confirms `Paid`, run `processCashflowsPayment` as fallback recovery.
5. Return recovered tickets if processing succeeds.

This endpoint is a webhook recovery path, not browser-return proof. Log every recovery as `webhook_missing_or_delayed` for monitoring.

---

## 10. Update success page

Modify:

```txt
app/[locale]/competitions/[slug]/success/page.tsx
```

Replace:

```ts
session_id
stripe.checkout.sessions.retrieve(...)
stripeSessionId
```

With:

```ts
payment_id
prisma.payment.findUnique(...)
payment.status
payment.id
```

Success page states:

- `PAID` with entries → show tickets.
- `PENDING` → show pending message + poller.
- `FAILED`/`CANCELLED` → show failure/cancel state.
- Missing/invalid payment → `notFound()`.

Do not trust the return URL alone. Payment verification stays in webhook/recovery server utilities.

---

## 11. Update client components

Modify:

```txt
components/public/ticket-poller.tsx
```

Rename props:

```ts
paymentId: string;
initialTickets: number[];
```

Change fetch URL:

```ts
/api/cashflows/payment-tickets?payment_id=${paymentId}&attempt=${attempt}
```

Modify:

```txt
app/[locale]/competitions/[slug]/verify/verify-client.tsx
```

No major UI change needed if `createCheckoutSession` continues returning `{ url }`.

---

## 12. CSP and config changes

Modify `next.config.ts`.

Remove Stripe domains:

```txt
https://js.stripe.com
https://api.stripe.com
https://hooks.stripe.com
```

Add Cashflows domains if needed:

```txt
https://gateway.cashflows.com
https://gateway-int.cashflows.com
```

If using full-page redirect Hosted Checkout, CSP impact is minimal. If embedding/iframe is used later, add Cashflows to `frame-src`.

---

## 13. Package cleanup

Remove Stripe packages:

```bash
npm uninstall stripe @stripe/stripe-js
```

Delete:

```txt
lib/stripe.ts
```

After Cashflows flow is confirmed, delete:

```txt
app/api/stripe/*
```

---

## 14. Copy/legal/i18n updates

Replace Stripe references in:

- `app/[locale]/privacy/page.tsx`
- `components/layout/footer.tsx`
- `messages/en.json`
- `messages/pl.json`
- `messages/ro.json`
- `messages/bg.json`
- `plan/PLAN.md` if still maintained
- `plan/golden-dream-draw.html`

Example copy:

```txt
Secure payments by Cashflows
```

Privacy page copy:

```txt
Payment details are processed securely by Cashflows; we do not store full card details.
```

---

## 15. Testing plan

### Unit/local tests

- Cashflows POST hash generation uses exact body string.
- Cashflows GET hash generation uses API key only when request body is empty.
- Payment job creation expects `201`.
- Payment amount formatting: pounds → `"12.00"`.
- Locale mapping: unsupported app locales fall back to `en_GB`.
- Status mapping:
  - `Paid` → `PAID`
  - `Pending` → `PENDING`
  - `Reserved`/`Commissioned` → `PENDING` or provider-specific intermediate status, no ticket allocation
  - `Failed`/declined statuses → `FAILED`
  - `Cancelled`/cancelled statuses → `CANCELLED`
- Duplicate webhook does not duplicate tickets.
- Webhook acknowledgement body includes `paymentJobReference` and `paymentReference`.
- Polling recovery processes paid payment once and logs recovery.

### Integration tests

Use Cashflows integration environment:

1. Create payment job.
2. Redirect to Cashflows action URL.
3. Simulate successful payment.
4. Verify webhook creates:
   - `Payment.status = PAID`
   - correct `Ticket` count
   - correct `Entry` count
   - confirmation email sent
5. Simulate failed payment.
6. Simulate cancelled payment.
7. Simulate webhook arriving before user return.
8. Simulate user returning before webhook.
9. Replay same webhook.
10. Run two purchases against last available tickets.
11. Verify `ReturnUrlSuccess`/`ReturnUrlFailed`/`ReturnUrlCancelled` PascalCase works in integration. If not, verify Hosted Checkout camelCase variants.
12. Verify `WebhookUrl` parameter is accepted. If rejected, remove it and rely on Portal Notification URL only.

---

## 16. Rollout plan

1. Add `Payment` schema and migrate.
2. Add Cashflows client.
3. Add provider-neutral purchase processor.
4. Add Cashflows checkout creation behind `PAYMENT_PROVIDER=cashflows`.
5. Add Cashflows webhook.
6. Add new success/poller flow.
7. Test in Cashflows integration environment.
8. Configure Cashflows Portal:
   - notification URL: `https://domain.com/api/cashflows/webhook`
   - return success URL
   - return failed URL
   - return cancelled URL
9. Confirm account-specific behavior in integration:
   - return URL parameter casing: `ReturnUrlSuccess` vs `returnUrlSuccess`
   - per-payment `WebhookUrl` support
   - GET retrieve hash with empty body = `sha512(apiKey)`
10. Deploy to staging.
11. Run live low-value test if supported.
12. Switch production env to Cashflows.
13. Monitor:
   - webhook failures
   - paid payments without entries
   - duplicate notifications
   - ticket allocation failures
   - polling recovery events marked `webhook_missing_or_delayed`
14. Remove Stripe code/dependencies after stable production window.

---

## 17. Acceptance criteria

Replacement is complete when:

- No new Stripe Checkout sessions are created.
- Cashflows hosted checkout opens from purchase flow.
- Paid Cashflows payments create tickets exactly once.
- Failed/cancelled payments create no tickets.
- Success page shows tickets reliably.
- Webhook replay is idempotent.
- Stripe packages/env/CSP references are removed.
- User-facing copy no longer mentions Stripe.
