"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";

interface ZoneData {
  name: string;
  tagline: string;
  index: number;
}

const ZONES: ZoneData[] = [
  { name: "EVENT X", tagline: "Every clue matters.", index: 0 },
  { name: "BATTLE OF THE BANDS", tagline: "Turn noise into legend.", index: 1 },
  { name: "SPOTLIGHT", tagline: "Own the room.", index: 2 },
  { name: "MURAL", tagline: "Make the walls speak.", index: 3 },
  { name: "UNVEIL", tagline: "Elegance in motion.", index: 4 },
  { name: "BEAT THE STREET", tagline: "Rhythm without permission.", index: 5 },
  { name: "PARODY", tagline: "Rewrite the reel.", index: 6 },
  { name: "RECAP", tagline: "One night. Eight worlds.", index: 7 },
];

interface CinematicOverlayProps {
  progress: number;
  activeZone: number;
  showPrologue: boolean;
  showEpilogue: boolean;
  onEnter?: () => void;
}

export function CinematicOverlay({
  progress,
  activeZone,
  showPrologue,
  showEpilogue,
  onEnter,
}: CinematicOverlayProps) {
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const currentZone = ZONES[activeZone] || ZONES[0];
  const showZoneInfo = !showPrologue && !showEpilogue && activeZone >= 0 && activeZone < 8;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Prologue */}
      <AnimatePresence>
        {showPrologue && (
          <PrologueOverlay
            progress={progress}
            onEnter={onEnter}
            logoLoaded={logoLoaded}
            logoError={logoError}
            setLogoLoaded={setLogoLoaded}
            setLogoError={setLogoError}
          />
        )}
      </AnimatePresence>

      {/* Zone Title Overlay */}
      <AnimatePresence mode="wait">
        {showZoneInfo && (
          <ZoneOverlay key={activeZone} zone={currentZone} progress={progress} />
        )}
      </AnimatePresence>

      {/* Progress indicator */}
      {!showPrologue && !showEpilogue && (
        <ProgressIndicator progress={progress} activeZone={activeZone} />
      )}

      {/* Epilogue */}
      <AnimatePresence>
        {showEpilogue && <EpilogueOverlay progress={progress} />}
      </AnimatePresence>

      {/* Scroll indicator */}
      {!showEpilogue && progress < 0.95 && (
        <ScrollIndicator show={!showPrologue || progress > 0.02} />
      )}
    </div>
  );
}

function PrologueOverlay({
  progress,
  onEnter,
  logoLoaded,
  logoError,
  setLogoLoaded,
  setLogoError,
}: {
  progress: number;
  onEnter?: () => void;
  logoLoaded: boolean;
  logoError: boolean;
  setLogoLoaded: (v: boolean) => void;
  setLogoError: (v: boolean) => void;
}) {
  const fadeOut = progress > 0.08;

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#05060A]"
      initial={{ opacity: 1 }}
      animate={{ opacity: fadeOut ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
    >
      {/* TRINS PRESENTS */}
      <motion.div
        className="absolute top-[20%]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        <span className="text-xs md:text-sm tracking-[0.5em] text-white/40 font-light">
          TRINS PRESENTS
        </span>
      </motion.div>

      {/* Logo / SPECTRA 8 */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
      >
        {!logoError ? (
          <div className="relative">
            <Image
              src="/SPECTRA_LOGO.png"
              alt="SPECTRA 8"
              width={300}
              height={300}
              className="w-48 h-48 md:w-72 md:h-72 object-contain"
              onLoad={() => setLogoLoaded(true)}
              onError={() => setLogoError(true)}
              priority
            />
            {/* Glow effect */}
            <div
              className="absolute inset-0 blur-3xl opacity-50"
              style={{
                background:
                  "radial-gradient(circle, rgba(124, 58, 237, 0.4) 0%, transparent 70%)",
              }}
            />
          </div>
        ) : (
          <div className="text-center">
            <h1
              className="text-6xl md:text-8xl font-extralight tracking-[0.2em] text-white"
              style={{ textShadow: "0 0 80px rgba(124, 58, 237, 0.5)" }}
            >
              SPECTRA
            </h1>
            <span
              className="text-4xl md:text-6xl font-thin tracking-[0.3em] text-spectra-violet"
              style={{ textShadow: "0 0 60px rgba(124, 58, 237, 0.8)" }}
            >
              8
            </span>
          </div>
        )}
      </motion.div>

      {/* Annual Cultural Festival */}
      <motion.div
        className="absolute bottom-[30%] text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <p className="text-sm md:text-base tracking-[0.4em] text-white/60 font-light mb-2">
          ANNUAL CULTURAL FESTIVAL
        </p>
        <p className="text-lg md:text-xl tracking-[0.3em] text-white/80 font-light">
          2027
        </p>
      </motion.div>

      {/* Scroll to begin */}
      <motion.div
        className="absolute bottom-[12%] pointer-events-auto cursor-pointer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1 }}
        onClick={onEnter}
      >
        <motion.div
          className="flex flex-col items-center gap-4"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-xs tracking-[0.4em] text-white/40">
            SCROLL TO BEGIN
          </span>
          <div className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function ZoneOverlay({ zone, progress }: { zone: ZoneData; progress: number }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="text-center px-8">
        {/* Zone number */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <span className="text-sm md:text-base tracking-[0.5em] text-spectra-violet/80 font-light">
            {String(zone.index + 1).padStart(2, "0")} / 08
          </span>
        </motion.div>

        {/* Zone name */}
        <motion.h2
          className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extralight tracking-[0.1em] text-white mb-6"
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
          style={{
            textShadow: "0 0 100px rgba(124, 58, 237, 0.3)",
          }}
        >
          {zone.name}
        </motion.h2>

        {/* Tagline */}
        <motion.p
          className="text-base sm:text-lg md:text-xl tracking-[0.2em] text-white/60 font-light"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          {zone.tagline}
        </motion.p>

        {/* Decorative line */}
        <motion.div
          className="mt-10 mx-auto h-px w-24 md:w-32"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.6), transparent)",
          }}
        />
      </div>
    </motion.div>
  );
}

function ProgressIndicator({
  progress,
  activeZone,
}: {
  progress: number;
  activeZone: number;
}) {
  return (
    <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-3">
      {Array.from({ length: 8 }, (_, i) => (
        <motion.div
          key={i}
          className="relative"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <div
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              i === activeZone
                ? "bg-spectra-violet scale-150"
                : i < activeZone
                  ? "bg-white/60"
                  : "bg-white/20"
            }`}
          />
          {i === activeZone && (
            <motion.div
              className="absolute inset-0 rounded-full bg-spectra-violet"
              animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}

function EpilogueOverlay({ progress }: { progress: number }) {
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowCTA(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#05060A]/90"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
    >
      {/* SPECTRA 8 */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        <h2
          className="text-5xl md:text-7xl font-extralight tracking-[0.15em] text-white mb-4"
          style={{ textShadow: "0 0 80px rgba(124, 58, 237, 0.4)" }}
        >
          SPECTRA 8
        </h2>
        <p className="text-lg md:text-xl tracking-[0.3em] text-white/60 font-light">
          TRINS
        </p>
        <p className="text-2xl md:text-3xl tracking-[0.2em] text-white/80 font-light mt-4">
          2027
        </p>
      </motion.div>

      {/* CTA */}
      <AnimatePresence>
        {showCTA && (
          <motion.div
            className="text-center pointer-events-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-sm md:text-base tracking-[0.3em] text-white/50 mb-8">
              ENTER THE LINEUP
            </p>

            <a
              href="#register"
              className="inline-block px-8 py-4 border border-spectra-violet/50 text-spectra-violet tracking-[0.2em] text-sm hover:bg-spectra-violet/10 hover:border-spectra-violet transition-all duration-500"
              data-hoverable="true"
            >
              REGISTRATIONS OPEN SOON
            </a>

            <p className="text-xs tracking-[0.2em] text-white/30 mt-8">
              WATCH THIS SPACE
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative elements */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <motion.div
          className="w-px h-16 bg-gradient-to-b from-spectra-violet/50 to-transparent"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
        />
      </div>
    </motion.div>
  );
}

function ScrollIndicator({ show }: { show: boolean }) {
  return (
    <motion.div
      className="absolute bottom-8 right-8 hidden md:block"
      initial={{ opacity: 0 }}
      animate={{ opacity: show ? 0.5 : 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="flex flex-col items-center gap-2"
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="w-5 h-8 border border-white/30 rounded-full flex justify-center pt-2">
          <motion.div
            className="w-1 h-2 bg-white/50 rounded-full"
            animate={{ y: [0, 8, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
