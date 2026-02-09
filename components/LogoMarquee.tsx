"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

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
      className="group relative overflow-hidden"
      aria-label="Schools our students have been accepted to"
    >
      {/* Soft edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white/80 to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white/80 to-transparent sm:w-24" />

      <div
        className={`flex items-center gap-12 sm:gap-16 ${
          prefersReducedMotion ? "" : "marquee-track group-hover:[animation-play-state:paused]"
        }`}
        style={
          prefersReducedMotion
            ? { justifyContent: "center", flexWrap: "wrap", gap: "2rem" }
            : undefined
        }
      >
        {/* Two copies for seamless infinite loop */}
        {[0, 1].map((copy) => (
          <div
            key={copy}
            className="flex shrink-0 items-center gap-12 sm:gap-16"
            aria-hidden={copy === 1 ? "true" : undefined}
          >
            {logos.map((logo) => (
              <div
                key={logo.alt}
                className="flex h-14 w-32 shrink-0 items-center justify-center sm:h-16 sm:w-40"
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={160}
                  height={64}
                  unoptimized
                  className="h-full w-full object-contain opacity-70 transition-opacity duration-300 hover:opacity-100"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
