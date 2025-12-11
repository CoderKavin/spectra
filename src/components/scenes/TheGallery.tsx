"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

const floatingImages = [
  { id: 1, x: "10%", y: "20%", size: "w-48 h-64", delay: 0, rotation: -5 },
  { id: 2, x: "65%", y: "15%", size: "w-56 h-72", delay: 0.2, rotation: 3 },
  { id: 3, x: "30%", y: "45%", size: "w-64 h-80", delay: 0.4, rotation: -2 },
  { id: 4, x: "75%", y: "50%", size: "w-52 h-68", delay: 0.6, rotation: 4 },
  { id: 5, x: "15%", y: "70%", size: "w-44 h-56", delay: 0.8, rotation: -6 },
  { id: 6, x: "55%", y: "75%", size: "w-60 h-76", delay: 1.0, rotation: 2 },
  { id: 7, x: "40%", y: "25%", size: "w-40 h-52", delay: 0.3, rotation: -3 },
  { id: 8, x: "85%", y: "35%", size: "w-48 h-64", delay: 0.5, rotation: 5 },
];

function FloatingImage({
  image,
  scrollProgress,
}: {
  image: (typeof floatingImages)[0];
  scrollProgress: MotionValue<number>;
}) {
  const parallaxY = useTransform(
    scrollProgress,
    [0, 1],
    [100 + image.delay * 200, -100 - image.delay * 100],
  );

  const opacity = useTransform(
    scrollProgress,
    [0, 0.2, 0.5, 0.8, 1],
    [0, 1, 1, 1, 0],
  );

  const scale = useTransform(
    scrollProgress,
    [0, 0.3, 0.7, 1],
    [0.8, 1, 1, 0.9],
  );

  const imageScale = useTransform(scrollProgress, [0, 1], [1, 1.15]);

  return (
    <motion.div
      className={`absolute ${image.size} rounded-lg overflow-hidden`}
      style={{
        left: image.x,
        top: image.y,
        y: parallaxY,
        opacity,
        scale,
        rotate: image.rotation,
        zIndex: Math.round(image.delay * 10),
      }}
    >
      <motion.div className="w-full h-full" style={{ scale: imageScale }}>
        <div
          className="w-full h-full"
          style={{
            background: `linear-gradient(
              ${135 + image.id * 20}deg,
              rgba(139, 92, 246, 0.3) 0%,
              rgba(59, 130, 246, 0.2) 50%,
              rgba(236, 72, 153, 0.3) 100%
            )`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent" />
      </motion.div>
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      />
    </motion.div>
  );
}

export function TheGallery() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
    
  });

  const headerOpacity = useTransform(
    scrollYProgress,
    [0, 0.1, 0.15],
    [0, 1, 0.3],
  );
  const headerY = useTransform(scrollYProgress, [0, 0.1], [50, 0]);
  const watermarkOpacity = useTransform(
    scrollYProgress,
    [0.2, 0.4, 0.7, 0.9],
    [0, 0.08, 0.08, 0],
  );
  const watermarkScale = useTransform(scrollYProgress, [0.2, 0.8], [0.8, 1.2]);

  return (
    <div ref={containerRef} className="relative bg-black h-[400vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div
          className="absolute top-24 left-0 right-0 text-center z-20"
          style={{ opacity: headerOpacity, y: headerY }}
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extralight tracking-[0.3em] text-white/60">
            MEMORIES
          </h2>
        </motion.div>

        <div className="absolute inset-0">
          {floatingImages.map((image) => (
            <FloatingImage
              key={image.id}
              image={image}
              scrollProgress={scrollYProgress}
            />
          ))}
        </div>

        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            opacity: watermarkOpacity,
            scale: watermarkScale,
          }}
        >
          <img
            src="/SPECTRA_LOGO.png"
            alt=""
            className="w-96 h-96 md:w-[500px] md:h-[500px] object-contain opacity-50"
            style={{
              filter: "grayscale(50%) brightness(0.5)",
            }}
          />
        </motion.div>

        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-purple-500/30 rounded-full"
              style={{
                left: `${5 + ((i * 19) % 90)}%`,
                top: `${5 + ((i * 23) % 90)}%`,
              }}
              animate={{
                y: [0, -50, 0],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 5 + (i % 5),
                repeat: Infinity,
                delay: (i % 6) * 0.5,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.9) 100%)",
          }}
        />

        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>
    </div>
  );
}
