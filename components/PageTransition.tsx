"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef, type ReactNode } from "react";

/**
 * Smooth page transition with elegant fade-in effect.
 * No exit animation - just a soft entrance when navigating to a new page.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const [mounted, setMounted] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      // Trigger new animation by changing key
      setAnimationKey((k) => k + 1);
    }
  }, [pathname]);

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion || !mounted) {
    return <>{children}</>;
  }

  return (
    <div
      key={animationKey}
      className="animate-fade-in-up"
      style={{
        animationDuration: "400ms",
        animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        animationFillMode: "both",
      }}
    >
      {children}
    </div>
  );
}
