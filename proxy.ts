import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher:
    "/((?!api|trpc|_next|_vercel|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
};
