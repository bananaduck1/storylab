"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Smooth page transition with soft fade-in and slide-up effect.
 * Uses CSS animations for reliability.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (pathname !== prevPathname) {
      if (prefersReducedMotion) {
        setDisplayChildren(children);
        setPrevPathname(pathname);
        return;
      }

      // Start exit animation
      setIsAnimating(true);

      // After exit, swap content and start enter animation
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setPrevPathname(pathname);

        // Small delay to ensure DOM update before enter animation
        requestAnimationFrame(() => {
          setIsAnimating(false);
        });
      }, 200);

      return () => clearTimeout(timer);
    } else {
      // Same pathname, just update children
      setDisplayChildren(children);
    }
  }, [pathname, children, prevPathname]);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        isAnimating
          ? "opacity-0 translate-y-2 scale-[0.99]"
          : "opacity-100 translate-y-0 scale-100"
      }`}
      style={{
        transitionTimingFunction: isAnimating
          ? "cubic-bezier(0.4, 0, 1, 1)"
          : "cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {displayChildren}
    </div>
  );
}
