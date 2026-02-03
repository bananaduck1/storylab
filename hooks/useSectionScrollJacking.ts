"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useSectionScrollJacking
 *
 * A hook that implements controlled section-by-section scrolling (scroll-jacking)
 * for full-viewport sections. One wheel/trackpad gesture moves exactly one section.
 *
 * Key features:
 * - Debounce wheel events to prevent momentum skipping
 * - Smooth animated transitions with easing
 * - Nested scrollable areas scroll naturally until at boundary
 * - Respects prefers-reduced-motion
 * - Keyboard navigation support
 * - Disabled on touch devices (uses native scroll)
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

function canScrollInDirection(
  element: HTMLElement,
  direction: "up" | "down"
): boolean {
  const { scrollTop, scrollHeight, clientHeight } = element;
  const style = window.getComputedStyle(element);
  const isScrollable =
    style.overflowY === "auto" ||
    style.overflowY === "scroll" ||
    (scrollHeight > clientHeight && style.overflowY !== "visible");

  if (!isScrollable) return false;

  if (direction === "up") {
    return scrollTop > 1;
  } else {
    return scrollTop + clientHeight < scrollHeight - 1;
  }
}

function findScrollableAncestor(
  target: HTMLElement,
  direction: "up" | "down",
  rootElement: HTMLElement | null
): HTMLElement | null {
  let current: HTMLElement | null = target;

  while (current && current !== rootElement && current !== document.body) {
    if (canScrollInDirection(current, direction)) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

export function useSectionScrollJacking({
  sectionRefs,
  onSectionChange,
  duration = 400,
  enableOnTouch = false,
}: UseSectionScrollJackingOptions) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Use ref for activeIndex to avoid stale closure
  const activeIndexRef = useRef(0);

  // Debounce state - tracks if we're currently in a scroll transition
  const isAnimating = useRef(false);
  const animationRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  // Wheel delta accumulator for debouncing trackpad momentum
  const wheelDeltaAccum = useRef(0);
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const isTouchCapable =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-expect-error - msMaxTouchPoints is a legacy IE property
      navigator.msMaxTouchPoints > 0;
    setIsTouchDevice(isTouchCapable);
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

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      isAnimating.current = true;

      const startY = window.scrollY;
      const targetY = section.getBoundingClientRect().top + window.scrollY;
      const distance = targetY - startY;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);

        window.scrollTo(0, startY + distance * easedProgress);

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
    (direction: "up" | "down"): boolean => {
      // Block if currently animating
      if (isAnimating.current) return false;

      const currentIndex = activeIndexRef.current;
      const sectionsCount = sectionRefs.current.filter(Boolean).length;

      if (sectionsCount === 0) return false;

      const newIndex =
        direction === "down"
          ? Math.min(currentIndex + 1, sectionsCount - 1)
          : Math.max(currentIndex - 1, 0);

      if (newIndex === currentIndex) return false;
      if (!sectionRefs.current[newIndex]) return false;

      scrollToSection(newIndex);
      return true;
    },
    [sectionRefs, scrollToSection]
  );

  useEffect(() => {
    if (!isReady) return;
    if (isTouchDevice && !enableOnTouch) return;

    /**
     * Wheel handler with debouncing.
     * Accumulates wheel delta and only triggers navigation once per "gesture".
     * This prevents trackpad momentum from skipping multiple sections.
     */
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      const rootElement = containerRef.current;

      const direction: "up" | "down" = e.deltaY > 0 ? "down" : "up";

      // Check for nested scrollable elements
      const scrollableAncestor = findScrollableAncestor(
        target,
        direction,
        rootElement
      );

      if (scrollableAncestor) {
        return; // Let nested element scroll naturally
      }

      // Prevent default to stop native scroll
      e.preventDefault();

      // If animating, ignore all wheel events
      if (isAnimating.current) return;

      // Accumulate delta for debouncing
      wheelDeltaAccum.current += e.deltaY;

      // Clear existing timeout
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }

      // Set a short timeout to process accumulated delta
      // This groups rapid wheel events into a single navigation
      wheelTimeoutRef.current = setTimeout(() => {
        const accum = wheelDeltaAccum.current;
        wheelDeltaAccum.current = 0;

        // Only navigate if delta is significant (prevents tiny trackpad movements)
        if (Math.abs(accum) > 30) {
          navigate(accum > 0 ? "down" : "up");
        }
      }, 50); // 50ms debounce window
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputElement =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInputElement) return;

      let direction: "up" | "down" | null = null;

      switch (e.key) {
        case "ArrowDown":
        case "PageDown":
          direction = "down";
          break;
        case "ArrowUp":
        case "PageUp":
          direction = "up";
          break;
        case " ":
          direction = e.shiftKey ? "up" : "down";
          break;
        case "Home":
          e.preventDefault();
          scrollToSection(0);
          return;
        case "End":
          e.preventDefault();
          const sectionsCount = sectionRefs.current.filter(Boolean).length;
          scrollToSection(sectionsCount - 1);
          return;
        default:
          return;
      }

      if (direction) {
        e.preventDefault();
        navigate(direction);
      }
    };

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;

      const targetSection = document.getElementById(hash);
      if (!targetSection) return;

      const sectionIndex = sectionRefs.current.findIndex(
        (ref) => ref === targetSection
      );

      if (sectionIndex !== -1 && sectionIndex !== activeIndexRef.current) {
        scrollToSection(sectionIndex, true);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("hashchange", handleHashChange);

    handleHashChange();

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("hashchange", handleHashChange);

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
    };
  }, [isReady, isTouchDevice, enableOnTouch, navigate, scrollToSection, sectionRefs]);

  const setContainerRef = useCallback((element: HTMLElement | null) => {
    containerRef.current = element;
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
