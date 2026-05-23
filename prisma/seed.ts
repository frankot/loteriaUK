import { PrismaClient, CompetitionStatus, EntryType, TicketStatus } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

process.loadEnvFile(".env.local");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL not set. Create .env.local with DATABASE_URL");
  process.exit(1);
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ── Admin user ──────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@goldendreandraw.com" },
    update: {},
    create: {
      email: "admin@goldendreandraw.com",
      name: "Admin",
      role: "admin",
      ageConfirmed: true,
    },
  });
  console.log(`  ✓ Admin user: ${admin.email}`);

  // ── Sample users for winners ────────────────────────────────
  const sampleUsers = [
    { name: "Sarah Mitchell", email: "sarah.m@example.com", address: "12 Oak Lane, London SW1A 1AA", phone: "+447700900001" },
    { name: "James Kowalski", email: "james.k@example.com", address: "45 Park Rd, Manchester M1 2AB", phone: "+447700900002" },
    { name: "Amina Rahman", email: "amina.r@example.com", address: "78 High St, Birmingham B1 1AA", phone: "+447700900003" },
    { name: "Thomas Price", email: "thomas.p@example.com", address: "3 Queen St, Glasgow G1 1AA", phone: "+447700900004" },
    { name: "Emma Lewis", email: "emma.l@example.com", address: "22 King Ave, Bristol BS1 1AA", phone: "+447700900005" },
  ];

  const users: Record<string, string> = {};
  for (const u of sampleUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, address: u.address, phone: u.phone },
      create: {
        email: u.email,
        name: u.name,
        address: u.address,
        phone: u.phone,
        dateOfBirth: new Date("1990-01-01"),
        ageConfirmed: true,
        role: "user",
      },
    });
    users[u.email] = user.id;
  }
  console.log(`  ✓ ${Object.keys(users).length} sample users`);

  // ── Skill questions (always re-seed) ────────────────────────
  await prisma.skillQuestion.deleteMany();
  const questions = [
    { en: "How many days are in a week?", pl: "Ile dni ma tydzień?", aEn: "5", aPl: "5", bEn: "7", bPl: "7", cEn: "9", cPl: "9", dEn: "12", dPl: "12", correct: "B" },
    { en: "What is the capital of England?", pl: "Jaka jest stolica Anglii?", aEn: "Manchester", aPl: "Manchester", bEn: "Birmingham", bPl: "Birmingham", cEn: "London", cPl: "Londyn", dEn: "Leeds", dPl: "Leeds", correct: "C" },
    { en: "What is 15 + 27?", pl: "Ile wynosi 15 + 27?", aEn: "40", aPl: "40", bEn: "42", bPl: "42", cEn: "44", cPl: "44", dEn: "46", dPl: "46", correct: "B" },
    { en: "In which year did World War II end?", pl: "W jakim roku zakończyła się II Wojna Światowa?", aEn: "1943", aPl: "1943", bEn: "1944", bPl: "1944", cEn: "1945", cPl: "1945", dEn: "1946", dPl: "1946", correct: "C" },
    { en: "What is the chemical symbol for water?", pl: "Jaki jest symbol chemiczny wody?", aEn: "H2O", aPl: "H2O", bEn: "CO2", bPl: "CO2", cEn: "NaCl", cPl: "NaCl", dEn: "O2", dPl: "O2", correct: "A" },
    { en: "What is the capital of France?", pl: "Jaka jest stolica Francji?", aEn: "Berlin", aPl: "Berlin", bEn: "Madrid", bPl: "Madryt", cEn: "Paris", cPl: "Paryż", dEn: "Rome", dPl: "Rzym", correct: "C" },
    { en: "Which planet is known as the Red Planet?", pl: "Która planeta nazywana jest Czerwoną Planetą?", aEn: "Venus", aPl: "Wenus", bEn: "Mars", bPl: "Mars", cEn: "Jupiter", cPl: "Jowisz", dEn: "Saturn", dPl: "Saturn", correct: "B" },
    { en: "How many bones are in the adult human body?", pl: "Ile kości ma dorosły człowiek?", aEn: "186", aPl: "186", bEn: "206", bPl: "206", cEn: "226", cPl: "226", dEn: "196", dPl: "196", correct: "B" },
    { en: "What element does 'Au' represent?", pl: "Jaki pierwiastek oznacza 'Au'?", aEn: "Silver", aPl: "Srebro", bEn: "Aluminium", bPl: "Aluminium", cEn: "Gold", cPl: "Złoto", dEn: "Argon", dPl: "Argon", correct: "C" },
    { en: "Which country is home to the kangaroo?", pl: "Który kraj jest ojczyzną kangurów?", aEn: "New Zealand", aPl: "Nowa Zelandia", bEn: "South Africa", bPl: "Republika Południowej Afryki", cEn: "Australia", cPl: "Australia", dEn: "Brazil", dPl: "Brazylia", correct: "C" },
    { en: "Who wrote Romeo and Juliet?", pl: "Kto napisał Romea i Julię?", aEn: "Charles Dickens", aPl: "Charles Dickens", bEn: "William Shakespeare", bPl: "William Szekspir", cEn: "Jane Austen", cPl: "Jane Austen", dEn: "Mark Twain", dPl: "Mark Twain", correct: "B" },
    { en: "What is the smallest prime number?", pl: "Jaka jest najmniejsza liczba pierwsza?", aEn: "0", aPl: "0", bEn: "1", bPl: "1", cEn: "2", cPl: "2", dEn: "3", dPl: "3", correct: "C" },
    { en: "Which gas makes up most of Earth's atmosphere?", pl: "Jaki gaz stanowi największą część atmosfery Ziemi?", aEn: "Oxygen", aPl: "Tlen", bEn: "Carbon dioxide", bPl: "Dwutlenek węgla", cEn: "Nitrogen", cPl: "Azot", dEn: "Hydrogen", dPl: "Wodór", correct: "C" },
    { en: "What is the hardest natural substance?", pl: "Jaka jest najtwardsza naturalna substancja?", aEn: "Gold", aPl: "Złoto", bEn: "Iron", bPl: "Żelazo", cEn: "Diamond", cPl: "Diament", dEn: "Platinum", dPl: "Platyna", correct: "C" },
    { en: "Which river is the longest in the world?", pl: "Która rzeka jest najdłuższa na świecie?", aEn: "Amazon", aPl: "Amazonka", bEn: "Nile", bPl: "Nil", cEn: "Mississippi", cPl: "Missisipi", dEn: "Yangtze", dPl: "Jangcy", correct: "B" },
    { en: "How many sides does a hexagon have?", pl: "Ile boków ma sześciokąt?", aEn: "5", aPl: "5", bEn: "6", bPl: "6", cEn: "7", cPl: "7", dEn: "8", dPl: "8", correct: "B" },
    { en: "What is the main ingredient in guacamole?", pl: "Jaki jest główny składnik guacamole?", aEn: "Tomato", aPl: "Pomidor", bEn: "Avocado", bPl: "Awokado", cEn: "Pepper", cPl: "Papryka", dEn: "Onion", dPl: "Cebula", correct: "B" },
    { en: "How many continents are there?", pl: "Ile jest kontynentów?", aEn: "5", aPl: "5", bEn: "6", bPl: "6", cEn: "7", cPl: "7", dEn: "8", dPl: "8", correct: "C" },
    { en: "What is the currency of Japan?", pl: "Jaka jest waluta Japonii?", aEn: "Yuan", aPl: "Yuan", bEn: "Won", bPl: "Won", cEn: "Yen", cPl: "Jen", dEn: "Ringgit", dPl: "Ringgit", correct: "C" },
    { en: "Which planet is closest to the Sun?", pl: "Która planeta jest najbliżej Słońca?", aEn: "Venus", aPl: "Wenus", bEn: "Earth", bPl: "Ziemia", cEn: "Mercury", cPl: "Merkury", dEn: "Mars", dPl: "Mars", correct: "C" },
  ];

  for (const q of questions) {
    await prisma.skillQuestion.create({
      data: {
        questionEn: q.en,
        questionPl: q.pl,
        optionAEn: q.aEn,
        optionAPl: q.aPl,
        optionBEn: q.bEn,
        optionBPl: q.bPl,
        optionCEn: q.cEn,
        optionCPl: q.cPl,
        optionDEn: q.dEn,
        optionDPl: q.dPl,
        correctOption: q.correct,
      },
    });
  }
  console.log(`  ✓ ${questions.length} skill questions created (EN + PL)`);

  // ── 6 ACTIVE competitions (matches design reference) ────────
  const compsData = [
    {
      slug: "cartier-love-bracelet",
      status: CompetitionStatus.ACTIVE,
      titleEn: "Cartier Love Bracelet",
      descEn: "The legendary Cartier Love Bracelet in 18K rose gold, size 17. A timeless symbol of devotion and luxury, featuring the iconic screw motif and included screwdriver. Handcrafted in Cartier's workshops.",
      pricePounds: "1.99",
      maxTickets: 400,
      drawDate: new Date("2026-05-28T20:00:00Z"),
      prizeImageUrl: "/images/cartier.avif",
      prizeCategory: "jewellery",
      prizeValue: "6900",
      ticketsSold: 387,
    },
    {
      slug: "iphone-16-pro-max",
      status: CompetitionStatus.ACTIVE,
      titleEn: "iPhone 16 Pro Max",
      descEn: "The latest iPhone 16 Pro Max in Desert Titanium with 256GB storage. Features the A18 Pro chip, 48MP camera system, and stunning 6.9-inch Super Retina XDR display with ProMotion.",
      pricePounds: "1.99",
      maxTickets: 500,
      drawDate: new Date("2026-06-03T20:00:00Z"),
      prizeImageUrl: "/images/iphone.jpg",
      prizeCategory: "electronics",
      prizeValue: "1199",
      ticketsSold: 234,
    },
    {
      slug: "5000-cash-prize",
      status: CompetitionStatus.ACTIVE,
      titleEn: "£5,000 Cash Prize",
      descEn: "A straight £5,000 cash prize paid directly to your bank account within 24 hours of winning. No strings attached — spend it however you like.",
      pricePounds: "1.99",
      maxTickets: 1000,
      drawDate: new Date("2026-06-01T20:00:00Z"),
      prizeImageUrl: "/images/money.jpg",
      prizeCategory: "cash",
      prizeValue: "5000",
      ticketsSold: 712,
    },
    {
      slug: "gucci-gg-marmont-bag",
      status: CompetitionStatus.ACTIVE,
      titleEn: "Gucci GG Marmont Bag",
      descEn: "The iconic Gucci GG Marmont matelassé leather shoulder bag in black. Features the signature double G hardware, sliding chain strap, and suede-like microfiber lining.",
      pricePounds: "1.99",
      maxTickets: 300,
      drawDate: new Date("2026-06-10T20:00:00Z"),
      prizeImageUrl: "/images/gucci.jpg",
      prizeCategory: "fashion",
      prizeValue: "1650",
      ticketsSold: 89,
    },
    {
      slug: "sony-wh-1000xm6",
      status: CompetitionStatus.ACTIVE,
      titleEn: "Sony WH-1000XM6",
      descEn: "The Sony WH-1000XM6 wireless noise-cancelling headphones — the gold standard in audio. Industry-leading noise cancellation, 40-hour battery life, and crystal-clear hands-free calling.",
      pricePounds: "1.99",
      maxTickets: 250,
      drawDate: new Date("2026-06-05T20:00:00Z"),
      prizeImageUrl: "/images/sony.webp",
      prizeCategory: "electronics",
      prizeValue: "379",
      ticketsSold: 156,
    },
    {
      slug: "rolex-datejust-36",
      status: CompetitionStatus.ACTIVE,
      titleEn: "Rolex Datejust 36",
      descEn: "The iconic Rolex Datejust 36 in Oystersteel and white gold. Features a stunning blue dial, fluted bezel, and the legendary Rolex calibre 3235 movement. A timeless classic.",
      pricePounds: "1.99",
      maxTickets: 500,
      drawDate: new Date("2026-05-30T20:00:00Z"),
      prizeImageUrl: "/images/rolex.png",
      prizeCategory: "jewellery",
      prizeValue: "9500",
      ticketsSold: 428,
    },
  ];

  // Delete old entries/tickets/winners/comps for clean slate
  await prisma.winner.deleteMany();
  await prisma.entry.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.competition.deleteMany();

  const competitionIds: string[] = [];
  for (const c of compsData) {
    const comp = await prisma.competition.create({ data: c });
    competitionIds.push(comp.id);
  }
  console.log(`  ✓ ${compsData.length} ACTIVE competitions`);

  // ── Tickets + Entries + Winners (5 sample winners) ──────────
  const winnerData = [
    { email: "sarah.m@example.com", slug: "iphone-16-pro-max", ticketNumber: 127, date: new Date("2026-05-12") },
    { email: "james.k@example.com", slug: "5000-cash-prize", ticketNumber: 385, date: new Date("2026-05-08") },
    { email: "amina.r@example.com", slug: "cartier-love-bracelet", ticketNumber: 42, date: new Date("2026-05-05") },
    { email: "thomas.p@example.com", slug: "rolex-datejust-36", ticketNumber: 201, date: new Date("2026-05-01") },
    { email: "emma.l@example.com", slug: "gucci-gg-marmont-bag", ticketNumber: 55, date: new Date("2026-04-28") },
  ];

  for (const w of winnerData) {
    const userId = users[w.email];
    const compId = competitionIds[compsData.findIndex((c) => c.slug === w.slug)];

    const ticket = await prisma.ticket.create({
      data: {
        competitionId: compId,
        userId,
        number: w.ticketNumber,
        status: TicketStatus.SOLD,
      },
    });

    const entry = await prisma.entry.create({
      data: {
        competitionId: compId,
        userId,
        ticketId: ticket.id,
        type: EntryType.PAID,
        answerCorrect: true,
      },
    });

    await prisma.winner.create({
      data: {
        competitionId: compId,
        userId,
        entryId: entry.id,
        notified: true,
        notifiedAt: w.date,
        createdAt: w.date,
      },
    });
  }
  console.log(`  ✓ ${winnerData.length} winners created`);

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
