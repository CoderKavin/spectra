"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Image from "next/image";

export function TheArrival() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const logoOpacity = useTransform(
    smoothProgress,
    [0, 0.1, 0.8, 1],
    [0, 1, 1, 0],
  );
  const logoScale = useTransform(
    smoothProgress,
    [0, 0.2, 0.5, 1],
    [1.2, 1, 0.6, 0.3],
  );
  const logoY = useTransform(smoothProgress, [0, 0.5, 1], ["0%", "0%", "-20%"]);
  const logoGlow = useTransform(smoothProgress, [0, 0.2, 0.5], [0, 1, 0.5]);

  const yearOpacity = useTransform(
    smoothProgress,
    [0.25, 0.35, 0.8, 1],
    [0, 1, 1, 0],
  );
  const yearY = useTransform(smoothProgress, [0.25, 0.4], [30, 0]);

  const bgOpacity = useTransform(smoothProgress, [0, 0.3, 0.7], [1, 1, 0.5]);
  const particlesOpacity = useTransform(smoothProgress, [0, 0.15], [0, 1]);
  const scrollIndicatorOpacity = useTransform(smoothProgress, [0, 0.1], [1, 0]);
  const gradientOpacity = useTransform(smoothProgress, [0.1, 0.4], [0, 0.6]);

  return (
    <div ref={containerRef} className="relative h-[300vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-black"
          style={{ opacity: bgOpacity }}
        />

        <motion.div
          className="absolute inset-0"
          style={{ opacity: gradientOpacity }}
        >
          <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-transparent to-transparent" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)",
            }}
          />
        </motion.div>

        <motion.div
          className="absolute inset-0"
          style={{ opacity: particlesOpacity }}
        >
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              style={{
                left: `${10 + ((i * 17) % 80)}%`,
                top: `${5 + ((i * 23) % 90)}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 3 + (i % 4),
                repeat: Infinity,
                delay: (i % 5) * 0.4,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>

        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="relative flex flex-col items-center"
            style={{
              opacity: logoOpacity,
              scale: logoScale,
              y: logoY,
            }}
          >
            <motion.div
              className="absolute inset-0 blur-3xl"
              style={{
                opacity: logoGlow,
                background:
                  "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)",
                transform: "scale(1.5)",
              }}
            />

            <motion.div
              className="relative z-10"
              animate={{
                filter: [
                  "drop-shadow(0 0 30px rgba(139, 92, 246, 0.3))",
                  "drop-shadow(0 0 60px rgba(139, 92, 246, 0.5))",
                  "drop-shadow(0 0 30px rgba(139, 92, 246, 0.3))",
                ],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Image
                src="/SPECTRA_LOGO.png"
                alt="SPECTRA"
                width={400}
                height={400}
                className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 object-contain"
                priority
              />
            </motion.div>

            <motion.div
              className="mt-8 md:mt-12"
              style={{
                opacity: yearOpacity,
                y: yearY,
              }}
            >
              <span className="text-xl sm:text-2xl md:text-3xl tracking-[0.3em] text-white/70 font-light">
                2027
              </span>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
          style={{ opacity: scrollIndicatorOpacity }}
        >
          <motion.div
            className="w-6 h-10 border border-white/30 rounded-full flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
          >
            <motion.div
              className="w-1.5 h-3 bg-white/50 rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </motion.div>

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)",
          }}
        />
      </div>
    </div>
  );
}
