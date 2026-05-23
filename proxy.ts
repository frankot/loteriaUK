import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { sessionOptions, SessionData } from "./lib/session";

// ── next-intl ──
const intlMiddleware = createMiddleware(routing);

// ── Route classification (locale-stripped paths) ──
const publicRoutes = [
  "/",
  "/login",
  "/login/verify",
  "/register",
  "/how-it-works",
  "/faq",
  "/winners",
  "/free-postal-entry",
  "/competitions",
  "/terms",
  "/privacy",
  "/postal-terms",
];

// ── Auth guard ──
async function authGuard(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Strip locale prefix to get base path
  const [, locale, ...segments] = pathname.split("/");
  const basePath = `/${segments.join("/")}`;

  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  const isLoggedIn = !!session.userId;
  const isAdmin = session.role === "admin";

  // 1) Public routes — pass through
  if (
    publicRoutes.some((r) => basePath === r || basePath.startsWith(r + "/"))
  ) {
    // Admin login: if already logged in as admin, redirect to dashboard
    if (basePath === "/admin/login") {
      if (isLoggedIn && isAdmin) {
        return NextResponse.redirect(new URL(`/${locale}/admin`, request.url));
      }
      return response;
    }
    return response;
  }

  // 2) Admin routes — require admin role
  if (basePath.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(
        new URL(`/${locale}/admin/login`, request.url)
      );
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
    return response;
  }

  // 3) Profile — require any logged-in user
  if (basePath.startsWith("/profile")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(
        new URL(`/${locale}/login`, request.url)
      );
    }
    return response;
  }

  return response;
}

// ── Composed middleware ──
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes: skip intl middleware + auth guard entirely
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Step 1: Run i18n routing
  const intlResponse = intlMiddleware(request);

  // Step 2: If i18n issued a redirect (e.g. / → /en), return immediately
  if (!intlResponse.ok) {
    return intlResponse;
  }

  // Step 3: Run auth guard using the i18n response as the base
  return authGuard(request, intlResponse);
}

// ── Matcher ──
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|favicon\\.ico|sitemap\\.xml|robots\\.txt)).*)",
    "/(api|trpc)(.*)",
  ],
};
