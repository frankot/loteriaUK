import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Ticket,
  Trophy,
  Search,
  Inbox,
  Clock,
  type LucideIcon,
} from "lucide-react";

/* ── Icon presets per context ── */
const iconPresets: Record<string, LucideIcon> = {
  ticket: Ticket,
  trophy: Trophy,
  search: Search,
  inbox: Inbox,
  clock: Clock,
};

/* ── Props ── */

type EmptyStateProps = {
  /** Icon preset name or custom Lucide icon */
  icon?: keyof typeof iconPresets | LucideIcon;
  /** Primary message (required) */
  message: string;
  /** Secondary description line */
  description?: string;
  /** CTA button label — when set, renders a link */
  ctaLabel?: string;
  /** CTA href */
  ctaHref?: string;
  /** Renders as table cell instead of standalone card */
  asTableCell?: boolean;
  /** colspan for table cell mode */
  colSpan?: number;
  /** Extra classes on wrapper */
  className?: string;
};

/* ── Component ── */

export function EmptyState({
  icon = "inbox",
  message,
  description,
  ctaLabel,
  ctaHref,
  asTableCell = false,
  colSpan = 1,
  className,
}: EmptyStateProps) {
  const Icon = typeof icon === "string" ? iconPresets[icon] : icon;

  // Table cell mode (for admin DataTables)
  if (asTableCell) {
    return (
      <tr>
        <td
          colSpan={colSpan}
          className={cn("px-4 py-12 text-center text-ink-muted", className)}
        >
          <div className="flex flex-col items-center gap-2">
            {Icon && <Icon className="h-8 w-8 text-ink-muted/30" />}
            <span className="text-sm">{message}</span>
            {description && (
              <span className="text-xs text-ink-muted/70">{description}</span>
            )}
            {ctaLabel && ctaHref && (
              <Link
                href={ctaHref}
                className="mt-2 inline-flex items-center rounded-xl border border-gold/40 bg-gold-pale/50 px-4 py-1.5 text-xs font-semibold text-gold-dark transition-colors hover:bg-gold-pale"
              >
                {ctaLabel}
              </Link>
            )}
          </div>
        </td>
      </tr>
    );
  }

  // Card mode (for section/page empty states)
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-white py-12 md:py-16 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-pale">
          <Icon className="h-6 w-6 text-gold-dark" />
        </div>
      )}
      <p className="text-base md:text-lg font-medium text-ink">{message}</p>
      {description && (
        <p className="mt-1 text-sm text-ink-muted">{description}</p>
      )}
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-4 inline-flex rounded-3xl bg-gold px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-gold-dark"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
