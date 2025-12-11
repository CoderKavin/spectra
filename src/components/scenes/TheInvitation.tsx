"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function TheInvitation() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"],
  });

  const spotlightOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);
  const spotlightScale = useTransform(scrollYProgress, [0, 0.4], [0.5, 1]);
  const mainTextOpacity = useTransform(scrollYProgress, [0.1, 0.25], [0, 1]);
  const mainTextY = useTransform(scrollYProgress, [0.1, 0.3], [60, 0]);
  const mainTextScale = useTransform(scrollYProgress, [0.1, 0.3], [0.9, 1]);
  const subtitleOpacity = useTransform(scrollYProgress, [0.25, 0.4], [0, 1]);
  const subtitleY = useTransform(scrollYProgress, [0.25, 0.4], [30, 0]);
  const dateOpacity = useTransform(scrollYProgress, [0.35, 0.5], [0, 1]);
  const dateY = useTransform(scrollYProgress, [0.35, 0.5], [20, 0]);
  const contactOpacity = useTransform(scrollYProgress, [0.5, 0.65], [0, 1]);
  const logoGlow = useTransform(scrollYProgress, [0.8, 1], [0.3, 1]);
  const fadeToBlack = useTransform(scrollYProgress, [0.9, 1], [0, 0.7]);

  return (
    <div ref={containerRef} className="relative bg-black h-[200vh]">
      <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center">
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: spotlightOpacity }}
        >
          <motion.div
            className="w-[800px] h-[800px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 50%)",
              scale: spotlightScale,
            }}
          />
        </motion.div>

        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: logoGlow }}
        >
          <div
            className="w-[600px] h-[600px]"
            style={{
              background:
                "radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 60%)",
              filter: "blur(60px)",
            }}
          />
        </motion.div>

        <div className="relative z-10 text-center px-8">
          <motion.h2
            className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-extralight tracking-[0.08em] text-white mb-8"
            style={{
              opacity: mainTextOpacity,
              y: mainTextY,
              scale: mainTextScale,
              textShadow: "0 0 100px rgba(255,255,255,0.3)",
            }}
          >
            BE PART OF IT
          </motion.h2>

          <motion.div
            className="mb-16"
            style={{ opacity: subtitleOpacity, y: subtitleY }}
          >
            <span
              className="text-2xl sm:text-3xl md:text-4xl tracking-[0.25em] font-light"
              style={{
                background: "linear-gradient(90deg, #8B5CF6, #EC4899, #06B6D4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              SPECTRA 8 | 2026
            </span>
          </motion.div>

          <motion.div
            className="mb-16"
            style={{ opacity: dateOpacity, y: dateY }}
          >
            <p className="text-lg sm:text-xl md:text-2xl tracking-[0.2em] text-white/60 font-light">
              Aug 1, 2026
            </p>
          </motion.div>

          <motion.div
            className="w-32 h-px mx-auto mb-12"
            style={{
              opacity: contactOpacity,
              background:
                "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.6), transparent)",
            }}
          />

          <motion.div className="mb-10" style={{ opacity: contactOpacity }}>
            <p className="text-xs md:text-sm tracking-[0.4em] text-white/30 font-light mb-4">
              HOSTED BY
            </p>
            <p className="text-base md:text-lg tracking-[0.2em] text-white/60 font-light">
              TRIVANDRUM INTERNATIONAL SCHOOL
            </p>
          </motion.div>

          <motion.div
            className="flex flex-col items-center gap-3"
            style={{ opacity: contactOpacity }}
          >
            <a
              href="mailto:spectra@trins.org"
              className="text-sm md:text-base tracking-[0.2em] text-white/40 hover:text-white/70 transition-colors duration-300"
              data-hoverable="true"
            >
              spectra@trins.org
            </a>
          </motion.div>
        </div>

        <motion.div
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ opacity: fadeToBlack }}
        />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.8) 100%)",
          }}
        />

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-0.5 h-0.5 bg-purple-400/40 rounded-full"
              style={{
                left: `${20 + ((i * 13) % 60)}%`,
                top: `${20 + ((i * 17) % 60)}%`,
              }}
              animate={{
                y: [0, -40, 0],
                opacity: [0.2, 0.6, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 5 + (i % 4),
                repeat: Infinity,
                delay: (i % 6) * 0.5,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
