"use client";

import { useEffect, useState } from "react";

type Logo = {
  src: string;
  alt: string;
};

const logos: Logo[] = [
  { src: "/logos/harvard.png", alt: "Harvard" },
  { src: "/logos/yale.png", alt: "Yale" },
  { src: "/logos/princeton.png", alt: "Princeton" },
  { src: "/logos/stanford.png", alt: "Stanford" },
  { src: "/logos/northwestern.png", alt: "Northwestern" },
  { src: "/logos/uchicago.png", alt: "UChicago" },
  { src: "/logos/vanderbilt.webp", alt: "Vanderbilt" },
  { src: "/logos/jhu.png", alt: "Johns Hopkins" },
  { src: "/logos/northeastern.png", alt: "Northeastern" },
];

function LogoSet() {
  return (
    <>
      {logos.map((logo) => (
        <div
          key={logo.alt}
          className="flex h-20 w-48 shrink-0 items-center justify-center sm:h-28 sm:w-64 md:h-32 md:w-72"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo.src}
            alt={logo.alt}
            className="max-h-full max-w-full object-contain opacity-60 transition-opacity duration-300 hover:opacity-100"
            loading="lazy"
          />
        </div>
      ))}
    </>
  );
}

export function LogoMarquee() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div
      className="group relative overflow-hidden py-4"
      aria-label="Schools our students have been accepted to"
    >
      {/* Soft edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white/90 to-transparent sm:w-32" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white/90 to-transparent sm:w-32" />

      {prefersReducedMotion ? (
        <div className="flex flex-wrap items-center justify-center gap-8">
          <LogoSet />
        </div>
      ) : (
        <div className="marquee-track group-hover:[animation-play-state:paused]">
          {/* Two identical strips, back-to-back, no gap on the track itself */}
          <div className="flex shrink-0 items-center gap-14 pr-14 sm:gap-20 sm:pr-20">
            <LogoSet />
          </div>
          <div
            className="flex shrink-0 items-center gap-14 pr-14 sm:gap-20 sm:pr-20"
            aria-hidden="true"
          >
            <LogoSet />
          </div>
        </div>
      )}
    </div>
  );
}
