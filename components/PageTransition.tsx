"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    // On pathname change, fade out briefly then swap content and fade in
    setVisible(false);
    const timeout = setTimeout(() => {
      setDisplayChildren(children);
      setVisible(true);
    }, 150);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // On first render, show immediately
  useEffect(() => {
    setDisplayChildren(children);
  }, [children]);

  return (
    <div
      className="transition-opacity duration-200 ease-out"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {displayChildren}
    </div>
  );
}
