# Code Review: Lottery Fullstack App — Golden Dream Draw

**Reviewed:** 2026-06-08
**Scope:** ~70 source files, ~8,000 LoC estimated. Full-stack Next.js 16 lottery/prize-draw platform with Stripe payments, admin panel, i18n (en/pl/ro/bg), iron-session auth, Prisma + Neon serverless, Cloudflare R2 image storage, Resend transactional emails.

---

## Executive Summary

Well-architected lottery platform with strong security fundamentals. Server-side price verification, atomic ticket allocation via raw SQL, webhook signature verification, and idempotency are all correctly implemented. The admin panel is functional with proper auth gating at both middleware and Server Action levels. The main gaps are around caching (no strategy at all — every page hits the DB), missing security headers, and the CSV export with no row limit. Production-ready with the critical items fixed.

| Tier | Count |
|------|-------|
| 🔴 Critical | 3 |
| 🟠 High | 7 |
| 🟡 Medium | 6 |
| 🔵 Low | 5 |

---

## 🔴 Critical Issues

### 1. Missing Security Headers
**File:** `next.config.ts`
**Why:** E-commerce site handling payments, PII (email, address, phone, DOB) with no CSP, HSTS, or frame protection. Browsers can't enforce any security policy.

```tsx
// ❌ Missing entirely
const nextConfig: NextConfig = {
  images: { ... },
};

// ✅ Add headers
const nextConfig: NextConfig = {
  images: { ... },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://js.stripe.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "connect-src 'self' https://api.stripe.com https://*.r2.dev https://*.r2.cloudflarestorage.com",
            "frame-src https://js.stripe.com https://hooks.stripe.com",
            "font-src 'self'",
          ].join("; "),
        },
      ],
    }];
  },
};
```

### 2. CSV Export — Unbounded Row Loading
**File:** `app/[locale]/admin/(dashboard)/competitions/[id]/entries/export/route.ts:18-24`
**Why:** `prisma.entry.findMany({ where: { competitionId: id } })` with no `take` limit loads ALL entries into memory. With thousands of entries this causes OOM or extreme response times. Export should stream or paginate.

```tsx
// ❌ No limit — loads everything
const entries = await prisma.entry.findMany({
  where: { competitionId: id },
  orderBy: { createdAt: "desc" },
  include: { user: { select: { email: true, name: true } }, ticket: { select: { number: true } } },
});

// ✅ Cap at a reasonable limit, or stream with cursor
const MAX_EXPORT_ROWS = 10_000;
const entries = await prisma.entry.findMany({
  where: { competitionId: id },
  orderBy: { createdAt: "desc" },
  take: MAX_EXPORT_ROWS,
  include: { ... },
});
```

### 3. Hardcoded Session Secret Fallback in Source
**File:** `lib/session.ts:12-13`
**Why:** If `SESSION_SECRET` env var is missing in production, falls back to a string literal in public source code. Encrypted session cookies become decryptable by anyone reading the repo.

```tsx
// ❌ Hardcoded fallback exposes session encryption key
password: process.env.SESSION_SECRET ?? "complex_password_at_least_32_characters_long_for_security",

// ✅ Throw in production, allow fallback only in dev
password: process.env.SESSION_SECRET
  ?? (process.env.NODE_ENV === "production"
    ? (() => { throw new Error("SESSION_SECRET must be set in production"); })()
    : "dev-fallback-do-not-use-in-production-change-me-now"),
```

---

## 🟠 High Priority

### 4. No Caching Strategy — Every Request Hits Database
**Files:** `lib/queries.ts`, `app/[locale]/page.tsx`, `app/[locale]/competitions/**`
**Why:** Homepage stats, trending competitions, hero competition, recent winners — all queried fresh on every request. No `cacheLife()`, no `unstable_cache`, no `'use cache'`. At scale this will hammer Neon serverless.

```tsx
// ❌ No caching
export async function getHomepageStats() {
  return Promise.all([prisma.competition.count({...}), prisma.winner.count(), prisma.entry.count()]);
}

// ✅ Add cacheLife for appropriate TTLs
import { cacheLife } from "next/cache";

export async function getHomepageStats() {
  "use cache";
  cacheLife("minutes"); // stats can be slightly stale
  return Promise.all([...]);
}
```

Apply `"use cache"` + `cacheLife()` to:
- `getHomepageStats()` → `cacheLife("minutes")`
- `getTrendingCompetitions()` → `cacheLife("seconds")` or `cacheLife("minutes")`
- `getHeroCompetition()` → `cacheLife("seconds")`
- `getRecentWinners()` → `cacheLife("minutes")`
- `getFeaturedCompetition()` → `cacheLife("minutes")`

Revalidate these caches in `createCompetition`, `updateCompetition`, `assignWinner`, and the webhook using `revalidateTag()`.

### 5. Homepage — No Suspense Boundaries
**File:** `app/[locale]/page.tsx`
**Why:** The homepage awaits all sections (Hero, StatsBar, TrendingPrizes, HowItWorks, Winners, FAQ, CTABanner) in sequence. The slowest query blocks the entire page. Wrap each section in `<Suspense>` with skeleton fallbacks.

```tsx
// ❌ All sections load sequentially, entire page blocked
export default async function HomePage({ params }: Props) {
  return (
    <>
      <Hero locale={locale} />
      <StatsBar />
      <TrendingPrizes />
      ...
    </>
  );
}

// ✅ Each section streams independently
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage({ params }: Props) {
  return (
    <>
      <Hero locale={locale} />
      <Suspense fallback={<StatsBarSkeleton />}><StatsBar /></Suspense>
      <Suspense fallback={<TrendingSkeleton />}><TrendingPrizes /></Suspense>
      <HowItWorks />
      <Suspense fallback={<WinnersSkeleton />}><Winners /></Suspense>
      <FAQ items={faqItems} title={t("title")} />
      <CTABanner />
    </>
  );
}
```

### 6. Stripe Checkout — No Idempotency on Session Creation
**File:** `actions/purchases.ts:109-132`
**Why:** No `idempotencyKey` passed to `stripe.checkout.sessions.create()`. A double-click on "Buy" can create two Stripe sessions before the first redirect. The webhook handles duplicates gracefully (stripeSessionId), but user may see two charges.

```tsx
// ❌ No idempotency protection
const checkoutSession = await stripe.checkout.sessions.create({
  mode: "payment",
  customer_email: user?.email || session.email,
  ...
});

// ✅ Add idempotency key (single-use per purchase intent)
import crypto from "crypto";
const idempotencyKey = crypto.randomUUID();
const checkoutSession = await stripe.checkout.sessions.create({
  mode: "payment",
  customer_email: user?.email || session.email,
  ...
}, { idempotencyKey });
```

Also: disable the "Buy" button on the client side after the first click — already partially done via `checkedOut` state in `VerifyClient`, but the `idempotencyKey` is the server-side safety net.

### 7. Login Code Endpoint — Weak Rate Limiting
**File:** `app/api/auth/send-code/route.ts:18-27`
**Why:** Rate limit is per-email (60s cooldown). An attacker can cycle email addresses to spam Resend (cost implication) or flood the login_codes table. No global rate limit, no CAPTCHA.

```tsx
// ❌ Only per-email rate limit
const recent = await prisma.loginCode.findFirst({
  where: { email: normalizedEmail },
  orderBy: { createdAt: "desc" },
});
if (recent && Date.now() - recent.createdAt.getTime() < 60000) {
  return NextResponse.json({ error: "Please wait" }, { status: 429 });
}

// ✅ Add IP-based rate limit + global throttle
// Use Vercel KV / Upstash or middleware-level rate limiting
// Minimum: check total codes created in last 60s globally
const recentGlobal = await prisma.loginCode.count({
  where: { createdAt: { gte: new Date(Date.now() - 60000) } },
});
if (recentGlobal > 20) {
  return NextResponse.json({ error: "Too many requests" }, { status: 429 });
}
```

### 8. Author Email Sending via `resend.emails.send` — Inconsistent Error Handling
**Files:** `lib/purchase-processor.ts:185-227`, `actions/admin.ts:518-556`
**Why:** Email failures are silently caught and logged. While this is intentional (non-blocking), the `toggleWinnerNotified` action returns a specific error to the admin UI when email fails — but `assignWinner` does not. The admin has no way to know if the winner email was sent or silently dropped.

**Fix:** Surface email delivery status explicitly in the `assignWinner` return value so the admin can retry notification via the toggle.

### 9. No Error Boundary on Competition Detail / Homepage
**Files:** `app/[locale]/competitions/[slug]/page.tsx`, `app/[locale]/page.tsx`
**Why:** If any section throws (DB timeout, schema mismatch), the entire page crashes with no reset button. Only the admin dashboard has `error.tsx`. Add `error.tsx` to `[locale]/` and `[locale]/competitions/`.

### 10. Admin Competitions List — No Pagination
**File:** `app/[locale]/admin/(dashboard)/competitions/page.tsx:36-39`
**Why:** `take: 100` with no skip/pagination. While 100 is a soft cap, the admin list has no way to view competitions beyond 100 entries. Add pagination or at minimum a warning when records exceed the limit.

---

## 🟡 Medium Priority

### 11. Plain `<img>` in Admin Competiton Detail
**File:** `app/[locale]/admin/(dashboard)/competitions/[id]/page.tsx:103-107`
**Why:** Uses native `<img>` tag instead of `next/image`. Loses automatic optimization, lazy loading, and prevents CLS. Minor since it's admin-only.

```tsx
// ❌ Raw img
<img src={competition.prizeImageUrl} alt={competition.titleEn} className="..." />

// ✅ Next.js Image
<Image src={competition.prizeImageUrl} alt={competition.titleEn} width={176} height={112} className="..." />
```

### 12. Admin Filter Tabs Use `<a>` Instead of `<Link>`
**File:** `app/[locale]/admin/(dashboard)/competitions/page.tsx:89-97`
**Why:** Status filter tabs use raw `<a>` tags with `href`, causing full page reloads. Should use `<Link>` for client-side navigation with search params preserved.

### 13. `CompetitionCard` — Entirely Client-Side Rendering
**File:** `components/public/competition-card.tsx`
**Why:** The `useTranslations` hook makes the entire card a Client Component. The card renders server-fetched data but can't SSR. Consider: pass translated strings as props from the Server Component parent, keeping the card as a server-rendered presentational component.

### 14. `FeaturedCard` in Hero — Significant Code Duplication
**File:** `components/sections/hero.tsx`
**Why:** The card rendering is duplicated between the `<Link>` and `<div>` wrapper variants. The only difference is the outer wrapper. Extract into a shared inner component.

### 15. No Admin Audit Trail
**Why:** Winner assignment, competition status changes, user edits — no record of who performed them or when. For a lottery platform, audit trail is important for regulatory compliance. Add an `AuditLog` model with `{ actorId, action, targetType, targetId, metadata, createdAt }`.

### 16. Dynamic Import for `@aws-sdk/client-s3` Is Good, But Could Be Better
**File:** `actions/admin.ts` (several places)
**Why:** The `uploadImage` and `deleteImage` Server Actions use dynamic `await import("@aws-sdk/client-s3")` — this is correct and avoids bundling the S3 client in the client bundle. Good pattern.

---

## 🔵 Low Priority

### 17. Facebook Pixel ID Hardcoded
**File:** `app/layout.tsx:12-13`
Replace `"1587203175663945"` with `process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID`.

### 18. `NEXT_PUBLIC_MAX_TICKETS_PER_TRANSACTION` — Safe But Document
**File:** `lib/constants.ts`
`NEXT_PUBLIC_` prefix makes this available client-side, which is intentional (used in ticket-selector UI). Safe since it's a non-secret configuration value, but document the override in README.

### 19. `prisma/seed.ts` Referenced But Not Present
**File:** `package.json:10`
`"db:seed": "prisma db seed"` references `tsx prisma/seed.ts`, but `prisma/seed.ts` wasn't found in the file listing. Either create it or update the script.

### 20. Hardcoded Locale Fallback Values in Email Templates
**File:** `lib/email-templates.ts`
Links in email templates always point to `/en/` paths (e.g., `${SITE_URL}/en/competitions/${slug}`). For pl/ro/bg users, these should redirect to their locale or use the user's preferred locale.

### 21. `deleteImage` Fallback — Orphaned Local Files
**File:** `actions/admin.ts` (deleteImage)
When using the `public/uploads` fallback (no R2), files are deleted. But migrated deployments may have leftover files in `public/uploads` that are never cleaned up. Add a cleanup script.

---

## ✅ What's Solid

- **Atomic ticket allocation** via raw SQL `UPDATE ... WHERE ticketsSold + quantity <= maxTickets RETURNING ticketsSold` — properly handles concurrent purchases. The concurrency gate is correct.
- **Stripe webhook idempotency** via `stripeSessionId` on Entry model. Replayed webhooks return existing tickets instead of double-allocating.
- **Webhook signature verification** with `stripe.webhooks.constructEvent()` — industry standard.
- **Server-side price verification** — prices come from database, never trust client input. Correct answer verified server-side.
- **Auth gating at every level**: middleware for page access, `requireAdmin()` in every Server Action, `getSession()` in every API route. No single-gate assumption.
- **Soft delete on competitions** (`CANCELLED` status) with separate `hardDeleteCompetition` for permanent removal. Good safety net.
- **Transaction safety** in winner assignment, hard delete, and ticket creation — all multi-step operations use `$transaction`.
- **Automatic status transitions** via middleware background job — ACTIVE→CLOSED when draw date passes, plus DRAWN consistency fix.
- **i18n implementation** — `next-intl` with proper locale routing, request middleware, and per-field translations in the database schema.
- **Clean architecture**: Server Actions in `/actions`, shared purchase logic in `/lib/purchase-processor`, queries in `/lib/queries`. Good separation.
- **Proper error handling**: `global-error.tsx`, `not-found.tsx`, `error.tsx` for admin, `loading.tsx` files throughout.
- **Non-blocking emails** — email failures never break the purchase flow. `try/catch` with logging and fire-and-forget pattern.
- **TypeScript strict mode** enabled with Zod validation everywhere.

---

## 📋 Pre-Deploy Checklist

- [ ] Add security headers (`next.config.ts`) — CSP, HSTS, X-Frame-Options, Referrer-Policy
- [ ] Remove hardcoded `SESSION_SECRET` fallback — throw in production if missing
- [ ] Cap CSV export rows or implement cursor-based streaming
- [ ] Add `cacheLife()` to all query functions with appropriate TTLs
- [ ] Add `revalidateTag()` calls in mutations to bust caches
- [ ] Add `Suspense` boundaries on the homepage for streaming
- [ ] Add `error.tsx` to `[locale]/` and `[locale]/competitions/` route segments
- [ ] Add `idempotencyKey` to Stripe checkout session creation
- [ ] Add IP-based/global rate limiting to `/api/auth/send-code`
- [ ] Verify `SESSION_SECRET` is set in production environment
- [ ] Verify `STRIPE_WEBHOOK_SECRET` is set (not empty string)
- [ ] Create `prisma/seed.ts` with sample data (or remove the script)
- [ ] Test webhook endpoint with `stripe trigger` CLI
- [ ] Review email templates — hardcoded `/en/` links in email bodies
- [ ] Consider adding audit trail model for admin actions

---

## Files Reviewed

| File | Status | Notes |
|------|--------|-------|
| `lib/session.ts` | 🔴 | Hardcoded secret fallback |
| `next.config.ts` | 🔴 | Missing security headers |
| `prisma/schema.prisma` | ✅ | Well-designed, good indexes |
| `lib/prisma.ts` | ✅ | Proper singleton, adapter-pg |
| `lib/stripe.ts` | ✅ | Clean |
| `lib/purchase-processor.ts` | ✅ | Excellent atomic allocation, idempotency |
| `lib/queries.ts` | 🟠 | No caching strategy |
| `lib/constants.ts` | ✅ | Clean |
| `lib/status-transitions.ts` | ✅ | Good background consistency fix |
| `lib/resend.ts` | ✅ | Clear sender configuration |
| `lib/email-templates.ts` | ✅ | Well-designed branded templates |
| `actions/purchases.ts` | 🟠 | Missing idempotency key |
| `actions/admin.ts` | ✅ | Solid auth gating, Zod validation |
| `actions/auth.ts` | ✅ | Clean registration flow |
| `proxy.ts` (middleware) | ✅ | Good route gating, status transitions |
| `app/api/stripe/webhook/route.ts` | ✅ | Signature verification, idempotency |
| `app/api/auth/send-code/route.ts` | 🟠 | Weak rate limiting |
| `app/api/auth/verify-code/route.ts` | ✅ | Solid code verification |
| `app/api/auth/admin-login/route.ts` | ✅ | Simple but functional |
| `app/layout.tsx` | ✅ | Next Font, Facebook Pixel (minor) |
| `app/[locale]/layout.tsx` | ✅ | Clean i18n + session wiring |
| `app/[locale]/page.tsx` | 🟠 | No Suspense boundaries |
| `app/[locale]/competitions/[slug]/page.tsx` | ✅ | Good locale-aware fields |
| `app/[locale]/competitions/[slug]/verify/**` | ✅ | Solid verify + checkout flow |
| `app/[locale]/admin/(dashboard)/layout.tsx` | ✅ | Proper auth redirect |
| `app/[locale]/admin/(dashboard)/competitions/page.tsx` | 🟡 | `<a>` instead of `<Link>`, no pagination |
| `app/[locale]/admin/(dashboard)/competitions/[id]/page.tsx` | 🟡 | `<img>` instead of `<Image>` |
| `app/[locale]/admin/(dashboard)/competitions/[id]/entries/export/route.ts` | 🔴 | No row limit |
| `app/[locale]/admin/(dashboard)/winners/page.tsx` | ✅ | Clean |
| `components/public/competition-card.tsx` | 🟡 | Full client component |
| `components/public/skill-question.tsx` | ✅ | Well-implemented multi-locale questions |
| `components/public/ticket-selector.tsx` | ✅ | Good UX |
| `components/sections/hero.tsx` | 🟡 | Code duplication in card variants |
| `components/admin/featured-toggle.tsx` | ✅ | Clean |
| `app/global-error.tsx` | ✅ | Proper global error boundary |
