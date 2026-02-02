"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { PageTransition } from "./PageTransition";
import { type ReactNode } from "react";

export function LayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  if (isHomepage) {
    return <PageTransition>{children}</PageTransition>;
  }

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
