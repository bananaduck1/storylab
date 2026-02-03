"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";

export type Tutor = {
  id: string;
  name: string;
  title: string;
  headshotSrc: string;
  actionSrc: string;
  shortBio: string;
  longBio: string;
};

type TutorCardProps = {
  tutor: Tutor;
  scrollProgress?: number; // 0-1 based on viewport position
};

// Placeholder component for missing images
function ImagePlaceholder({ name, grayscale = false }: { name: string; grayscale?: boolean }) {
  const initials = name.split(" ").map(n => n[0]).join("");
  return (
    <div className={`absolute inset-0 flex items-center justify-center bg-zinc-200 ${grayscale ? "grayscale" : ""}`}>
      <span className="text-4xl font-semibold text-zinc-400">{initials}</span>
    </div>
  );
}

export function TutorCard({ tutor, scrollProgress = 0.5 }: TutorCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [headshotError, setHeadshotError] = useState(false);
  const [actionError, setActionError] = useState(false);

  // Parallax offset state (smoothed via rAF)
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const targetOffset = useRef({ x: 0, y: 0 });

  // Check for reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Smooth parallax animation loop using rAF
  // Easing: lerp toward target at ~10% per frame for smooth motion
  const animateParallax = useCallback(() => {
    setParallaxOffset((prev) => {
      const easing = 0.1; // Lower = smoother, slower
      const newX = prev.x + (targetOffset.current.x - prev.x) * easing;
      const newY = prev.y + (targetOffset.current.y - prev.y) * easing;

      // Stop animating if close enough to target
      const dx = Math.abs(targetOffset.current.x - newX);
      const dy = Math.abs(targetOffset.current.y - newY);

      if (dx < 0.1 && dy < 0.1) {
        return { x: targetOffset.current.x, y: targetOffset.current.y };
      }

      rafRef.current = requestAnimationFrame(animateParallax);
      return { x: newX, y: newY };
    });
  }, []);

  // Handle pointer move for cursor-based parallax
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (prefersReducedMotion || !cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      // Normalize pointer position to -1 to 1 range
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

      // Max parallax offset in pixels (subtle: 8-14px)
      const maxOffset = 10;
      targetOffset.current = { x: x * maxOffset, y: y * maxOffset };

      // Start animation loop if not already running
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(animateParallax);
    },
    [prefersReducedMotion, animateParallax]
  );

  // Reset parallax on pointer leave
  const handlePointerLeave = useCallback(() => {
    targetOffset.current = { x: 0, y: 0 };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animateParallax);
  }, [animateParallax]);

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const showExpanded = isHovered || isFocused || isExpanded;

  // Scroll-based parallax: slight translateY based on scroll progress
  // scrollProgress 0 = top of viewport, 1 = bottom
  // Maps to -8px to +8px translateY for subtle effect
  const scrollParallaxY = prefersReducedMotion ? 0 : (scrollProgress - 0.5) * 16;

  // Combined transform for the image
  const imageTransform = prefersReducedMotion
    ? "none"
    : `translate(${parallaxOffset.x}px, ${parallaxOffset.y + scrollParallaxY}px) scale(${showExpanded ? 1.03 : 1})`;

  return (
    <div
      ref={cardRef}
      className="group relative rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm transition-shadow duration-300 hover:shadow-lg focus-within:shadow-lg"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      {/* Image container with overflow hidden for parallax bounds */}
      <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100">
        {/* Headshot (B/W / muted) - visible by default */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            showExpanded ? "opacity-0" : "opacity-100"
          }`}
        >
          {headshotError ? (
            <ImagePlaceholder name={tutor.name} grayscale />
          ) : (
            <Image
              src={tutor.headshotSrc}
              alt={`${tutor.name} headshot`}
              fill
              className="object-cover grayscale"
              style={{
                transform: imageTransform,
                transition: prefersReducedMotion ? "none" : "transform 0.3s ease-out",
              }}
              onError={() => setHeadshotError(true)}
            />
          )}
        </div>

        {/* Action image (color) - visible on hover/focus */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            showExpanded ? "opacity-100" : "opacity-0"
          }`}
        >
          {actionError ? (
            <ImagePlaceholder name={tutor.name} />
          ) : (
            <Image
              src={tutor.actionSrc}
              alt={`${tutor.name} in action`}
              fill
              className="object-cover"
              style={{
                transform: imageTransform,
                transition: prefersReducedMotion ? "none" : "transform 0.3s ease-out",
              }}
              onError={() => setActionError(true)}
            />
          )}
        </div>

        {/* Bio overlay - slides up on hover/focus */}
        <div
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-5 pt-16 transition-all duration-500 ${
            showExpanded
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          }`}
          style={{
            transition: prefersReducedMotion
              ? "opacity 0.2s"
              : "opacity 0.5s ease-out, transform 0.5s ease-out",
          }}
        >
          <p className="text-sm leading-relaxed text-white/90">{tutor.longBio}</p>
        </div>
      </div>

      {/* Card content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold tracking-tight text-zinc-950">
          {tutor.name}
        </h3>
        <p className="mt-1 text-sm text-zinc-600">{tutor.title}</p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500">{tutor.shortBio}</p>

        {/* Mobile: tap to expand affordance */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 text-xs font-medium text-zinc-500 hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 md:hidden"
          aria-expanded={isExpanded}
        >
          {isExpanded ? "Less" : "More"}
        </button>
      </div>

      {/* Focusable overlay for keyboard users */}
      <a
        href="/team"
        className="absolute inset-0 z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400"
        aria-label={`View ${tutor.name}'s profile`}
        tabIndex={0}
      />
    </div>
  );
}

// Grid wrapper with scroll-based parallax tracking
export function TutorGrid({ tutors }: { tutors: Tutor[] }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [scrollProgresses, setScrollProgresses] = useState<number[]>(
    tutors.map(() => 0.5)
  );
  const rafRef = useRef<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Throttled scroll handler using rAF
  useEffect(() => {
    if (prefersReducedMotion) return;

    const updateScrollProgress = () => {
      if (!gridRef.current) return;

      const cards = gridRef.current.querySelectorAll("[data-tutor-card]");
      const viewportHeight = window.innerHeight;

      const progresses = Array.from(cards).map((card) => {
        const rect = card.getBoundingClientRect();
        // Calculate how far through the viewport the card center is
        const cardCenter = rect.top + rect.height / 2;
        // 0 = card center at top of viewport, 1 = at bottom
        const progress = cardCenter / viewportHeight;
        return Math.max(0, Math.min(1, progress));
      });

      setScrollProgresses(progresses);
    };

    const handleScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateScrollProgress);
    };

    // Listen to the scroll container (parent with overflow-y: auto)
    const scrollContainer = gridRef.current?.closest(".scroll-snap-container") ||
                           gridRef.current?.closest(".tutor-scroll-container");
    const target = scrollContainer || window;

    target.addEventListener("scroll", handleScroll, { passive: true });
    updateScrollProgress(); // Initial calculation

    return () => {
      target.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={gridRef}
      className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {tutors.map((tutor, i) => (
        <div key={tutor.id} data-tutor-card>
          <TutorCard tutor={tutor} scrollProgress={scrollProgresses[i]} />
        </div>
      ))}
    </div>
  );
}

/**
 * Two-column sticky layout:
 * - Left: sticky heading that stays fixed while scrolling
 * - Right: scrollable list of tutor cards
 * - Mobile: collapses to single column
 */
export function TutorStickySection({
  tutors,
  title,
  ctaHref = "/team",
  ctaLabel = "Meet the full team",
}: {
  tutors: Tutor[];
  title: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgresses, setScrollProgresses] = useState<number[]>(
    tutors.map(() => 0.5)
  );
  const rafRef = useRef<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Track scroll progress for parallax inside the right column
  useEffect(() => {
    if (prefersReducedMotion || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;

    const updateScrollProgress = () => {
      const cards = container.querySelectorAll("[data-tutor-card]");
      const containerHeight = container.clientHeight;

      const progresses = Array.from(cards).map((card) => {
        const rect = card.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        // Position relative to the scroll container
        const relativeTop = rect.top - containerRect.top;
        const cardCenter = relativeTop + rect.height / 2;
        // 0 = card center at top of container, 1 = at bottom
        const progress = cardCenter / containerHeight;
        return Math.max(0, Math.min(1, progress));
      });

      setScrollProgresses(progresses);
    };

    const handleScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateScrollProgress);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    updateScrollProgress();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [prefersReducedMotion]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6">
      {/* Two-column layout: sticky left, scrollable right (desktop) */}
      {/* Single column on mobile */}
      <div className="grid gap-8 md:grid-cols-[1fr_1.5fr] lg:grid-cols-[1fr_2fr]">
        {/* Left column: sticky text */}
        <div
          className="md:sticky md:self-start"
          style={{
            // Sticky positioning: stays fixed while right column scrolls
            // top = navbar height (~80px) + some padding
            top: "calc(80px + 2rem)",
          }}
        >
          <h2 className="text-2xl font-semibold leading-snug tracking-tight text-zinc-950 sm:text-3xl lg:text-4xl">
            {title}
          </h2>
          <div className="mt-8 hidden md:block">
            <a
              href={ctaHref}
              className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              {ctaLabel}
            </a>
          </div>
        </div>

        {/* Right column: scrollable card list (desktop) / normal list (mobile) */}
        {/* Desktop: fixed height scroll container */}
        {/* Mobile: no scroll container, cards flow normally */}
        <div className="relative">
          {/* Desktop scroll container */}
          <div
            ref={scrollContainerRef}
            className="
              tutor-scroll-container
              hidden md:block
              overflow-y-auto
              overscroll-contain
            "
            style={{
              // Fixed height = viewport - navbar - section padding
              height: "calc(100svh - 80px - 4rem)",
              // Smooth scrolling (respects reduced motion via CSS)
              scrollBehavior: prefersReducedMotion ? "auto" : "smooth",
              // Subtle scroll snapping inside the container
              scrollSnapType: "y proximity",
            }}
          >
            <div className="space-y-6 pb-8">
              {tutors.map((tutor, i) => (
                <div
                  key={tutor.id}
                  data-tutor-card
                  style={{
                    // Snap each card to start
                    scrollSnapAlign: "start",
                    scrollSnapStop: "always",
                  }}
                >
                  <TutorCard tutor={tutor} scrollProgress={scrollProgresses[i]} />
                </div>
              ))}
            </div>

            {/* Gradient fade at bottom to imply more content */}
            <div
              className="pointer-events-none sticky bottom-0 h-16 bg-gradient-to-t from-white/90 to-transparent"
              aria-hidden="true"
            />
          </div>

          {/* Mobile: normal list (no scroll container) */}
          <div className="space-y-6 md:hidden">
            {tutors.map((tutor) => (
              <div key={tutor.id} data-tutor-card>
                <TutorCard tutor={tutor} scrollProgress={0.5} />
              </div>
            ))}
          </div>

          {/* Mobile CTA */}
          <div className="mt-8 md:hidden">
            <a
              href={ctaHref}
              className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              {ctaLabel}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
