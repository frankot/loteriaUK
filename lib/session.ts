import { cookies } from "next/headers";
import { getIronSession } from "iron-session";

export interface SessionData {
  userId?: string;
  email?: string;
  role?: "user" | "admin";
  ageConfirmed?: boolean;
}

export const sessionOptions = {
  password:
    process.env.SESSION_SECRET ??
    "complex_password_at_least_32_characters_long_for_security",
  cookieName: "loteria-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

export async function getSession(): Promise<SessionData> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return {
    userId: session.userId,
    email: session.email,
    role: session.role,
    ageConfirmed: session.ageConfirmed,
  };
}

export async function saveSession(data: SessionData): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  session.userId = data.userId;
  session.email = data.email;
  session.role = data.role;
  session.ageConfirmed = data.ageConfirmed;
  await session.save();
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  session.destroy();
}
