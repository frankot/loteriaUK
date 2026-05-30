"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "./language-switcher";
import { X } from "lucide-react";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  locale: string;
  isLoggedIn?: boolean;
  userEmail?: string;
  navLinks: { label: string; href: string }[];
}

export default function MobileMenu({
  open,
  onClose,
  locale,
  isLoggedIn,
  navLinks,
}: MobileMenuProps) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [staggered, setStaggered] = useState(false);

  // Scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        setVisible(true);
        setTimeout(() => setStaggered(true), 100);
      });
    } else {
      document.body.style.overflow = "";
      setStaggered(false);
      const t = setTimeout(() => setVisible(false), 350);
      return () => clearTimeout(t);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname]);

  if (!open && !visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{ backgroundColor: "#FDFBF7" }}
    >
      {/* Top bar — matches header exactly: same logo, same button shape, just icon flips burger→X */}
      <div className="flex h-[60px] items-center justify-between px-4 shrink-0">
        <Link href={`/${locale}`} onClick={onClose} className="flex items-center">
          <Image
            src="/logo2.png"
            alt="Golden Dream Draw"
            width={140}
            height={32}
            className="h-auto w-[130px]"
          />
        </Link>
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white text-ink transition-colors hover:border-gold hover:text-gold-dark"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav links — centered, staggered */}
      <nav className="flex flex-1 flex-col items-center justify-center gap-1 px-4">
        {navLinks.map((link, i) => {
          const isActive = pathname === `/${locale}${link.href}` || pathname === `/${locale}${link.href}/`;
          return (
            <Link
              key={link.href}
              href={`/${locale}${link.href}`}
              onClick={onClose}
              className={`font-serif text-2xl font-semibold transition-all duration-400 ease-out ${
                isActive ? "text-gold-dark" : "text-ink"
              } hover:text-gold-dark`}
              style={{
                opacity: staggered ? 1 : 0,
                transform: staggered ? "translateY(0)" : "translateY(12px)",
                transitionDelay: `${80 + i * 60}ms`,
                transitionProperty: "opacity, transform, color",
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: lang switcher + auth */}
      <div className="flex flex-col items-center gap-4 border-t border-border px-4 py-6">
        <LanguageSwitcher dropUp />

        {isLoggedIn ? (
          <div className="flex flex-col items-center gap-3 w-full max-w-[260px]">
            <Link
              href={`/${locale}/profile`}
              onClick={onClose}
              className="w-full rounded-3xl border border-gold bg-gold-pale py-3 text-center text-sm font-semibold text-gold-dark transition-all hover:bg-gold hover:text-white"
            >
              My Profile
            </Link>
            <SignOutButton locale={locale} onClose={onClose} />
          </div>
        ) : (
          <Link
            href={`/${locale}/login`}
            onClick={onClose}
            className="w-full max-w-[260px] rounded-3xl border border-ink bg-transparent py-3 text-center text-sm font-semibold text-ink transition-all hover:border-gold hover:text-gold-dark"
          >
            Sign In
          </Link>
        )}
      </div>
    </div>
  );
}

function SignOutButton({
  locale,
  onClose,
}: {
  locale: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="w-full max-w-[260px] rounded-3xl border border-border py-3 text-sm font-medium text-ink-muted transition-all hover:border-urgent hover:text-urgent disabled:opacity-50"
    >
      {loading ? "..." : "Sign Out"}
    </button>
  );
}
