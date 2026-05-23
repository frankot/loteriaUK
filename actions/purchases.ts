"use server";

import { getSession } from "@/lib/session";
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
  quantity: number
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

    // 2. Validate competition
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId, status: "ACTIVE" },
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

    if (quantity < 1 || quantity > 10) {
      return { error: "Quantity must be between 1 and 10", status: 400 };
    }

    // 3. Find user's locale for success URL
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // 4. Create Stripe Checkout Session
    const lineItemPrice = Math.round(Number(competition.pricePounds) * 100); // cents

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
              images: competition.prizeImageUrl
                ? [`${appUrl}${competition.prizeImageUrl}`]
                : undefined,
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
      success_url: `${appUrl}/en/competitions/${competitionSlug}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/en/competitions/${competitionSlug}?cancelled=true`,
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
