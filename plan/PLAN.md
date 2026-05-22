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

## 12. Implementation Order — Granular Steps

Each step is individually testable (commit → verify → next). No step exceeds ~4 hours. Steps within the same sub-phase can be parallelised when dependencies allow.

---

### Phase 1 — Scaffold & Foundation

**Goal:** Boilerplate project, schema, i18n wiring, auth, basic layout visible.

#### 1a — Project init (≈1h)
- [ ] `npx create-next-app@latest loteria --typescript --tailwind --app`
- [ ] Configure `tsconfig.json` (strict mode, path aliases `@/`)
- [ ] Set up `globals.css` with Tailwind v4 `@import "tailwindcss"`
- [ ] Verify dev server starts, `localhost:3000` renders
- [ ] Commit: "chore: scaffold Next.js 16 with TypeScript + Tailwind v4"

#### 1b — Install all dependencies (≈30min)
- [ ] `npm install prisma @prisma/client next-intl iron-session stripe @stripe/stripe-js resend react-hook-form zod @hookform/resolvers @aws-sdk/client-s3`
- [ ] `npx shadcn@latest init` (configure components.json)
- [ ] Add core shadcn primitives: `button card dialog dropdown-menu input label select separator table tabs textarea badge`
- [ ] Commit: "chore: install deps — Prisma, next-intl, iron-session, Stripe, Resend, shadcn/ui"

#### 1c — Prisma schema + first migration (≈2h)
- [ ] Write full `prisma/schema.prisma` (all models: User, LoginCode, Competition, Ticket, Entry, Winner, SkillQuestion)
- [ ] Run `npx prisma migrate dev --name init`
- [ ] Create `src/lib/prisma.ts` (singleton client)
- [ ] Write `prisma/seed.ts`: 30 English skill questions, 1 admin user (email: admin@goldendreandraw.com), 2 sample competitions (draft)
- [ ] Run `npx prisma db seed`, verify data in Prisma Studio
- [ ] Commit: "feat: Prisma schema — all models + seed script"

#### 1d — i18n middleware + routing (≈1.5h)
- [ ] Create `messages/en.json` with skeleton keys (nav, footer, hero, buttons)
- [ ] Create `messages/pl.json`, `messages/ro.json`, `messages/bg.json` (same keys, placeholder values)
- [ ] Configure `next-intl` middleware — reads `Accept-Language`, redirects to `/[locale]`
- [ ] Create `i18n/request.ts` — loads messages for the active locale
- [ ] Wrap layout in `NextIntlClientProvider`
- [ ] Test: `/en`, `/pl`, `/ro`, `/bg` all render with correct locale string
- [ ] Commit: "feat: next-intl setup — middleware, locale routing, message files"

#### 1e — Auth: LoginCode model + API routes (≈3h)
- [ ] Write `src/lib/session.ts` — iron-session config, `getSession()`, `saveSession()`, `destroySession()`
- [ ] Create `src/app/api/auth/send-code/route.ts` — generate 6-digit code, store in LoginCode, send via Resend
- [ ] Create `src/app/api/auth/verify-code/route.ts` — check code validity, mark used, create session
- [ ] Create `src/middleware.ts` — reads session for `/profile/*` and `/admin/*` guards
- [ ] Commit: "feat: email-code auth — send-code + verify-code API routes, iron-session"

#### 1f — Auth: Login + Verify pages (≈1.5h)
- [ ] Create `src/app/[locale]/login/page.tsx` — email input + 18+ checkbox, calls `send-code` API
- [ ] Create `src/app/[locale]/login/verify/page.tsx` — 6-digit code input, auto-submit on complete, calls `verify-code` API
- [ ] Handle error states: invalid code, expired code, rate-limit hint
- [ ] Test full login flow end-to-end (dev: skip real email, log code to console)
- [ ] Commit: "feat: login + verify pages — email input, code input, session creation"

#### 1g — Basic layout shell (≈1h)
- [ ] Create `src/components/layout/header.tsx` — logo, nav links (competitions, winners, how-it-works, FAQ), language switcher, login/profile button
- [ ] Create `src/components/layout/footer.tsx` — links, free postal entry, copyright
- [ ] Create `src/components/layout/language-switcher.tsx` — locale toggle (flag icons or text)
- [ ] Wire layout into `src/app/[locale]/layout.tsx`
- [ ] Commit: "feat: layout shell — header, footer, language switcher"

**Phase 1 sign-off:** `localhost:3000` shows layout, login works (console-code mode), i18n switches locales, Prisma models exist with seed data.

---
### Phase 2 — Public Pages: Homepage

**Goal:** Homepage matches golden-dream-draw.html design with live data.

#### 2a — Hero section (≈1.5h)
- [ ] Create `src/components/public/hero.tsx` — headline, CTA button, background gradient/pattern from design ref
- [ ] Pull static text from `messages/{locale}.json` (hero title, subtitle, CTA)
- [ ] Responsive: stack vertically on mobile, full-width image on desktop
- [ ] Commit: "feat: homepage hero section"

#### 2b — Stats bar (≈1h)
- [ ] Create `src/components/public/stats-bar.tsx` — live counters: active competitions this week, total winners, prizes given, total entries
- [ ] Fetch stats from Prisma (aggregate queries: COUNT competitions WHERE ACTIVE, COUNT winners, SUM ticketsSold)
- [ ] Animate numbers on scroll into view (simple counter transition)
- [ ] Commit: "feat: homepage stats bar — live data from DB"

#### 2c — Trending competitions grid (≈2h)
- [ ] Create `src/components/public/competition-card.tsx` — card with prize image, title, price, progress bar (sold/max), time remaining
- [ ] Fetch top 6 competitions: WHERE ACTIVE, ORDER BY drawDate ASC (most urgent first)
- [ ] Carousel on mobile (horizontal scroll snap), grid on desktop
- [ ] Empty state: "No active competitions right now — check back soon"
- [ ] Commit: "feat: homepage trending competitions grid"

#### 2d — Winners section (≈1h)
- [ ] Create `src/components/public/winner-card.tsx` — avatar placeholder, name (first + initial), prize, date, city
- [ ] Create `src/components/public/winners-grid.tsx` — grid of winner cards, latest 6
- [ ] Fetch winners from DB: JOIN Winner → User → Competition
- [ ] Empty state: "No winners yet — be the first!"
- [ ] Commit: "feat: homepage winners section"

#### 2e — FAQ accordion (≈1h)
- [ ] Create accordion component (or use shadcn `Accordion`)
- [ ] Hard-code FAQ items in `messages/{locale}.json` (5-7 items: what is this, is it a lottery, how do I enter, how are winners picked, free postal entry, age limit, when do I get my prize)
- [ ] Wire into homepage bottom section
- [ ] Commit: "feat: homepage FAQ accordion"

**Phase 2 sign-off:** Homepage complete — hero, stats (live), competitions (live), winners (live), FAQ.

---

### Phase 3 — Public Pages: Competitions Detail + Purchase Flow

**Goal:** User can browse competitions, view details, answer a skill question, and buy tickets.

#### 3a — Competitions list page (≈2h)
- [ ] Create `src/app/[locale]/competitions/page.tsx` — grid of competition cards
- [ ] Fetch all competitions WHERE ACTIVE, paginated (12 per page)
- [ ] Filter by prize category (dropdown in header of list)
- [ ] Empty state + loading skeleton
- [ ] Commit: "feat: competitions list page with pagination + category filter"

#### 3b — Competition detail page shell (≈1.5h)
- [ ] Create `src/app/[locale]/competitions/[slug]/page.tsx` — dynamic route
- [ ] Fetch competition by slug: title, description, prize image, price, max tickets, tickets sold, draw date
- [ ] Display prize hero image, title (locale-aware), description (locale-aware), prize value badge
- [ ] Buy section placeholder: quantity selector + skill question + buy button (non-functional yet)
- [ ] 404 page if slug not found
- [ ] Commit: "feat: competition detail page — prize info, progress bar shell"

#### 3c — Progress bar + countdown timer (≈1h)
- [ ] Create `src/components/public/progress-bar.tsx` — ticketsSold/maxTickets, percentage bar, animated
- [ ] Create countdown timer component — time remaining until drawDate, auto-updates every second
- [ ] States: sold out (100%), expiring soon (<24h), past draw date
- [ ] Commit: "feat: progress bar + countdown timer"

#### 3d — Ticket quantity selector (≈1h)
- [ ] Create `src/components/public/ticket-selector.tsx` — stepper (min 1, max 10 or remaining tickets)
- [ ] Price display: updates in real-time (quantity × ticket price)
- [ ] Constraint: cannot exceed `maxTickets - ticketsSold`
- [ ] Commit: "feat: ticket quantity selector with live price"

#### 3e — Skill question component (≈2.5h)
- [ ] Create `src/components/public/skill-question.tsx` — renders 4 options (A/B/C/D) as radio buttons
- [ ] Fetch random question from the competition's assigned question pool
- [ ] On wrong answer: show "Incorrect" feedback → auto-load a different question from pool
- [ ] On correct answer: mark as passed, unlock Buy button
- [ ] Track answered questions in client state (avoid repeats in same session)
- [ ] Edge case: no more questions in pool → fallback message
- [ ] Commit: "feat: skill question component with retry (different question) + pass/fail flow"

#### 3f — Stripe Checkout Server Action (≈2h)
- [ ] Create `src/actions/purchases.ts` — `createCheckoutSession(competitionSlug, quantity, userId)`
- [ ] Server Action validates: competition ACTIVE, enough tickets, correct answer flag
- [ ] Creates Stripe Checkout Session with `line_items` (dynamic price × quantity) and metadata
- [ ] Returns session URL → client redirects to Stripe
- [ ] Wire into Buy button on competition detail page
- [ ] Commit: "feat: Stripe Checkout Session creation — Server Action + redirect"

#### 3g — Stripe webhook handler (≈3h)
- [ ] Create `src/app/api/stripe/webhook/route.ts` — verify signature with `stripe.webhooks.constructEvent`
- [ ] Handle `checkout.session.completed`:
  - [ ] Extract metadata (competitionId, userId, ticketCount, correctAnswer flag)
  - [ ] Prisma transaction: create N tickets (sequential numbers), create N entries, increment ticketsSold
  - [ ] If tickets sold out: rollback + email user
- [ ] Handle `checkout.session.expired`: log + no-op (user can retry)
- [ ] Send confirmation email via Resend (`src/components/email/purchase-confirmation.tsx`)
- [ ] Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] Commit: "feat: Stripe webhook — ticket assignment, entry creation, confirmation email"

#### 3h — Post-purchase success page (≈1h)
- [ ] Create `src/app/[locale]/competitions/[slug]/success/page.tsx` — reads `?session_id=xxx`
- [ ] Verify session with Stripe SDK (retrieve session by ID)
- [ ] Show: checkmark animation, ticket numbers purchased, competition title, "Check your email"
- [ ] CTA buttons: "View My Tickets" → /profile, "Browse More" → /competitions
- [ ] Commit: "feat: purchase success page with ticket numbers"

**Phase 3 sign-off:** Full purchase flow works end-to-end — browse → detail → skill question → Stripe checkout → webhook → ticket creation → success page.

---

### Phase 4 — Profile, Registration, Free Postal Entry

**Goal:** User account management, first-time registration, postal entry compliance.

#### 4a — Registration page (≈1.5h)
- [ ] Create `src/app/[locale]/register/page.tsx` — form: full name, address, phone, date of birth, 18+ checkbox
- [ ] Validate with Zod: all required, DOB ≥ 18 years ago, phone UK format
- [ ] POST to Server Action that creates User (all fields), issues session cookie
- [ ] Redirect logic: first-time user (no existing User record) → /register after verify-code
- [ ] Commit: "feat: registration page — name, address, phone, DOB, age confirmation"

#### 4b — Profile page (≈2h)
- [ ] Create `src/app/[locale]/profile/page.tsx` — protected (middleware redirects to /login if no session)
- [ ] Fetch user's tickets: grouped by competition, show ticket numbers, purchase date
- [ ] Fetch user's entry history: competition name, type (paid/postal), answer correct, date
- [ ] Empty state: "You haven't entered any competitions yet"
- [ ] Commit: "feat: profile page — ticket list, entry history"

#### 4c — Profile settings (≈1h)
- [ ] Create `src/app/[locale]/profile/settings/page.tsx` — pre-filled form with user's current data
- [ ] Editable fields: name, address, phone
- [ ] Server Action updates User record
- [ ] Success toast + redirect back to /profile
- [ ] Commit: "feat: profile settings — edit name, address, phone"

#### 4d — Free postal entry page (≈1h)
- [ ] Create `src/app/[locale]/free-postal-entry/page.tsx` — static page with instructions
- [ ] Content: address to send postcard to, required fields (name, address, email, DOB, competition name, answer), deadline rule (must arrive before draw date), legal note "equal chance"
- [ ] Footer link to this page
- [ ] Commit: "feat: free postal entry instructions page"

#### 4e — Admin: Add postal entry (≈1.5h)
- [ ] Create form on `/admin/competitions/[id]/entries` — "Add Postal Entry" button opens modal/dialog
- [ ] Form fields: name, address, email, DOB, answer (A/B/C/D)
- [ ] Backend: create Entry with `type: POSTAL`, evaluate answer → `answerCorrect: true/false`
- [ ] Subscription check: find-or-create User by email, flag `ageConfirmed: true`
- [ ] Commit: "feat: admin postal entry form — create Entry with answer evaluation"

#### 4f — Admin: Edit user (≈1h)
- [ ] Create `src/app/[locale]/admin/users/[id]/edit/page.tsx` — form pre-filled with user's name, address, phone, DOB
- [ ] Server Action updates any field
- [ ] Commit: "feat: admin edit user — name, address, phone, DOB"

**Phase 4 sign-off:** Register/login flow complete for new users, profile shows personal data + tickets, postal entry page live, admin can manually add postal entries.

---

### Phase 5 — Admin Panel: Competitions & Questions

**Goal:** Admin can create/edit competitions, manage skill questions, upload images.

#### 5a — Admin login (≈1h)
- [ ] Create `src/app/[locale]/admin/login/page.tsx` — same email-code flow but checks `role === 'admin'`
- [ ] Admin middleware check on all `/admin/*` routes (redirect non-admins to /)
- [ ] Commit: "feat: admin login — role-checked email-code auth"

#### 5b — Admin dashboard (≈1.5h)
- [ ] Create `src/app/[locale]/admin/page.tsx` — stats cards
- [ ] Fetch: active competitions count, entries this month, revenue (sum of ticket prices sold this month), pending draws (CLOSED competitions past drawDate without winner)
- [ ] Quick-action buttons: New Competition, View Entries, Assign Winners
- [ ] Commit: "feat: admin dashboard — stats cards, quick actions"

#### 5c — Competitions CRUD: List + Create (≈2.5h)
- [ ] Create `src/app/[locale]/admin/competitions/page.tsx` — DataTable: title, slug, price, tickets (sold/max), draw date, status badge
- [ ] Search by title/slug, filter by status
- [ ] Create `src/app/[locale]/admin/competitions/new/page.tsx` — form with all fields (title EN/PL/RO/BG, slug auto-gen, description 4-lang, price, max tickets, draw date, prize category, prize value, prize image upload, question selector, status dropdown)
- [ ] Server Action creates competition in DB
- [ ] Validation: price > 0, maxTickets > 0, drawDate in future, required fields
- [ ] Commit: "feat: admin competitions — list DataTable + create form"

#### 5d — Competitions CRUD: Edit + Delete (≈1.5h)
- [ ] Create `src/app/[locale]/admin/competitions/[id]/edit/page.tsx` — same form as create, pre-filled
- [ ] Create delete action — soft delete (set status to CANCELLED) with confirmation dialog
- [ ] Handle concurrency: if ticketsSold > 0, disallow price/maxTickets changes, show warning
- [ ] Commit: "feat: admin competitions — edit form + soft delete"

#### 5e — Image upload to Cloudflare R2 (≈1.5h)
- [ ] Configure `src/lib/r2.ts` — S3 client with R2 credentials
- [ ] Create Server Action: `uploadFile(file: FormData)` → uploads to R2 bucket → returns public URL
- [ ] Wire into competition form (prize image upload)
- [ ] Show preview after upload, allow replace/remove
- [ ] Commit: "feat: Cloudflare R2 image upload — competition prize images"

#### 5f — Questions CRUD (≈2h)
- [ ] Create `src/app/[locale]/admin/questions/page.tsx` — DataTable: question EN, options preview, correct answer, actions
- [ ] Create `src/app/[locale]/admin/questions/new/page.tsx` — form: question text (4 langs), options A/B/C/D (4 langs), correct answer radio
- [ ] Create `src/app/[locale]/admin/questions/[id]/edit/page.tsx` — pre-filled edit form
- [ ] Server Actions: create, update, delete (cascade — warn if question assigned to active competition)
- [ ] Commit: "feat: admin questions CRUD — multi-lang skill questions"

**Phase 5 sign-off:** Admin can manage competitions (with images) and skill questions end-to-end.

---

### Phase 6 — Admin Panel: Entries, Draw & Winners

**Goal:** Admin can view entries, run the draw, assign winners, manage notifications.

#### 6a — Entries list per competition (≈2h)
- [ ] Create `src/app/[locale]/admin/competitions/[id]/entries/page.tsx` — DataTable with columns: user email, name, ticket number, entry type (paid/postal), answer correct, created date
- [ ] Search by email or name
- [ ] Filter: by entry type dropdown, by answer correctness dropdown
- [ ] Pagination (50 per page)
- [ ] Commit: "feat: admin entries list — DataTable with search + filters"

#### 6b — CSV export (≈1h)
- [ ] Create `src/app/[locale]/admin/competitions/[id]/entries/export/route.ts` — Server Action generates CSV
- [ ] CSV columns: email, name, ticketNumber, type, answerCorrect, createdAt
- [ ] Use `src/lib/csv.ts` helper — streams CSV response with content-disposition header
- [ ] Button on entries page triggers download
- [ ] Commit: "feat: CSV export for competition entries"

#### 6c — Draw + Assign Winner flow (≈2.5h)
- [ ] Create `src/app/[locale]/admin/competitions/[id]/assign-winner/page.tsx`
- [ ] Pre-condition check: competition status === CLOSED, no winner yet (redirect/error if not)
- [ ] Search input: admin types ticket number → calls Server Action to find Ticket + User + Entry
- [ ] Result preview: ticket #, user email + name, entry type, answer correctness badge
- [ ] Validation: ticket belongs to this competition, entry has answerCorrect === true, ticket status === SOLD
- [ ] Confirm button → creates Winner record → sets competition status to DRAWN
- [ ] Error states: ticket not found, wrong competition, wrong answer, already assigned
- [ ] Commit: "feat: assign winner — ticket ID lookup, validation, winner creation"

#### 6d — Winner notification email (≈1h)
- [ ] Create `src/components/email/winner-notification.tsx` — React Email template: congratulations, prize name, claim instructions, deadline (14 days)
- [ ] On winner assignment: auto-send via Resend
- [ ] Log sent status on Winner record (`notified: true`, `notifiedAt: now()`)
- [ ] Commit: "feat: winner notification email — auto-send on assign"

#### 6e — Winners management page (≈1.5h)
- [ ] Create `src/app/[locale]/admin/winners/page.tsx` — DataTable: competition, user, ticket number, notified status, claimed status, date
- [ ] Toggle notified: re-sends email (with "Reminder" subject)
- [ ] Toggle claimed: marks `claimed: true`, `claimedAt: now()`
- [ ] Handle redraw: button to delete Winner record → sets competition back to CLOSED → admin can assign again
- [ ] Commit: "feat: admin winners management — notify, claim, redraw"

#### 6f — Users list + entry history modal (≈1.5h)
- [ ] Create `src/app/[locale]/admin/users/page.tsx` — DataTable: email, name, phone, entries count, created date
- [ ] Click row → modal/dialog shows entry history: competition name, ticket numbers, entry type, date
- [ ] Search by email or name
- [ ] Commit: "feat: admin users list with entry history modal"

**Phase 6 sign-off:** Full admin panel complete — entries, CSV export, draw/winner assignment, winner management, users.

---

### Phase 7 — i18n Content & Translation

**Goal:** All static UI translated, DB content localised, Polish verified.

#### 7a — Extract static UI strings (≈2h)
- [ ] Audit every page/component for hardcoded English strings
- [ ] Move all strings to `messages/{locale}.json` with descriptive keys (nested by page)
- [ ] Ensure Server Components use `next-intl` `getTranslations()`, Client Components use `useTranslations()`
- [ ] Commit: "i18n: extract all static UI strings to JSON message files"

#### 7b — AI translation of PL, RO, BG (≈1h script + 1d async)
- [ ] Write extraction script: read `messages/en.json` → outputs CSV of keys + EN values
- [ ] Send CSV to GPT-4o / DeepL for PL, RO, BG translations
- [ ] Import translations back into `messages/pl.json`, `messages/ro.json`, `messages/bg.json`
- [ ] Commit: "i18n: AI-translated PL, RO, BG message files"

#### 7c — Verify Polish manually (≈2h)
- [ ] Polish-speaking developer reviews every string in `messages/pl.json`
- [ ] Fix tone, phrasing, legal accuracy (especially: "skill competition", "free postal entry", "draw")
- [ ] Commit: "i18n: polish polish translation (PL verified)"

#### 7d — Seed multi-lang questions + competitions (≈2h)
- [ ] Extend `prisma/seed.ts` — add PL/RO/BG translations for all 30 skill questions (use AI, verify PL)
- [ ] Add 3 sample competitions with fully translated titles, descriptions, images
- [ ] Re-seed: `npx prisma db seed` → verify all 4 locales render correctly on public pages
- [ ] Commit: "feat: seed 30 multi-lang questions + 3 sample competitions"

**Phase 7 sign-off:** All user-facing strings translated. Polish verified. Demo data in 4 languages.

---

### Phase 8 — Polish, Responsive, Error States

**Goal:** Production-quality UX — loading, empty, error, edge cases, mobile.

#### 8a — Loading skeletons (≈1.5h)
- [ ] Add `loading.tsx` for every route group: competitions, competition detail, profile, admin pages
- [ ] Skeleton components: card skeleton, table skeleton, form skeleton
- [ ] Ensure no layout shift on page transitions
- [ ] Commit: "ux: loading skeletons for all route groups"

#### 8b — Error boundaries (≈1h)
- [ ] Add `error.tsx` for every route group — friendly error message, retry button, support email
- [ ] Add global error boundary in root layout
- [ ] Commit: "ux: error boundaries — per-route + global"

#### 8c — Empty states (≈1h)
- [ ] Audit all lists/tables for empty state handling: no competitions, no winners, no entries, no tickets, no search results
- [ ] Design consistent empty state component: illustration + message + CTA (e.g. "Browse competitions")
- [ ] Commit: "ux: empty states — all lists/tables"

#### 8d — Responsive audit (≈2h)
- [ ] Test every page at: 375px (mobile), 768px (tablet), 1280px (desktop), 1920px (wide)
- [ ] Fix: overflowing tables, broken grid, too-small touch targets, overlapping elements
- [ ] Ensure admin DataTable scrolls horizontally on mobile
- [ ] Commit: "fix: responsive audit — mobile, tablet, desktop"

#### 8e — Error & edge case hardening (≈2h)
- [ ] Stripe: handle expired session, insufficient tickets race condition, webhook timeout, duplicate webhook events (idempotency)
- [ ] Auth: expired code, too many attempts (rate-limit), session expiry mid-flow, concurrent login
- [ ] Competition: sold-out mid-purchase, drawDate passed while user is buying, deleted competition with active stripe session
- [ ] Winner: duplicate assignment race condition, notify-fail retry
- [ ] Commit: "fix: error hardening — Stripe, auth, competition edge cases"

**Phase 8 sign-off:** UX complete — loading, error, empty states covered. Responsive across all breakpoints.

---

### Phase 9 — Production Infrastructure

**Goal:** Production database, file storage, email, monitoring, deployment.

#### 9a — Set up Neon PostgreSQL (≈1h)
- [ ] Create Neon project (Launch tier, $5-10/mo)
- [ ] Copy connection string to `.env.local`
- [ ] Run migration: `npx prisma migrate deploy`
- [ ] Run seed on production: `npx prisma db seed`
- [ ] Verify with Prisma Studio connected to production DB

#### 9b — Set up Cloudflare R2 bucket (≈1h)
- [ ] Create R2 bucket: `golden-dream-draw`
- [ ] Generate access keys (access key ID + secret access key)
- [ ] Configure bucket as public (or use R2.dev custom domain)
- [ ] Set CORS policy for Vercel domain
- [ ] Add R2 env vars to `.env.local` and Vercel
- [ ] Test upload via admin competition form → confirm URL accessible

#### 9c — Configure Stripe webhook (≈30min)
- [ ] Create webhook endpoint in Stripe Dashboard: URL = production domain + `/api/stripe/webhook`
- [ ] Subscribe to events: `checkout.session.completed`, `checkout.session.expired`
- [ ] Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET` env var
- [ ] Test with Stripe CLI against production endpoint

#### 9d — Configure Resend (≈30min)
- [ ] Add domain in Resend dashboard → verify DKIM
- [ ] Copy API key to `RESEND_API_KEY` env var
- [ ] Send test email to confirm deliverability

#### 9e — Nightly backup cron job (≈1h)
- [ ] Create `src/app/api/cron/backup/route.ts` — `pg_dump` piped to R2
- [ ] Configure Vercel Cron: `"schedule": "0 3 * * *"`
- [ ] Create separate R2 bucket: `golden-dream-draw-backups`
- [ ] Set lifecycle policy: retain 30 daily, promote monthly to long-term
- [ ] Test: trigger cron manually, verify dump file appears in R2

#### 9f — Deploy to Vercel (≈1h)
- [ ] Push to GitHub (main branch)
- [ ] Import repo into Vercel
- [ ] Configure all environment variables in Vercel dashboard
- [ ] Deploy → verify: homepage, login, competitions, purchase flow, admin
- [ ] Set custom domain: `goldendreandraw.com` (or chosen name)
- [ ] Enable Vercel Analytics + Speed Insights

**Phase 9 sign-off:** Production site live on Vercel with real DB, file storage, email, backups.

---

### Phase 10 — Legal, Monitoring & Launch

**Goal:** Legal compliance, monitoring, final QA, launch readiness.

#### 10a — Monitoring setup (≈1h)
- [ ] Set up Sentry (or Vercel Observability): error tracking, performance monitoring
- [ ] Set up uptime monitoring (Better Uptime, Pingdom, or Vercel Status)
- [ ] Configure alerts: Stripe webhook failures, auth failures, error rate spike
- [ ] Add health check endpoint: `GET /api/health` → checks DB connection + Stripe ping

#### 10b — Legal pages (≈2h)
- [ ] Create `src/app/[locale]/terms/page.tsx` — Terms & Conditions (lawyer-reviewed template adapted for skill competitions)
- [ ] Create `src/app/[locale]/privacy/page.tsx` — Privacy Policy (UK GDPR compliant, covers data retention, deletion)
- [ ] Create `src/app/[locale]/postal-terms/page.tsx` — Free postal entry terms (address, deadlines, no-purchase-necessary wording)
- [ ] Footer links to all legal pages
- [ ] Commit: "feat: legal pages — T&Cs, privacy, postal entry terms"

#### 10c — Email template finalisation (≈1h)
- [ ] Review all 4 email templates in React Email: login-code, purchase-confirmation, winner-notification, redraw-notice
- [ ] Add locale-aware subject lines and body
- [ ] Send test emails to self in all 4 languages
- [ ] Commit: "feat: email templates — finalise locale-aware transactional emails"

#### 10d — Load testing (≈2h)
- [ ] Write load test script (k6 or autocannon) for: competition listing, competition detail, Stripe webhook
- [ ] Target: 50 concurrent users browsing, 10 concurrent purchases
- [ ] Verify: no DB connection pool exhaustion, no Stripe rate-limit hits, response times < 500ms
- [ ] Tune Prisma connection pool size if needed
- [ ] Document results in project wiki

#### 10e — Final QA pass (≈3h)
- [ ] Full regression walkthrough:
  - [ ] New user: login → verify → register → browse → buy → check profile
  - [ ] Returning user: login → buy → check tickets
  - [ ] Wrong answer → retry with different question → correct → buy
  - [ ] Postal entry admin flow
  - [ ] Admin: create competition → upload image → set question → activate
  - [ ] Admin: view entries → CSV export → assign winner → notify → claim
  - [ ] Admin: redraw → reassign
  - [ ] i18n: switch to PL, RO, BG → all pages render translated
  - [ ] Mobile: login, buy, admin table scroll
  - [ ] Error states: wrong code, expired session, sold-out competition, 404 slug
- [ ] Create QA checklist in project wiki / Notion
- [ ] Fix all bugs found → re-test

#### 10f — Launch checklist (≈30min)
- [ ] `STRIPE_WEBHOOK_SECRET` updated to production secret
- [ ] `RESEND_API_KEY` updated to production key (not test mode)
- [ ] Cloudflare R2 bucket public URL correct
- [ ] Neon DB on Launch tier (not Free)
- [ ] Domain DNS propagated
- [ ] SSL certificate active (Vercel auto)
- [ ] Legal pages reviewed by solicitor
- [ ] Backup cron confirmed running
- [ ] Monitoring alerts active
- [ ] 🚀 Dance

**Phase 10 sign-off:** 🚀 Production launch.

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
