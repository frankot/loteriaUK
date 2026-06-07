import { NextRequest, NextResponse } from "next/server";
import { stripe, getWebhookSecret } from "@/lib/stripe";
import { processStripeCheckout } from "@/lib/purchase-processor";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("Stripe webhook: stripe client not initialized");
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, getWebhookSecret());
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Only process if payment is actually complete.
        // For async payment methods (bank transfer, etc.), we handle
        // checkout.session.async_payment_succeeded instead.
        if (session.payment_status === "paid") {
          const result = await processStripeCheckout(session);
          return NextResponse.json(
            { received: true, ...(result.error ? { warning: result.error } : {}) },
            { status: result.status }
          );
        }

        console.log(
          `Session ${session.id} completed but payment_status=${session.payment_status} — waiting for async_payment_succeeded`
        );
        return NextResponse.json({ received: true });
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const result = await processStripeCheckout(session);
        return NextResponse.json(
          { received: true, ...(result.error ? { warning: result.error } : {}) },
          { status: result.status }
        );
      }

      case "checkout.session.expired": {
        console.log("Checkout session expired:", event.data.object.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
