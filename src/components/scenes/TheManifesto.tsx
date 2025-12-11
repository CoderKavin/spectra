"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

export function TheManifesto() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const line1Opacity = useTransform(
    smoothProgress,
    [0.1, 0.2, 0.3, 0.4],
    [0, 1, 1, 0],
  );
  const line1Y = useTransform(smoothProgress, [0.1, 0.2], [50, 0]);
  const line1Scale = useTransform(
    smoothProgress,
    [0.1, 0.2, 0.35],
    [0.95, 1, 1.02],
  );

  const line2Opacity = useTransform(
    smoothProgress,
    [0.25, 0.35, 0.45, 0.55],
    [0, 1, 1, 0],
  );
  const line2Y = useTransform(smoothProgress, [0.25, 0.35], [50, 0]);
  const line2Scale = useTransform(
    smoothProgress,
    [0.25, 0.35, 0.5],
    [0.95, 1, 1.02],
  );

  const line3Opacity = useTransform(
    smoothProgress,
    [0.4, 0.5, 0.65, 0.75],
    [0, 1, 1, 0],
  );
  const line3Y = useTransform(smoothProgress, [0.4, 0.5], [50, 0]);
  const line3Scale = useTransform(
    smoothProgress,
    [0.4, 0.5, 0.65],
    [0.95, 1, 1.02],
  );

  const spotlightOpacity = useTransform(
    smoothProgress,
    [0.05, 0.15, 0.7, 0.85],
    [0, 0.6, 0.6, 0],
  );
  const spotlightScale = useTransform(smoothProgress, [0.1, 0.5], [0.8, 1.2]);
  const particleOpacity = useTransform(
    smoothProgress,
    [0.05, 0.15, 0.75, 0.9],
    [0, 0.4, 0.4, 0],
  );

  return (
    <div ref={containerRef} className="relative h-[400vh]">
      <div className="sticky top-0 h-screen overflow-hidden bg-black flex items-center justify-center">
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: spotlightOpacity }}
        >
          <motion.div
            className="w-[600px] h-[600px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%)",
              scale: spotlightScale,
            }}
          />
        </motion.div>

        <motion.div
          className="absolute inset-0 overflow-hidden"
          style={{ opacity: particleOpacity }}
        >
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-0.5 h-0.5 bg-white/40 rounded-full"
              style={{
                left: `${10 + ((i * 13) % 80)}%`,
                top: `${10 + ((i * 17) % 80)}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 4 + (i % 3),
                repeat: Infinity,
                delay: (i % 6) * 0.5,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>

        <div className="relative z-10 text-center px-8 max-w-5xl">
          <motion.div
            className="mb-6 md:mb-8"
            style={{
              opacity: line1Opacity,
              y: line1Y,
              scale: line1Scale,
            }}
          >
            <h2
              className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extralight tracking-[0.15em] text-white"
              style={{ textShadow: "0 0 80px rgba(255,255,255,0.3)" }}
            >
              AUGUST 1, 2026
            </h2>
          </motion.div>

          <motion.div
            className="mb-6 md:mb-8"
            style={{
              opacity: line2Opacity,
              y: line2Y,
              scale: line2Scale,
            }}
          >
            <h2
              className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extralight tracking-[0.15em] text-white"
              style={{ textShadow: "0 0 80px rgba(255,255,255,0.3)" }}
            >
              SEVEN EVENTS.
            </h2>
          </motion.div>

          <motion.div
            style={{
              opacity: line3Opacity,
              y: line3Y,
              scale: line3Scale,
            }}
          >
            <h2
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extralight tracking-[0.12em] text-white/90"
              style={{ textShadow: "0 0 60px rgba(139, 92, 246, 0.4)" }}
            >
              ONE UNFORGETTABLE
            </h2>
            <h2
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-[0.15em] text-white mt-2"
              style={{ textShadow: "0 0 80px rgba(139, 92, 246, 0.5)" }}
            >
              EXPERIENCE.
            </h2>
          </motion.div>
        </div>

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)",
          }}
        />
      </div>
    </div>
  );
}
