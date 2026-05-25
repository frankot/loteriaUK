"use client";

import { usePathname } from "next/navigation";
import Header from "./header";
import Footer from "./footer";

interface LayoutShellProps {
  isLoggedIn: boolean;
  userEmail?: string;
  children: React.ReactNode;
}

export function LayoutShell({
  isLoggedIn,
  userEmail,
  children,
}: LayoutShellProps) {
  const pathname = usePathname();
  // Hide header + footer on admin routes
  const isAdmin = pathname.split("/")[2] === "admin";

  return (
    <>
      {!isAdmin && (
        <Header isLoggedIn={isLoggedIn} userEmail={userEmail} />
      )}
      <main className="flex-1">{children}</main>
      {!isAdmin && <Footer />}
    </>
  );
}
