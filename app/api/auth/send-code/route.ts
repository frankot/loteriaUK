import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import resend, { FROM_AUTH } from "@/lib/resend";
import { loginCodeEmailHtml } from "@/lib/email-templates";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

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

    // Store code in DB
    await prisma.loginCode.create({
      data: {
        email: normalizedEmail,
        code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
      },
    });

    // Send via Resend
    const hasResend = !!process.env.RESEND_API_KEY;
    if (hasResend) {
      try {
        const { error: sendError } = await resend.emails.send({
          from: FROM_AUTH,
          to: normalizedEmail,
          subject: "Your login code — Golden Dream Draw",
          html: loginCodeEmailHtml(code),
        });

        if (sendError) {
          console.error("📧 Resend returned error:", sendError);
        } else {
          console.log(`📧 Login code sent to ${normalizedEmail}`);
        }
      } catch (emailError) {
        console.error("Failed to send login email:", emailError);
        // Still return success — code is stored, user can retry
      }
    } else {
      console.log(`\n🔑 Login code for ${normalizedEmail}: ${code}\n`);
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
