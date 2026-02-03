"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { PageTransition } from "./PageTransition";
import { type ReactNode } from "react";

export function LayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const isAcademyOverview = pathname === "/academy";

  // Homepage: no navbar/footer, just page transition
  if (isHomepage) {
    return <PageTransition>{children}</PageTransition>;
  }

  // Academy overview: navbar only, page manages its own scroll (scroll-snap)
  if (isAcademyOverview) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden">
        <Navbar />
        <main id="content" className="flex-1 overflow-hidden">
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
