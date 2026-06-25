import { prisma } from "@/lib/prisma";
import resend, { FROM_AUTH, ADMIN_NOTIFICATION_EMAIL } from "@/lib/resend";
import { purchaseConfirmationHtml, adminPurchaseNotificationHtml } from "@/lib/email-templates";
import { revalidateTag } from "next/cache";
import {
  getCashflowsAmountPence,
  getCashflowsCurrency,
  getCashflowsPaymentStatus,
  normalizeCashflowsStatus,
  retrieveCashflowsPayment,
} from "@/lib/cashflows";

export interface ProcessResult {
  success: boolean;
  ticketNumbers?: number[];
  alreadyProcessed?: boolean;
  error?: string;
  status: number; // HTTP status for route callers
}

interface CompletePaidPurchaseInput {
  paymentId: string;
  idempotencyKey: string;
  competitionId: string;
  userId: string;
  quantity: number;
  amountPence: number;
}

export async function completePaidPurchase({
  paymentId,
  idempotencyKey,
  competitionId,
  userId,
  quantity,
  amountPence,
}: CompletePaidPurchaseInput): Promise<ProcessResult> {
  const existingEntry = await prisma.entry.findFirst({
    where: { paymentId },
    select: { id: true },
  });

  if (existingEntry) {
    const existingTickets = await prisma.ticket.findMany({
      where: { entry: { paymentId } },
      select: { number: true },
      orderBy: { number: "asc" },
    });

    console.log(`Payment ${paymentId} already processed — returning existing tickets`);
    return {
      success: true,
      alreadyProcessed: true,
      ticketNumbers: existingTickets.map((ticket) => ticket.number),
      status: 200,
    };
  }

  const result = await prisma.$queryRaw<{ tickets_sold: number }[]>`
    UPDATE competitions
    SET "ticketsSold" = "ticketsSold" + ${quantity}
    WHERE id = ${competitionId}
      AND status = 'ACTIVE'
      AND ("ticketsSold" + ${quantity}) <= "maxTickets"
    RETURNING "ticketsSold" AS tickets_sold
  `;

  if (result.length === 0) {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { status: true, ticketsSold: true, maxTickets: true },
    });

    const reason = !competition
      ? "Competition not found"
      : competition.status !== "ACTIVE"
        ? `Competition not active (status: ${competition.status})`
        : `Capacity exceeded: need ${quantity}, only ${competition.maxTickets - competition.ticketsSold} left`;

    console.error(`Purchase processing failed for ${idempotencyKey}: ${reason}`);
    return { success: false, error: reason, status: 500 };
  }

  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    select: { maxTickets: true },
  });
  const maxTickets = competition?.maxTickets ?? 0;

  const takenRows = await prisma.ticket.findMany({
    where: { competitionId },
    select: { number: true },
  });
  const taken = new Set(takenRows.map((ticket) => ticket.number));

  const available: number[] = [];
  for (let number = 1; number <= maxTickets; number++) {
    if (!taken.has(number)) available.push(number);
  }

  if (available.length < quantity) {
    console.error(
      `Not enough free ticket numbers: need ${quantity}, only ${available.length} available — payment ${paymentId}`
    );
    await rollbackTicketsSold(competitionId, quantity);
    return { success: false, error: "Not enough free ticket numbers", status: 500 };
  }

  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  const ticketNumbers = available.slice(0, quantity);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.ticket.createMany({
        data: ticketNumbers.map((number) => ({
          competitionId,
          userId,
          number,
          status: "SOLD" as const,
        })),
      });

      const createdTickets = await tx.ticket.findMany({
        where: {
          competitionId,
          number: { in: ticketNumbers },
        },
        select: { id: true },
      });

      if (createdTickets.length !== ticketNumbers.length) {
        throw new Error(`Ticket creation mismatch: expected ${ticketNumbers.length}, got ${createdTickets.length}`);
      }

      await tx.entry.createMany({
        data: createdTickets.map((ticket) => ({
          competitionId,
          userId,
          ticketId: ticket.id,
          paymentId,
          type: "PAID" as const,
          answerCorrect: true,
        })),
      });
    });

    console.log(
      `Purchase complete: user=${userId} comp=${competitionId} tickets=[${ticketNumbers.join(",")}] payment=${paymentId}`
    );

    revalidatePurchaseCaches();

    sendPurchaseEmails({ userId, competitionId, ticketNumbers, quantity, amountPence }).catch((error) => {
      console.error("Failed to send purchase emails:", error);
    });

    return { success: true, ticketNumbers, status: 200 };
  } catch (error) {
    console.error(`Ticket/entry creation failed for payment ${paymentId}:`, error);
    await rollbackTicketsSold(competitionId, quantity);
    console.log(`Rolled back ticketsSold for failed payment ${paymentId}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ticket creation failed",
      status: 500,
    };
  }
}

export async function processCashflowsPayment(
  paymentJobReference: string,
  paymentReference: string
): Promise<ProcessResult> {
  let statusResponse: Awaited<ReturnType<typeof retrieveCashflowsPayment>>;

  try {
    statusResponse = await retrieveCashflowsPayment(paymentJobReference, paymentReference);
  } catch (error) {
    console.error(`Failed to retrieve Cashflows payment ${paymentJobReference}/${paymentReference}:`, error);
    return { success: false, error: "Failed to retrieve Cashflows payment", status: 500 };
  }

  const payment = await prisma.payment.findFirst({
    where: {
      provider: "CASHFLOWS",
      providerPaymentJobReference: paymentJobReference,
    },
  });

  if (!payment) {
    console.error("Cashflows webhook references unknown local payment", { paymentJobReference, paymentReference });
    return { success: false, error: "Unknown payment reference", status: 200 };
  }

  const remoteAmountPence = getCashflowsAmountPence(statusResponse.body);
  if (remoteAmountPence != null && remoteAmountPence !== payment.amountPence) {
    console.error("Cashflows payment amount mismatch", {
      paymentId: payment.id,
      expected: payment.amountPence,
      received: remoteAmountPence,
    });
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "PROCESSING_FAILED",
        rawLastStatusResponse: statusResponse.body as never,
        failedAt: new Date(),
      },
    });
    return { success: false, error: "Payment amount mismatch", status: 500 };
  }

  const remoteCurrency = getCashflowsCurrency(statusResponse.body);
  if (remoteCurrency && remoteCurrency.toUpperCase() !== payment.currency.toUpperCase()) {
    console.error("Cashflows payment currency mismatch", {
      paymentId: payment.id,
      expected: payment.currency,
      received: remoteCurrency,
    });
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "PROCESSING_FAILED",
        rawLastStatusResponse: statusResponse.body as never,
        failedAt: new Date(),
      },
    });
    return { success: false, error: "Payment currency mismatch", status: 500 };
  }

  if (payment.providerPaymentReference && payment.providerPaymentReference !== paymentReference) {
    console.error("Cashflows payment reference mismatch", {
      paymentId: payment.id,
      expected: payment.providerPaymentReference,
      received: paymentReference,
    });
    return { success: false, error: "Payment reference mismatch", status: 200 };
  }

  const cashflowsStatus = getCashflowsPaymentStatus(statusResponse.body);
  const localStatus = normalizeCashflowsStatus(cashflowsStatus);

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: localStatus,
      providerPaymentReference: payment.providerPaymentReference ?? paymentReference,
      rawLastStatusResponse: statusResponse.body as never,
      paidAt: localStatus === "PAID" ? payment.paidAt ?? new Date() : payment.paidAt,
      failedAt: ["FAILED", "CANCELLED", "EXPIRED", "PROCESSING_FAILED"].includes(localStatus)
        ? payment.failedAt ?? new Date()
        : payment.failedAt,
    },
  });

  if (localStatus !== "PAID") {
    console.log("Cashflows payment not paid — no ticket allocation", {
      paymentId: payment.id,
      status: cashflowsStatus,
      localStatus,
    });
    return { success: false, error: `Payment not paid (status: ${cashflowsStatus ?? "unknown"})`, status: 200 };
  }

  return completePaidPurchase({
    paymentId: updatedPayment.id,
    idempotencyKey: `${paymentJobReference}/${paymentReference}`,
    competitionId: updatedPayment.competitionId,
    userId: updatedPayment.userId,
    quantity: updatedPayment.quantity,
    amountPence: updatedPayment.amountPence,
  });
}

async function rollbackTicketsSold(competitionId: string, quantity: number) {
  await prisma.competition.update({
    where: { id: competitionId },
    data: { ticketsSold: { decrement: quantity } },
  });
}

function revalidatePurchaseCaches() {
  revalidateTag("trending-competitions", "seconds");
  revalidateTag("featured-competition", "minutes");
  revalidateTag("hero-competition", "seconds");
  revalidateTag("homepage-stats", "minutes");
  revalidateTag("competition-detail", "minutes");
  revalidateTag("competitions-list", "seconds");
}

async function sendPurchaseEmails({
  userId,
  competitionId,
  ticketNumbers,
  quantity,
  amountPence,
}: {
  userId: string;
  competitionId: string;
  ticketNumbers: number[];
  quantity: number;
  amountPence: number;
}) {
  if (!process.env.RESEND_API_KEY) return;

  try {
    const [user, competition] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, phone: true, address: true },
      }),
      prisma.competition.findUnique({
        where: { id: competitionId },
        select: { titleEn: true, slug: true, drawDate: true },
      }),
    ]);

    if (!user?.email || !competition) return;

    const totalPaid = (amountPence / 100).toFixed(2);

    await resend.emails.send({
      from: FROM_AUTH,
      to: user.email,
      subject: `🎟️ Tickets confirmed — ${competition.titleEn}`,
      html: purchaseConfirmationHtml({
        userName: user.name || "Player",
        ticketNumbers,
        competitionTitle: competition.titleEn,
        competitionSlug: competition.slug,
        drawDate: competition.drawDate.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        totalPaid,
      }),
    });

    console.log(`📧 Purchase confirmation sent to ${user.email}`);

    if (ADMIN_NOTIFICATION_EMAIL) {
      await resend.emails.send({
        from: FROM_AUTH,
        to: ADMIN_NOTIFICATION_EMAIL,
        subject: `💰 New purchase: ${user.name || "Someone"} bought ${quantity} ticket(s) for ${competition.titleEn}`,
        html: adminPurchaseNotificationHtml({
          userName: user.name || "Unknown",
          userEmail: user.email,
          competitionTitle: competition.titleEn,
          ticketCount: quantity,
          ticketNumbers,
          totalPaid,
          userPhone: user.phone,
          userAddress: user.address,
        }),
      });
      console.log(`📧 Admin purchase notification sent to ${ADMIN_NOTIFICATION_EMAIL}`);
    }
  } catch (emailError) {
    console.error("Failed to send purchase confirmation email:", emailError);
  }
}
