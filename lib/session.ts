import { cookies } from "next/headers";
import { getIronSession } from "iron-session";

export interface SessionData {
  userId?: string;
  email?: string;
  role?: "user" | "admin";
  ageConfirmed?: boolean;
}

function getSessionSecret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET environment variable must be set in production. " +
      "Generate one with: openssl rand -base64 32"
    );
  }
  // Dev-only fallback — never used in production
  return "dev-session-secret-change-in-production-32-chars-ok";
}

export const sessionOptions = {
  password: getSessionSecret(),
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
