"use client";

import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with 3D/animations
const UltraCinematicExperience = dynamic(
  () =>
    import("@/components/UltraCinematicExperience").then(
      (mod) => mod.UltraCinematicExperience
    ),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#05060A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-8 border-2 border-spectra-violet/30 border-t-spectra-violet rounded-full animate-spin" />
          <p className="text-xs tracking-[0.4em] text-white/30 font-light">
            LOADING EXPERIENCE
          </p>
        </div>
      </div>
    ),
  }
);

export default function Home() {
  return <UltraCinematicExperience />;
}
