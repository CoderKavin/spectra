"use client";

import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with animations
const CinematicExperience = dynamic(
  () =>
    import("@/components/CinematicExperience").then(
      (mod) => mod.CinematicExperience,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    ),
  },
);

export default function Home() {
  return <CinematicExperience />;
}
