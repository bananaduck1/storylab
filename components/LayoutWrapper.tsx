"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { PageTransition } from "./PageTransition";
import { type ReactNode } from "react";

export function LayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAcademyOverview = pathname === "/academy";

  // Lab, admin, login, and auth routes manage their own layout
  if (
    pathname.startsWith("/lab") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth/")
  ) {
    return <>{children}</>;
  }

  // Academy overview: non-sticky navbar that scrolls away, no footer
  if (isAcademyOverview) {
    return (
      <div className="flex min-h-dvh flex-col">
        <div className="relative z-50 [&_header]:static [&_header]:border-b-0">
          <Navbar />
        </div>
        <main id="content" className="flex-1" style={{ transform: 'translateY(0)' }}>
          {children}
        </main>
      </div>
    );
  }

  // All other pages: navbar + footer + page transition
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main id="content" className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </div>
  );
}
