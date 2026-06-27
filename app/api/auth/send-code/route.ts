import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import resend, { FROM_AUTH } from "@/lib/resend";
import { loginCodeEmailHtml } from "@/lib/email-templates";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail.length > 254 || !EMAIL_RE.test(normalizedEmail)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Rate-limit: check last code sent within 60s
    const recent = await prisma.loginCode.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: "desc" },
    });

    if (recent && Date.now() - recent.createdAt.getTime() < 60000) {
      return NextResponse.json(
        { error: "Please wait before requesting a new code" },
        { status: 429 }
      );
    }

    // Generate 6-digit code
    const code = crypto.randomInt(100_000, 1_000_000).toString();

    // Store code before sending so a delivered email is always verifiable.
    const loginCode = await prisma.loginCode.create({
      data: {
        email: normalizedEmail,
        code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
      },
    });

    // Send via Resend. In production, never pretend success if email delivery failed.
    const hasResend = !!process.env.RESEND_API_KEY;
    if (hasResend) {
      try {
        const { data, error: sendError } = await resend.emails.send({
          from: FROM_AUTH,
          to: normalizedEmail,
          subject: "Your login code — Golden Dream Draw",
          html: loginCodeEmailHtml(code),
        });

        if (sendError) {
          console.error("📧 Resend returned error:", sendError);
          await prisma.loginCode.delete({ where: { id: loginCode.id } });
          return NextResponse.json(
            { error: "Failed to send login email. Please try again or contact support." },
            { status: 502 }
          );
        }

        console.log(`📧 Login code sent to ${normalizedEmail} (${data?.id ?? "no-message-id"})`);
      } catch (emailError) {
        console.error("Failed to send login email:", emailError);
        await prisma.loginCode.delete({ where: { id: loginCode.id } });
        return NextResponse.json(
          { error: "Failed to send login email. Please try again or contact support." },
          { status: 502 }
        );
      }
    } else if (process.env.NODE_ENV === "development") {
      console.log(`\n🔑 Login code for ${normalizedEmail}: ${code}\n`);
    } else {
      console.error("RESEND_API_KEY is not configured; cannot send login code");
      await prisma.loginCode.delete({ where: { id: loginCode.id } });
      return NextResponse.json(
        { error: "Email service is not configured" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Code sent",
      // In development, return the code so dev can test
      ...(process.env.NODE_ENV === "development" && { devCode: code }),
    });
  } catch (error) {
    console.error("send-code error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
