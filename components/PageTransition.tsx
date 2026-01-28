"use client";

import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";

/**
 * Smooth page transition with soft landing effect.
 * - Exit: gentle fade + slight upward drift + subtle blur
 * - Enter: fade in from below with deceleration curve for "soft landing"
 * - Respects prefers-reduced-motion
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [phase, setPhase] = useState<"idle" | "exit" | "enter-prep" | "enter">("idle");
  const prevPath = useRef(pathname);
  const reducedMotion = useReducedMotion();
  const exitTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const enterTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const cleanup = useCallback(() => {
    clearTimeout(exitTimer.current);
    clearTimeout(enterTimer.current);
  }, []);

  useEffect(() => {
    if (pathname === prevPath.current) {
      setDisplayChildren(children);
      return;
    }
    prevPath.current = pathname;

    if (reducedMotion) {
      setDisplayChildren(children);
      return;
    }

    cleanup();

    // Phase 1: Exit - fade out with gentle upward motion
    setPhase("exit");

    exitTimer.current = setTimeout(() => {
      // Phase 2: Swap content, prepare entry position
      setDisplayChildren(children);
      setPhase("enter-prep");

      // Phase 3: Trigger enter animation (needs 2 frames for browser to paint prep state)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase("enter");

          enterTimer.current = setTimeout(() => {
            setPhase("idle");
          }, 380); // Match enter duration
        });
      });
    }, 180); // Exit duration

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, reducedMotion, cleanup]);

  // Keep children fresh on same-route updates
  useEffect(() => {
    if (pathname === prevPath.current && phase === "idle") {
      setDisplayChildren(children);
    }
  }, [children, pathname, phase]);

  // Cubic-bezier for soft landing: slow start, smooth deceleration
  // cubic-bezier(0.22, 1, 0.36, 1) = easeOutQuint-like
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
