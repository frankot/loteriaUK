"use server";

import { randomBytes } from "crypto";
import { getSession } from "@/lib/session";
import { MAX_TICKETS_PER_TRANSACTION } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  createCashflowsPaymentJob,
  formatPenceAsPounds,
  getCashflowsActionUrl,
  getCashflowsPaymentJobReference,
  getCashflowsPaymentReference,
  getCashflowsPaymentStatus,
  normalizeCashflowsStatus,
  toCashflowsLocale,
} from "@/lib/cashflows";

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
    const session = await getSession();
    if (!session.userId || !session.ageConfirmed) {
      return {
        error: session.userId
          ? "You must confirm your age before purchasing"
          : "Please sign in to purchase tickets",
        status: 401,
      };
    }

    if (process.env.PAYMENT_PROVIDER && process.env.PAYMENT_PROVIDER.toLowerCase() !== "cashflows") {
      return { error: "Configured payment provider is not supported", status: 500 };
    }

    if (!process.env.CASHFLOWS_CONFIGURATION_ID || !process.env.CASHFLOWS_API_KEY) {
      return { error: "Cashflows is not configured", status: 500 };
    }

    const competition = await prisma.competition.findUnique({
      where: { id: competitionId, status: "ACTIVE" },
      include: { question: { select: { id: true, correctOption: true } } },
    });

    if (!competition) {
      return { error: "Competition not found or not active", status: 404 };
    }

    if (competition.slug !== competitionSlug) {
      return { error: "Competition mismatch", status: 400 };
    }

    if (competition.drawDate < new Date()) {
      return { error: "This competition's draw has already passed", status: 400 };
    }

    if (quantity < 1 || quantity > MAX_TICKETS_PER_TRANSACTION) {
      return { error: `Quantity must be between 1 and ${MAX_TICKETS_PER_TRANSACTION}`, status: 400 };
    }

    const left = competition.maxTickets - competition.ticketsSold;
    if (left < quantity) {
      return { error: `Only ${left} ticket${left !== 1 ? "s" : ""} remaining`, status: 400 };
    }

    if (questionId && answer && competition.question) {
      if (competition.question.id !== questionId) {
        return { error: "Question mismatch — please answer the current question", status: 400 };
      }
      if (answer !== competition.question.correctOption) {
        return { error: "Incorrect answer — you must answer correctly to purchase tickets", status: 400 };
      }
    } else if (competition.question) {
      return { error: "You must answer the skill question correctly", status: 400 };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true },
    });

    const email = user?.email || session.email;
    if (!email) {
      return { error: "A verified email address is required to purchase tickets", status: 400 };
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
    const unitPricePence = Math.round(Number(competition.pricePounds) * 100);
    const amountPence = unitPricePence * quantity;
    const orderNumber = createOrderNumber();

    const payment = await prisma.payment.create({
      data: {
        provider: "CASHFLOWS",
        status: "INITIATED",
        orderNumber,
        competitionId,
        userId: session.userId,
        quantity,
        amountPence,
        currency: "GBP",
        locale,
      },
    });

    try {
      const paymentJob = await createCashflowsPaymentJob({
        type: "Payment",
        amountToCollect: formatPenceAsPounds(amountPence),
        currency: "GBP",
        locale: toCashflowsLocale(locale),
        paymentMethodsToUse: ["Card"],
        order: {
          orderNumber,
          billingIdentity: {
            emailAddress: email,
          },
        },
        parameters: {
          ReturnUrlSuccess: `${appUrl}/${locale}/competitions/${competitionSlug}/success?payment_id=${payment.id}`,
          ReturnUrlFailed: `${appUrl}/${locale}/competitions/${competitionSlug}?payment_failed=true`,
          ReturnUrlCancelled: `${appUrl}/${locale}/competitions/${competitionSlug}?payment_cancelled=true`,
          WebhookUrl: `${appUrl}/api/cashflows/webhook`,
        },
      });

      const paymentJobReference = getCashflowsPaymentJobReference(paymentJob.body);
      const paymentReference = getCashflowsPaymentReference(paymentJob.body);
      const actionUrl = getCashflowsActionUrl(paymentJob.body);
      const providerStatus = getCashflowsPaymentStatus(paymentJob.body);
      const localStatus = normalizeCashflowsStatus(providerStatus);

      if (!paymentJobReference || !actionUrl) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "PROCESSING_FAILED",
            rawCreateResponse: paymentJob.body as never,
            failedAt: new Date(),
          },
        });
        return { error: "Cashflows did not return a checkout URL", status: 500 };
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: localStatus === "INITIATED" ? "PENDING" : localStatus,
          providerPaymentJobReference: paymentJobReference,
          providerPaymentReference: paymentReference,
          providerActionUrl: actionUrl,
          rawCreateResponse: paymentJob.body as never,
        },
      });

      return { url: actionUrl, status: 200 };
    } catch (error) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "PROCESSING_FAILED",
          failedAt: new Date(),
        },
      });
      throw error;
    }
  } catch (error) {
    console.error("Cashflows checkout error:", error);
    return { error: "Failed to create checkout session", status: 500 };
  }
}

function createOrderNumber() {
  return `LOT-${Date.now()}-${randomBytes(4).toString("hex").toUpperCase()}`;
}
