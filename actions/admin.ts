"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";
// ── Auth guard helper ─────────────────────────────────────────
async function requireAdmin() {
  const session = await getSession();
  if (!session.userId || session.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

// ═══════════════════════════════════════════════════════════════
// Competitions CRUD
// ═══════════════════════════════════════════════════════════════

const competitionSchema = z.object({
  titleEn: z.string().min(1, "Title (EN) is required"),
  titlePl: z.string().optional().default(""),
  titleRo: z.string().optional().default(""),
  titleBg: z.string().optional().default(""),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  descEn: z.string().optional().default(""),
  descPl: z.string().optional().default(""),
  descRo: z.string().optional().default(""),
  descBg: z.string().optional().default(""),
  pricePounds: z.coerce.number().positive("Price must be positive"),
  maxTickets: z.coerce.number().int().positive("Max tickets must be positive"),
  drawDate: z.string().min(1, "Draw date is required"),
  prizeImageUrl: z.string().optional().default(""),
  prizeCategory: z.string().optional().default(""),
  prizeValue: z.coerce.number().optional(),
  questionId: z.string().optional().nullable().default(null),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED", "DRAWN", "CANCELLED"]).default("DRAFT"),
});

export interface AdminResult {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  id?: string;
}

export async function createCompetition(
  formData: FormData
): Promise<AdminResult> {
  try {
    await requireAdmin();

    const raw = Object.fromEntries(formData.entries());
    const parsed = competitionSchema.safeParse(raw);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      return { error: "Validation failed", fieldErrors };
    }

    const data = parsed.data;

    // Check slug uniqueness
    const existing = await prisma.competition.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      return { error: "Slug already taken", fieldErrors: { slug: "This slug is already in use" } };
    }

    const competition = await prisma.competition.create({
      data: {
        titleEn: data.titleEn,
        titlePl: data.titlePl || null,
        titleRo: data.titleRo || null,
        titleBg: data.titleBg || null,
        slug: data.slug,
        descEn: data.descEn || null,
        descPl: data.descPl || null,
        descRo: data.descRo || null,
        descBg: data.descBg || null,
        pricePounds: Number(data.pricePounds),
        maxTickets: data.maxTickets,
        drawDate: new Date(data.drawDate),
        prizeImageUrl: data.prizeImageUrl || null,
        prizeCategory: data.prizeCategory || null,
        prizeValue: data.prizeValue ? Number(data.prizeValue) : null,
        questionId: data.questionId || null,
        status: data.status,
      },
    });

    revalidatePath("/[locale]/admin/competitions", "page");
    return { success: true, id: competition.id };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    console.error("createCompetition error:", error);
    return { error: "Failed to create competition" };
  }
}

export async function updateCompetition(
  id: string,
  formData: FormData
): Promise<AdminResult> {
  try {
    await requireAdmin();

    const raw = Object.fromEntries(formData.entries());
    const parsed = competitionSchema.safeParse(raw);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      return { error: "Validation failed", fieldErrors };
    }

    const data = parsed.data;

    // Check slug uniqueness (exclude current)
    const existing = await prisma.competition.findFirst({
      where: { slug: data.slug, id: { not: id } },
    });
    if (existing) {
      return { error: "Slug already taken", fieldErrors: { slug: "This slug is already in use" } };
    }

    await prisma.competition.update({
      where: { id },
      data: {
        titleEn: data.titleEn,
        titlePl: data.titlePl || null,
        titleRo: data.titleRo || null,
        titleBg: data.titleBg || null,
        slug: data.slug,
        descEn: data.descEn || null,
        descPl: data.descPl || null,
        descRo: data.descRo || null,
        descBg: data.descBg || null,
        pricePounds: Number(data.pricePounds),
        maxTickets: data.maxTickets,
        drawDate: new Date(data.drawDate),
        prizeImageUrl: data.prizeImageUrl || null,
        prizeCategory: data.prizeCategory || null,
        prizeValue: data.prizeValue ? Number(data.prizeValue) : null,
        questionId: data.questionId || null,
        status: data.status,
      },
    });

    revalidatePath("/[locale]/admin/competitions", "page");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    console.error("updateCompetition error:", error);
    return { error: "Failed to update competition" };
  }
}

export async function deleteCompetition(id: string): Promise<AdminResult> {
  try {
    await requireAdmin();

    // Soft delete — set to CANCELLED
    await prisma.competition.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    revalidatePath("/[locale]/admin/competitions", "page");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    console.error("deleteCompetition error:", error);
    return { error: "Failed to delete competition" };
  }
}

// ═══════════════════════════════════════════════════════════════
// Questions CRUD
// ═══════════════════════════════════════════════════════════════

const questionSchema = z.object({
  questionEn: z.string().min(1, "Question (EN) is required"),
  questionPl: z.string().optional().default(""),
  questionRo: z.string().optional().default(""),
  questionBg: z.string().optional().default(""),
  optionAEn: z.string().min(1, "Option A (EN) is required"),
  optionAPl: z.string().optional().default(""),
  optionARo: z.string().optional().default(""),
  optionABg: z.string().optional().default(""),
  optionBEn: z.string().min(1, "Option B (EN) is required"),
  optionBPl: z.string().optional().default(""),
  optionBRo: z.string().optional().default(""),
  optionBBg: z.string().optional().default(""),
  optionCEn: z.string().optional().default(""),
  optionCPl: z.string().optional().default(""),
  optionCRo: z.string().optional().default(""),
  optionCBg: z.string().optional().default(""),
  optionDEn: z.string().optional().default(""),
  optionDPl: z.string().optional().default(""),
  optionDRo: z.string().optional().default(""),
  optionDBg: z.string().optional().default(""),
  correctOption: z.enum(["A", "B", "C", "D"]),
});

export async function createQuestion(
  formData: FormData
): Promise<AdminResult> {
  try {
    await requireAdmin();

    const raw = Object.fromEntries(formData.entries());
    const parsed = questionSchema.safeParse(raw);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      return { error: "Validation failed", fieldErrors };
    }

    const data = parsed.data;

    const question = await prisma.skillQuestion.create({
      data: {
        questionEn: data.questionEn,
        questionPl: data.questionPl || null,
        questionRo: data.questionRo || null,
        questionBg: data.questionBg || null,
        optionAEn: data.optionAEn,
        optionAPl: data.optionAPl || null,
        optionARo: data.optionARo || null,
        optionABg: data.optionABg || null,
        optionBEn: data.optionBEn,
        optionBPl: data.optionBPl || null,
        optionBRo: data.optionBRo || null,
        optionBBg: data.optionBBg || null,
        optionCEn: data.optionCEn || null,
        optionCPl: data.optionCPl || null,
        optionCRo: data.optionCRo || null,
        optionCBg: data.optionCBg || null,
        optionDEn: data.optionDEn || null,
        optionDPl: data.optionDPl || null,
        optionDRo: data.optionDRo || null,
        optionDBg: data.optionDBg || null,
        correctOption: data.correctOption,
      },
    });

    revalidatePath("/[locale]/admin/questions", "page");
    return { success: true, id: question.id };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    console.error("createQuestion error:", error);
    return { error: "Failed to create question" };
  }
}

export async function updateQuestion(
  id: string,
  formData: FormData
): Promise<AdminResult> {
  try {
    await requireAdmin();

    const raw = Object.fromEntries(formData.entries());
    const parsed = questionSchema.safeParse(raw);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      return { error: "Validation failed", fieldErrors };
    }

    const data = parsed.data;

    await prisma.skillQuestion.update({
      where: { id },
      data: {
        questionEn: data.questionEn,
        questionPl: data.questionPl || null,
        questionRo: data.questionRo || null,
        questionBg: data.questionBg || null,
        optionAEn: data.optionAEn,
        optionAPl: data.optionAPl || null,
        optionARo: data.optionARo || null,
        optionABg: data.optionABg || null,
        optionBEn: data.optionBEn,
        optionBPl: data.optionBPl || null,
        optionBRo: data.optionBRo || null,
        optionBBg: data.optionBBg || null,
        optionCEn: data.optionCEn || null,
        optionCPl: data.optionCPl || null,
        optionCRo: data.optionCRo || null,
        optionCBg: data.optionCBg || null,
        optionDEn: data.optionDEn || null,
        optionDPl: data.optionDPl || null,
        optionDRo: data.optionDRo || null,
        optionDBg: data.optionDBg || null,
        correctOption: data.correctOption,
      },
    });

    revalidatePath("/[locale]/admin/questions", "page");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    console.error("updateQuestion error:", error);
    return { error: "Failed to update question" };
  }
}

export async function deleteQuestion(id: string): Promise<AdminResult> {
  try {
    await requireAdmin();

    // Check if any active competitions use this question
    const usedBy = await prisma.competition.count({
      where: { questionId: id, status: { not: "CANCELLED" } },
    });

    if (usedBy > 0) {
      return { error: `Cannot delete: used by ${usedBy} active competition(s)` };
    }

    await prisma.skillQuestion.delete({ where: { id } });

    revalidatePath("/[locale]/admin/questions", "page");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    console.error("deleteQuestion error:", error);
    return { error: "Failed to delete question" };
  }
}

// ═══════════════════════════════════════════════════════════════
// Postal Entry (Phase 4e)
// ═══════════════════════════════════════════════════════════════

const postalEntrySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  address: z.string().min(1, "Address is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  answer: z.enum(["A", "B", "C", "D"]),
});

export async function createPostalEntry(
  competitionId: string,
  formData: FormData
): Promise<AdminResult> {
  try {
    await requireAdmin();

    const raw = Object.fromEntries(formData.entries());
    const parsed = postalEntrySchema.safeParse(raw);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      return { error: "Validation failed", fieldErrors };
    }

    const data = parsed.data;

    // Get competition with question
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: { question: true },
    });

    if (!competition) {
      return { error: "Competition not found" };
    }

    // Evaluate answer
    let answerCorrect: boolean | null = null;
    if (competition.question) {
      answerCorrect = data.answer === competition.question.correctOption;
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email.toLowerCase().trim(),
          name: data.name,
          address: data.address,
          dateOfBirth: new Date(data.dateOfBirth),
          ageConfirmed: true,
        },
      });
    }

    // Create postal entry
    const entry = await prisma.entry.create({
      data: {
        competitionId,
        userId: user.id,
        type: "POSTAL",
        answerCorrect,
      },
    });

    revalidatePath(`/[locale]/admin/competitions/[id]`, "page");
    return { success: true, id: entry.id };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    console.error("createPostalEntry error:", error);
    return { error: "Failed to create postal entry" };
  }
}

// ═══════════════════════════════════════════════════════════════
// User Management (Phase 4f)
// ═══════════════════════════════════════════════════════════════

const userEditSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().optional().default(""),
  dateOfBirth: z.string().optional(),
});

export async function adminUpdateUser(
  userId: string,
  formData: FormData
): Promise<AdminResult> {
  try {
    await requireAdmin();

    const raw = Object.fromEntries(formData.entries());
    const parsed = userEditSchema.safeParse(raw);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      return { error: "Validation failed", fieldErrors };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        name: parsed.data.name,
        address: parsed.data.address,
        phone: parsed.data.phone || null,
        ...(parsed.data.dateOfBirth
          ? { dateOfBirth: new Date(parsed.data.dateOfBirth) }
          : {}),
      },
    });

    revalidatePath("/[locale]/admin/users", "page");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    console.error("adminUpdateUser error:", error);
    return { error: "Failed to update user" };
  }
}

// ═══════════════════════════════════════════════════════════════
// Winner Assignment (Phase 6c)
// ═══════════════════════════════════════════════════════════════

export interface TicketLookup {
  id: string;
  number: number;
  user: { id: string; email: string; name: string | null };
  entry: { id: string; type: string; answerCorrect: boolean | null };
}

export interface TicketLookupResult {
  success?: boolean;
  error?: string;
  ticket?: TicketLookup;
  competition?: { id: string; titleEn: string; status: string };
}

export async function lookupTicket(
  competitionId: string,
  ticketNumber: number
): Promise<TicketLookupResult> {
  try {
    await requireAdmin();

    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { id: true, titleEn: true, status: true, slug: true },
    });

    if (!competition) {
      return { error: "Competition not found" };
    }

    // Check competition eligibility
    if (competition.status === "DRAFT" || competition.status === "ACTIVE") {
      return {
        error: `Competition must be CLOSED before assigning a winner. Current status: ${competition.status}`,
      };
    }

    if (competition.status === "DRAWN") {
      return { error: "A winner has already been drawn for this competition" };
    }

    if (competition.status === "CANCELLED") {
      return { error: "Cannot assign a winner to a cancelled competition" };
    }

    // Check no winner already assigned
    const existingWinner = await prisma.winner.findFirst({
      where: { competitionId },
    });
    if (existingWinner) {
      return { error: "A winner has already been assigned to this competition" };
    }

    // Look up ticket
    const ticket = await prisma.ticket.findUnique({
      where: {
        competitionId_number: { competitionId, number: ticketNumber },
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        entry: { select: { id: true, type: true, answerCorrect: true } },
      },
    });

    if (!ticket) {
      return {
        error: `Ticket #${ticketNumber} not found in this competition`,
        competition: { id: competition.id, titleEn: competition.titleEn, status: competition.status },
      };
    }

    if (ticket.status !== "SOLD") {
      return {
        error: `Ticket #${ticketNumber} is not sold (status: ${ticket.status})`,
        competition: { id: competition.id, titleEn: competition.titleEn, status: competition.status },
      };
    }

    if (!ticket.user) {
      return {
        error: `Ticket #${ticketNumber} is not assigned to a user`,
        competition: { id: competition.id, titleEn: competition.titleEn, status: competition.status },
      };
    }

    if (!ticket.entry) {
      return {
        error: `No entry record found for ticket #${ticketNumber}`,
        competition: { id: competition.id, titleEn: competition.titleEn, status: competition.status },
      };
    }

    if (ticket.entry.answerCorrect === false) {
      return {
        error: `Entry for ticket #${ticketNumber} has an incorrect answer — not eligible`,
        competition: { id: competition.id, titleEn: competition.titleEn, status: competition.status },
      };
    }

    if (ticket.entry.answerCorrect === null && ticket.entry.type === "POSTAL") {
      return {
        error: `Postal entry for ticket #${ticketNumber} has not been evaluated yet`,
        competition: { id: competition.id, titleEn: competition.titleEn, status: competition.status },
      };
    }

    return {
      success: true,
      ticket: {
        id: ticket.id,
        number: ticket.number,
        user: {
          id: ticket.user.id,
          email: ticket.user.email,
          name: ticket.user.name,
        },
        entry: {
          id: ticket.entry.id,
          type: ticket.entry.type,
          answerCorrect: ticket.entry.answerCorrect,
        },
      },
      competition: { id: competition.id, titleEn: competition.titleEn, status: competition.status },
    };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    console.error("lookupTicket error:", error);
    return { error: "Failed to look up ticket" };
  }
}

export async function assignWinner(
  competitionId: string,
  ticketId: string,
  entryId: string,
  userId: string
): Promise<AdminResult> {
  try {
    await requireAdmin();

    // Double-check no winner exists
    const existingWinner = await prisma.winner.findFirst({
      where: { competitionId },
    });
    if (existingWinner) {
      return { error: "A winner has already been assigned to this competition" };
    }

    // Create winner + update competition status in transaction
    const [winner] = await prisma.$transaction([
      prisma.winner.create({
        data: {
          competitionId,
          userId,
          entryId,
          notified: false,
        },
      }),
      prisma.competition.update({
        where: { id: competitionId },
        data: { status: "DRAWN" },
      }),
    ]);

    // Try to send winner notification email (non-blocking)
    try {
      const competition = await prisma.competition.findUnique({
        where: { id: competitionId },
        select: { titleEn: true, slug: true, prizeImageUrl: true },
      });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (user && competition && process.env.RESEND_API_KEY) {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: "Golden Dream Draw <winners@goldendreandraw.com>",
          to: user.email,
          subject: `🎉 Congratulations! You won ${competition.titleEn}!`,
          html: winnerNotificationHtml({
            userName: user.name || "Winner",
            competitionTitle: competition.titleEn,
            competitionSlug: competition.slug,
            claimDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
          }),
        });

        // Mark as notified
        await prisma.winner.update({
          where: { id: winner.id },
          data: { notified: true, notifiedAt: new Date() },
        });

        console.log(`📧 Winner notification sent to ${user.email}`);
      } else {
        console.log(`📧 [DEV] Winner notification would be sent to ${user?.email || "unknown"} (RESEND_API_KEY not configured)`);
      }
    } catch (emailError) {
      console.error("Failed to send winner email (non-fatal):", emailError);
    }

    revalidatePath("/[locale]/admin/competitions/[id]", "page");
    revalidatePath("/[locale]/admin/winners", "page");
    revalidatePath("/[locale]/winners", "page");
    return { success: true, id: winner.id };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    console.error("assignWinner error:", error);
    return { error: "Failed to assign winner" };
  }
}

// Winner notification HTML template (inline, no React Email dependency at runtime)
function winnerNotificationHtml({
  userName,
  competitionTitle,
  competitionSlug,
  claimDeadline,
}: {
  userName: string;
  competitionTitle: string;
  competitionSlug: string;
  claimDeadline: string;
}): string {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://goldendreandraw.com";
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Georgia, serif; background: #F8F5F0; color: #1A1A1A; }
    .email { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 16px; border: 1px solid #E5DFD5; padding: 40px; }
    .trophy { text-align: center; font-size: 48px; margin-bottom: 16px; }
    h1 { font-family: Georgia, serif; font-size: 24px; text-align: center; color: #1A1A1A; }
    .prize { background: #FDF4E3; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
    .prize-name { font-size: 20px; font-weight: 700; color: #C6942E; }
    .deadline { background: #FFF3E0; border-radius: 8px; padding: 14px; margin: 20px 0; text-align: center; font-size: 13px; color: #8B6914; }
    .cta { display: block; text-align: center; background: #C6942E; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; margin: 24px 0 8px; }
    .footer { font-size: 12px; color: #9B968B; text-align: center; margin-top: 28px; }
  </style>
</head>
<body>
  <div class="email">
    <div class="trophy">🏆</div>
    <h1>Congratulations, ${userName}!</h1>
    <p style="text-align:center;color:#6B6460;">You are the lucky winner of:</p>
    <div class="prize">
      <div class="prize-name">${competitionTitle}</div>
    </div>
    <div class="deadline">
      ⏰ You have <strong>14 days</strong> to claim your prize.<br>
      Claim deadline: <strong>${claimDeadline}</strong>
    </div>
    <p style="text-align:center;color:#6B6460;font-size:14px;">
      To claim your prize, sign in to your account at the link below:
    </p>
    <a href="${siteUrl}/en/competitions/${competitionSlug}" class="cta">
      Claim Your Prize →
    </a>
    <p style="text-align:center;font-size:12px;color:#9B968B;">
      If you don't claim within 14 days, a new winner will be drawn.
    </p>
    <div class="footer">
      Golden Dream Draw Ltd — Skill-based prize competitions<br>
      © ${new Date().getFullYear()} All rights reserved.
    </div>
  </div>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════
// Winners Management (Phase 6e)
// ═══════════════════════════════════════════════════════════════

export async function toggleWinnerNotified(
  winnerId: string
): Promise<AdminResult> {
  try {
    await requireAdmin();

    const winner = await prisma.winner.findUnique({
      where: { id: winnerId },
      include: {
        user: { select: { email: true, name: true } },
        competition: { select: { titleEn: true, slug: true } },
      },
    });

    if (!winner) return { error: "Winner not found" };

    if (winner.notified) {
      // Un-notify (rarely used, but togglable)
      await prisma.winner.update({
        where: { id: winnerId },
        data: { notified: false, notifiedAt: null },
      });
      revalidatePath("/[locale]/admin/winners", "page");
      return { success: true };
    }

    // Send notification email
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: "Golden Dream Draw <winners@goldendreandraw.com>",
          to: winner.user.email,
          subject: `🎉 Congratulations! You won ${winner.competition.titleEn}!`,
          html: winnerNotificationHtml({
            userName: winner.user.name || "Winner",
            competitionTitle: winner.competition.titleEn,
            competitionSlug: winner.competition.slug,
            claimDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
          }),
        });
      } catch (emailError) {
        console.error("Failed to send winner email:", emailError);
        return { error: "Email sending failed. Resend may not be configured." };
      }
    } else {
      console.log(`📧 [DEV] Winner notification would be sent to ${winner.user.email}`);
    }

    await prisma.winner.update({
      where: { id: winnerId },
      data: { notified: true, notifiedAt: new Date() },
    });

    revalidatePath("/[locale]/admin/winners", "page");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    console.error("toggleWinnerNotified error:", error);
    return { error: "Failed to toggle notified status" };
  }
}

export async function toggleWinnerClaimed(
  winnerId: string
): Promise<AdminResult> {
  try {
    await requireAdmin();

    const winner = await prisma.winner.findUnique({
      where: { id: winnerId },
      select: { claimed: true },
    });

    if (!winner) return { error: "Winner not found" };

    await prisma.winner.update({
      where: { id: winnerId },
      data: {
        claimed: !winner.claimed,
        claimedAt: winner.claimed ? null : new Date(),
      },
    });

    revalidatePath("/[locale]/admin/winners", "page");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    console.error("toggleWinnerClaimed error:", error);
    return { error: "Failed to toggle claimed status" };
  }
}

export async function resetWinner(
  winnerId: string
): Promise<AdminResult> {
  try {
    await requireAdmin();

    const winner = await prisma.winner.findUnique({
      where: { id: winnerId },
      select: { competitionId: true },
    });

    if (!winner) return { error: "Winner not found" };

    // Delete winner + revert competition to CLOSED in transaction
    await prisma.$transaction([
      prisma.winner.delete({ where: { id: winnerId } }),
      prisma.competition.update({
        where: { id: winner.competitionId },
        data: { status: "CLOSED" },
      }),
    ]);

    revalidatePath("/[locale]/admin/winners", "page");
    revalidatePath("/[locale]/winners", "page");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    console.error("resetWinner error:", error);
    return { error: "Failed to reset winner" };
  }
}

// ═══════════════════════════════════════════════════════════════
// Image Upload & Delete (R2 or fallback)
// ═══════════════════════════════════════════════════════════════

function extractR2Key(url: string): string | null {
  // Try with bucket name first (new URL format: .../bucket/prizes/uuid.jpg)
  const bucket = process.env.R2_BUCKET_NAME;
  if (bucket) {
    const idx = url.indexOf(bucket + "/");
    if (idx !== -1) return url.slice(idx + bucket.length + 1);
  }
  // Fallback: extract "prizes/<uuid.ext>" from anywhere in path
  // (handles old URL format without bucket name)
  const prizesIdx = url.indexOf("prizes/");
  if (prizesIdx !== -1) {
    const key = url.slice(prizesIdx);
    // Ensure it ends with a file extension
    if (/prizes\/[\w-]+\.\w+$/.test(key)) return key;
  }
  return null;
}

export async function deleteImage(
  url: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    await requireAdmin();

    const r2Configured =
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_ENDPOINT;

    if (r2Configured) {
      const key = extractR2Key(url);
      console.log("🗑️ deleteImage:", { url, key, bucket: process.env.R2_BUCKET_NAME });
      if (key) {
        const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
        const client = new S3Client({
          region: "auto",
          endpoint: process.env.R2_ENDPOINT,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
          },
        });
        await client.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: key,
          })
        );
        console.log(`🗑️ Deleted from R2: ${key}`);
      } else {
        console.log("⚠️ Could not extract R2 key from URL:", url);
      }
    } else {
      // Fallback: delete from public/uploads
      const path = await import("path");
      const fs = await import("fs/promises");
      const filename = path.basename(url);
      const filePath = path.join(process.cwd(), "public", "uploads", filename);
      await fs.unlink(filePath).catch(() => {});
    }

    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    console.error("deleteImage error:", error);
    return { error: "Failed to delete image" };
  }
}

export async function uploadImage(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  try {
    await requireAdmin();

    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      return { error: "No file provided" };
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!validTypes.includes(file.type)) {
      return { error: "Invalid file type. Use JPEG, PNG, WebP, or AVIF." };
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return { error: "File too large. Maximum 5MB." };
    }

    // Delete old image if provided
    const oldUrl = formData.get("oldUrl") as string | null;
    const r2Configured =
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_ENDPOINT;

    if (oldUrl) {
      await deleteImage(oldUrl);
    }

    if (r2Configured) {
      // Upload to Cloudflare R2
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
      const crypto = await import("crypto");

      const ext = file.name.split(".").pop() || "jpg";
      const key = `prizes/${crypto.randomUUID()}.${ext}`;

      const client = new S3Client({
        region: "auto",
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      });

      const buffer = Buffer.from(await file.arrayBuffer());

      await client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: key,
          Body: buffer,
          ContentType: file.type,
        })
      );

      const publicUrl = process.env.R2_PUBLIC_URL
        ? `${process.env.R2_PUBLIC_URL}/${process.env.R2_BUCKET_NAME}/${key}`
        : `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}/${key}`;

      return { url: publicUrl };
    } else {
      // Fallback: save to public/uploads
      const fs = await import("fs/promises");
      const path = await import("path");
      const crypto = await import("crypto");

      const ext = file.name.split(".").pop() || "jpg";
      const filename = `${crypto.randomUUID()}.${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");

      await fs.mkdir(uploadDir, { recursive: true });

      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(path.join(uploadDir, filename), buffer);

      return { url: `/uploads/${filename}` };
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    console.error("uploadImage error:", error);
    return { error: "Failed to upload image" };
  }
}
