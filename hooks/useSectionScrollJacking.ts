"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useSectionScrollJacking
 *
 * A hook that implements controlled section-by-section scrolling (scroll-jacking)
 * for full-viewport sections. One wheel/trackpad gesture moves exactly one section.
 *
 * Key features:
 * - Lock/debounce prevents momentum "skipping" multiple sections
 * - Smooth animated transitions with easing
 * - Nested scrollable areas scroll naturally until at boundary
 * - Respects prefers-reduced-motion
 * - Keyboard navigation support (Arrow keys, Page keys, Space)
 * - Disabled on touch devices (uses native scroll)
 */

type UseSectionScrollJackingOptions = {
  /** Array of section element refs */
  sectionRefs: React.MutableRefObject<(HTMLElement | null)[]>;
  /** Callback when active section changes */
  onSectionChange?: (index: number) => void;
  /** Animation duration in ms (default: 400) */
  duration?: number;
  /** Cooldown between navigations in ms (default: 600) */
  cooldown?: number;
  /** Enable on touch devices (default: false) */
  enableOnTouch?: boolean;
};

// Ease-out cubic for smooth deceleration
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Check if an element can scroll in a given direction.
 * Returns true if the element has more content to scroll in that direction.
 */
function canScrollInDirection(
  element: HTMLElement,
  direction: "up" | "down"
): boolean {
  const { scrollTop, scrollHeight, clientHeight } = element;

  // Element must be scrollable (has overflow)
  const style = window.getComputedStyle(element);
  const isScrollable =
    style.overflowY === "auto" ||
    style.overflowY === "scroll" ||
    // Handle Firefox's overflow-y: hidden with scrollHeight > clientHeight
    (scrollHeight > clientHeight && style.overflowY !== "visible");

  if (!isScrollable) return false;

  if (direction === "up") {
    // Can scroll up if not at the top
    return scrollTop > 0;
  } else {
    // Can scroll down if not at the bottom (with 1px tolerance)
    return scrollTop + clientHeight < scrollHeight - 1;
  }
}

/**
 * Find the nearest scrollable ancestor that can scroll in the given direction.
 * Starts from the event target and walks up the DOM tree.
 */
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
  cooldown = 600,
  enableOnTouch = false,
}: UseSectionScrollJackingOptions) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Use ref for activeIndex to avoid stale closure issues in event handlers
  const activeIndexRef = useRef(0);

  // Navigation lock to prevent rapid inputs
  const isLocked = useRef(false);
  const lockTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  // Check for reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Detect touch device
  useEffect(() => {
    const isTouchCapable =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-expect-error - msMaxTouchPoints is a legacy IE property
      navigator.msMaxTouchPoints > 0;
    setIsTouchDevice(isTouchCapable);
    // Mark as ready after detecting touch capability
    setIsReady(true);
  }, []);

  /**
   * Animate scroll to a specific section using requestAnimationFrame.
   * Uses easing for smooth motion. Respects reduced-motion preference.
   */
  const scrollToSection = useCallback(
    (index: number, instant = false) => {
      const section = sectionRefs.current[index];
      if (!section) return false;

      // Update both state and ref
      setActiveIndex(index);
      activeIndexRef.current = index;
      onSectionChange?.(index);

      // Use instant scroll if reduced motion or requested
      if (prefersReducedMotion || instant) {
        section.scrollIntoView({ behavior: "auto", block: "start" });
        return true;
      }

      // Cancel any ongoing animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

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
        }
      };

      animationRef.current = requestAnimationFrame(animate);
      return true;
    },
    [sectionRefs, duration, prefersReducedMotion, onSectionChange]
  );

  /**
   * Navigate to the next or previous section.
   * Includes lock mechanism to prevent rapid navigation.
   * Returns true if navigation was triggered, false otherwise.
   */
  const navigate = useCallback(
    (direction: "up" | "down"): boolean => {
      // Check if navigation is locked (prevents rapid inputs)
      if (isLocked.current) return false;

      // Use ref to get current index (avoids stale closure)
      const currentIndex = activeIndexRef.current;
      const sectionsCount = sectionRefs.current.filter(Boolean).length;

      if (sectionsCount === 0) return false;

      const newIndex =
        direction === "down"
          ? Math.min(currentIndex + 1, sectionsCount - 1)
          : Math.max(currentIndex - 1, 0);

      // Don't navigate if already at boundary
      if (newIndex === currentIndex) return false;

      // Check if target section exists
      if (!sectionRefs.current[newIndex]) return false;

      // Lock navigation during transition
      isLocked.current = true;

      // Clear any existing timeout
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current);
      }

      // Unlock after cooldown period
      lockTimeoutRef.current = setTimeout(() => {
        isLocked.current = false;
      }, cooldown);

      scrollToSection(newIndex);
      return true;
    },
    [sectionRefs, cooldown, scrollToSection]
  );

  // Set up event listeners
  useEffect(() => {
    // Wait until we've determined touch capability
    if (!isReady) return;

    // Skip scroll-jacking on touch devices unless explicitly enabled
    if (isTouchDevice && !enableOnTouch) return;

    /**
     * Handle wheel events with boundary detection for nested scrollables.
     * Only triggers section navigation when:
     * 1. No nested scrollable can scroll in the wheel direction
     * 2. Navigation is not locked
     */
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      const rootElement = containerRef.current;

      // Determine scroll direction from wheel delta
      // Positive deltaY = scroll down, negative = scroll up
      const direction: "up" | "down" = e.deltaY > 0 ? "down" : "up";

      // Check if there's a scrollable element under the pointer that can scroll
      const scrollableAncestor = findScrollableAncestor(
        target,
        direction,
        rootElement
      );

      // If a nested scrollable can handle this scroll, let it (don't prevent)
      if (scrollableAncestor) {
        return;
      }

      // Try to navigate - only prevent default if navigation actually happens
      const didNavigate = navigate(direction);
      if (didNavigate) {
        e.preventDefault();
      }
    };

    /**
     * Handle keyboard navigation.
     * Supports: ArrowUp/Down, PageUp/Down, Space/Shift+Space, Home/End
     */
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
        case " ": // Space
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
        const didNavigate = navigate(direction);
        if (didNavigate) {
          e.preventDefault();
        }
      }
    };

    /**
     * Handle hash changes (e.g., clicking anchor links or browser find).
     * Updates active section based on the hash target.
     */
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

    // Wheel event with passive: false to allow preventDefault
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("hashchange", handleHashChange);

    // Check initial hash
    handleHashChange();

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("hashchange", handleHashChange);

      // Cleanup animation and timeout on unmount
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current);
      }
    };
  }, [isReady, isTouchDevice, enableOnTouch, navigate, scrollToSection, sectionRefs]);

  /**
   * Set up the container element reference.
   * This should be called with the root scrolling container element.
   */
  const setContainerRef = useCallback((element: HTMLElement | null) => {
    containerRef.current = element;
  }, []);

  return {
    /** Current active section index */
    activeIndex,
    /** Set the active section index and scroll to it */
    setActiveIndex: scrollToSection,
    /** Navigate to previous/next section */
    navigate,
    /** Set the container element ref for boundary detection */
    setContainerRef,
    /** Whether reduced motion is preferred */
    prefersReducedMotion,
    /** Whether the device is touch-capable */
    isTouchDevice,
    /** Whether scroll-jacking is currently active */
    isActive: isReady && (!isTouchDevice || enableOnTouch),
  };
}
