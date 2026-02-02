"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Enhanced Link component that triggers transition before navigation.
 */
export function TransitionLink({
  href,
  children,
  className,
  ...props
}: React.ComponentProps<typeof Link>) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    // Dispatch custom event to trigger exit animation
    window.dispatchEvent(new CustomEvent("page-transition-start"));
    // Navigate after a brief delay to allow exit animation
    setTimeout(() => {
      router.push(href.toString());
    }, 180);
  };

  return (
    <Link href={href} onClick={handleClick} className={className} {...props}>
      {children}
    </Link>
  );
}

/**
 * Seamless page transition with soft landing effect.
 * - Listens for transition-start event to begin exit immediately on click
 * - Enter animation plays as soon as new content mounts
 * - Respects prefers-reduced-motion
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [phase, setPhase] = useState<"idle" | "exit" | "enter-prep" | "enter">("idle");
  const prevPath = useRef(pathname);
  const reducedMotion = useReducedMotion();
  const enterTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mounted = useRef(false);

  // Listen for manual transition trigger (from TransitionLink)
  useEffect(() => {
    const handleTransitionStart = () => {
      if (reducedMotion) return;
      setPhase("exit");
    };

    window.addEventListener("page-transition-start", handleTransitionStart);
    return () => window.removeEventListener("page-transition-start", handleTransitionStart);
  }, [reducedMotion]);

  // Handle pathname changes
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    if (pathname === prevPath.current) {
      setDisplayChildren(children);
      return;
    }
    prevPath.current = pathname;

    if (reducedMotion) {
      setDisplayChildren(children);
      setPhase("idle");
      return;
    }

    // If we're not already in exit phase, start it now
    if (phase !== "exit") {
      setPhase("exit");
    }

    // After exit, swap content and enter
    clearTimeout(enterTimer.current);
    enterTimer.current = setTimeout(() => {
      setDisplayChildren(children);
      setPhase("enter-prep");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase("enter");
          enterTimer.current = setTimeout(() => {
            setPhase("idle");
          }, 380);
        });
      });
    }, phase === "exit" ? 0 : 180); // If already exiting, proceed immediately

    return () => clearTimeout(enterTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, reducedMotion]);

  // Keep children fresh on same-route updates
  useEffect(() => {
    if (pathname === prevPath.current && phase === "idle") {
      setDisplayChildren(children);
    }
  }, [children, pathname, phase]);

  const softLanding = "cubic-bezier(0.22, 1, 0.36, 1)";
  const gentleExit = "cubic-bezier(0.4, 0, 1, 1)";

  const styles: Record<typeof phase, React.CSSProperties> = {
    idle: {
      opacity: 1,
      transform: "translateY(0) scale(1)",
      filter: "blur(0)",
    },
    exit: {
      opacity: 0,
      transform: "translateY(-8px) scale(0.995)",
      filter: "blur(2px)",
      transition: `opacity 180ms ${gentleExit}, transform 180ms ${gentleExit}, filter 180ms ${gentleExit}`,
    },
    "enter-prep": {
      opacity: 0,
      transform: "translateY(16px) scale(0.98)",
      filter: "blur(3px)",
    },
    enter: {
      opacity: 1,
      transform: "translateY(0) scale(1)",
      filter: "blur(0)",
      transition: `opacity 380ms ${softLanding}, transform 380ms ${softLanding}, filter 280ms ${softLanding}`,
    },
  };

  return (
    <div style={{ ...styles[phase], willChange: phase === "idle" ? "auto" : "opacity, transform, filter" }}>
      {displayChildren}
    </div>
  );
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}
