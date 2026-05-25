"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import LanguageSwitcher from "./language-switcher";

interface HeaderProps {
  isLoggedIn?: boolean;
  userEmail?: string;
}

export default function Header({ isLoggedIn, userEmail }: HeaderProps) {
  const t = useTranslations("nav");
  const params = useParams();
  const locale = (params.locale as string) || "en";

  return (
    <header className="bg-transparent">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-12">
        <Link href={`/${locale}`} className="flex items-center">
          <Image
            src="/logo2.png"
            alt="Golden Dream Draw"
            width={180}
            height={40}
            className="h-auto w-auto"
            priority
          />
        </Link>

        <nav>
          <ul className="flex items-center gap-8">
            {[
              ["trending", "#trending"],
              ["howItWorks", "#how-it-works"],
              ["winners", "#winners"],
              ["faq", "#faq"],
            ].map(([key, href]) => (
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

        <div className="flex items-center gap-4">
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
      </div>
    </header>
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
