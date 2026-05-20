import type { ReactNode } from "react";

export interface Competition {
  title: string;
  subtitle: string;
  category: string;
  badgeColor: string;
  sold: number;
  max: number;
  left: number;
  drawDate: string;
  price: string;
  img: string;
}

export const competitions: Competition[] = [
  {
    title: "Cartier Love Bracelet",
    subtitle: "18K Rose Gold · Size 17",
    category: "Jewellery",
    badgeColor: "bg-badge-jewellery",
    sold: 387,
    max: 400,
    left: 13,
    drawDate: "28 May 2026",
    price: "£1.99",
    img: "/plan/images/cartier.avif",
  },
  {
    title: "iPhone 16 Pro Max",
    subtitle: "256GB · Desert Titanium",
    category: "Electronics",
    badgeColor: "bg-badge-electronics",
    sold: 234,
    max: 500,
    left: 266,
    drawDate: "3 Jun 2026",
    price: "£1.99",
    img: "/plan/images/iphone.jpg",
  },
  {
    title: "£5,000 Cash Prize",
    subtitle: "Direct bank transfer",
    category: "Cash",
    badgeColor: "bg-badge-cash",
    sold: 712,
    max: 1000,
    left: 288,
    drawDate: "1 Jun 2026",
    price: "£1.99",
    img: "/plan/images/money.jpg",
  },
  {
    title: "Gucci GG Marmont Bag",
    subtitle: "Matelassé Leather · Black",
    category: "Fashion",
    badgeColor: "bg-badge-fashion",
    sold: 89,
    max: 300,
    left: 211,
    drawDate: "10 Jun 2026",
    price: "£1.99",
    img: "/plan/images/gucci.jpg",
  },
  {
    title: "Sony WH-1000XM6",
    subtitle: "Wireless Noise Cancelling",
    category: "Electronics",
    badgeColor: "bg-badge-electronics",
    sold: 156,
    max: 250,
    left: 94,
    drawDate: "5 Jun 2026",
    price: "£1.99",
    img: "/plan/images/sony.webp",
  },
  {
    title: "Rolex Datejust 36",
    subtitle: "Steel & White Gold · 2025",
    category: "Jewellery",
    badgeColor: "bg-badge-jewellery",
    sold: 428,
    max: 500,
    left: 72,
    drawDate: "30 May 2026",
    price: "£1.99",
    img: "/plan/images/rolex.png",
  },
];

export interface Winner {
  name: string;
  prize: string;
  date: string;
  img: string;
}

export const winners: Winner[] = [
  { name: "Sarah M.", prize: "iPhone 16 Pro Max", date: "12 May 2026 · London", img: "https://randomuser.me/api/portraits/women/44.jpg" },
  { name: "James K.", prize: "£5,000 Cash", date: "8 May 2026 · Manchester", img: "https://randomuser.me/api/portraits/men/32.jpg" },
  { name: "Amina R.", prize: "Cartier Love Bracelet", date: "5 May 2026 · Birmingham", img: "https://randomuser.me/api/portraits/women/68.jpg" },
  { name: "Thomas P.", prize: "Rolex Datejust 36", date: "1 May 2026 · Glasgow", img: "https://randomuser.me/api/portraits/men/75.jpg" },
  { name: "Emma L.", prize: "Gucci GG Marmont Bag", date: "28 Apr 2026 · Bristol", img: "https://randomuser.me/api/portraits/women/22.jpg" },
];

export interface FaqItem {
  q: string;
  a: ReactNode;
}

export const faqs: FaqItem[] = [
  {
    q: "What is a Skill-Based Competition?",
    a: (
      <p>
        In the UK, prize draws that rely purely on chance are classified as gambling and require a Gambling Commission licence. A{" "}
        <strong>skill-based competition</strong> is different — entrants must answer a question or complete a task requiring knowledge,
        judgment, or skill. This means the outcome depends on the entrant&apos;s ability, not just luck. Every Golden Dream Draw
        competition includes a skill question, making it fully compliant with UK law. This legal structure also allows us to offer a{" "}
        <a href="#" className="text-gold-dark underline">free postal entry route</a> for every competition.
      </p>
    ),
  },
  {
    q: "Can I enter for free?",
    a: (
      <p>
        Yes. UK law requires every paid skill-based competition to offer a <strong>free entry route</strong>. To enter by post, send
        your full name, address, date of birth, email address, the competition name, and your answer to the skill question to: Golden
        Dream Draw, Free Postal Entry, PO Box 421, Manchester M1 2AB. One entry per postcard, per competition. Entries must arrive
        before the competition closing date. Postal entries are treated exactly the same as paid entries in the draw.
      </p>
    ),
  },
  {
    q: "How are winners chosen and announced?",
    a: (
      <p>
        All eligible entries (paid and postal) are entered into a random draw performed live on our{" "}
        <strong>YouTube and Facebook channels</strong>. We use a certified random number generator and the entire process is streamed
        in real time so you can watch the winner being selected. Winners are also notified by email within 24 hours and listed on our
        Winners page.
      </p>
    ),
  },
  {
    q: "Is my payment secure?",
    a: (
      <p>
        Absolutely. All payments are processed through <strong>Stripe</strong>, a PCI DSS Level 1 certified payment provider — the
        highest level of security certification in the payments industry. We never store your full card details. We accept Visa,
        Mastercard, American Express, Apple Pay, and Google Pay.
      </p>
    ),
  },
  {
    q: "What happens if a competition doesn&apos;t sell all tickets?",
    a: (
      <p>
        If a competition doesn&apos;t sell out by the draw date, the draw still proceeds with all entries received. The odds of winning
        are based on the total number of entries, not the number of tickets available. This means entering a competition with fewer
        entries actually <strong>increases your chance of winning</strong>.
      </p>
    ),
  },
];
