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

  // ── Skill questions (seed once) ─────────────────────────────
  const existingQ = await prisma.skillQuestion.count();
  if (existingQ === 0) {
    const questions = [
      { q: "What is the capital of France?", a: "Berlin", b: "Madrid", c: "Paris", d: "Rome", correct: "C" },
      { q: "Which planet is known as the Red Planet?", a: "Venus", b: "Mars", c: "Jupiter", d: "Saturn", correct: "B" },
      { q: "What is the chemical symbol for water?", a: "H2O", b: "CO2", c: "NaCl", d: "O2", correct: "A" },
      { q: "In which year did the Titanic sink?", a: "1905", b: "1912", c: "1921", d: "1898", correct: "B" },
      { q: "Who painted the Mona Lisa?", a: "Michelangelo", b: "Raphael", c: "Leonardo da Vinci", d: "Van Gogh", correct: "C" },
      { q: "What is the largest ocean on Earth?", a: "Atlantic", b: "Indian", c: "Arctic", d: "Pacific", correct: "D" },
      { q: "How many bones are in the adult human body?", a: "186", b: "206", c: "226", d: "196", correct: "B" },
      { q: "What element does 'Au' represent?", a: "Silver", b: "Aluminium", c: "Gold", d: "Argon", correct: "C" },
      { q: "Which country is home to the kangaroo?", a: "New Zealand", b: "South Africa", c: "Australia", d: "Brazil", correct: "C" },
      { q: "What is the speed of light approximately?", a: "300,000 km/s", b: "150,000 km/s", c: "500,000 km/s", d: "1,000,000 km/s", correct: "A" },
      { q: "Who wrote 'Romeo and Juliet'?", a: "Charles Dickens", b: "William Shakespeare", c: "Jane Austen", d: "Mark Twain", correct: "B" },
      { q: "What is the smallest prime number?", a: "0", b: "1", c: "2", d: "3", correct: "C" },
      { q: "Which gas makes up most of Earth's atmosphere?", a: "Oxygen", b: "CO2", c: "Nitrogen", d: "Hydrogen", correct: "C" },
      { q: "How many sides does a hexagon have?", a: "5", b: "6", c: "7", d: "8", correct: "B" },
      { q: "What is the hardest natural substance?", a: "Gold", b: "Iron", c: "Diamond", d: "Platinum", correct: "C" },
      { q: "Which river is the longest in the world?", a: "Amazon", b: "Nile", c: "Mississippi", d: "Yangtze", correct: "B" },
      { q: "What year did World War II end?", a: "1943", b: "1944", c: "1945", d: "1946", correct: "C" },
      { q: "What is the main ingredient in guacamole?", a: "Tomato", b: "Avocado", c: "Pepper", d: "Onion", correct: "B" },
      { q: "Which animal is known as the 'King of the Jungle'?", a: "Tiger", b: "Lion", c: "Bear", d: "Elephant", correct: "B" },
      { q: "How many continents are there?", a: "5", b: "6", c: "7", d: "8", correct: "C" },
      { q: "What is the boiling point of water in Celsius?", a: "90°C", b: "100°C", c: "110°C", d: "120°C", correct: "B" },
      { q: "Who developed the theory of relativity?", a: "Newton", b: "Einstein", c: "Hawking", d: "Galileo", correct: "B" },
      { q: "What is the currency of Japan?", a: "Yuan", b: "Won", c: "Yen", d: "Ringgit", correct: "C" },
      { q: "How many players on a football (soccer) team?", a: "9", b: "10", c: "11", d: "12", correct: "C" },
      { q: "Which blood type is the universal donor?", a: "A+", b: "B-", c: "O-", d: "AB+", correct: "C" },
      { q: "What is the largest mammal?", a: "Elephant", b: "Blue Whale", c: "Giraffe", d: "Great White Shark", correct: "B" },
      { q: "In which country was pizza invented?", a: "France", b: "Spain", c: "Italy", d: "Greece", correct: "C" },
      { q: "What does HTTP stand for?", a: "HyperText Transfer Protocol", b: "High Transfer Text Protocol", c: "HyperText Transmission Process", d: "High Text Transfer Process", correct: "A" },
      { q: "How many legs does a spider have?", a: "6", b: "8", c: "10", d: "12", correct: "B" },
      { q: "Which planet is closest to the Sun?", a: "Venus", b: "Earth", c: "Mercury", d: "Mars", correct: "C" },
    ];

    for (const q of questions) {
      await prisma.skillQuestion.create({
        data: {
          questionEn: q.q,
          optionAEn: q.a,
          optionBEn: q.b,
          optionCEn: q.c,
          optionDEn: q.d,
          correctOption: q.correct,
        },
      });
    }
    console.log(`  ✓ ${questions.length} skill questions created`);
  } else {
    console.log(`  ✓ ${existingQ} questions already exist (skipped)`);
  }

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
