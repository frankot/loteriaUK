import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processCashflowsPayment } from "@/lib/purchase-processor";

const ID_RE = /^[a-z0-9]{20,32}$/i;

export async function GET(request: NextRequest) {
  const paymentId = request.nextUrl.searchParams.get("payment_id");
  const attempt = parseInt(request.nextUrl.searchParams.get("attempt") || "0", 10);

  if (!paymentId || !ID_RE.test(paymentId)) {
    return NextResponse.json({ tickets: [] });
  }

  const entries = await prisma.entry.findMany({
    where: { paymentId },
    select: {
      ticket: { select: { number: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (entries.length > 0) {
    const tickets = entries
      .filter((entry) => entry.ticket)
      .map((entry) => ({ number: entry.ticket!.number }));

    return NextResponse.json({ tickets });
  }

  if (attempt >= 5) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        providerPaymentJobReference: true,
        providerPaymentReference: true,
      },
    });

    if (!payment?.providerPaymentJobReference || !payment.providerPaymentReference) {
      return NextResponse.json({
        tickets: [],
        recoveryFailed: true,
        error: "Payment references are not available yet",
      });
    }

    console.warn("webhook_missing_or_delayed", {
      paymentId,
      attempt,
      paymentJobReference: payment.providerPaymentJobReference,
      paymentReference: payment.providerPaymentReference,
    });

    const result = await processCashflowsPayment(
      payment.providerPaymentJobReference,
      payment.providerPaymentReference
    );

    if (result.success && result.ticketNumbers) {
      return NextResponse.json({
        tickets: result.ticketNumbers.map((number) => ({ number })),
        recovered: true,
      });
    }

    return NextResponse.json({
      tickets: [],
      recoveryFailed: true,
      error: result.error,
    });
  }

  return NextResponse.json({ tickets: [] });
}
