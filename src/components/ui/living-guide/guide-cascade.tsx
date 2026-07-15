"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function GuideCascade({
  children,
  staggerMs = 80,
  className,
}: {
  children: ReactNode;
  staggerMs?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const children = container.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      child.style.setProperty("--lg-cascade-delay", `${i * staggerMs}ms`);
      child.classList.add("lg-cascade-child");
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            container.classList.add("lg-cascade-active");
            observer.disconnect();
          }
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [staggerMs]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
