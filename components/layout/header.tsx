"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import LanguageSwitcher from "./language-switcher";

export default function Header() {
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
          <Link
            href={`/${locale}/login`}
            className="rounded-3xl border border-ink bg-transparent px-5 py-2 font-medium text-sm text-ink transition-all hover:border-gold hover:text-gold-dark"
          >
            {t("signIn")}
          </Link>
        </div>
      </div>
    </header>
  );
}
