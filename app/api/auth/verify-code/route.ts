import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find valid, unused code
    const loginCode = await prisma.loginCode.findFirst({
      where: {
        email: normalizedEmail,
        code,
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!loginCode) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 401 }
      );
    }

    // Mark code as used
    await prisma.loginCode.update({
      where: { id: loginCode.id },
      data: { used: true },
    });

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // First-time visitor — create minimal user, they'll complete registration
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
        },
      });

      // Return flag so frontend redirects to /register
      await saveSession({
        userId: user.id,
        email: user.email,
        role: "user",
        ageConfirmed: false,
      });

      return NextResponse.json({
        message: "Registration required",
        needsRegistration: true,
        userId: user.id,
      });
    }

    // Returning user
    await saveSession({
      userId: user.id,
      email: user.email,
      role: user.role as "user" | "admin",
      ageConfirmed: user.ageConfirmed,
    });

    // If user exists but hasn't completed registration, redirect to register
    if (!user.ageConfirmed || !user.name || !user.address) {
      return NextResponse.json({
        message: "Registration incomplete — please complete your profile",
        needsRegistration: true,
        userId: user.id,
      });
    }

    return NextResponse.json({
      message: "Authenticated",
      role: user.role,
    });
  } catch (error) {
    console.error("verify-code error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
