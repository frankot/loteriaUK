import { NextResponse } from "next/server";
import { saveSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "Admin credentials not configured" },
        { status: 500 }
      );
    }

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Find or create admin user in DB
    let user = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: adminEmail,
          name: "Admin",
          role: "admin",
          ageConfirmed: true,
        },
      });
    } else if (user.role !== "admin") {
      // Upgrade to admin if needed
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: "admin" },
      });
    }

    // Create session
    await saveSession({
      userId: user.id,
      email: user.email,
      role: "admin",
      ageConfirmed: true,
    });

    return NextResponse.json({ message: "Authenticated", role: "admin" });
  } catch (error) {
    console.error("admin-login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
