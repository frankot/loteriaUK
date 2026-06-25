import { NextRequest, NextResponse } from "next/server";
import { processCashflowsPayment } from "@/lib/purchase-processor";

interface CashflowsWebhookBody {
  notifyType?: string;
  paymentJobReference?: string;
  paymentReference?: string;
}

export async function POST(request: NextRequest) {
  let body: CashflowsWebhookBody;

  try {
    body = await request.json();
  } catch (error) {
    console.error("Cashflows webhook: invalid JSON", error);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const paymentJobReference = body.paymentJobReference;
  const paymentReference = body.paymentReference;
  const acknowledgement = { paymentJobReference, paymentReference };

  if (!paymentJobReference || !paymentReference) {
    console.error("Cashflows webhook: missing references", body);
    return NextResponse.json(acknowledgement, { status: 400 });
  }

  if (!isAllowedCashflowsWebhookIp(request)) {
    console.error("Cashflows webhook: rejected source IP", {
      xForwardedFor: request.headers.get("x-forwarded-for"),
      xRealIp: request.headers.get("x-real-ip"),
    });
    return NextResponse.json(acknowledgement, { status: 403 });
  }

  if (body.notifyType && body.notifyType !== "PaymentStatusChange") {
    console.log("Cashflows webhook: ignoring unsupported notification", body);
    return NextResponse.json(acknowledgement, { status: 200 });
  }

  try {
    const result = await processCashflowsPayment(paymentJobReference, paymentReference);

    if (result.status >= 500) {
      return NextResponse.json(
        { ...acknowledgement, error: result.error ?? "Processing failed" },
        { status: 500 }
      );
    }

    return NextResponse.json(acknowledgement, { status: 200 });
  } catch (error) {
    console.error("Cashflows webhook handler error:", error);
    return NextResponse.json(
      { ...acknowledgement, error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

function isAllowedCashflowsWebhookIp(request: NextRequest) {
  const allowedIps = (process.env.CASHFLOWS_ALLOWED_WEBHOOK_IPS || "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);

  if (allowedIps.length === 0) return true;

  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  const candidateIps = forwardedFor
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);

  const realIp = request.headers.get("x-real-ip");
  if (realIp) candidateIps.push(realIp.trim());

  return candidateIps.some((ip) => allowedIps.includes(ip));
}
