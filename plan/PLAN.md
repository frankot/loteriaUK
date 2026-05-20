# Golden Dream Draw — Implementation Plan

> Skill-based prize competition platform. Next.js 16, Tailwind CSS v4, PostgreSQL, Stripe, 4 languages.
> Inspired by thegiveawayguys.co.uk. Design base: `golden-dream-draw.html`

---

## 1. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 16 (App Router) | Latest, RSC, Server Actions, i18n-native |
| Language | TypeScript (strict) | Type safety across Prisma → API → UI |
| Styling | Tailwind CSS v4 | Utility-first, CSS-first config, no `tailwind.config.ts` |
| Database | PostgreSQL (Neon serverless) + Prisma ORM | Schema-first, migrations, type-safe queries |
| Auth | Custom email-code + iron-session | Magic-link-alike, no password, stateless sessions |
| i18n | next-intl | Industry standard for Next.js App Router i18n |
| Payments | Stripe (Checkout Sessions + Webhooks) | PCI DSS Level 1, Apple Pay / GPay included |
| Forms | React Hook Form + Zod | Type-safe validation, RHF integrates with Shadcn |
| Admin | Custom (Server Actions + same Next.js app) | No external CMS. All CRUD via `/admin/*` routes |
| Email | Resend | Simple transactional API, DKIM, good deliverability |
| File Storage | Cloudflare R2 | S3-compatible, no egress fees |
| Deployment | Vercel | Native Next.js hosting, edge runtime support |
| Component Lib | Shadcn/ui (Tailwind v4) | Accessible, unstyled, themable primitives |

---

## 2. Auth System — Email Code Login

No passwords. No OAuth (v1). Pure email-code flow.

### Flow

```
1. User enters email on /login
2. POST /api/auth/send-code → generates 6-digit code (crypto.randomInt)
   → stores in LoginCode table (email, code, expiresAt: +15min)
   → sends via Resend
3. User checks email, enters 6-digit code on /login/verify
4. First-time user → redirected to /register form (name, address, phone, DOB, 18+ checkbox)
   POST /api/auth/register → creates User with full details, creates iron-session cookie
   Returning user → POST /api/auth/verify-code → marks used, creates iron-session cookie
   Session payload: { userId, email, role, name }
5. Session persists (iron-session, encrypted cookie, ~7d expiry)
6. On logout → cookie destroyed. Next login → new code.
```

### LoginCode table schema

```prisma
model LoginCode {
  id        String   @id @default(cuid())
  email     String
  code      String
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  @@index([email, code])
}
```

### Session

- **iron-session** — encrypted cookie, no DB lookup on every request
- Session payload: `{ userId: string, email: string, role: 'user' | 'admin', ageConfirmed: boolean }`
- Middleware reads session for `/profile/*` and `/admin/*` routes

### Registration

- **Step 1:** User enters email on `/login` → receives 6-digit code
- **Step 2:** User enters code on `/login/verify`
- **Step 3 (first-time only):** Redirected to `/register` with a form:
  - Full name (required)
  - Address (required — needed for prize delivery + postal entry compliance)
  - Phone number (required — contact for winner notification)
  - Date of birth (required — 18+ verification)
  - Age confirmation checkbox ("I confirm I am 18 or older")
- **Step 4:** Submit → User created with all fields → session issued
- All fields stored on User model (`name`, `address`, `phone`, `dateOfBirth` required for users, nullable for admin accounts)
- Returning users skip registration; code login → session directly

---

## 3. Data Model — Prisma Schema

```prisma
enum CompetitionStatus {
  DRAFT
  ACTIVE
  CLOSED
  DRAWN
  CANCELLED
}

enum EntryType {
  PAID
  POSTAL
}

enum TicketStatus {
  AVAILABLE
  SOLD
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  address       String?
  phone         String?
  dateOfBirth   DateTime?
  ageConfirmed  Boolean  @default(false)
  role          String   @default("user") // "user" | "admin"
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  tickets       Ticket[]
  entries       Entry[]
}

model Competition {
  id            String             @id @default(cuid())
  slug          String             @unique
  status        CompetitionStatus  @default(DRAFT)

  // Multi-lang fields
  titleEn       String
  titlePl       String?
  titleRo       String?
  titleBg       String?
  descEn        String?
  descPl        String?
  descRo        String?
  descBg        String?

  pricePounds   Decimal            @db.Decimal(10, 2) // e.g. 1.99
  maxTickets    Int
  drawDate      DateTime
  prizeImageUrl String?
  prizeCategory String?            // electronics, jewellery, fashion, cash
  prizeValue    Decimal?           @db.Decimal(10, 2) // RRP of prize

  // Stats (denormalized, updated via trigger/webhook)
  ticketsSold   Int                @default(0)

  // Relation to skill question
  questionId    String?
  question      SkillQuestion?     @relation(fields: [questionId], references: [id])

  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt

  tickets       Ticket[]
  entries       Entry[]
  winners       Winner[]

  @@index([status, drawDate])
}

model Ticket {
  id             String        @id @default(cuid())
  competitionId  String
  competition    Competition   @relation(fields: [competitionId], references: [id])
  userId         String?
  user           User?         @relation(fields: [userId], references: [id])
  number         Int           // sequential per competition
  status         TicketStatus  @default(AVAILABLE)
  createdAt      DateTime      @default(now())

  entry          Entry?

  @@unique([competitionId, number])
  @@index([competitionId, status])
}

model Entry {
  id             String     @id @default(cuid())
  competitionId  String
  competition    Competition @relation(fields: [competitionId], references: [id])
  userId         String
  user           User       @relation(fields: [userId], references: [id])
  ticketId       String?    @unique // null for postal entries
  ticket         Ticket?    @relation(fields: [ticketId], references: [id])
  type           EntryType  @default(PAID)
  answerCorrect  Boolean?   // null = not yet evaluated, true/false for postal
  createdAt      DateTime   @default(now())

  @@index([competitionId])
  @@index([userId])
}

model Winner {
  id             String     @id @default(cuid())
  competitionId  String
  competition    Competition @relation(fields: [competitionId], references: [id])
  userId         String
  user           User       @relation(fields: [userId], references: [id])
  entryId        String     @unique
  entry          Entry      @relation(fields: [entryId], references: [id])

  notified       Boolean    @default(false)
  claimed        Boolean    @default(false)
  notifiedAt     DateTime?
  claimedAt      DateTime?
  createdAt      DateTime   @default(now())

  @@index([competitionId])
}

model SkillQuestion {
  id        String   @id @default(cuid())

  // Multi-lang question text
  questionEn String
  questionPl String?
  questionRo String?
  questionBg String?

  // Options — same across languages, text differs
  optionAEn  String
  optionAPl  String?
  optionARo  String?
  optionABg  String?
  optionBEn  String
  optionBPl  String?
  optionBRo  String?
  optionBBg  String?
  optionCEn  String?
  optionCPl  String?
  optionCRo  String?
  optionCBg  String?
  optionDEn  String?
  optionDPl  String?
  optionDRo  String?
  optionDBg  String?

  correctOption String // "A" | "B" | "C" | "D"
  createdAt     DateTime @default(now())

  competitions Competition[]
}
```

---

## 4. Route Map

### Public Routes

| Route | Page | Data |
|-------|------|------|
| `/` | Homepage | Hero, stats bar, trending competitions (top 6 by urgency), winners carousel, FAQ |
| `/login` | Login (email input) | Form: email + 18+ checkbox |
| `/login/verify` | Verify code (6-digit input) | Code input, auto-submit on 6 digits |
| `/competitions` | All competitions | Filtered grid, pagination |
| `/competitions/[slug]` | Single competition | Prize details, progress bar, ticket quantity selector, skill question, Stripe Checkout button |
| `/winners` | Recent winners | Grid of winner cards |
| `/how-it-works` | How It Works | 3-step explanation |
| `/faq` | FAQ | Accordion list |
| `/profile` | User profile (protected) | Ticket list per competition, entry history |

### Admin Routes (`/admin/*`)

All protected — middleware checks `session.role === 'admin'`.

| Route | Page | Purpose |
|-------|------|---------|
| `/admin/login` | Admin login | Separate email-code login but checks `role: admin` |
| `/admin` | Dashboard | Stats cards: active comps, live entries, revenue (monthly), pending draws |
| `/admin/competitions` | List competitions | Table with status badges, filter, search |
| `/admin/competitions/new` | Create competition | Form: title (4 langs), description, price, max tickets, draw date, prize image upload, question selector |
| `/admin/competitions/[id]/edit` | Edit competition | Same form, pre-filled |
| `/admin/competitions/[id]` | Competition detail | Tabs: entries table, draw action, winner |
| `/admin/competitions/[id]/entries` | Entries list | DataTable: search by name/email, filter by type/correct, **export CSV** button |
| `/admin/competitions/[id]/entries/export` | CSV download | Server Action returns CSV file |
| `/admin/competitions/[id]/assign-winner` | Assign winner | Search input for ticket ID. Admin enters the winning ticket number from the external live draw. Confirms. Creates Winner record. |
| `/admin/winners` | All winners | Table: competition, user, prize, notified status, claim status. Mark as notified / claimed. |
| `/admin/questions` | Skill questions | List, create, edit, delete. 4-language fields. |
| `/admin/users` | Registered users | Table: email, name, entries count. Click to view entry history. |
| `/admin/users/[id]/edit` | Edit user | Form: name, address, phone, DOB. Admin can update any field. |

---

## 5. i18n — next-intl

### File structure

```
messages/
├── en.json    # default
├── pl.json    # Polish
├── ro.json    # Romanian
└── bg.json    # Bulgarian
```

### Locale detection

- `next-intl` middleware reads `Accept-Language` header → redirects to `/pl`, `/ro`, `/bg`, or `/en` (default)
- Language switcher in header — sets cookie, client-side re-render
- Admin panel stays in English regardless of locale

### Translation coverage (v1)

| Area | Scope | Mechanism |
|------|-------|-----------|
| Static UI | Nav, footer, hero, buttons, labels, error messages | next-intl `t()` in JSON |
| Competition titles | Per competition | Stored in DB (`titleEn`, `titlePl`, etc.) |
| Competition descriptions | Per competition | Stored in DB (`descEn`, `descPl`, etc.) |
| Skill questions | Per question | Stored in DB (`questionEn`, `optionAEn`, etc.) |
| FAQ content | 5-7 items | Stored in DB with translation fields (v1) or JSON (v2) |
| Email templates | Purchase confirm, winner notification | Separate template per locale in Resend |
| Admin panel | English only | No translation |

### Translation workflow

1. Develop in English (default)
2. Export untranslated keys to CSV script
3. AI (GPT-4o) translates PL, RO, BG
4. Polish user verifies PL. RO and BG spot-checked.
5. Import back to JSON files + DB seed data

---

## 6. Ticket Purchase Flow

```
User on /competitions/[slug]
  │
  ├─ 1. Select ticket quantity (1-10)
  ├─ 2. Answer skill question (multiple choice, 4 options)
  │     └─ Wrong → "Incorrect. Try another question." (shows different question from pool)
  │     └─ Correct → proceeds
  ├─ 3. Click "Buy Tickets"
  ├─ 4. Server Action creates Stripe Checkout Session
  │     └─ line_items: [price_data with dynamic price × quantity]
  │     └─ metadata: { competitionId, userId, ticketCount, questionId, correctOption }
  ├─ 5. Redirect to Stripe Checkout
  ├─ 6. Success → Stripe redirects to /competitions/[slug]/success?session_id=xxx
  │     └─ Webhook: stripe.webhooks.checkout.session.completed
  │         → Reserves tickets (marks as SOLD, assigns sequential numbers)
  │         → Creates Entry records (answerCorrect: true)
  │         → Sends confirmation email
  └─ 7. Cancel → Stripe redirects to /competitions/[slug]?cancelled=true
```

### Ticket number assignment

- Sequential per competition: `SELECT COALESCE(MAX(number), 0) + 1 FROM Ticket WHERE competitionId = ?`
- Wrapped in a Prisma transaction + lock check `WHERE status = AVAILABLE`
- If `ticketsSold + quantity > maxTickets` → fail with "Not enough tickets remaining"

### Stripe webhook handler

```
POST /api/stripe/webhook
  ├─ Verify signature (stripe.webhooks.constructEvent)
  ├─ event.type === 'checkout.session.completed'
  │   ├─ Extract metadata
  │   ├─ Find or create User
  │   ├─ In transaction:
  │   │   ├─ Create N Ticket records (AVAILABLE → SOLD)
  │   │   ├─ Create N Entry records (answerCorrect: true)
  │   │   └─ Increment Competition.ticketsSold
  │   ├─ Send confirmation email via Resend
  │   └─ Return 200
  └─ event.type === 'checkout.session.expired' → release reserved tickets (if any)
```

---

## 7. Admin Panel — Detailed Spec

### Dashboard (`/admin`)

Cards:
- **Active Competitions** — count where status = ACTIVE
- **Total Entries** (current month)
- **Revenue** (current month, from Stripe webhook data or denormalized)
- **Pending Draws** — competitions past drawDate where status = CLOSED

### Competitions CRUD

**Form fields (create/edit):**
- Title: EN (required), PL, RO, BG
- Slug: auto-generated from title_EN, editable
- Description: EN (required), PL, RO, BG (textarea, WYSIWYG minimal)
- Price (£): number input, decimal
- Max Tickets: number input
- Draw Date: date picker
- Prize Category: dropdown (Electronics / Jewellery / Fashion / Cash)
- Prize Value (£): number input (RRP)
- Prize Image: file upload → Cloudflare R2 → returns URL
- Skill Question: dropdown selector from SkillQuestion pool
- Status: dropdown (Draft / Active / Closed / Drawn / Cancelled)

**List view** — DataTable with columns:
- Title (EN), Slug, Price, Tickets (sold/max), Draw Date, Status
- Actions: Edit, View, Delete (soft with confirmation)

### Entries per Competition (`/admin/competitions/[id]/entries`)

**DataTable with:**
- User email
- User name (if provided)
- Ticket number
- Entry type (PAID / POSTAL)
- Answer correct (Yes / No / N/A for postal not yet evaluated)
- Created date
- Search bar (email, name)
- Filter dropdown (type, answer correct status)
- **Export CSV button** — Server Action streams CSV:
  ```csv
  email,name,ticketNumber,type,answerCorrect,createdAt
  ```

### Draw & Winner Assignment (`/admin/competitions/[id]/assign-winner`)

**Pre-conditions:**
- Competition status must be CLOSED (past drawDate)
- No winner assigned yet

**Flow:**
1. Live draw happens externally on YouTube/Facebook — a random ticket number is drawn live
2. Admin goes to `/admin/competitions/[id]/assign-winner`
3. **Search input:** admin types the winning ticket number (e.g. `427`)
4. System looks up the ticket: finds Ticket + User + Entry for that competition + ticket number
5. Shows result preview:
   - Ticket: #427
   - User: sarah.m@example.com, Sarah Mitchell
   - Entry type: PAID
   - Answer: correct ✅
6. Admin confirms → creates Winner record → competition status → DRAWN
7. If ticket not found / wrong competition / wrong answer → error message displayed
8. Winner notification email sent automatically
9. If winner doesn't claim within 14 days → admin can delete Winner record and assign a new one
   (new draw happens externally again, admin repeats the process with the new ticket number)

### Winners Management (`/admin/winners`)

**DataTable with:**
- Competition title
- User email + name
- Ticket number
- Notified status (toggle button → sends email via Resend)
- Claimed status (toggle)
- Created date

### Questions CRUD (`/admin/questions`)

**Form fields (create/edit):**
- Question: EN (required), PL, RO, BG
- Option A: EN (required), PL, RO, BG
- Option B: EN (required), PL, RO, BG
- Option C: EN (optional), PL, RO, BG
- Option D: EN (optional), PL, RO, BG
- Correct Answer: radio (A/B/C/D)

**Seed data:** 30 questions in English (hardcoded in `prisma/seed.ts`).
Translations added via admin panel or migration later.

### Users View (`/admin/users`)

**DataTable with:**
- Email, Name, Phone, Entries count, Created date
- Click row → modal with entry history (competition, tickets, type, date)

---

## 8. Free Postal Entry (UK Legal Compliance)

### Admin workflow

1. Postcard arrives with: name, address, email, DOB, competition name, answer
2. Admin goes to `/admin/competitions/[id]/entries` → "Add Postal Entry" button
3. Form: name, address, email, DOB, answer (A/B/C/D)
4. System evaluates answer → `answerCorrect: true/false`
5. Creates Entry with `type: POSTAL` (no ticket number)
6. Postal entries are included in the draw (if answerCorrect)

### Display on site

- Footer link: "Free Postal Entry" → static page with instructions
- Instructions: address, required fields, deadline (must arrive before draw date)
- Legal note: "Postal entries have equal chance in the draw"

---

## 9. Winner Selection & Display

### External draw — ticket ID lookup

1. Live draw happens on YouTube/Facebook (outside the app) — a random ticket number is drawn
2. Admin goes to `/admin/competitions/[id]/assign-winner`
3. Types the winning **ticket number** into a search input
4. System validates: ticket exists, belongs to this competition, entry has correct answer
5. Admin confirms → Winner record created
6. Winner appears on public `/winners` page immediately
7. Winner notification email sent automatically via Resend

### Winners page (`/winners`)

- Grid of winner cards (same design as HTML mockup)
- Shows: avatar placeholder, name (first name + initial), prize won, date, city (if provided)
- Paginated, newest first

---

## 10. Email Templates (Resend)

All transactional, sent via Resend React Email components.

| Template | Trigger | Locale |
|----------|---------|--------|
| Login code | User requests login | User's selected locale |
| Purchase confirmation | Successful Stripe payment | User's selected locale |
| Winner notification | Admin assigns winner | User's selected locale |
| Redraw notice | Previous winner didn't claim | User's selected locale |

---

## 11. Project Structure

```
loteria/
├── golden-dream-draw.html     # design reference
├── images/                    # existing prize images
├── PLAN.md                    # this file
│
├── prisma/
│   ├── schema.prisma          # full schema
│   ├── seed.ts                # 30 questions, default admin user, sample competitions
│   └── migrations/
│
├── messages/
│   ├── en.json
│   ├── pl.json
│   ├── ro.json
│   └── bg.json
│
├── src/
│   ├── app/
│   │   ├── [locale]/          # i18n route group
│   │   │   ├── page.tsx                   # homepage
│   │   │   ├── login/
│   │   │   │   ├── page.tsx               # email input + 18+ checkbox
│   │   │   │   └── verify/page.tsx        # code input
│   │   │   ├── competitions/
│   │   │   │   ├── page.tsx               # all competitions
│   │   │   │   └── [slug]/
│   │   │   │       ├── page.tsx           # competition detail + buy flow
│   │   │   │       └── success/page.tsx   # post-purchase confirmation
│   │   │   ├── winners/page.tsx
│   │   │   ├── how-it-works/page.tsx
│   │   │   ├── faq/page.tsx
│   │   │   ├── free-postal-entry/page.tsx
│   │   │   ├── profile/
│   │   │   │   ├── page.tsx               # tickets overview
│   │   │   │   └── settings/page.tsx      # edit own name/address/phone
│   │   │   └── admin/
│   │   │       ├── login/page.tsx
│   │   │       ├── page.tsx               # dashboard
│   │   │       ├── competitions/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── new/page.tsx
│   │   │       │   └── [id]/
│   │   │       │       ├── page.tsx       # detail + tabs
│   │   │       │       ├── edit/page.tsx
│   │   │       │       ├── entries/
│   │   │       │       │   ├── page.tsx
│   │   │       │       │   └── export/route.ts  # CSV download
│   │   │       │       └── assign-winner/
│   │   │       │           └── page.tsx
│   │   │       ├── winners/page.tsx
│   │   │       ├── users/page.tsx
│   │   │       ├── users/[id]/edit/page.tsx
│   │   │       └── questions/
│   │   │           ├── page.tsx
│   │   │           ├── new/page.tsx
│   │   │           └── [id]/edit/page.tsx
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── send-code/route.ts     # POST → generate code, send email
│   │   │   │   └── verify-code/route.ts   # POST → verify code, create session
│   │   │   └── stripe/
│   │   │       └── webhook/route.ts       # POST → Stripe webhook handler
│   │   │
│   │   └── globals.css                    # Tailwind v4 setup
│   │
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   └── language-switcher.tsx
│   │   ├── public/
│   │   │   ├── hero.tsx
│   │   │   ├── competition-card.tsx
│   │   │   ├── featured-card.tsx
│   │   │   ├── stats-bar.tsx
│   │   │   ├── how-it-works.tsx
│   │   │   ├── winners-grid.tsx
│   │   │   ├── winner-card.tsx
│   │   │   ├── faq-accordion.tsx
│   │   │   ├── skill-question.tsx
│   │   │   └── ticket-selector.tsx
│   │   ├── admin/
│   │   │   ├── data-table.tsx
│   │   │   ├── competition-form.tsx
│   │   │   ├── question-form.tsx
│   │   │   ├── entries-table.tsx
│   │   │   └── stats-cards.tsx
│   │   └── email/
│   │       ├── login-code.tsx
│   │       ├── purchase-confirmation.tsx
│   │       └── winner-notification.tsx
│   │
│   ├── lib/
│   │   ├── prisma.ts             # singleton Prisma client
│   │   ├── session.ts            # iron-session config + helpers
│   │   ├── stripe.ts             # Stripe client init
│   │   ├── resend.ts             # Resend client init
│   │   ├── r2.ts                 # Cloudflare R2 client
│   │   ├── csv.ts                # CSV generation helper
│   │   └── constants.ts          # UK-specific constants, age limits
│   │
│   ├── actions/
│   │   ├── auth.ts               # sendCode, verifyCode, logout
│   │   ├── competitions.ts       # create, update, delete, list
│   │   ├── entries.ts            # list, export CSV, add postal
│   │   ├── winners.ts            # assign, notify, claim
│   │   ├── questions.ts          # CRUD
│   │   ├── purchases.ts          # createCheckoutSession
│   │   └── users.ts              # list, update profile
│   │
│   └── middleware.ts             # i18n redirect + session guard
│
├── public/
│   └── images/                   # public static images
│
├── next.config.ts
├── tailwind.config.ts            # (minimal — v4 uses CSS)
├── tsconfig.json
├── package.json
└── .env.local                    # DATABASE_URL, STRIPE_*, RESEND_KEY, R2_*, SESSION_SECRET
```

---

## 12. Implementation Order

### Phase 1 — Foundation (Days 1-3)

1. `npx create-next-app@latest loteria --typescript --tailwind --app` (Next.js 16)
2. Install deps: `prisma`, `next-intl`, `iron-session`, `stripe`, `resend`, `react-hook-form`, `zod`, `@aws-sdk/client-s3` (for R2), `shadcn/ui`
3. Set up Prisma schema + first migration + seed script
4. Set up `next-intl` with middleware + locale routing
5. Set up iron-session middleware + login-code auth flow
6. Create `/login` and `/login/verify` pages (public)
7. Create basic layout (header, footer, language switcher)

### Phase 2 — Core Public Pages (Days 4-7)

1. Homepage: hero section, stats bar, trending competitions grid, winners section, FAQ accordion
2. Competitions list page
3. Competition detail page: prize info, progress bar, ticket selector, skill question UI
4. Skill question component — random question from competition's assigned question, 4 options, retry logic
5. Stripe Checkout integration (Server Action → redirect)
6. Stripe webhook handler (ticket assignment, entry creation, email)
7. Post-purchase success page
8. Winners page
9. How It Works page
10. FAQ page (content from mockup)

### Phase 3 — Profile + Free Postal (Days 8-9)

1. `/profile` page — ticket list per competition, entry history
2. `/profile/settings` — user can edit own name/address/phone
3. `/register` page — registration form (name, address, phone, DOB, age confirmation)
4. Free postal entry page (static, instructions)
5. Add postal entry admin form (manual entry)
6. `/admin/users/[id]/edit` — admin can edit any user's name/address/phone/DOB

### Phase 4 — Admin Panel (Days 10-14)

1. Admin login (separate email-code flow, checks role)
2. Dashboard — stats cards
3. Competitions CRUD (create/edit/list/delete) with multi-lang fields
4. Image upload to Cloudflare R2
5. Entries list per competition (DataTable, search, filter)
6. CSV export
7. Draw / Assign Winner flow — ticket ID search input + validation + winner creation
8. Winners management (notify, claim toggle)
9. Questions CRUD (multi-lang)
10. Users list + entry history modal

### Phase 5 — i18n Content + Polish (Days 15-16)

1. Extract all static UI strings to JSON translation files
2. AI-translate PL, RO, BG
3. Verify PL manually
4. Seed 30 skill questions in 4 languages
5. Add 2-3 sample competitions with translated content
6. Responsive audit + mobile fixes
7. Load testing (Stripe webhook under concurrency)

### Phase 6 — Launch Prep (Days 17-18)

1. Set up Neon PostgreSQL (production)
2. Set up Cloudflare R2 bucket
3. Configure Stripe webhook endpoint (production URL)
4. Configure Resend domain + DKIM
5. Deploy to Vercel
6. Set up monitoring (Sentry or Vercel Analytics)
7. Legal review: T&Cs page, privacy policy, free postal entry wording
8. Final QA pass

---

## 13. Key Legal Notes (UK Skill Competition)

- **Must not be a lottery** — the skill question must genuinely prevent some people from winning. "Multiple choice questions that allow a second chance if your first answer was wrong, are unlikely to meet the skill test" (GC guidance). Our retry model uses a **different question** from the pool, not the same one.
- **Free entry route required** — postal entry must be available for every competition. No purchase necessary.
- **Age restriction** — 18+. Confirmed at registration. No under-18 entries.
- **Data protection** — UK GDPR compliant. User data retained for legal period (6 years for financial records), then deleted.
- **Advertising Standards** — CAP Code applies. Don't use "guaranteed win" or misleading urgency language.
- **Consider legal consultation** before going live. This plan is technical, not legal advice.

---

## 14. Component Library Integration (shadcn/ui + Tailwind v4)

Install shadcn/ui primitives as needed:

```bash
npx shadcn@latest add button card dialog dropdown-menu input
npx shadcn@latest add label select separator table tabs textarea
npx shadcn@latest add toast sheet popover command badge
npx shadcn@latest add data-table   # if available, else manual
```

Custom components (from the HTML design) built on top of shadcn primitives:
- CompetitionCard — shadcn `Card` + custom progress bar
- FeaturedCard — shadcn `Card` + image overlay
- WinnerCard — shadcn `Card` + avatar
- SkillQuestion — custom radio group with feedback states
- TicketSelector — custom stepper with price calculation

---

## 15. Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Session
SESSION_SECRET="..." # 32+ char random string

# Stripe
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."

# Resend
RESEND_API_KEY="re_..."

# Cloudflare R2
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="golden-dream-draw"
R2_ENDPOINT="https://....r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://pub-....r2.dev"

# Next.js
NEXT_PUBLIC_SITE_URL="https://goldendreandraw.com"
```

---

## 16. Database Backup & Disaster Recovery

### Neon PITR (built-in) — what you get per plan

| Plan | History window (PITR) | Max configurable | Monthly cost |
|------|----------------------|-----------------|-------------|
| **Free** | **6 hours** | 6 hours (capped at 1 GB history) | $0 |
| **Launch** | 1 day | **7 days** | ~$5-10 |
| **Scale** | 1 day | **30 days** | ~$20-50+ |

**Problem:** Free tier PITR (6h) means:
- Bad migration on Friday 5 PM → noticed Monday 9 AM → **64h gap → permanent data loss**
- Accidental `DELETE FROM tickets` → if unnoticed for 7+ hours, gone forever
- No protection against Neon account issues, billing problems, or regional failure

### Backup failure modes mapped

| Scenario | Neon Free covers? | Neon Launch covers? | External dump covers? |
|----------|-------------------|--------------------|----------------------|
| Accidental DELETE (noticed within 6h) | ✅ PITR | ✅ PITR | ⚠️ up to 24h stale |
| Accidental DELETE (noticed after 24h) | ❌ | ✅ PITR (7d window) | ⚠️ up to 24h stale |
| Bad migration (noticed Monday from Friday) | ❌ | ✅ PITR | ⚠️ previous night's dump |
| Ransomware / malicious admin (detected late) | ❌ | ✅ PITR | ✅ offline dump safe |
| Neon account terminated / billing issue | ❌ | ❌ | ✅ you have the data |
| Neon company goes bankrupt | ❌ | ❌ | ✅ you have the data |
| Region-level outage | ❌ | ❌ | ✅ you can restore elsewhere |
| Corrupted data silently accumulating | ❌ | ⚠️ depends on detection | ✅ point-in-time dump comparison |

### Recommended strategy

**Two-layer defence — cheap, simple, covers all realistic scenarios.**

#### Layer 1: Neon PITR (primary)

Handles 90%+ of accidents — instant restore, no data loss within window.

| Phase | Plan | PITR window | Why |
|-------|------|-------------|-----|
| **Dev / testing** | Free | 6 hours | Good enough for early development |
| **Launch (first ticket sold)** | **Launch (~$5-10/mo)** | **7 days** | Customer money + legal liability = need proper window |

#### Layer 2: Nightly pg_dump → Cloudflare R2 (off-site)

Handles the remaining 10% — account death, bankruptcy, region failure, or bugs noticed beyond PITR window.

```bash
# Vercel Cron Job — runs daily at 3 AM UTC
# File: src/app/api/cron/backup/route.ts

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  const filename = `db-${new Date().toISOString().split("T")[0]}.dump`;

  // Dump to stdout, pipe directly to R2 (no temp file)
  const { stdout } = await execAsync(
    `pg_dump "${process.env.DATABASE_URL}" --format=custom --no-owner --compress=9`
  );

  const client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  await client.send(new PutObjectCommand({
    Bucket: "golden-dream-draw-backups",
    Key: filename,
    Body: stdout,
  }));

  return Response.json({ ok: true, file: filename });
}
```

**Cron config** (`vercel.json` or Vercel dashboard):

```json
{
  "crons": [
    {
      "path": "/api/cron/backup",
      "schedule": "0 3 * * *"
    }
  ]
}
```

**Retention:**
- Keep daily backups for **30 days** (auto-prune via R2 lifecycle policy)
- Keep monthly snapshots for **12 months** (one per month, manually promoted)
- Total storage: ~50 MB/day × 30 days = ~1.5 GB → **~$0.05/mo on R2**

### Restore drill (test quarterly)

1. Create a fresh Neon project (or branch)
2. Download the latest dump from R2
3. `pg_restore --dbname=$NEON_DATABASE_URL --no-owner --jobs=4 latest.dump`
4. Run a query to verify: `SELECT COUNT(*) FROM competitions;`
5. Document the time-to-restore in the project wiki

### Emergency runbook (1-pager for admin)

```text
┌─────────────────────────────────────────────────────────┐
│  DATA RESTORE — QUICK REFERENCE                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  SCENARIO A: Accidental delete / corruption (≤7 days)   │
│  → Go to Neon Console → Branches → Restore → PITR       │
│  → Pick timestamp before incident → Instant             │
│                                                         │
│  SCENARIO B: Data lost beyond PITR window               │
│  → Go to R2 → download latest .dump                     │
│  → pg_restore to new Neon branch                        │
│  → ~1 hour for full restore                             │
│                                                         │
│  SCENARIO C: Neon account / region failure              │
│  → Provision new PostgreSQL anywhere (Supabase, RDS)    │
│  → pg_restore from R2 dump                              │
│  → Update DATABASE_URL in Vercel → redeploy             │
│                                                         │
│  CONTACTS:                                              │
│  Neon support: support@neon.tech                        │
│  Who to ping: [name] [phone]                            │
└─────────────────────────────────────────────────────────┘
```

### Verdict

| Phase | Setup | Monthly cost | RPO (worst case) | Restore time |
|-------|-------|-------------|-------------------|-------------|
| Dev (Free) | Free Neon + nightly dump → R2 | ~$0.05 | ~24h | ~1h |
| Production | Launch Neon + nightly dump → R2 | ~$5-10 | ~0 (PITR) + ~24h (dump) | minutes (PITR) |

**Bottom line:** Set up the nightly dump during Phase 1 (it's 1 hour of work, $0.05/mo). Upgrade Neon from Free to Launch when the first real ticket sells. That covers everything from "oops I deleted the entries table" to "Neon disappears overnight."

---

## 17. Key Design Decisions Recap

| Decision | Choice | Why |
|----------|--------|-----|
| Auth model | Email code, no password | Simpler UX, no password reset, secure enough for v1 |
| Session | iron-session (encrypted cookie) | No DB load on every request, stateless |
| Admin panel | Custom, not CMS | Schema is 5 tables, custom fits perfectly, no lock-in |
| Winner selection | Ticket ID lookup (manual) | Admin enters winning ticket number from YouTube/Facebook draw into search. System validates and confirms. |
| Ticket assignment | Sequential per competition | Predictable, simple UX, easy to verify |
| Wrong answer handling | Retry with different question | Legal compliance + good UX |
| Translation DB fields | Per-table columns (en/pl/ro/bg) | Simpler than translation tables for only 4 langs |
| File storage | Cloudflare R2 | S3-compatible, free egress, cheap |
| Deployment | Vercel + Neon Postgres | Managed, scalable, zero-ops |
| DB backup | Neon PITR (Launch: 7d) + nightly pg_dump → R2 | Two-layer defence, ~$0.05/mo for dumps, covers both accidents and provider failures |
