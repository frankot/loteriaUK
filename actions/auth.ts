"use server";

import { prisma } from "@/lib/prisma";
import { saveSession, getSession } from "@/lib/session";
import { z } from "zod";

// ── Registration ──────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone number is required"),
  dateOfBirth: z.string().refine((val) => {
    const dob = new Date(val);
    const now = new Date();
    const age = now.getFullYear() - dob.getFullYear();
    const monthDiff = now.getMonth() - dob.getMonth();
    return (
      age > 18 ||
      (age === 18 && monthDiff > 0) ||
      (age === 18 && monthDiff === 0 && now.getDate() >= dob.getDate())
    );
  }, "You must be 18 or older"),
  ageConfirmed: z.boolean().refine((v) => v === true, {
    message: "You must confirm you are 18 or older",
  }),
});

export interface RegisterResult {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function registerUser(
  formData: FormData | { name: string; address: string; phone: string; dateOfBirth: string; ageConfirmed: boolean }
): Promise<RegisterResult> {
  try {
    const session = await getSession();

    if (!session.userId) {
      return { error: "Session expired. Please log in again." };
    }

    const rawData = formData instanceof FormData
      ? {
          name: formData.get("name"),
          address: formData.get("address"),
          phone: formData.get("phone"),
          dateOfBirth: formData.get("dateOfBirth"),
          ageConfirmed: formData.get("ageConfirmed") === "on",
        }
      : formData;

    const parsed = registerSchema.safeParse(rawData);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      return { error: "Please fix the form errors", fieldErrors };
    }

    // Update the user with full details
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: parsed.data.name,
        address: parsed.data.address,
        phone: parsed.data.phone,
        dateOfBirth: new Date(parsed.data.dateOfBirth),
        ageConfirmed: true,
      },
    });

    // Update session
    await saveSession({
      userId: session.userId,
      email: session.email,
      role: session.role,
      ageConfirmed: true,
    });

    return { success: true };
  } catch (error) {
    console.error("registerUser error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

// ── Profile Update ────────────────────────────────────────────

const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone number is required"),
});

export interface ProfileUpdateResult {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function updateProfile(
  formData: FormData
): Promise<ProfileUpdateResult> {
  try {
    const session = await getSession();

    if (!session.userId) {
      return { error: "Not authenticated" };
    }

    const rawData = {
      name: formData.get("name"),
      address: formData.get("address"),
      phone: formData.get("phone"),
    };

    const parsed = profileUpdateSchema.safeParse(rawData);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      return { error: "Please fix the form errors", fieldErrors };
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: parsed.data.name,
        address: parsed.data.address,
        phone: parsed.data.phone,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("updateProfile error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
