"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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

export function CinematicExperience() {
  const [isMounted, setIsMounted] = useState(false);

  useSmoothScroll();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <>
      {/* Custom cursor - desktop only */}
      <div className="hidden md:block">
        <CustomCursor />
      </div>

      {/* Main experience */}
      <motion.main
        className="relative bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
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
      </motion.main>
    </>
  );
}
