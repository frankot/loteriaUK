"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import LanguageSwitcher from "./language-switcher";
import MobileMenu from "./mobile-menu";

interface HeaderProps {
  isLoggedIn?: boolean;
  userEmail?: string;
}

export default function Header({ isLoggedIn, userEmail }: HeaderProps) {
  const t = useTranslations("nav");
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const [mobileOpen, setMobileOpen] = useState(false);

  // Unified mobile nav links — same on every page
  const mobileNavLinks: { label: string; href: string }[] = [
    { label: t("home"), href: "/" },
    { label: t("competitions"), href: "/competitions" },
    { label: t("trending"), href: "/#trending" },
    { label: t("howItWorks"), href: "/#how-it-works" },
    { label: t("winners"), href: "/#winners" },
    { label: t("faq"), href: "/#faq" },
  ];

  // Desktop nav links
  const desktopLinks = [
    ["competitions", "/competitions"],
    ["trending", "#trending"],
    ["howItWorks", "#how-it-works"],
    ["winners", "#winners"],
    ["faq", "#faq"],
  ] as const;

  return (
    <>
      <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur-[12px] border-b border-border/50 lg:static lg:z-auto lg:bg-transparent lg:backdrop-blur-none lg:border-0">
        <div className="mx-auto flex h-[60px] md:h-[72px] max-w-7xl items-center justify-between px-4 md:px-8 lg:px-12">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center shrink-0">
            <Image
              src="/logo2.png"
              alt="Golden Dream Draw"
              width={140}
              height={32}
              className="h-auto w-[130px] md:w-[180px]"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {desktopLinks.map(([key, href]) => (
                <li key={key}>
                  <Link
                    href={`/${locale}${href}`}
                    className="text-sm font-medium text-ink-soft transition-colors hover:text-gold-dark"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Desktop auth */}
          <div className="hidden lg:flex items-center gap-4">
            <LanguageSwitcher />
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <Link
                  href={`/${locale}/profile`}
                  className="rounded-3xl border border-gold bg-gold-pale px-5 py-2 font-medium text-sm text-gold-dark transition-all hover:bg-gold hover:text-white"
                >
                  {t("profile")}
                </Link>
                <SignOutButton locale={locale} />
              </div>
            ) : (
              <Link
                href={`/${locale}/login`}
                className="rounded-3xl border border-ink bg-transparent px-5 py-2 font-medium text-sm text-ink transition-all hover:border-gold hover:text-gold-dark"
              >
                {t("signIn")}
              </Link>
            )}
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white text-ink transition-colors hover:border-gold hover:text-gold-dark"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile fullscreen overlay */}
      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        locale={locale}
        isLoggedIn={isLoggedIn}
        userEmail={userEmail}
        navLinks={mobileNavLinks}
      />
    </>
  );
}

function SignOutButton({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push(`/${locale}`);
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="rounded-3xl border border-border px-4 py-2 text-sm font-medium text-ink-muted transition-all hover:border-urgent hover:text-urgent disabled:opacity-50"
    >
      {loading ? "..." : t("signOut")}
    </button>
  );
}
