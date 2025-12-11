"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { TheArrival } from "@/components/scenes/TheArrival";
import { TheManifesto } from "@/components/scenes/TheManifesto";
import dynamic from "next/dynamic";

// Dynamic import for 3D events to avoid SSR issues
const TheEvents3D = dynamic(
  () =>
    import("@/components/scenes/TheEvents3D").then((mod) => mod.TheEvents3D),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    ),
  },
);
import { TheLegacy } from "@/components/scenes/TheLegacy";
import { TheGallery } from "@/components/scenes/TheGallery";
import { TheInvitation } from "@/components/scenes/TheInvitation";

function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const interval = 20;
    const increment = 100 / (duration / interval);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: "easeInOut" }}
    >
      <div className="text-center">
        <motion.img
          src="/SPECTRA_LOGO.png"
          alt="SPECTRA"
          className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-8 object-contain"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            filter: [
              "drop-shadow(0 0 20px rgba(139, 92, 246, 0.3))",
              "drop-shadow(0 0 40px rgba(139, 92, 246, 0.5))",
              "drop-shadow(0 0 20px rgba(139, 92, 246, 0.3))",
            ],
          }}
          transition={{
            duration: 0.8,
            filter: { duration: 2, repeat: Infinity },
          }}
        />

        <div className="w-48 h-px bg-white/10 mx-auto overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
            style={{ width: `${progress}%` }}
            transition={{ ease: "linear" }}
          />
        </div>

        <motion.p
          className="mt-6 text-xs tracking-[0.4em] text-white/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          ENTERING EXPERIENCE
        </motion.p>
      </div>
    </motion.div>
  );
}

export function CinematicExperience() {
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useSmoothScroll();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  if (!isMounted) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <>
      {/* Custom cursor - desktop only */}
      <div className="hidden md:block">
        <CustomCursor />
      </div>

      {/* Loading screen */}
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}
      </AnimatePresence>

      {/* Main experience */}
      <motion.main
        className="relative bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        {/* Film grain overlay */}
        <div className="film-grain" />

        {/* Vignette overlay */}
        <div className="vignette" />

        {/* ACT 1: The Arrival */}
        <TheArrival />

        {/* ACT 2: The Manifesto */}
        <TheManifesto />

        {/* ACT 3: The Events (3D Experience) */}
        <TheEvents3D />

        {/* ACT 4: The Legacy */}
        <TheLegacy />

        {/* ACT 5: The Gallery */}
        <TheGallery />

        {/* ACT 6: The Invitation */}
        <TheInvitation />

        {/* Final black screen */}
        <div className="h-screen bg-black flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 2 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <motion.img
              src="/SPECTRA_LOGO.png"
              alt="SPECTRA"
              className="w-16 h-16 mx-auto opacity-30"
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
      </motion.main>
    </>
  );
}
