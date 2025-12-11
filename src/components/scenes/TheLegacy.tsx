"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const years = [
  { year: "2019", highlight: false },
  { year: "2020", highlight: false },
  { year: "2021", highlight: false },
  { year: "2022", highlight: false },
  { year: "2023", highlight: false },
  { year: "2024", highlight: false },
  { year: "2025", highlight: false },
  { year: "2026", highlight: false },
  { year: "2027", highlight: true },
];

export function TheLegacy() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={containerRef} className="relative bg-black h-[250vh]">
      <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center">
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: useTransform(scrollYProgress, [0.7, 0.9], [0, 0.8]),
          }}
        >
          <div
            className="w-[600px] h-[600px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 60%)",
              filter: "blur(60px)",
            }}
          />
        </motion.div>

        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{
            opacity: useTransform(scrollYProgress, [0, 0.1, 0.15], [1, 1, 0]),
          }}
        >
          <motion.div
            className="mb-4 text-purple-500/60"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            viewport={{ once: true }}
          >
            <span className="text-5xl">◈</span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-extralight tracking-[0.2em] text-white/80">
            THE JOURNEY
          </h2>
          <p className="mt-4 text-sm tracking-[0.3em] text-white/40 font-light">
            EIGHT YEARS IN THE MAKING
          </p>
        </motion.div>

        <div className="relative z-10 text-center">
          {years.map((yearData, index) => {
            const isLast = yearData.highlight;
            const startProgress = index / years.length;
            const endProgress = (index + 1) / years.length;

            return (
              <motion.div
                key={yearData.year}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  opacity: useTransform(
                    scrollYProgress,
                    [
                      Math.max(0, startProgress - 0.05),
                      startProgress + 0.02,
                      endProgress - 0.02,
                      Math.min(1, endProgress + 0.05),
                    ],
                    [0, 1, 1, isLast ? 1 : 0],
                  ),
                  scale: useTransform(
                    scrollYProgress,
                    [startProgress, startProgress + 0.05, endProgress - 0.02],
                    [0.8, isLast ? 1.1 : 1, isLast ? 1.1 : 1],
                  ),
                }}
              >
                <h2
                  className={`font-extralight tracking-[0.05em] ${
                    isLast
                      ? "text-8xl sm:text-9xl md:text-[10rem] lg:text-[12rem]"
                      : "text-7xl sm:text-8xl md:text-9xl"
                  }`}
                  style={{
                    color: isLast ? "#ffffff" : "rgba(255,255,255,0.7)",
                    textShadow: isLast
                      ? "0 0 100px rgba(139, 92, 246, 0.8), 0 0 200px rgba(139, 92, 246, 0.4)"
                      : "0 0 60px rgba(255,255,255,0.2)",
                  }}
                >
                  {yearData.year}
                </h2>

                {isLast && (
                  <motion.p
                    className="mt-6 text-xl md:text-2xl tracking-[0.3em] text-purple-400 font-light"
                    style={{
                      opacity: useTransform(
                        scrollYProgress,
                        [0.85, 0.95],
                        [0, 1],
                      ),
                    }}
                  >
                    SPECTRA 8
                  </motion.p>
                )}
              </motion.div>
            );
          })}
        </div>

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.8) 100%)",
          }}
        />
      </div>
    </div>
  );
}
