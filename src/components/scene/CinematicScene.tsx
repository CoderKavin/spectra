"use client";

import { Suspense, useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { CameraPath, ZONE_POSITIONS, PROLOGUE_Z, EPILOGUE_Z } from "./CameraPath";
import { MetallicCorridor } from "./MetallicCorridor";
import { AllZones } from "./zones/AllZones";
import { PostProcessing } from "./effects/PostProcessing";
import { LiquidMetalParticles, MetallicDust } from "./effects/LiquidMetal";

interface CinematicSceneProps {
  progress: number;
  quality: "low" | "medium" | "high";
  reducedMotion: boolean;
}

export function CinematicScene({
  progress,
  quality,
  reducedMotion,
}: CinematicSceneProps) {
  // Calculate active zone based on progress
  const activeZone = useMemo(() => {
    // Map progress to zone (0.1 to 0.9 covers zones 0-7)
    const zoneProgress = (progress - 0.1) / 0.8;
    if (zoneProgress < 0) return -1; // Prologue
    if (zoneProgress > 1) return 8; // Epilogue
    return Math.floor(zoneProgress * 8);
  }, [progress]);

  return (
    <Canvas
      gl={{
        antialias: quality !== "low",
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
      }}
      dpr={quality === "high" ? [1, 2] : [1, 1.5]}
      shadows={quality !== "low"}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "#05060A",
      }}
    >
      <Suspense fallback={null}>
        <SceneContent
          progress={progress}
          activeZone={activeZone}
          quality={quality}
          reducedMotion={reducedMotion}
        />
      </Suspense>
    </Canvas>
  );
}

function SceneContent({
  progress,
  activeZone,
  quality,
  reducedMotion,
}: {
  progress: number;
  activeZone: number;
  quality: "low" | "medium" | "high";
  reducedMotion: boolean;
}) {
  return (
    <>
      {/* Camera */}
      <PerspectiveCamera makeDefault fov={60} near={0.1} far={500} />
      <CameraPath progress={progress} reducedMotion={reducedMotion} />

      {/* Environment */}
      <color attach="background" args={["#05060A"]} />
      <fog attach="fog" args={["#05060A", 20, 100]} />

      {/* Lighting */}
      <SceneLighting activeZone={activeZone} progress={progress} />

      {/* Environment map for metallic reflections */}
      <Environment preset="night" />

      {/* Main corridor structure */}
      <MetallicCorridor progress={progress} />

      {/* All 8 event zones */}
      <AllZones progress={progress} activeZone={activeZone} />

      {/* Ambient particles */}
      {quality !== "low" && (
        <>
          <LiquidMetalParticles
            count={quality === "high" ? 500 : 250}
            progress={progress}
          />
          <MetallicDust count={quality === "high" ? 200 : 100} />
        </>
      )}

      {/* The "8" motif - appears at various points */}
      <EightMotifs progress={progress} />

      {/* Post-processing */}
      <PostProcessing quality={quality} progress={progress} />
    </>
  );
}

function SceneLighting({
  activeZone,
  progress,
}: {
  activeZone: number;
  progress: number;
}) {
  const lightRef = useRef<THREE.PointLight>(null);

  // Zone-specific lighting colors
  const zoneColors = useMemo(
    () => [
      "#4a5568", // Event X - Cold grey
      "#EF4444", // Battle of Bands - Red
      "#F59E0B", // Spotlight - Amber
      "#10B981", // Mural - Emerald
      "#EC4899", // Unveil - Pink
      "#22D3EE", // Beat the Street - Cyan
      "#f5f5f5", // Parody - White
      "#7C3AED", // Recap - Violet
    ],
    []
  );

  useFrame((state) => {
    if (lightRef.current) {
      const time = state.clock.elapsedTime;

      // Subtle light movement
      lightRef.current.position.x = Math.sin(time * 0.2) * 2;
      lightRef.current.position.y = 15 + Math.cos(time * 0.3) * 2;

      // Update color based on zone
      if (activeZone >= 0 && activeZone < 8) {
        const targetColor = new THREE.Color(zoneColors[activeZone]);
        lightRef.current.color.lerp(targetColor, 0.02);
      }
    }
  });

  return (
    <>
      {/* Ambient fill */}
      <ambientLight intensity={0.15} color="#1a1a2e" />

      {/* Main moving light */}
      <pointLight
        ref={lightRef}
        position={[0, 15, 0]}
        intensity={2}
        color="#7C3AED"
        distance={50}
        decay={2}
      />

      {/* Rim lights along corridor */}
      {Array.from({ length: 10 }, (_, i) => {
        const z = 50 - i * 20;
        return (
          <group key={i}>
            <pointLight
              position={[-6, 2, z]}
              intensity={0.5}
              color="#7C3AED"
              distance={15}
              decay={2}
            />
            <pointLight
              position={[6, 2, z]}
              intensity={0.5}
              color="#22D3EE"
              distance={15}
              decay={2}
            />
          </group>
        );
      })}

      {/* Spotlight for dramatic effect */}
      <spotLight
        position={[0, 20, 30]}
        angle={0.3}
        penumbra={0.8}
        intensity={1.5}
        color="#ffffff"
        castShadow
        shadow-mapSize={1024}
      />
    </>
  );
}

// Recurring "8" motif throughout the scene
function EightMotifs({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        mesh.rotation.y = state.clock.elapsedTime * 0.2 + i * 0.5;
      });
    }
  });

  // Place "8" shapes at key positions
  const eightPositions = useMemo(
    () => [
      { pos: [0, 5, 25] as [number, number, number], scale: 0.5 },
      { pos: [-4, 8, -15] as [number, number, number], scale: 0.3 },
      { pos: [5, 12, -45] as [number, number, number], scale: 0.4 },
      { pos: [-3, 15, -75] as [number, number, number], scale: 0.35 },
      { pos: [0, 18, -105] as [number, number, number], scale: 0.6 },
    ],
    []
  );

  return (
    <group ref={groupRef}>
      {eightPositions.map((eight, i) => (
        <group key={i} position={eight.pos} scale={eight.scale}>
          {/* Top circle */}
          <mesh position={[0, 1.2, 0]}>
            <torusGeometry args={[1, 0.12, 16, 32]} />
            <meshStandardMaterial
              color="#e0e0e0"
              metalness={0.98}
              roughness={0.05}
              emissive="#7C3AED"
              emissiveIntensity={0.1}
            />
          </mesh>
          {/* Bottom circle */}
          <mesh position={[0, -0.8, 0]}>
            <torusGeometry args={[1, 0.12, 16, 32]} />
            <meshStandardMaterial
              color="#e0e0e0"
              metalness={0.98}
              roughness={0.05}
              emissive="#7C3AED"
              emissiveIntensity={0.1}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
