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
 * Crossfade + upward drift (6px) + scale settle (0.99→1.00), ~220ms ease-out.
 * Outgoing content stays until incoming mounts. Respects prefers-reduced-motion.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [state, setState] = useState<"idle" | "exit" | "enter-start" | "enter-active">("idle");
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

    // Exit: fade out current content
    setState("exit");

    exitTimer.current = setTimeout(() => {
      // Swap content and prepare enter
      setDisplayChildren(children);
      setState("enter-start"); // render at offset position for 1 frame

      // Next frame: activate the transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setState("enter-active");

          enterTimer.current = setTimeout(() => {
            setState("idle");
          }, 230);
        });
      });
    }, 130);

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, reducedMotion, cleanup]);

  // Keep children fresh on same-route updates
  useEffect(() => {
    if (pathname === prevPath.current && state === "idle") {
      setDisplayChildren(children);
    }
  }, [children, pathname, state]);

  const styles: Record<typeof state, React.CSSProperties> = {
    idle: {},
    exit: {
      opacity: 0,
      transform: "translateY(-2px) scale(0.998)",
      transition: "opacity 130ms ease-in, transform 130ms ease-in",
    },
    "enter-start": {
      opacity: 0,
      transform: "translateY(6px) scale(0.99)",
    },
    "enter-active": {
      opacity: 1,
      transform: "translateY(0) scale(1)",
      transition: "opacity 220ms ease-out, transform 220ms ease-out",
    },
  };

  return <div style={styles[state]}>{displayChildren}</div>;
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
