import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getSession();
    if (!session.userId || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    const entries = await prisma.entry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        competition: { select: { titleEn: true, slug: true } },
        ticket: { select: { number: true } },
      },
      take: 100,
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("User entries API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
