import { prisma } from "@/lib/prisma";

/**
 * Auto-transition ACTIVE competitions past their draw date to CLOSED.
 * Also fix inconsistency: competitions with winners but not DRAWN status.
 *
 * Called from middleware on every page request (non-blocking).
 * Idempotent — only touches DB when there are records to fix.
 *
 * Returns count of competitions transitioned (for logging).
 */
export async function transitionPastDueCompetitions(): Promise<number> {
  let total = 0;
  try {
    // 1) Close past-due ACTIVE competitions
    const closed = await prisma.competition.updateMany({
      where: {
        status: "ACTIVE",
        drawDate: { lt: new Date() },
      },
      data: { status: "CLOSED" },
    });
    total += closed.count;

    if (closed.count > 0) {
      console.log(
        `🔄 [status-transition] Auto-closed ${closed.count} past-due competition(s)`,
      );
    }

    // 2) Fix inconsistency: competitions with winners but status not DRAWN
    // This catches records created before the assignWinner action was fixed,
    // or any edge case where the transaction partially failed.
    const winnersWithWrongStatus = await prisma.competition.findMany({
      where: {
        status: { not: "DRAWN" },
        winners: { some: {} }, // has at least one winner
      },
      select: { id: true, titleEn: true, status: true },
    });

    if (winnersWithWrongStatus.length > 0) {
      const ids = winnersWithWrongStatus.map((c) => c.id);
      await prisma.competition.updateMany({
        where: { id: { in: ids } },
        data: { status: "DRAWN" },
      });
      total += winnersWithWrongStatus.length;

      console.log(
        `🔄 [status-transition] Fixed ${winnersWithWrongStatus.length} competition(s) with winners but wrong status:` +
          winnersWithWrongStatus
            .map((c) => `  ${c.titleEn} (was ${c.status})`)
            .join("\n"),
      );
    }

    return total;
  } catch (error) {
    console.error("[status-transition] Failed:", error);
    return total;
  }
}
