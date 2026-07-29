"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type HomeScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
};

export default function HomeScrollReveal({
  children,
  className = "",
  delayMs = 0,
}: HomeScrollRevealProps) {
  const ref = useRef<globalThis.HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    setIsVisible(false);
    const observer = new globalThis.IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-scroll-reveal=""
      data-visible={isVisible ? "true" : "false"}
      className={`transform-gpu transition-[opacity,transform] duration-700 ease-out motion-reduce:transform-none motion-reduce:opacity-100 motion-reduce:transition-none ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${Math.max(0, delayMs)}ms` }}
    >
      {children}
    </div>
  );
}
