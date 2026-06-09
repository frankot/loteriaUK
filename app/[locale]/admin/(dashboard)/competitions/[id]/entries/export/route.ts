import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; id: string }> }
) {
  try {
    const session = await getSession();
    if (!session.userId || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const MAX_EXPORT_ROWS = 10_000;

    const [entries, totalCount] = await Promise.all([
      prisma.entry.findMany({
        where: { competitionId: id },
        orderBy: { createdAt: "desc" },
        take: MAX_EXPORT_ROWS,
        include: {
          user: { select: { email: true, name: true } },
          ticket: { select: { number: true } },
        },
      }),
      prisma.entry.count({ where: { competitionId: id } }),
    ]);

    const truncated = totalCount > MAX_EXPORT_ROWS;

    // Build CSV
    const header = "email,name,ticketNumber,type,answerCorrect,createdAt";
    const rows = entries.map((e: typeof entries[number]) => {
      const answerCorrect =
        e.answerCorrect === null ? "" : e.answerCorrect ? "Yes" : "No";
      return [
        e.user.email,
        `"${(e.user.name || "").replace(/"/g, '""')}"`,
        e.ticket?.number ?? "",
        e.type,
        answerCorrect,
        e.createdAt.toISOString(),
      ].join(",");
    });

    const csv = [header, ...rows].join("\n");

    const filename = truncated
      ? `entries-export-${MAX_EXPORT_ROWS}-of-${totalCount}.csv`
      : `entries-export.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500 }
    );
  }
}
