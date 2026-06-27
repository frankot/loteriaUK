import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ID_RE = /^[a-z0-9]{20,32}$/i;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const competitionId = searchParams.get("competitionId");
    const excludeRaw = searchParams.get("exclude");

    if (competitionId && !ID_RE.test(competitionId)) {
      return NextResponse.json({ error: "Invalid competition id" }, { status: 400 });
    }

    const excludeIds = excludeRaw
      ? excludeRaw.split(",").filter((id) => ID_RE.test(id)).slice(0, 20)
      : [];

    // If competition has an assigned question, prefer it (unless already attempted)
    let competitionQuestionId: string | null = null;
    if (competitionId) {
      const comp = await prisma.competition.findUnique({
        where: { id: competitionId },
        select: { questionId: true },
      });
      competitionQuestionId = comp?.questionId || null;
    }

    // Find a question: prefer competition-assigned, fallback to random
    let question;
    if (competitionQuestionId && !excludeIds.includes(competitionQuestionId)) {
      question = await prisma.skillQuestion.findUnique({
        where: { id: competitionQuestionId },
      });
    }

    if (!question) {
      // Get random question excluding attempted ones
      const where = excludeIds.length > 0
        ? { id: { notIn: excludeIds } }
        : {};

      const count = await prisma.skillQuestion.count({ where });
      if (count === 0) {
        return NextResponse.json(
          { error: "No more questions available" },
          { status: 404 }
        );
      }

      const skip = Math.floor(Math.random() * count);
      const questions = await prisma.skillQuestion.findMany({
        where,
        take: 1,
        skip,
      });
      question = questions[0];
    }

    if (!question) {
      return NextResponse.json(
        { error: "No more questions available" },
        { status: 404 }
      );
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error("Random question error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
