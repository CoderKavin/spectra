"use client";

import { useEffect, useState, useRef, RefObject } from "react";

interface ScrollProgressOptions {
  offset?: [string, string];
}

export function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  options: ScrollProgressOptions = {}
): number {
  const [progress, setProgress] = useState(0);
  const { offset = ["start end", "end start"] } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate progress from 0 to 1 as element scrolls through viewport
      const elementTop = rect.top;
      const elementHeight = rect.height;

      // Start when element enters viewport, end when it leaves
      const start = windowHeight;
      const end = -elementHeight;
      const current = elementTop;

      const rawProgress = (start - current) / (start - end);
      const clampedProgress = Math.max(0, Math.min(1, rawProgress));

      setProgress(clampedProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => window.removeEventListener("scroll", handleScroll);
  }, [ref, offset]);

  return progress;
}

export function useElementInView(
  ref: RefObject<HTMLElement | null>,
  threshold: number = 0.5
): boolean {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return isInView;
}
