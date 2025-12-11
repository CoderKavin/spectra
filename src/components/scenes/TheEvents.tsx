"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

interface EventData {
  name: string;
  tagline: string;
  color: string;
  accentColor: string;
  icon: string;
}

const events: EventData[] = [
  {
    name: "EVENT X",
    tagline: "The unknown awaits",
    color: "from-violet-500/20 via-purple-500/10",
    accentColor: "#8B5CF6",
    icon: "✕",
  },
  {
    name: "BATTLE OF THE BANDS",
    tagline: "Feel the rhythm. Own the stage",
    color: "from-red-500/20 via-orange-500/10",
    accentColor: "#EF4444",
    icon: "♪",
  },
  {
    name: "SPOTLIGHT",
    tagline: "Where stars are born",
    color: "from-amber-500/20 via-yellow-500/10",
    accentColor: "#F59E0B",
    icon: "◈",
  },
  {
    name: "MURAL",
    tagline: "Art without boundaries",
    color: "from-emerald-500/20 via-teal-500/10",
    accentColor: "#10B981",
    icon: "◐",
  },
  {
    name: "UNVEIL",
    tagline: "Fashion meets expression",
    color: "from-pink-500/20 via-rose-500/10",
    accentColor: "#EC4899",
    icon: "◇",
  },
  {
    name: "BEAT THE STREET",
    tagline: "Move. Groove. Conquer",
    color: "from-cyan-500/20 via-blue-500/10",
    accentColor: "#06B6D4",
    icon: "◎",
  },
  {
    name: "RECAP",
    tagline: "Every moment. Immortalized",
    color: "from-slate-500/20 via-gray-500/10",
    accentColor: "#94A3B8",
    icon: "◉",
  },
];

function EventScene({
  event,
  index,
  totalEvents,
}: {
  event: EventData;
  index: number;
  totalEvents: number;
}) {
  const sceneRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sceneRef,
    offset: ["start end", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const sceneOpacity = useTransform(
    smoothProgress,
    [0, 0.2, 0.5, 0.8, 1],
    [0, 1, 1, 1, 0],
  );
  const contentOpacity = useTransform(
    smoothProgress,
    [0.15, 0.3, 0.6, 0.8],
    [0, 1, 1, 0],
  );
  const titleY = useTransform(smoothProgress, [0.15, 0.35], [80, 0]);
  const titleScale = useTransform(
    smoothProgress,
    [0.15, 0.35, 0.7],
    [0.9, 1, 1.05],
  );
  const taglineOpacity = useTransform(
    smoothProgress,
    [0.25, 0.4, 0.6, 0.75],
    [0, 1, 1, 0],
  );
  const taglineY = useTransform(smoothProgress, [0.25, 0.4], [30, 0]);
  const iconOpacity = useTransform(
    smoothProgress,
    [0.1, 0.25, 0.65, 0.8],
    [0, 0.3, 0.3, 0],
  );
  const iconScale = useTransform(
    smoothProgress,
    [0.1, 0.4, 0.7],
    [0.5, 1, 1.2],
  );
  const iconRotate = useTransform(smoothProgress, [0.1, 0.8], [0, 45]);
  const bgScale = useTransform(smoothProgress, [0, 0.5, 1], [0.8, 1, 1.2]);

  return (
    <div ref={sceneRef} className="relative h-[200vh]">
      <motion.div
        className="sticky top-0 h-screen overflow-hidden flex items-center justify-center"
        style={{ opacity: sceneOpacity }}
      >
        <motion.div
          className={`absolute inset-0 bg-gradient-radial ${event.color} to-transparent`}
          style={{ scale: bgScale }}
        />

        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: iconOpacity, scale: iconScale, rotate: iconRotate }}
        >
          <span
            className="text-[30vw] md:text-[25vw] font-thin select-none"
            style={{
              color: event.accentColor,
              opacity: 0.15,
              filter: "blur(2px)",
            }}
          >
            {event.icon}
          </span>
        </motion.div>

        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 100 + i * 50,
                height: 100 + i * 50,
                background: `radial-gradient(circle, ${event.accentColor}20 0%, transparent 70%)`,
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
              }}
              animate={{
                y: [0, -30 - i * 10, 0],
                x: [0, 10 + i * 5, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 6 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center px-8">
          <motion.div className="mb-8" style={{ opacity: contentOpacity }}>
            <span
              className="text-sm md:text-base tracking-[0.4em] font-light"
              style={{ color: event.accentColor }}
            >
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(totalEvents).padStart(2, "0")}
            </span>
          </motion.div>

          <motion.h2
            className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-extralight tracking-[0.1em] mb-6"
            style={{
              opacity: contentOpacity,
              y: titleY,
              scale: titleScale,
              color: "#ffffff",
              textShadow: `0 0 80px ${event.accentColor}40`,
            }}
          >
            {event.name}
          </motion.h2>

          <motion.p
            className="text-lg sm:text-xl md:text-2xl font-light tracking-[0.2em] text-white/70"
            style={{ opacity: taglineOpacity, y: taglineY }}
          >
            {event.tagline}
          </motion.p>

          <motion.div
            className="mt-12 mx-auto h-px w-32"
            style={{
              opacity: taglineOpacity,
              background: `linear-gradient(90deg, transparent, ${event.accentColor}, transparent)`,
            }}
          />
        </div>

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.8) 100%)",
          }}
        />
      </motion.div>
    </div>
  );
}

export function TheEvents() {
  return (
    <div className="relative bg-black">
      <div className="h-[50vh] flex items-center justify-center">
        <motion.h3
          className="text-xl md:text-2xl tracking-[0.4em] text-white/40 font-light"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          THE EVENTS
        </motion.h3>
      </div>

      {events.map((event, index) => (
        <EventScene
          key={event.name}
          event={event}
          index={index}
          totalEvents={events.length}
        />
      ))}
    </div>
  );
}
