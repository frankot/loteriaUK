"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Trophy,
  HelpCircle,
  Users,
  Crown,
  LogOut,
  ChevronRight,
} from "lucide-react";

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/admin/competitions",
    label: "Competitions",
    icon: Trophy,
  },
  {
    href: "/admin/winners",
    label: "Winners",
    icon: Crown,
  },
  {
    href: "/admin/questions",
    label: "Questions",
    icon: HelpCircle,
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
  },
];

interface AdminSidebarProps {
  locale: string;
}

export function AdminSidebar({ locale }: AdminSidebarProps) {
  const pathname = usePathname();
  // Strip locale prefix
  const pathParts = pathname.split("/");
  const adminPath = "/" + pathParts.slice(2).join("/");

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = `/${locale}/admin/login`;
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-60 flex-col border-r border-border bg-white lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink">
          <Trophy className="h-4 w-4 text-gold" />
        </div>
        <span className="font-serif text-sm font-semibold text-ink">
          GD Draw
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const fullHref = `/${locale}${item.href}`;
          const isActive = item.exact
            ? adminPath === item.href
            : adminPath.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={fullHref}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gold-pale text-gold-dark"
                  : "text-ink-soft hover:bg-cream-warm hover:text-ink"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
              {isActive && (
                <ChevronRight className="ml-auto h-4 w-4 text-gold-dark/50" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-border px-3 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-urgent/10 hover:text-urgent"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
