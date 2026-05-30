"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toggleFeatured, deleteCompetition } from "@/actions/admin";

interface RowActionsDropdownProps {
  competitionId: string;
  title: string;
  slug: string;
  status: string;
  featured: boolean;
  locale: string;
}

export function RowActionsDropdown({
  competitionId,
  title,
  slug,
  status,
  featured,
  locale,
}: RowActionsDropdownProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  // Position the portal menu relative to trigger button
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 4,
        left: rect.right - 192, // 192px = w-48
      });
    }
  }, []);

  useEffect(() => {
    if (open) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const clickedTrigger = triggerRef.current?.contains(target);
      const clickedMenu = menuRef.current?.contains(target);
      if (!clickedTrigger && !clickedMenu) {
        setOpen(false);
        setConfirmDelete(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  async function handleToggleFeatured() {
    setLoading(true);
    try {
      await toggleFeatured(competitionId);
    } catch { /* silent */ }
    setLoading(false);
    setOpen(false);
  }

  async function handleDelete() {
    setLoading(true);
    const result = await deleteCompetition(competitionId);
    if (result.success) router.refresh();
    setLoading(false);
    setConfirmDelete(false);
    setOpen(false);
  }

  const baseItem =
    "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition-colors";

  const menuNode = open && (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: menuPos.top,
        left: menuPos.left,
        zIndex: 9999,
      }}
      className="w-48 rounded-xl border border-border bg-white py-1 shadow-lg"
    >
      {/* View Entries */}
      <Link
        href={`/${locale}/admin/competitions/${competitionId}`}
        className={`${baseItem} text-ink-muted hover:bg-cream hover:text-ink`}
        onClick={() => setOpen(false)}
      >
        📋 View Entries
      </Link>

      {/* Edit */}
      <Link
        href={`/${locale}/admin/competitions/${competitionId}/edit`}
        className={`${baseItem} text-ink-muted hover:bg-cream hover:text-ink`}
        onClick={() => setOpen(false)}
      >
        ✏️ Edit
      </Link>

      {/* Feature / Unfeature */}
      <button
        onClick={handleToggleFeatured}
        disabled={loading}
        className={`${baseItem} ${
          featured
            ? "text-gold-dark hover:bg-gold-pale/30"
            : "text-ink-muted hover:bg-cream hover:text-ink"
        }`}
      >
        {featured ? "⭐ Unfeature" : "☆ Feature"}
      </button>

      {/* Assign Winner (only if CLOSED) */}
      {status === "CLOSED" && (
        <Link
          href={`/${locale}/admin/competitions/${competitionId}/assign-winner`}
          className={`${baseItem} text-gold-dark hover:bg-gold-pale/30`}
          onClick={() => setOpen(false)}
        >
          🏆 Assign Winner
        </Link>
      )}

      {/* Divider */}
      <div className="my-1 border-t border-border-light" />

      {/* Delete */}
      {confirmDelete ? (
        <div className="px-3 py-2">
          <p className="mb-2 text-xs text-ink-soft">
            Delete &quot;{title.slice(0, 24)}{title.length > 24 ? "…" : ""}&quot;?
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="rounded bg-urgent px-3 py-1 text-xs font-medium text-white hover:bg-urgent/80 disabled:opacity-50"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded border border-border px-3 py-1 text-xs text-ink-muted hover:border-gold"
            >
              No
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className={`${baseItem} text-urgent hover:bg-urgent/10`}
        >
          🗑️ Delete
        </button>
      )}
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => {
          updatePosition();
          setOpen(!open);
        }}
        disabled={loading}
        className="rounded-lg border border-border px-2.5 py-1.5 text-sm text-ink-muted transition-colors hover:border-gold hover:text-gold-dark disabled:opacity-50"
      >
        ⋮
      </button>
      {typeof document !== "undefined" && createPortal(menuNode, document.body)}
    </>
  );
}
