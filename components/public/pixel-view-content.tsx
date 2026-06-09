"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

interface ViewContentProps {
  contentName: string;
  value: number;
}

/**
 * Fires Meta Pixel ViewContent event on mount.
 * Include once per competition detail page.
 */
export default function PixelViewContent({
  contentName,
  value,
}: ViewContentProps) {
  useEffect(() => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "ViewContent", {
        content_name: contentName,
        content_type: "product",
        value,
        currency: "GBP",
      });
    }
  }, [contentName, value]);

  return null;
}
