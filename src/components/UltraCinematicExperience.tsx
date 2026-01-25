"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Lenis from "lenis";
import { CinematicOverlay } from "@/components/ui/CinematicOverlay";

// Dynamic import for the 3D scene
const CinematicScene = dynamic(
  () =>
    import("@/components/scene/CinematicScene").then(
      (mod) => mod.CinematicScene
    ),
  {
    ssr: false,
    loading: () => null,
  }
);

type Quality = "low" | "medium" | "high";

export function UltraCinematicExperience() {
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [quality, setQuality] = useState<Quality>("medium");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showSkipOverlay, setShowSkipOverlay] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Calculate states based on progress
  const showPrologue = progress < 0.08;
  const showEpilogue = progress > 0.92;
  const activeZone = Math.min(7, Math.max(0, Math.floor((progress - 0.1) / 0.1)));

  // Initialize on mount
  useEffect(() => {
    setMounted(true);

    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    mediaQuery.addEventListener("change", handleChange);

    // Detect device capability for quality
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isLowEndDevice = navigator.hardwareConcurrency <= 4;

    if (isMobile || isLowEndDevice) {
      setQuality("low");
    } else if (navigator.hardwareConcurrency >= 8) {
      setQuality("high");
    }

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  // Initialize Lenis smooth scroll
  useEffect(() => {
    if (!mounted) return;

    const lenis = new Lenis({
      duration: reducedMotion ? 0 : 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: !reducedMotion,
      wheelMultiplier: 0.8,
      touchMultiplier: 1.5,
    });

    lenisRef.current = lenis;

    // Update scroll progress
    lenis.on("scroll", ({ progress: scrollProgress }: { progress: number }) => {
      setProgress(scrollProgress);
      if (scrollProgress > 0.01 && !hasStarted) {
        setHasStarted(true);
      }
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, [mounted, reducedMotion, hasStarted]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSkipOverlay(true);
      } else if (e.key === "ArrowDown" || e.key === " ") {
        lenisRef.current?.scrollTo(window.scrollY + window.innerHeight * 0.5, {
          duration: 1,
        });
      } else if (e.key === "ArrowUp") {
        lenisRef.current?.scrollTo(window.scrollY - window.innerHeight * 0.5, {
          duration: 1,
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle enter from prologue
  const handleEnter = useCallback(() => {
    lenisRef.current?.scrollTo(window.innerHeight * 0.5, { duration: 2 });
    setHasStarted(true);
  }, []);

  // Skip to section
  const skipToSection = useCallback((sectionProgress: number) => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const targetScroll = scrollHeight * sectionProgress;
    lenisRef.current?.scrollTo(targetScroll, { duration: 1.5 });
    setShowSkipOverlay(false);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#05060A] flex items-center justify-center">
        <motion.div
          className="w-12 h-12 border-2 border-spectra-violet/30 border-t-spectra-violet rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <>
      {/* Scroll container - this drives the progress */}
      <div
        ref={scrollContainerRef}
        className="relative"
        style={{ height: "8000vh" }}
      />

      {/* 3D Scene */}
      <CinematicScene
        progress={progress}
        quality={quality}
        reducedMotion={reducedMotion}
      />

      {/* UI Overlays */}
      <CinematicOverlay
        progress={progress}
        activeZone={activeZone}
        showPrologue={showPrologue}
        showEpilogue={showEpilogue}
        onEnter={handleEnter}
      />

      {/* Quality toggle */}
      <QualityToggle quality={quality} setQuality={setQuality} />

      {/* Skip overlay (accessibility) */}
      <AnimatePresence>
        {showSkipOverlay && (
          <SkipOverlay
            onClose={() => setShowSkipOverlay(false)}
            onSkipTo={skipToSection}
          />
        )}
      </AnimatePresence>

      {/* Film grain overlay */}
      <div className="film-grain" />

      {/* Vignette */}
      <div className="vignette" />
    </>
  );
}

function QualityToggle({
  quality,
  setQuality,
}: {
  quality: Quality;
  setQuality: (q: Quality) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 left-6 z-50 hidden md:block">
      <motion.button
        className="px-3 py-2 text-xs tracking-[0.2em] text-white/40 hover:text-white/70 transition-colors border border-white/10 hover:border-white/30"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {quality.toUpperCase()}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute bottom-full left-0 mb-2 bg-black/90 border border-white/10 backdrop-blur-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {(["low", "medium", "high"] as Quality[]).map((q) => (
              <button
                key={q}
                className={`block w-full px-4 py-2 text-left text-xs tracking-[0.2em] transition-colors ${
                  quality === q
                    ? "text-spectra-violet bg-spectra-violet/10"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }`}
                onClick={() => {
                  setQuality(q);
                  setIsOpen(false);
                }}
              >
                {q.toUpperCase()}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SkipOverlay({
  onClose,
  onSkipTo,
}: {
  onClose: () => void;
  onSkipTo: (progress: number) => void;
}) {
  const sections = [
    { name: "PROLOGUE", progress: 0 },
    { name: "EVENT X", progress: 0.12 },
    { name: "BATTLE OF THE BANDS", progress: 0.22 },
    { name: "SPOTLIGHT", progress: 0.32 },
    { name: "MURAL", progress: 0.42 },
    { name: "UNVEIL", progress: 0.52 },
    { name: "BEAT THE STREET", progress: 0.62 },
    { name: "PARODY", progress: 0.72 },
    { name: "RECAP", progress: 0.82 },
    { name: "EPILOGUE", progress: 0.95 },
  ];

  return (
    <motion.div
      className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-[#0a0a15] border border-white/10 p-8 max-w-md w-full mx-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg tracking-[0.3em] text-white/80 font-light mb-6 text-center">
          SKIP TO SECTION
        </h3>

        <div className="space-y-2">
          {sections.map((section) => (
            <button
              key={section.name}
              className="w-full px-4 py-3 text-left text-sm tracking-[0.2em] text-white/50 hover:text-white hover:bg-spectra-violet/10 transition-colors border border-transparent hover:border-spectra-violet/30"
              onClick={() => onSkipTo(section.progress)}
            >
              {section.name}
            </button>
          ))}
        </div>

        <button
          className="mt-6 w-full py-3 text-xs tracking-[0.3em] text-white/30 hover:text-white/60 transition-colors"
          onClick={onClose}
        >
          PRESS ESC TO CLOSE
        </button>
      </motion.div>
    </motion.div>
  );
}
