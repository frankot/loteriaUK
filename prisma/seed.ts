import { PrismaClient, CompetitionStatus } from "@prisma/client";
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

  // Use upsert on the first question to check — if it exists, skip seeding questions
  const existing = await prisma.skillQuestion.count();
  if (existing === 0) {
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
    console.log(`  ✓ ${existing} questions already exist (skipped)`);
  }

  await prisma.competition.upsert({
    where: { slug: "apple-watch-series-10" },
    update: {},
    create: {
      slug: "apple-watch-series-10",
      status: CompetitionStatus.DRAFT,
      titleEn: "Apple Watch Series 10",
      descEn: "Win the latest Apple Watch Series 10 with health monitoring, always-on display, and all-day battery life.",
      pricePounds: 1.99,
      maxTickets: 500,
      drawDate: new Date("2026-07-01T20:00:00Z"),
      prizeCategory: "electronics",
      prizeValue: 399,
    },
  });

  await prisma.competition.upsert({
    where: { slug: "rolex-submariner" },
    update: {},
    create: {
      slug: "rolex-submariner",
      status: CompetitionStatus.DRAFT,
      titleEn: "Rolex Submariner",
      descEn: "A chance to win a genuine Rolex Submariner Date 41mm in Oystersteel.",
      pricePounds: 2.99,
      maxTickets: 1000,
      drawDate: new Date("2026-07-15T20:00:00Z"),
      prizeCategory: "jewellery",
      prizeValue: 9500,
    },
  });

  console.log(`  ✓ 2 sample competitions created (DRAFT)`);
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
