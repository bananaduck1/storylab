"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useSectionScrollJacking
 *
 * Controlled section-by-section scrolling. Responds immediately to scroll input,
 * then locks during animation to prevent skipping.
 */

type UseSectionScrollJackingOptions = {
  sectionRefs: React.MutableRefObject<(HTMLElement | null)[]>;
  onSectionChange?: (index: number) => void;
  duration?: number;
  enableOnTouch?: boolean;
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function canScrollInDirection(el: HTMLElement, dir: "up" | "down"): boolean {
  const { scrollTop, scrollHeight, clientHeight } = el;
  const style = window.getComputedStyle(el);
  const scrollable = style.overflowY === "auto" || style.overflowY === "scroll" ||
    (scrollHeight > clientHeight && style.overflowY !== "visible");
  if (!scrollable) return false;
  return dir === "up" ? scrollTop > 1 : scrollTop + clientHeight < scrollHeight - 1;
}

function findScrollableAncestor(
  target: HTMLElement,
  dir: "up" | "down",
  root: HTMLElement | null
): HTMLElement | null {
  let el: HTMLElement | null = target;
  while (el && el !== root && el !== document.body) {
    if (canScrollInDirection(el, dir)) return el;
    el = el.parentElement;
  }
  return null;
}

export function useSectionScrollJacking({
  sectionRefs,
  onSectionChange,
  duration = 350,
  enableOnTouch = false,
}: UseSectionScrollJackingOptions) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const activeIndexRef = useRef(0);
  const isAnimating = useRef(false);
  const animationRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
    setIsReady(true);
  }, []);

  const scrollToSection = useCallback(
    (index: number, instant = false) => {
      const section = sectionRefs.current[index];
      if (!section) return false;

      setActiveIndex(index);
      activeIndexRef.current = index;
      onSectionChange?.(index);

      if (prefersReducedMotion || instant) {
        section.scrollIntoView({ behavior: "auto", block: "start" });
        isAnimating.current = false;
        return true;
      }

      if (animationRef.current) cancelAnimationFrame(animationRef.current);

      isAnimating.current = true;
      const startY = window.scrollY;
      const targetY = section.getBoundingClientRect().top + window.scrollY;
      const distance = targetY - startY;
      const startTime = performance.now();

      const animate = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        window.scrollTo(0, startY + distance * easeOutCubic(progress));
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          isAnimating.current = false;
        }
      };

      animationRef.current = requestAnimationFrame(animate);
      return true;
    },
    [sectionRefs, duration, prefersReducedMotion, onSectionChange]
  );

  const navigate = useCallback(
    (dir: "up" | "down"): boolean => {
      if (isAnimating.current) return false;

      const curr = activeIndexRef.current;
      const count = sectionRefs.current.filter(Boolean).length;
      if (count === 0) return false;

      const next = dir === "down"
        ? Math.min(curr + 1, count - 1)
        : Math.max(curr - 1, 0);

      if (next === curr || !sectionRefs.current[next]) return false;

      scrollToSection(next);
      return true;
    },
    [sectionRefs, scrollToSection]
  );

  useEffect(() => {
    if (!isReady || (isTouchDevice && !enableOnTouch)) return;

    const handleWheel = (e: WheelEvent) => {
      const dir: "up" | "down" = e.deltaY > 0 ? "down" : "up";

      // Allow nested scrollable elements to scroll
      const scrollable = findScrollableAncestor(
        e.target as HTMLElement,
        dir,
        containerRef.current
      );
      if (scrollable) return;

      e.preventDefault();

      // Ignore if animating - this is the key to preventing skipping
      if (isAnimating.current) return;

      // Respond immediately
      navigate(dir);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;

      let dir: "up" | "down" | null = null;
      switch (e.key) {
        case "ArrowDown": case "PageDown": dir = "down"; break;
        case "ArrowUp": case "PageUp": dir = "up"; break;
        case " ": dir = e.shiftKey ? "up" : "down"; break;
        case "Home": e.preventDefault(); scrollToSection(0); return;
        case "End":
          e.preventDefault();
          scrollToSection(sectionRefs.current.filter(Boolean).length - 1);
          return;
        default: return;
      }
      if (dir) { e.preventDefault(); navigate(dir); }
    };

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      const section = document.getElementById(hash);
      if (!section) return;
      const idx = sectionRefs.current.findIndex(r => r === section);
      if (idx !== -1 && idx !== activeIndexRef.current) scrollToSection(idx, true);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("hashchange", handleHashChange);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isReady, isTouchDevice, enableOnTouch, navigate, scrollToSection, sectionRefs]);

  const setContainerRef = useCallback((el: HTMLElement | null) => {
    containerRef.current = el;
  }, []);

  return {
    activeIndex,
    setActiveIndex: scrollToSection,
    navigate,
    setContainerRef,
    prefersReducedMotion,
    isTouchDevice,
    isActive: isReady && (!isTouchDevice || enableOnTouch),
  };
}
