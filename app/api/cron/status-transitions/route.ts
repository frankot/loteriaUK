import { NextRequest, NextResponse } from "next/server";
import { transitionPastDueCompetitions } from "@/lib/status-transitions";

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const token = request.nextUrl.searchParams.get("token") || bearer;

  if (token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transitioned = await transitionPastDueCompetitions();

  return NextResponse.json({ ok: true, transitioned });
}
