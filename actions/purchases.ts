"use server";

import { getSession } from "@/lib/session";
import { MAX_TICKETS_PER_TRANSACTION } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

interface CreateCheckoutResult {
  url?: string;
  error?: string;
  status: number;
}

export async function createCheckoutSession(
  competitionId: string,
  competitionSlug: string,
  quantity: number,
  locale: string,
  questionId?: string,
  answer?: string
): Promise<CreateCheckoutResult> {
  try {
    // 1. Auth check
    const session = await getSession();
    if (!session.userId || !session.ageConfirmed) {
      return {
        error: session.userId
          ? "You must confirm your age before purchasing"
          : "Please sign in to purchase tickets",
        status: 401,
      };
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return { error: "Stripe is not configured", status: 500 };
    }

    // 2. Validate competition and question
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId, status: "ACTIVE" },
      include: { question: { select: { id: true, correctOption: true } } },
    });

    if (!competition) {
      return { error: "Competition not found or not active", status: 404 };
    }

    if (competition.drawDate < new Date()) {
      return { error: "This competition's draw has already passed", status: 400 };
    }

    const left = competition.maxTickets - competition.ticketsSold;
    if (left < quantity) {
      return { error: `Only ${left} ticket${left !== 1 ? "s" : ""} remaining`, status: 400 };
    }

    if (quantity < 1 || quantity > MAX_TICKETS_PER_TRANSACTION) {
      return { error: `Quantity must be between 1 and ${MAX_TICKETS_PER_TRANSACTION}`, status: 400 };
    }

    // 3. Verify skill question answer (server-side)
    if (questionId && answer && competition.question) {
      if (competition.question.id !== questionId) {
        return { error: "Question mismatch — please answer the current question", status: 400 };
      }
      if (answer !== competition.question.correctOption) {
        return { error: "Incorrect answer — you must answer correctly to purchase tickets", status: 400 };
      }
    } else if (competition.question) {
      // Question exists but wasn't answered — possible client bypass attempt
      return { error: "You must answer the skill question correctly", status: 400 };
    }

    // 4. Fetch user email for Stripe customer_email
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true },
    });

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");

    // 5. Build price (pounds → pence)
    const lineItemPrice = Math.round(Number(competition.pricePounds) * 100);

    // 6. Build image URL for Stripe product display
    const imageUrl = competition.prizeImageUrl
      ? competition.prizeImageUrl.startsWith("http://") || competition.prizeImageUrl.startsWith("https://")
        ? competition.prizeImageUrl
        : `${appUrl}${competition.prizeImageUrl.startsWith("/") ? "" : "/"}${competition.prizeImageUrl}`
      : null;

    // Skip images when running on localhost — Stripe can't fetch them
    const finalImages = imageUrl && !imageUrl.includes("localhost") && !imageUrl.includes("127.0.0.1")
      ? [imageUrl]
      : undefined;

    // 7. Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user?.email || session.email,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: competition.titleEn,
              description: `${quantity} ticket${quantity > 1 ? "s" : ""} for ${competition.titleEn}`,
              images: finalImages,
            },
            unit_amount: lineItemPrice,
          },
          quantity,
        },
      ],
      metadata: {
        competitionId,
        userId: session.userId,
        quantity: String(quantity),
      },
      // Only redirect to success when payment is actually complete
      success_url: `${appUrl}/${locale}/competitions/${competitionSlug}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/${locale}/competitions/${competitionSlug}?cancelled=true`,
    });

    if (!checkoutSession.url) {
      return { error: "Failed to create checkout session", status: 500 };
    }

    return { url: checkoutSession.url, status: 200 };
  } catch (error) {
    console.error("Checkout session error:", error);
    return { error: "Failed to create checkout session", status: 500 };
  }
}
