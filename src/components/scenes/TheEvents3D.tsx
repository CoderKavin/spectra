"use client";

import { useRef, useMemo, useEffect, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, useProgress, Html } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

// ============================================================================
// SPECTRA 8 COLOR PALETTE
// ============================================================================
const COLORS = {
  teal: "#0d9488",
  cyan: "#06b6d4",
  purple: "#8b5cf6",
  violet: "#7c3aed",
  pink: "#ec4899",
  orange: "#f97316",
  gold: "#fbbf24",
  red: "#ef4444",

  eventX: {
    primary: "#0d9488",
    secondary: "#0d4d56",
    background: "#000000",
    glow: "#14b8a6",
  },
  battle: {
    primary: "#f97316",
    secondary: "#dc2626",
    background: "#000000",
    glow: "#fb923c",
  },
  spotlight: {
    primary: "#fbbf24",
    secondary: "#fef3c7",
    background: "#000000",
    glow: "#fcd34d",
  },
  mural: {
    primary: "#ec4899",
    secondary: "#8b5cf6",
    background: "#000000",
    glow: "#f472b6",
  },
  unveil: {
    primary: "#e5e7eb",
    secondary: "#f9fafb",
    background: "#000000",
    glow: "#ffffff",
  },
  beatTheStreet: {
    primary: "#6b7280",
    secondary: "#374151",
    background: "#000000",
    glow: "#ec4899",
  },
  parody: {
    primary: "#ec4899",
    secondary: "#84cc16",
    background: "#000000",
    glow: "#f472b6",
  },
};

// ============================================================================
// SMOOTH EASING FUNCTIONS
// ============================================================================
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

// Calculate smooth opacity based on distance from scene center
function getSceneOpacity(
  cameraZ: number,
  sceneZ: number,
  fadeRange: number = 400,
): number {
  const distance = Math.abs(cameraZ - sceneZ);
  if (distance > fadeRange) return 0;
  const t = 1 - distance / fadeRange;
  // Use smoother easing for more gradual transitions
  return easeOutQuart(t);
}

// Smooth lerp helper with frame-rate independence
function smoothDamp(
  current: number,
  target: number,
  smoothing: number,
  delta: number,
): number {
  const factor = 1 - Math.exp(-smoothing * delta * 60);
  return current + (target - current) * factor;
}

// ============================================================================
// SCROLL STATE STORE
// ============================================================================
interface ScrollState {
  progress: number;
  cameraZ: number;
  currentSection: string;
  velocity: number;
}

const scrollState: ScrollState = {
  progress: 0,
  cameraZ: 0,
  currentSection: "portal",
  velocity: 0,
};

let containerElement: HTMLElement | null = null;
let lastScrollTime = 0;
let lastProgress = 0;

export function setContainerRef(el: HTMLElement | null) {
  containerElement = el;
}

// ============================================================================
// LOADING COMPONENT
// ============================================================================
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-4">
        <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 via-purple-500 to-pink-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-white/60 text-sm font-mono">
          {progress.toFixed(0)}%
        </span>
      </div>
    </Html>
  );
}

// ============================================================================
// SCROLL PAUSE ZONES - Dead zones where scrolling pauses to let users read titles
// ============================================================================
// Each event has a "pause zone" after the title appears
// Format: { start: z position where pause begins, duration: how long the pause lasts in scroll units }
const PAUSE_ZONES = [
  { center: 750, pauseAmount: 0.015 }, // Event X
  { center: 1750, pauseAmount: 0.015 }, // Battle of the Bands
  { center: 2750, pauseAmount: 0.015 }, // Spotlight
  { center: 3750, pauseAmount: 0.015 }, // Mural
  { center: 4750, pauseAmount: 0.015 }, // Unveil
  { center: 5750, pauseAmount: 0.015 }, // Beat the Street
  { center: 6750, pauseAmount: 0.015 }, // Parody
];

// Map raw scroll progress to adjusted progress with pause zones
function applyScrollPauses(rawProgress: number): number {
  // Total pause amount affects how we map scroll to camera position
  const totalPauseAmount = PAUSE_ZONES.reduce(
    (sum, zone) => sum + zone.pauseAmount,
    0,
  );
  const effectiveScrollRange = 1 + totalPauseAmount;

  // Scale raw progress to account for pause zones
  let adjustedProgress = rawProgress * effectiveScrollRange;

  // For each pause zone, check if we're in it and apply the pause
  let accumulatedPause = 0;

  for (const zone of PAUSE_ZONES) {
    const zoneProgressCenter = zone.center / 7000;
    const pauseStart = zoneProgressCenter - 0.01;
    const pauseEnd = zoneProgressCenter + zone.pauseAmount + 0.01;

    if (
      adjustedProgress - accumulatedPause >= pauseStart &&
      adjustedProgress - accumulatedPause <= pauseEnd
    ) {
      // We're in the pause zone - clamp to the center
      const distFromStart = adjustedProgress - accumulatedPause - pauseStart;
      const zoneWidth = pauseEnd - pauseStart;

      if (distFromStart < zoneWidth * 0.3) {
        // Entering pause - slow approach
        return pauseStart + distFromStart * 0.3;
      } else if (distFromStart > zoneWidth * 0.7) {
        // Exiting pause - speed up
        const exitProgress =
          (distFromStart - zoneWidth * 0.7) / (zoneWidth * 0.3);
        return zoneProgressCenter + exitProgress * 0.01;
      } else {
        // In the middle of pause - stay at center
        return zoneProgressCenter;
      }
    }

    if (adjustedProgress - accumulatedPause > pauseEnd) {
      accumulatedPause += zone.pauseAmount;
    }
  }

  return Math.min(1, adjustedProgress - accumulatedPause);
}

// ============================================================================
// CAMERA CONTROLLER - Ultra-smooth scroll-driven camera
// ============================================================================
function CameraController() {
  const { camera } = useThree();
  const targetZ = useRef(0);
  const targetY = useRef(0);
  const targetFov = useRef(50);
  const targetRotationZ = useRef(0);
  const currentZ = useRef(0);
  const currentY = useRef(0);
  const currentFov = useRef(50);
  const currentRotationZ = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerElement) return;

      const now = performance.now();
      const rect = containerElement.getBoundingClientRect();
      const containerHeight = containerElement.offsetHeight;
      const viewportHeight = window.innerHeight;

      const scrollableDistance = containerHeight - viewportHeight;
      const scrolled = -rect.top;
      const rawProgress = Math.max(
        0,
        Math.min(1, scrolled / scrollableDistance),
      );

      // Apply pause zones to create reading time for titles
      const progress = applyScrollPauses(rawProgress);

      // Calculate velocity for motion blur effects
      const deltaTime = (now - lastScrollTime) / 1000;
      scrollState.velocity =
        deltaTime > 0 ? (progress - lastProgress) / deltaTime : 0;
      lastScrollTime = now;
      lastProgress = progress;

      scrollState.progress = progress;
      scrollState.cameraZ = progress * 7000;

      targetZ.current = scrollState.cameraZ;

      // Determine current section
      const z = scrollState.cameraZ;
      if (z < 500) scrollState.currentSection = "portal";
      else if (z < 1000) scrollState.currentSection = "eventX";
      else if (z < 1500) scrollState.currentSection = "vortex";
      else if (z < 2000) scrollState.currentSection = "battle";
      else if (z < 2500) scrollState.currentSection = "curtain";
      else if (z < 3000) scrollState.currentSection = "spotlight";
      else if (z < 3500) scrollState.currentSection = "paintTunnel";
      else if (z < 4000) scrollState.currentSection = "mural";
      else if (z < 4500) scrollState.currentSection = "dollyZoom";
      else if (z < 5000) scrollState.currentSection = "unveil";
      else if (z < 5500) scrollState.currentSection = "falling";
      else if (z < 6000) scrollState.currentSection = "beatTheStreet";
      else if (z < 6500) scrollState.currentSection = "glitch";
      else scrollState.currentSection = "parody";

      // Smooth dolly zoom FOV (Z: 4100-4400)
      if (z >= 4100 && z <= 4400) {
        const dollyProgress = easeInOutCubic((z - 4100) / 300);
        targetFov.current = 50 + 30 * dollyProgress;
      } else if (z > 4400 && z < 4700) {
        const returnProgress = easeInOutCubic((z - 4400) / 300);
        targetFov.current = 80 - 30 * returnProgress;
      } else {
        targetFov.current = 50;
      }

      // Smooth falling Y movement (Z: 5100-5400)
      if (z >= 5100 && z <= 5400) {
        const fallProgress = easeInOutCubic((z - 5100) / 300);
        targetY.current = -500 * fallProgress;
      } else if (z > 5400) {
        targetY.current = -500;
      } else {
        targetY.current = 0;
      }

      // Smooth glitch spin (Z: 6300-6450)
      if (z >= 6300 && z <= 6450) {
        const spinProgress = easeInOutCubic((z - 6300) / 150);
        targetRotationZ.current = spinProgress * Math.PI * 2;
      } else if (z > 6450 && z < 6600) {
        const resetProgress = easeInOutCubic((z - 6450) / 150);
        targetRotationZ.current = Math.PI * 2 * (1 - resetProgress);
      } else {
        targetRotationZ.current = 0;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useFrame((_, delta) => {
    // Silky smooth interpolation - using damping approach
    // Lower values = smoother but more delayed, higher = snappier
    const smoothing = 0.08; // Main camera smoothing
    const rotationSmoothing = 0.06;
    const fovSmoothing = 0.04;

    // Frame-rate independent smoothing using exponential decay
    const zLerp = 1 - Math.exp(-smoothing * delta * 60);
    const yLerp = 1 - Math.exp(-smoothing * 0.7 * delta * 60);
    const rotLerp = 1 - Math.exp(-rotationSmoothing * delta * 60);
    const fovLerp = 1 - Math.exp(-fovSmoothing * delta * 60);

    currentZ.current += (targetZ.current - currentZ.current) * zLerp;
    currentY.current += (targetY.current - currentY.current) * yLerp;
    currentRotationZ.current +=
      (targetRotationZ.current - currentRotationZ.current) * rotLerp;
    currentFov.current += (targetFov.current - currentFov.current) * fovLerp;

    camera.position.z = currentZ.current;
    camera.position.y = currentY.current;
    camera.rotation.z = currentRotationZ.current;

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = currentFov.current;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

// ============================================================================
// FADE GROUP - Wrapper for smooth opacity transitions
// ============================================================================
interface FadeGroupProps {
  children: React.ReactNode;
  sceneZ: number;
  fadeRange?: number;
}

function FadeGroup({ children, sceneZ, fadeRange = 500 }: FadeGroupProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const currentOpacity = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const cameraZ = camera.position.z;
    const targetOpacity = getSceneOpacity(cameraZ, sceneZ, fadeRange);

    // Smooth opacity transition
    currentOpacity.current = smoothDamp(
      currentOpacity.current,
      targetOpacity,
      0.12,
      delta,
    );

    // Update all materials in the group
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.Material;
        if ("opacity" in material) {
          (material as THREE.MeshBasicMaterial).opacity =
            (material.userData.baseOpacity || 1) * currentOpacity.current;
        }
      }
    });

    // Hide completely when very transparent for performance
    groupRef.current.visible = currentOpacity.current > 0.01;
  });

  return <group ref={groupRef}>{children}</group>;
}

// ============================================================================
// PARTICLE SYSTEM - Optimized with smooth visibility
// ============================================================================
interface ParticleSystemProps {
  count: number;
  color: string;
  size?: number;
  zStart: number;
  zEnd: number;
  spread?: number;
  speed?: number;
  baseOpacity?: number;
}

function ParticleSystem({
  count,
  color,
  size = 2,
  zStart,
  zEnd,
  spread = 500,
  speed = 0.5,
  baseOpacity = 0.6,
}: ParticleSystemProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const { camera } = useThree();
  const currentOpacity = useRef(0);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread,
          zStart + Math.random() * (zEnd - zStart),
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * speed,
          (Math.random() - 0.5) * speed,
          (Math.random() - 0.5) * speed * 0.5,
        ),
        scale: 0.5 + Math.random() * 1.5,
      });
    }
    return temp;
  }, [count, zStart, zEnd, spread, speed]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    if (!meshRef.current || !materialRef.current) return;

    const cameraZ = camera.position.z;
    const centerZ = (zStart + zEnd) / 2;
    const range = (zEnd - zStart) / 2 + 400;

    // Smooth opacity based on distance
    const distance = Math.abs(cameraZ - centerZ);
    const targetOpacity =
      distance < range ? baseOpacity * easeOutQuart(1 - distance / range) : 0;

    // Use smoothDamp for buttery smooth transitions
    currentOpacity.current = smoothDamp(
      currentOpacity.current,
      targetOpacity,
      0.1,
      delta,
    );

    materialRef.current.opacity = currentOpacity.current;
    meshRef.current.visible = currentOpacity.current > 0.01;

    if (!meshRef.current.visible) return;

    particles.forEach((particle, i) => {
      particle.position.add(particle.velocity.clone().multiplyScalar(delta));

      if (particle.position.x > spread / 2) particle.position.x = -spread / 2;
      if (particle.position.x < -spread / 2) particle.position.x = spread / 2;
      if (particle.position.y > spread / 2) particle.position.y = -spread / 2;
      if (particle.position.y < -spread / 2) particle.position.y = spread / 2;

      dummy.position.copy(particle.position);
      dummy.scale.setScalar(particle.scale * size);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.5, 8, 8]} />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={baseOpacity}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}

// ============================================================================
// INTRO SCENE - "THE EVENTS" title before portal
// ============================================================================
function IntroScene() {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const currentOpacity = useRef(1);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const cameraZ = camera.position.z;

    // Visible at start, fades out as we approach portal
    let targetOpacity = 0;
    if (cameraZ < 300) {
      targetOpacity = 1 - easeOutQuart(cameraZ / 300);
    }

    currentOpacity.current = smoothDamp(
      currentOpacity.current,
      targetOpacity,
      0.1,
      delta,
    );

    groupRef.current.visible = currentOpacity.current > 0.01;

    // Update text opacity
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshBasicMaterial;
        if (material.opacity !== undefined) {
          material.opacity =
            currentOpacity.current * (material.userData.baseOpacity || 1);
        }
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, 100]}>
      {/* Main title */}
      <Text
        fontSize={25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.4}
        position={[0, 0, 0]}
      >
        THE EVENTS
        <meshBasicMaterial
          transparent
          opacity={0.4}
          userData={{ baseOpacity: 0.4 }}
        />
      </Text>

      {/* Subtle glow behind */}
      <mesh position={[0, 0, -10]}>
        <planeGeometry args={[300, 80]} />
        <meshBasicMaterial
          color={COLORS.purple}
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          userData={{ baseOpacity: 0.05 }}
        />
      </mesh>
    </group>
  );
}

// ============================================================================
// PORTAL COMPONENT - Smooth entry transition
// ============================================================================
function Portal() {
  const groupRef = useRef<THREE.Group>(null);
  const portalRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ringMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const { camera } = useThree();
  const currentScale = useRef(1);
  const currentOpacity = useRef(0.8);

  useFrame((_, delta) => {
    if (!groupRef.current || !portalRef.current || !ringRef.current) return;

    const cameraZ = camera.position.z;
    const distance = 400 - cameraZ;

    if (distance > -100 && distance < 500) {
      groupRef.current.visible = true;

      // Smooth scale transition
      const targetScale = THREE.MathUtils.mapLinear(
        Math.max(0, distance),
        400,
        50,
        1,
        12,
      );
      currentScale.current = smoothDamp(
        currentScale.current,
        Math.max(1, targetScale),
        0.1,
        delta,
      );

      portalRef.current.scale.setScalar(currentScale.current);
      ringRef.current.scale.setScalar(currentScale.current);
      ringRef.current.rotation.z += 0.015 * (1 - Math.pow(0.5, delta * 60));

      // Fade out as we pass through
      const fadeProgress = distance < 100 ? (100 - distance) / 200 : 0;
      const targetOpacity = 0.8 * (1 - easeOutQuart(Math.max(0, fadeProgress)));
      currentOpacity.current = smoothDamp(
        currentOpacity.current,
        targetOpacity,
        0.1,
        delta,
      );

      if (ringMaterialRef.current) {
        ringMaterialRef.current.opacity = currentOpacity.current;
      }
    } else {
      groupRef.current.visible = false;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 400]}>
      <mesh ref={portalRef}>
        <circleGeometry args={[50, 64]} />
        <meshBasicMaterial color="#000000" side={THREE.DoubleSide} />
      </mesh>

      <mesh ref={ringRef}>
        <ringGeometry args={[48, 55, 64]} />
        <meshBasicMaterial
          ref={ringMaterialRef}
          color={COLORS.eventX.glow}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {[45, 40, 35].map((radius, i) => (
        <mesh key={i} position={[0, 0, -i * 2]}>
          <ringGeometry args={[radius - 2, radius, 64]} />
          <meshBasicMaterial
            color={COLORS.eventX.primary}
            transparent
            opacity={0.3 - i * 0.08}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================================
// EVENT X SCENE - Fixed smooth entry with glitch reveal effect
// ============================================================================
function EventXScene() {
  const groupRef = useRef<THREE.Group>(null);
  const textRef = useRef<THREE.Group>(null);
  const glitchLayersRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const currentOpacity = useRef(0);
  const currentScale = useRef(0.5);
  const glitchIntensity = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const cameraZ = camera.position.z;

    // Calculate smooth opacity - starts fading in earlier (from z=400 portal exit)
    // Custom fade that starts after portal and peaks at scene center
    let targetOpacity = 0;
    if (cameraZ > 350 && cameraZ < 1100) {
      if (cameraZ < 750) {
        // Fade in from portal to center
        targetOpacity = easeOutQuart((cameraZ - 350) / 400);
      } else {
        // Fade out from center to next scene
        targetOpacity = easeOutQuart((1100 - cameraZ) / 350);
      }
    }

    currentOpacity.current = smoothDamp(
      currentOpacity.current,
      targetOpacity,
      0.08,
      delta,
    );

    // Scale animation - grows as we approach
    const targetScale = 0.6 + currentOpacity.current * 0.4;
    currentScale.current = smoothDamp(
      currentScale.current,
      targetScale,
      0.1,
      delta,
    );

    groupRef.current.visible = currentOpacity.current > 0.01;

    // Glitch effect on entry (stronger when first appearing)
    const entryProgress = Math.max(0, Math.min(1, (cameraZ - 400) / 300));
    const targetGlitch = entryProgress < 0.7 ? (0.7 - entryProgress) * 0.5 : 0;
    glitchIntensity.current = smoothDamp(
      glitchIntensity.current,
      targetGlitch,
      0.15,
      delta,
    );

    if (textRef.current) {
      const breathe = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
      textRef.current.scale.setScalar(breathe * currentScale.current);
    }

    // Animate glitch layers
    if (glitchLayersRef.current) {
      glitchLayersRef.current.children.forEach((child, i) => {
        const glitchOffset =
          Math.sin(state.clock.elapsedTime * 20 + i * 2) *
          glitchIntensity.current *
          15;
        child.position.x = glitchOffset * (i % 2 === 0 ? 1 : -1);
        (child as THREE.Mesh).material = (child as THREE.Mesh)
          .material as THREE.MeshBasicMaterial;
        ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity =
          currentOpacity.current * (0.15 - i * 0.03);
      });
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 750]}>
      {/* Glitch/echo layers behind main text */}
      <group ref={glitchLayersRef}>
        {[0, 1, 2, 3].map((i) => (
          <Text
            key={i}
            fontSize={82}
            color={i % 2 === 0 ? COLORS.cyan : COLORS.pink}
            anchorX="center"
            anchorY="middle"
            position={[0, 0, -5 - i * 2]}
          >
            EVENT X
            <meshBasicMaterial
              transparent
              opacity={0.15 - i * 0.03}
              blending={THREE.AdditiveBlending}
            />
          </Text>
        ))}
      </group>

      {/* Main text group */}
      <group ref={textRef}>
        <Text
          fontSize={80}
          color={COLORS.eventX.primary}
          anchorX="center"
          anchorY="middle"
          outlineWidth={2}
          outlineColor={COLORS.eventX.glow}
        >
          EVENT X
        </Text>

        {/* Glow layer */}
        <Text
          fontSize={82}
          color={COLORS.eventX.glow}
          anchorX="center"
          anchorY="middle"
          position={[0, 0, -2]}
          fillOpacity={0.3}
        >
          EVENT X
          <meshBasicMaterial
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
          />
        </Text>
      </group>

      {/* Orbiting ring */}
      <EventXRing />

      {/* Floating geometric shapes */}
      <FloatingShapes
        count={20}
        color={COLORS.eventX.primary}
        spread={500}
        zOffset={0}
        sceneZ={750}
      />

      {/* Particles */}
      <ParticleSystem
        count={250}
        color={COLORS.eventX.glow}
        size={1.5}
        zStart={450}
        zEnd={1050}
        spread={700}
        speed={0.4}
        baseOpacity={0.5}
      />

      {/* Dynamic lighting */}
      <pointLight
        position={[0, 100, 0]}
        color={COLORS.eventX.glow}
        intensity={60}
        distance={600}
      />
      <pointLight
        position={[150, -50, 50]}
        color={COLORS.cyan}
        intensity={30}
        distance={400}
      />
    </group>
  );
}

// Orbiting ring for Event X
function EventXRing() {
  const ringRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const currentOpacity = useRef(0);

  useFrame((state, delta) => {
    if (!ringRef.current) return;

    const cameraZ = camera.position.z;
    const targetOpacity = getSceneOpacity(cameraZ, 750, 400);
    currentOpacity.current = smoothDamp(
      currentOpacity.current,
      targetOpacity,
      0.1,
      delta,
    );

    ringRef.current.rotation.z = state.clock.elapsedTime * 0.3;
    ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.2;

    ringRef.current.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        (child.material as THREE.MeshBasicMaterial).opacity =
          currentOpacity.current * 0.4;
      }
    });
  });

  return (
    <group ref={ringRef}>
      <mesh>
        <torusGeometry args={[120, 2, 16, 64]} />
        <meshBasicMaterial
          color={COLORS.eventX.glow}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[140, 1.5, 16, 64]} />
        <meshBasicMaterial
          color={COLORS.cyan}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// ============================================================================
// FLOATING SHAPES - With smooth fade
// ============================================================================
interface FloatingShapesProps {
  count: number;
  color: string;
  spread: number;
  zOffset: number;
  sceneZ: number;
}

function FloatingShapes({
  count,
  color,
  spread,
  zOffset,
  sceneZ,
}: FloatingShapesProps) {
  const shapes = useMemo(() => {
    const temp = [];
    const geometries = ["tetrahedron", "octahedron", "icosahedron"];

    for (let i = 0; i < count; i++) {
      temp.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread * 0.5,
          zOffset + (Math.random() - 0.5) * 200,
        ),
        rotation: new THREE.Euler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI,
        ),
        scale: 3 + Math.random() * 8,
        geometry: geometries[Math.floor(Math.random() * geometries.length)],
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        floatSpeed: 0.5 + Math.random() * 0.5,
        floatOffset: Math.random() * Math.PI * 2,
      });
    }
    return temp;
  }, [count, spread, zOffset]);

  return (
    <group>
      {shapes.map((shape, i) => (
        <FloatingShape key={i} {...shape} color={color} sceneZ={sceneZ} />
      ))}
    </group>
  );
}

function FloatingShape({
  position,
  rotation,
  scale,
  geometry,
  rotationSpeed,
  floatSpeed,
  floatOffset,
  color,
  sceneZ,
}: {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
  geometry: string;
  rotationSpeed: number;
  floatSpeed: number;
  floatOffset: number;
  color: string;
  sceneZ: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const { camera } = useThree();
  const currentOpacity = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    meshRef.current.rotation.x += rotationSpeed;
    meshRef.current.rotation.y += rotationSpeed * 0.7;
    meshRef.current.position.y =
      position.y +
      Math.sin(state.clock.elapsedTime * floatSpeed + floatOffset) * 10;

    // Smooth opacity
    const targetOpacity = getSceneOpacity(camera.position.z, sceneZ, 450) * 0.4;
    currentOpacity.current = smoothDamp(
      currentOpacity.current,
      targetOpacity,
      0.1,
      delta,
    );

    if (materialRef.current) {
      materialRef.current.opacity = currentOpacity.current;
    }
  });

  const GeometryComponent = useMemo(() => {
    switch (geometry) {
      case "tetrahedron":
        return <tetrahedronGeometry args={[1]} />;
      case "octahedron":
        return <octahedronGeometry args={[1]} />;
      case "icosahedron":
        return <icosahedronGeometry args={[1, 0]} />;
      default:
        return <octahedronGeometry args={[1]} />;
    }
  }, [geometry]);

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
      {GeometryComponent}
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={0.4}
        wireframe
      />
    </mesh>
  );
}

// ============================================================================
// VORTEX TUNNEL - Smooth rotating transition
// ============================================================================
function VortexTunnel() {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const tunnelMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const { camera } = useThree();
  const currentOpacity = useRef(0);
  const currentRotation = useRef(0);

  const particles = useMemo(() => {
    const count = 500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 10;
      const radius = 20 + Math.random() * 30;
      const z = (i / count) * 300;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = 1200 + z;

      const colorProgress = z / 300;
      const teal = new THREE.Color(COLORS.eventX.glow);
      const purple = new THREE.Color(COLORS.purple);
      const orange = new THREE.Color(COLORS.battle.primary);

      let finalColor;
      if (colorProgress < 0.5) {
        finalColor = teal.clone().lerp(purple, colorProgress * 2);
      } else {
        finalColor = purple.clone().lerp(orange, (colorProgress - 0.5) * 2);
      }

      colors[i * 3] = finalColor.r;
      colors[i * 3 + 1] = finalColor.g;
      colors[i * 3 + 2] = finalColor.b;
    }

    return { positions, colors };
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current || !particlesRef.current) return;

    const cameraZ = camera.position.z;
    const sceneZ = 1300;

    // Smooth opacity transition
    const targetOpacity = getSceneOpacity(cameraZ, sceneZ, 400);
    currentOpacity.current = smoothDamp(
      currentOpacity.current,
      targetOpacity,
      0.1,
      delta,
    );

    groupRef.current.visible = currentOpacity.current > 0.01;

    if (materialRef.current) {
      materialRef.current.opacity = currentOpacity.current * 0.8;
    }
    if (tunnelMaterialRef.current) {
      tunnelMaterialRef.current.opacity = currentOpacity.current * 0.2;
    }

    // Smooth rotation
    currentRotation.current += 0.02 * (1 - Math.pow(0.5, delta * 60));
    particlesRef.current.rotation.z = currentRotation.current;
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(particles.positions, 3),
    );
    geo.setAttribute("color", new THREE.BufferAttribute(particles.colors, 3));
    return geo;
  }, [particles]);

  return (
    <group ref={groupRef}>
      <points ref={particlesRef} geometry={geometry}>
        <pointsMaterial
          ref={materialRef}
          size={4}
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>

      <mesh position={[0, 0, 1300]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[60, 30, 300, 32, 1, true]} />
        <meshBasicMaterial
          ref={tunnelMaterialRef}
          color={COLORS.purple}
          transparent
          opacity={0.2}
          side={THREE.BackSide}
          wireframe
        />
      </mesh>
    </group>
  );
}

// ============================================================================
// BATTLE OF THE BANDS SCENE
// ============================================================================
function BattleScene() {
  const groupRef = useRef<THREE.Group>(null);
  const text1Ref = useRef<THREE.Group>(null);
  const text2Ref = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const currentOpacity = useRef(0);
  const vibrationIntensity = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const cameraZ = camera.position.z;
    const sceneZ = 1750;

    const targetOpacity = getSceneOpacity(cameraZ, sceneZ, 450);
    currentOpacity.current = smoothDamp(
      currentOpacity.current,
      targetOpacity,
      0.1,
      delta,
    );

    groupRef.current.visible = currentOpacity.current > 0.01;

    // Smooth vibration based on proximity
    vibrationIntensity.current = smoothDamp(
      vibrationIntensity.current,
      currentOpacity.current,
      0.1,
      delta,
    );

    if (text1Ref.current && text2Ref.current) {
      const vibration =
        Math.sin(state.clock.elapsedTime * 25) * 2 * vibrationIntensity.current;
      text1Ref.current.position.x = vibration;
      text2Ref.current.position.x = -vibration;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 1750]}>
      <group ref={text1Ref} position={[0, 30, 0]}>
        <Text
          fontSize={45}
          color={COLORS.battle.primary}
          anchorX="center"
          anchorY="middle"
          outlineWidth={1.5}
          outlineColor={COLORS.battle.glow}
        >
          BATTLE OF THE
        </Text>
      </group>

      <group ref={text2Ref} position={[0, -30, 0]}>
        <Text
          fontSize={60}
          color={COLORS.battle.primary}
          anchorX="center"
          anchorY="middle"
          outlineWidth={2}
          outlineColor={COLORS.battle.glow}
        >
          BANDS
        </Text>
      </group>

      <SoundWaves sceneZ={1750} />

      <ParticleSystem
        count={250}
        color={COLORS.battle.glow}
        size={1.5}
        zStart={1500}
        zEnd={2000}
        spread={500}
        speed={1}
        baseOpacity={0.6}
      />

      <pointLight
        position={[100, 50, 0]}
        color={COLORS.battle.primary}
        intensity={80}
        distance={400}
      />
      <pointLight
        position={[-100, -50, 0]}
        color={COLORS.red}
        intensity={60}
        distance={400}
      />
    </group>
  );
}

// ============================================================================
// SOUND WAVES - With smooth fade
// ============================================================================
function SoundWaves({ sceneZ }: { sceneZ: number }) {
  const wavesRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const currentOpacity = useRef(0);

  useFrame((state, delta) => {
    if (!wavesRef.current) return;

    const targetOpacity = getSceneOpacity(camera.position.z, sceneZ, 400);
    currentOpacity.current = smoothDamp(
      currentOpacity.current,
      targetOpacity,
      0.1,
      delta,
    );

    wavesRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Line) {
        const positions = (
          child.geometry.attributes.position as THREE.BufferAttribute
        ).array as Float32Array;
        const time = state.clock.elapsedTime;

        for (let j = 0; j < positions.length / 3; j++) {
          const x = positions[j * 3];
          positions[j * 3 + 1] =
            Math.sin(x * 0.1 + time * 5 + i) *
            20 *
            Math.sin((j / (positions.length / 3)) * Math.PI) *
            currentOpacity.current;
        }

        child.geometry.attributes.position.needsUpdate = true;
        (child.material as THREE.LineBasicMaterial).opacity =
          currentOpacity.current * 0.5;
      }
    });
  });

  const waveLines = useMemo(() => {
    return [-80, -40, 0, 40, 80].map((yOffset) => {
      const points = [];
      for (let i = 0; i <= 100; i++) {
        points.push(new THREE.Vector3((i - 50) * 4, yOffset, -50));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: COLORS.battle.glow,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
      });
      return new THREE.Line(geometry, material);
    });
  }, []);

  return (
    <group ref={wavesRef}>
      {waveLines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  );
}

// ============================================================================
// CURTAIN LAYERS - Smooth parting transition
// ============================================================================
function CurtainLayers() {
  const layersRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const layerData = useRef(
    [2100, 2200, 2300, 2400, 2500, 2600].map((z, i) => ({
      z,
      direction: i % 2 === 0 ? -1 : 1,
      openProgress: 0,
      currentX: 0,
      currentRotation: 0,
      currentOpacity: 0.3,
    })),
  );

  useFrame((_, delta) => {
    if (!layersRef.current) return;

    const cameraZ = camera.position.z;

    if (cameraZ < 1900 || cameraZ > 2800) {
      layersRef.current.visible = false;
      return;
    }

    layersRef.current.visible = true;

    layersRef.current.children.forEach((child, i) => {
      const layer = layerData.current[i];
      const distanceToLayer = layer.z - cameraZ;

      // Smooth opening based on distance
      const targetOpen =
        distanceToLayer < 120 && distanceToLayer > -150 ? 1 : 0;
      layer.openProgress = smoothDamp(
        layer.openProgress,
        targetOpen,
        0.06,
        delta,
      );

      // Smooth position and rotation
      const targetX = layer.direction * layer.openProgress * 600;
      const targetRotation = layer.direction * layer.openProgress * 0.2;

      layer.currentX = smoothDamp(layer.currentX, targetX, 0.1, delta);
      layer.currentRotation = smoothDamp(
        layer.currentRotation,
        targetRotation,
        0.1,
        delta,
      );

      child.position.x = layer.currentX;
      child.rotation.y = layer.currentRotation;

      // Smooth opacity
      const targetOpacity = 0.3 * (1 - layer.openProgress * 0.7);
      layer.currentOpacity = smoothDamp(
        layer.currentOpacity,
        targetOpacity,
        0.1,
        delta,
      );

      const mesh = child as THREE.Mesh;
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.opacity = layer.currentOpacity;
    });
  });

  return (
    <group ref={layersRef}>
      {layerData.current.map((layer, i) => (
        <mesh key={i} position={[0, 0, layer.z]}>
          <planeGeometry args={[1000, 800]} />
          <meshBasicMaterial
            color={new THREE.Color(COLORS.battle.primary).lerp(
              new THREE.Color(COLORS.spotlight.primary),
              i / 5,
            )}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================================
// SPOTLIGHT SCENE
// ============================================================================
function SpotlightScene() {
  const groupRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const beamMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const { camera } = useThree();
  const currentOpacity = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const cameraZ = camera.position.z;
    const sceneZ = 2750;

    const targetOpacity = getSceneOpacity(cameraZ, sceneZ, 450);
    currentOpacity.current = smoothDamp(
      currentOpacity.current,
      targetOpacity,
      0.1,
      delta,
    );

    groupRef.current.visible = currentOpacity.current > 0.01;

    if (beamMaterialRef.current) {
      const pulse = 0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      beamMaterialRef.current.opacity = 0.15 * pulse * currentOpacity.current;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 2750]}>
      <Text
        fontSize={70}
        color={COLORS.spotlight.primary}
        anchorX="center"
        anchorY="middle"
        outlineWidth={2}
        outlineColor={COLORS.spotlight.glow}
      >
        SPOTLIGHT
      </Text>

      <mesh ref={beamRef} position={[0, 200, 0]}>
        <coneGeometry args={[80, 400, 32, 1, true]} />
        <meshBasicMaterial
          ref={beamMaterialRef}
          color={COLORS.spotlight.primary}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <ParticleSystem
        count={100}
        color={COLORS.spotlight.glow}
        size={2}
        zStart={2500}
        zEnd={3000}
        spread={400}
        speed={0.2}
        baseOpacity={0.7}
      />

      <spotLight
        position={[0, 300, 0]}
        angle={0.3}
        penumbra={0.5}
        intensity={200}
        color={COLORS.spotlight.primary}
      />
    </group>
  );
}

// ============================================================================
// PAINT TUNNEL - Smooth ribbon transition
// ============================================================================
function PaintTunnel() {
  const groupRef = useRef<THREE.Group>(null);
  const ribbonsRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const currentOpacity = useRef(0);
  const currentRotation = useRef(0);

  const ribbonColors = useMemo(
    () => [
      COLORS.pink,
      COLORS.purple,
      COLORS.cyan,
      COLORS.orange,
      COLORS.gold,
      COLORS.teal,
    ],
    [],
  );

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const cameraZ = camera.position.z;
    const sceneZ = 3300;

    const targetOpacity = getSceneOpacity(cameraZ, sceneZ, 400);
    currentOpacity.current = smoothDamp(
      currentOpacity.current,
      targetOpacity,
      0.1,
      delta,
    );

    groupRef.current.visible = currentOpacity.current > 0.01;

    if (ribbonsRef.current) {
      currentRotation.current += 0.008 * (1 - Math.pow(0.5, delta * 60));
      ribbonsRef.current.rotation.z = currentRotation.current;
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={ribbonsRef}>
        {ribbonColors.map((color, i) => (
          <PaintRibbon
            key={i}
            color={color}
            angle={(i / ribbonColors.length) * Math.PI * 2}
            zStart={3100}
            zEnd={3500}
            sceneZ={3300}
          />
        ))}
      </group>

      <ParticleSystem
        count={150}
        color={COLORS.mural.primary}
        size={2}
        zStart={3400}
        zEnd={3600}
        spread={300}
        speed={2}
        baseOpacity={0.6}
      />
    </group>
  );
}

function PaintRibbon({
  color,
  angle,
  zStart,
  zEnd,
  sceneZ,
}: {
  color: string;
  angle: number;
  zStart: number;
  zEnd: number;
  sceneZ: number;
}) {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const { camera } = useThree();
  const currentOpacity = useRef(0);

  useFrame((_, delta) => {
    const targetOpacity = getSceneOpacity(camera.position.z, sceneZ, 400) * 0.7;
    currentOpacity.current = smoothDamp(
      currentOpacity.current,
      targetOpacity,
      0.1,
      delta,
    );

    if (materialRef.current) {
      materialRef.current.opacity = currentOpacity.current;
    }
  });

  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(angle) * 80, Math.sin(angle) * 80, zStart),
      new THREE.Vector3(
        Math.cos(angle + 0.5) * 60,
        Math.sin(angle + 0.5) * 60,
        zStart + 100,
      ),
      new THREE.Vector3(
        Math.cos(angle + 1) * 40,
        Math.sin(angle + 1) * 40,
        zStart + 200,
      ),
      new THREE.Vector3(
        Math.cos(angle + 1.5) * 20,
        Math.sin(angle + 1.5) * 20,
        zStart + 300,
      ),
      new THREE.Vector3(0, 0, zEnd),
    ]);

    return new THREE.TubeGeometry(curve, 64, 5, 8, false);
  }, [angle, zStart, zEnd]);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={0.7}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ============================================================================
// MURAL SCENE
// ============================================================================
function MuralScene() {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const currentOpacity = useRef(0);

  const letterColors = [
    COLORS.pink,
    COLORS.purple,
    COLORS.cyan,
    COLORS.orange,
    COLORS.gold,
  ];

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const cameraZ = camera.position.z;
    const sceneZ = 3750;

    // Larger fade range to bridge gap to Unveil scene
    const targetOpacity = getSceneOpacity(cameraZ, sceneZ, 600);
    currentOpacity.current = smoothDamp(
      currentOpacity.current,
      targetOpacity,
      0.1,
      delta,
    );

    groupRef.current.visible = currentOpacity.current > 0.01;
  });

  return (
    <group ref={groupRef} position={[0, 0, 3750]}>
      {["M", "U", "R", "A", "L"].map((letter, i) => (
        <MuralLetter
          key={i}
          letter={letter}
          color={letterColors[i]}
          position={[(i - 2) * 50, 0, 0]}
          index={i}
          sceneZ={3750}
        />
      ))}

      <PaintSplatters sceneZ={3750} />

      <ParticleSystem
        count={300}
        color={COLORS.pink}
        size={2}
        zStart={3200}
        zEnd={4300}
        spread={500}
        speed={1.5}
        baseOpacity={0.5}
      />

      <pointLight position={[100, 50, 50]} color={COLORS.pink} intensity={40} />
      <pointLight
        position={[-100, -50, -50]}
        color={COLORS.cyan}
        intensity={40}
      />
      <pointLight position={[0, 100, 0]} color={COLORS.purple} intensity={40} />
    </group>
  );
}

function MuralLetter({
  letter,
  color,
  position,
  index,
  sceneZ,
}: {
  letter: string;
  color: string;
  position: number[];
  index: number;
  sceneZ: number;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const currentOpacity = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const offset = Math.sin(state.clock.elapsedTime * 2 + index) * 5;
    meshRef.current.position.y = position[1] + offset;

    // Larger fade range for Mural scene
    const targetOpacity = getSceneOpacity(camera.position.z, sceneZ, 600);
    currentOpacity.current = smoothDamp(
      currentOpacity.current,
      targetOpacity,
      0.1,
      delta,
    );
  });

  return (
    <group ref={meshRef} position={position as [number, number, number]}>
      <Text
        fontSize={80}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={2}
        outlineColor="#ffffff"
      >
        {letter}
      </Text>
    </group>
  );
}

function PaintSplatters({ sceneZ }: { sceneZ: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const currentOpacity = useRef(0);

  const splatters = useMemo(() => {
    const temp = [];
    const colors = [
      COLORS.pink,
      COLORS.purple,
      COLORS.cyan,
      COLORS.orange,
      COLORS.gold,
    ];

    for (let i = 0; i < 30; i++) {
      temp.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 400,
          (Math.random() - 0.5) * 300,
          (Math.random() - 0.5) * 100,
        ),
        scale: 5 + Math.random() * 15,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
      });
    }
    return temp;
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Larger fade range for Mural scene
    const targetOpacity = getSceneOpacity(camera.position.z, sceneZ, 600);
    currentOpacity.current = smoothDamp(
      currentOpacity.current,
      targetOpacity,
      0.1,
      delta,
    );

    groupRef.current.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        (child.material as THREE.MeshBasicMaterial).opacity =
          currentOpacity.current * 0.6;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {splatters.map((splatter, i) => (
        <mesh
          key={i}
          position={splatter.position}
          rotation={[0, 0, splatter.rotation]}
          scale={splatter.scale}
        >
          <circleGeometry args={[1, 16]} />
          <meshBasicMaterial color={splatter.color} transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================================
// UNVEIL SCENE - Dramatic curtain reveal with light rays
// ============================================================================
function UnveilScene() {
  const groupRef = useRef<THREE.Group>(null);
  const textRef = useRef<THREE.Group>(null);
  const curtainLeftRef = useRef<THREE.Mesh>(null);
  const curtainRightRef = useRef<THREE.Mesh>(null);
  const lightRaysRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const currentOpacity = useRef(0);
  const revealProgress = useRef(0);
  const textScale = useRef(0.3);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const cameraZ = camera.position.z;
    const sceneZ = 4750;

    // Custom opacity with hold period - stays at full opacity for a range
    // Fade in: 4100-4500, Hold: 4500-5100, Fade out: 5100-5400
    let targetOpacity = 0;
    if (cameraZ >= 4100 && cameraZ < 4500) {
      // Fade in
      targetOpacity = easeOutQuart((cameraZ - 4100) / 400);
    } else if (cameraZ >= 4500 && cameraZ <= 5100) {
      // Hold at full opacity - this gives time to read
      targetOpacity = 1;
    } else if (cameraZ > 5100 && cameraZ <= 5500) {
      // Fade out
      targetOpacity = 1 - easeOutQuart((cameraZ - 5100) / 400);
    }

    currentOpacity.current = smoothDamp(
      currentOpacity.current,
      targetOpacity,
      0.1,
      delta,
    );

    groupRef.current.visible = currentOpacity.current > 0.01;

    // Calculate reveal progress based on approach
    const distanceToScene = sceneZ - cameraZ;
    let targetReveal = 0;
    if (distanceToScene < 300 && distanceToScene > -200) {
      targetReveal = easeOutQuart(1 - Math.max(0, distanceToScene) / 300);
    } else if (distanceToScene <= -200) {
      targetReveal = 1;
    }

    revealProgress.current = smoothDamp(
      revealProgress.current,
      targetReveal,
      0.05,
      delta,
    );

    // Animate curtains parting
    if (curtainLeftRef.current && curtainRightRef.current) {
      const curtainOffset = revealProgress.current * 250;
      curtainLeftRef.current.position.x = -curtainOffset - 100;
      curtainRightRef.current.position.x = curtainOffset + 100;

      // Fade curtains
      (curtainLeftRef.current.material as THREE.MeshBasicMaterial).opacity =
        currentOpacity.current * (1 - revealProgress.current * 0.7);
      (curtainRightRef.current.material as THREE.MeshBasicMaterial).opacity =
        currentOpacity.current * (1 - revealProgress.current * 0.7);
    }

    // Text scales up as it's revealed
    const targetScale = 0.3 + revealProgress.current * 0.7;
    textScale.current = smoothDamp(textScale.current, targetScale, 0.1, delta);

    if (textRef.current) {
      textRef.current.scale.setScalar(textScale.current);
      // Gentle float
      textRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 5;
    }

    // Animate light rays
    if (lightRaysRef.current) {
      lightRaysRef.current.rotation.z = state.clock.elapsedTime * 0.1;
      lightRaysRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          const pulse =
            0.3 + Math.sin(state.clock.elapsedTime * 2 + i * 0.5) * 0.2;
          (child.material as THREE.MeshBasicMaterial).opacity =
            currentOpacity.current * revealProgress.current * pulse;
        }
      });
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 4750]}>
      {/* Velvet curtains */}
      <mesh ref={curtainLeftRef} position={[-100, 0, -30]}>
        <planeGeometry args={[300, 500]} />
        <meshBasicMaterial
          color="#1a1a2e"
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={curtainRightRef} position={[100, 0, -30]}>
        <planeGeometry args={[300, 500]} />
        <meshBasicMaterial
          color="#1a1a2e"
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Light rays emanating from center */}
      <group ref={lightRaysRef} position={[0, 0, -20]}>
        {[...Array(12)].map((_, i) => (
          <mesh
            key={i}
            rotation={[0, 0, (i / 12) * Math.PI * 2]}
            position={[0, 0, 0]}
          >
            <planeGeometry args={[8, 400]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>

      {/* Central glowing orb */}
      <mesh position={[0, 0, -15]}>
        <sphereGeometry args={[30, 32, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Main text */}
      <group ref={textRef}>
        <Text
          fontSize={80}
          color={COLORS.unveil.primary}
          anchorX="center"
          anchorY="middle"
          outlineWidth={2}
          outlineColor={COLORS.unveil.glow}
        >
          UNVEIL
        </Text>

        {/* Glowing underline */}
        <mesh position={[0, -50, 0]}>
          <planeGeometry args={[200, 3]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Floating diamond shapes */}
      <UnveilDiamonds />

      {/* Sparkle particles */}
      <ParticleSystem
        count={150}
        color="#ffffff"
        size={2}
        zStart={4500}
        zEnd={5000}
        spread={500}
        speed={0.15}
        baseOpacity={0.5}
      />

      {/* Dramatic lighting */}
      <pointLight
        position={[0, 0, 50]}
        color="#ffffff"
        intensity={100}
        distance={400}
      />
      <pointLight
        position={[-100, 100, 0]}
        color={COLORS.purple}
        intensity={30}
        distance={300}
      />
      <pointLight
        position={[100, -100, 0]}
        color={COLORS.cyan}
        intensity={30}
        distance={300}
      />
    </group>
  );
}

// Floating diamonds for Unveil
function UnveilDiamonds() {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const currentOpacity = useRef(0);

  const diamonds = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 20; i++) {
      temp.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 400,
          (Math.random() - 0.5) * 300,
          (Math.random() - 0.5) * 100,
        ),
        scale: 3 + Math.random() * 6,
        rotationSpeed: (Math.random() - 0.5) * 0.03,
        floatOffset: Math.random() * Math.PI * 2,
      });
    }
    return temp;
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const cameraZ = camera.position.z;

    // Match UnveilScene opacity timing with hold period
    let targetOpacity = 0;
    if (cameraZ >= 4100 && cameraZ < 4500) {
      targetOpacity = easeOutQuart((cameraZ - 4100) / 400);
    } else if (cameraZ >= 4500 && cameraZ <= 5100) {
      targetOpacity = 1;
    } else if (cameraZ > 5100 && cameraZ <= 5500) {
      targetOpacity = 1 - easeOutQuart((cameraZ - 5100) / 400);
    }

    currentOpacity.current = smoothDamp(
      currentOpacity.current,
      targetOpacity,
      0.1,
      delta,
    );

    groupRef.current.children.forEach((child, i) => {
      const diamond = diamonds[i];
      child.rotation.y += diamond.rotationSpeed;
      child.rotation.x += diamond.rotationSpeed * 0.5;
      child.position.y =
        diamond.position.y +
        Math.sin(state.clock.elapsedTime + diamond.floatOffset) * 10;

      if (child instanceof THREE.Mesh) {
        (child.material as THREE.MeshBasicMaterial).opacity =
          currentOpacity.current * 0.5;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {diamonds.map((diamond, i) => (
        <mesh key={i} position={diamond.position} scale={diamond.scale}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.5}
            wireframe
          />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================================
// BEAT THE STREET SCENE
// ============================================================================
function BeatTheStreetScene() {
  const groupRef = useRef<THREE.Group>(null);
  const neonRef1 = useRef<THREE.Mesh>(null);
  const neonRef2 = useRef<THREE.Mesh>(null);
  const neonMaterial1 = useRef<THREE.MeshBasicMaterial>(null);
  const neonMaterial2 = useRef<THREE.MeshBasicMaterial>(null);
  const { camera } = useThree();
  const currentOpacity = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const cameraZ = camera.position.z;
    const sceneZ = 5750;

    // Larger fade range to bridge gap from Unveil
    const targetOpacity = getSceneOpacity(cameraZ, sceneZ, 650);
    currentOpacity.current = smoothDamp(
      currentOpacity.current,
      targetOpacity,
      0.1,
      delta,
    );

    groupRef.current.visible = currentOpacity.current > 0.01;

    // Neon flicker with smooth base opacity
    if (neonMaterial1.current && neonMaterial2.current) {
      const flicker1 = Math.random() > 0.02 ? 1 : 0.3;
      const flicker2 = Math.random() > 0.05 ? 1 : 0.5;
      neonMaterial1.current.opacity = 0.8 * flicker1 * currentOpacity.current;
      neonMaterial2.current.opacity = 0.8 * flicker2 * currentOpacity.current;
    }
  });

  return (
    <group ref={groupRef} position={[0, -500, 5750]}>
      <mesh position={[0, 0, -50]}>
        <planeGeometry args={[800, 600]} />
        <meshBasicMaterial color="#374151" />
      </mesh>

      <Text
        fontSize={40}
        color={COLORS.beatTheStreet.glow}
        anchorX="center"
        anchorY="middle"
        outlineWidth={3}
        outlineColor="#000000"
      >
        BEAT THE STREET
      </Text>

      <mesh ref={neonRef1} position={[-200, 100, 20]}>
        <boxGeometry args={[100, 20, 5]} />
        <meshBasicMaterial
          ref={neonMaterial1}
          color={COLORS.pink}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh ref={neonRef2} position={[200, 80, 20]}>
        <boxGeometry args={[80, 15, 5]} />
        <meshBasicMaterial
          ref={neonMaterial2}
          color={COLORS.cyan}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <GraffitiElements sceneZ={5750} />

      <ParticleSystem
        count={100}
        color="#9ca3af"
        size={1}
        zStart={5500}
        zEnd={6000}
        spread={400}
        speed={0.2}
        baseOpacity={0.3}
      />

      <pointLight
        position={[-200, 100, 50]}
        color={COLORS.pink}
        intensity={30}
      />
      <pointLight position={[200, 80, 50]} color={COLORS.cyan} intensity={25} />
    </group>
  );
}

function GraffitiElements({ sceneZ }: { sceneZ: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const currentOpacity = useRef(0);

  const tags = useMemo(() => {
    const temp = [];
    const colors = [COLORS.pink, COLORS.cyan, COLORS.orange, COLORS.purple];

    for (let i = 0; i < 15; i++) {
      temp.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 600,
          (Math.random() - 0.5) * 400,
          -40 + Math.random() * 30,
        ),
        scale: 20 + Math.random() * 40,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: (Math.random() - 0.5) * 0.3,
      });
    }
    return temp;
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Larger fade range for Beat the Street
    const targetOpacity = getSceneOpacity(camera.position.z, sceneZ, 650);
    currentOpacity.current = smoothDamp(
      currentOpacity.current,
      targetOpacity,
      0.1,
      delta,
    );

    groupRef.current.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        (child.material as THREE.MeshBasicMaterial).opacity =
          currentOpacity.current * 0.7;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {tags.map((tag, i) => (
        <mesh key={i} position={tag.position} rotation={[0, 0, tag.rotation]}>
          <planeGeometry args={[tag.scale, tag.scale * 0.3]} />
          <meshBasicMaterial color={tag.color} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================================
// PARODY SCENE - Comedy theater with masks, spotlights, and film strip
// ============================================================================
function ParodyScene() {
  const groupRef = useRef<THREE.Group>(null);
  const textRef = useRef<THREE.Group>(null);
  const stageRef = useRef<THREE.Group>(null);
  const filmStripRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const currentOpacity = useRef(0);
  const maskSwing = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const cameraZ = camera.position.z;
    const sceneZ = 6750;

    const targetOpacity = getSceneOpacity(cameraZ, sceneZ, 500);
    currentOpacity.current = smoothDamp(
      currentOpacity.current,
      targetOpacity,
      0.1,
      delta,
    );

    groupRef.current.visible = currentOpacity.current > 0.01;

    // Text wave animation
    if (textRef.current) {
      textRef.current.children.forEach((child, i) => {
        const wave = Math.sin(state.clock.elapsedTime * 3 + i * 0.5) * 8;
        child.position.y = wave;
        child.rotation.z = Math.sin(state.clock.elapsedTime * 2 + i) * 0.1;
      });
    }

    // Mask swing animation
    maskSwing.current = Math.sin(state.clock.elapsedTime * 1.5) * 0.3;

    // Film strip scroll
    if (filmStripRef.current) {
      filmStripRef.current.position.x =
        ((state.clock.elapsedTime * 50) % 400) - 200;
    }
  });

  return (
    <group ref={groupRef} position={[0, -500, 6750]}>
      {/* Stage backdrop with gradient */}
      <mesh position={[0, 0, -80]}>
        <planeGeometry args={[800, 600]} />
        <meshBasicMaterial color="#1a0a2e" />
      </mesh>

      {/* Stage curtain frame */}
      <StageCurtains opacity={currentOpacity.current} />

      {/* Comedy/Tragedy masks */}
      <TheaterMasks
        swing={maskSwing.current}
        opacity={currentOpacity.current}
      />

      {/* Scrolling film strip at bottom */}
      <group ref={filmStripRef} position={[0, -180, 0]}>
        <FilmStrip opacity={currentOpacity.current} />
      </group>

      {/* Main text with letter wave */}
      <group ref={textRef} position={[0, 30, 0]}>
        {["P", "A", "R", "O", "D", "Y"].map((letter, i) => (
          <Text
            key={i}
            fontSize={70}
            color={
              i % 2 === 0 ? COLORS.parody.primary : COLORS.parody.secondary
            }
            anchorX="center"
            anchorY="middle"
            position={[(i - 2.5) * 55, 0, 0]}
            outlineWidth={3}
            outlineColor="#000000"
          >
            {letter}
          </Text>
        ))}
      </group>

      {/* Spotlight beams */}
      <SpotlightBeams opacity={currentOpacity.current} />

      {/* Confetti particles */}
      <ConfettiParticles sceneZ={6750} />

      {/* Star burst decorations */}
      <StarBursts opacity={currentOpacity.current} />

      {/* Theatrical lighting */}
      <pointLight
        position={[0, 150, 100]}
        color={COLORS.pink}
        intensity={60}
        distance={400}
      />
      <pointLight
        position={[-150, 50, 50]}
        color={COLORS.parody.secondary}
        intensity={40}
        distance={300}
      />
      <pointLight
        position={[150, 50, 50]}
        color={COLORS.cyan}
        intensity={40}
        distance={300}
      />
      <ambientLight intensity={0.3} />
    </group>
  );
}

// Stage curtains frame
function StageCurtains({ opacity }: { opacity: number }) {
  return (
    <group>
      {/* Top valance */}
      <mesh position={[0, 220, -50]}>
        <planeGeometry args={[700, 80]} />
        <meshBasicMaterial
          color="#8b0000"
          transparent
          opacity={opacity * 0.9}
        />
      </mesh>

      {/* Side curtains */}
      <mesh position={[-320, 0, -40]}>
        <planeGeometry args={[100, 500]} />
        <meshBasicMaterial
          color="#8b0000"
          transparent
          opacity={opacity * 0.8}
        />
      </mesh>
      <mesh position={[320, 0, -40]}>
        <planeGeometry args={[100, 500]} />
        <meshBasicMaterial
          color="#8b0000"
          transparent
          opacity={opacity * 0.8}
        />
      </mesh>

      {/* Golden trim */}
      <mesh position={[0, 175, -45]}>
        <planeGeometry args={[650, 8]} />
        <meshBasicMaterial
          color={COLORS.gold}
          transparent
          opacity={opacity * 0.9}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// Comedy and Tragedy masks
function TheaterMasks({ swing, opacity }: { swing: number; opacity: number }) {
  const comedyRef = useRef<THREE.Group>(null);
  const tragedyRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (comedyRef.current) {
      comedyRef.current.rotation.z = swing;
      comedyRef.current.position.y =
        -80 + Math.sin(state.clock.elapsedTime * 2) * 5;
    }
    if (tragedyRef.current) {
      tragedyRef.current.rotation.z = -swing;
      tragedyRef.current.position.y =
        -80 + Math.sin(state.clock.elapsedTime * 2 + Math.PI) * 5;
    }
  });

  return (
    <group>
      {/* Comedy mask (left) - happy */}
      <group ref={comedyRef} position={[-180, -80, 20]}>
        <mesh>
          <circleGeometry args={[40, 32]} />
          <meshBasicMaterial
            color="#ffd700"
            transparent
            opacity={opacity * 0.9}
          />
        </mesh>
        {/* Smile */}
        <mesh position={[0, -10, 1]}>
          <ringGeometry args={[15, 20, 32, 1, 0, Math.PI]} />
          <meshBasicMaterial color="#000000" transparent opacity={opacity} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-12, 8, 1]}>
          <circleGeometry args={[6, 16]} />
          <meshBasicMaterial color="#000000" transparent opacity={opacity} />
        </mesh>
        <mesh position={[12, 8, 1]}>
          <circleGeometry args={[6, 16]} />
          <meshBasicMaterial color="#000000" transparent opacity={opacity} />
        </mesh>
      </group>

      {/* Tragedy mask (right) - sad */}
      <group ref={tragedyRef} position={[180, -80, 20]}>
        <mesh>
          <circleGeometry args={[40, 32]} />
          <meshBasicMaterial
            color="#c0c0c0"
            transparent
            opacity={opacity * 0.9}
          />
        </mesh>
        {/* Frown */}
        <mesh position={[0, -15, 1]} rotation={[0, 0, Math.PI]}>
          <ringGeometry args={[15, 20, 32, 1, 0, Math.PI]} />
          <meshBasicMaterial color="#000000" transparent opacity={opacity} />
        </mesh>
        {/* Eyes (droopy) */}
        <mesh position={[-12, 5, 1]} rotation={[0, 0, 0.3]}>
          <circleGeometry args={[6, 16]} />
          <meshBasicMaterial color="#000000" transparent opacity={opacity} />
        </mesh>
        <mesh position={[12, 5, 1]} rotation={[0, 0, -0.3]}>
          <circleGeometry args={[6, 16]} />
          <meshBasicMaterial color="#000000" transparent opacity={opacity} />
        </mesh>
      </group>
    </group>
  );
}

// Film strip decoration
function FilmStrip({ opacity }: { opacity: number }) {
  return (
    <group>
      {/* Film strip base */}
      <mesh>
        <planeGeometry args={[600, 50]} />
        <meshBasicMaterial
          color="#1a1a1a"
          transparent
          opacity={opacity * 0.8}
        />
      </mesh>

      {/* Sprocket holes */}
      {[...Array(12)].map((_, i) => (
        <group key={i}>
          <mesh position={[(i - 5.5) * 50, 18, 1]}>
            <planeGeometry args={[15, 10]} />
            <meshBasicMaterial color="#000000" transparent opacity={opacity} />
          </mesh>
          <mesh position={[(i - 5.5) * 50, -18, 1]}>
            <planeGeometry args={[15, 10]} />
            <meshBasicMaterial color="#000000" transparent opacity={opacity} />
          </mesh>
        </group>
      ))}

      {/* Film frames with colors */}
      {[...Array(6)].map((_, i) => (
        <mesh key={i} position={[(i - 2.5) * 90, 0, 1]}>
          <planeGeometry args={[70, 35]} />
          <meshBasicMaterial
            color={
              [
                COLORS.pink,
                COLORS.cyan,
                COLORS.orange,
                COLORS.purple,
                COLORS.gold,
                COLORS.teal,
              ][i]
            }
            transparent
            opacity={opacity * 0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

// Spotlight beams
function SpotlightBeams({ opacity }: { opacity: number }) {
  const beamsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!beamsRef.current) return;
    beamsRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        const swing = Math.sin(state.clock.elapsedTime * 0.8 + i * 2) * 0.2;
        child.rotation.z = (i === 0 ? 0.4 : -0.4) + swing;
      }
    });
  });

  return (
    <group ref={beamsRef} position={[0, 200, -30]}>
      <mesh position={[-100, 0, 0]} rotation={[0, 0, 0.4]}>
        <coneGeometry args={[60, 350, 32, 1, true]} />
        <meshBasicMaterial
          color={COLORS.pink}
          transparent
          opacity={opacity * 0.15}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh position={[100, 0, 0]} rotation={[0, 0, -0.4]}>
        <coneGeometry args={[60, 350, 32, 1, true]} />
        <meshBasicMaterial
          color={COLORS.parody.secondary}
          transparent
          opacity={opacity * 0.15}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// Confetti particles
function ConfettiParticles({ sceneZ }: { sceneZ: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const currentOpacity = useRef(0);

  const confetti = useMemo(() => {
    const temp = [];
    const colors = [
      COLORS.pink,
      COLORS.parody.secondary,
      COLORS.cyan,
      COLORS.gold,
      COLORS.orange,
    ];

    for (let i = 0; i < 60; i++) {
      temp.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 500,
          (Math.random() - 0.5) * 400,
          (Math.random() - 0.5) * 100,
        ),
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        fallSpeed: 0.3 + Math.random() * 0.5,
        swayOffset: Math.random() * Math.PI * 2,
        scale: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    return temp;
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const targetOpacity = getSceneOpacity(camera.position.z, sceneZ, 450);
    currentOpacity.current = smoothDamp(
      currentOpacity.current,
      targetOpacity,
      0.1,
      delta,
    );

    groupRef.current.children.forEach((child, i) => {
      const c = confetti[i];
      child.rotation.z += c.rotationSpeed;
      child.rotation.x += c.rotationSpeed * 0.5;

      // Falling with sway
      const sway = Math.sin(state.clock.elapsedTime * 2 + c.swayOffset) * 20;
      child.position.x = c.position.x + sway;
      child.position.y =
        c.position.y -
        ((state.clock.elapsedTime * c.fallSpeed * 30) % 400) +
        200;

      if (child instanceof THREE.Mesh) {
        (child.material as THREE.MeshBasicMaterial).opacity =
          currentOpacity.current * 0.8;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {confetti.map((c, i) => (
        <mesh
          key={i}
          position={c.position}
          rotation={[0, 0, c.rotation]}
          scale={c.scale}
        >
          <planeGeometry args={[1, 0.6]} />
          <meshBasicMaterial
            color={c.color}
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// Star burst decorations
function StarBursts({ opacity }: { opacity: number }) {
  const starsRef = useRef<THREE.Group>(null);

  const stars = useMemo(() => {
    return [
      { position: [-250, 120, 10], scale: 1.2, color: COLORS.gold },
      { position: [250, 100, 10], scale: 1, color: COLORS.pink },
      { position: [-200, -120, 10], scale: 0.8, color: COLORS.cyan },
      { position: [220, -100, 10], scale: 0.9, color: COLORS.parody.secondary },
    ];
  }, []);

  useFrame((state) => {
    if (!starsRef.current) return;
    starsRef.current.children.forEach((child, i) => {
      child.rotation.z = state.clock.elapsedTime * 0.5 + i;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3 + i) * 0.2;
      child.scale.setScalar(stars[i].scale * pulse * 15);
    });
  });

  return (
    <group ref={starsRef}>
      {stars.map((star, i) => (
        <mesh key={i} position={star.position as [number, number, number]}>
          <ringGeometry args={[0.8, 1, 6]} />
          <meshBasicMaterial
            color={star.color}
            transparent
            opacity={opacity * 0.7}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================================
// BACKGROUND
// ============================================================================
function Background() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.z = camera.position.z - 500;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -500]}>
      <planeGeometry args={[3000, 2000]} />
      <meshBasicMaterial color="#000000" />
    </mesh>
  );
}

// ============================================================================
// POST PROCESSING
// ============================================================================
function PostProcessing() {
  const chromaticOffset = useMemo(() => new THREE.Vector2(0.002, 0.002), []);

  return (
    <EffectComposer>
      <Bloom
        intensity={0.4}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
      />
      <ChromaticAberration
        offset={chromaticOffset}
        blendFunction={BlendFunction.NORMAL}
      />
      <Vignette darkness={0.4} offset={0.3} />
      <Noise opacity={0.015} blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  );
}

// ============================================================================
// MAIN SCENE
// ============================================================================
function SpectraScene() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <Background />
      <fog attach="fog" args={["#000000", 100, 1200]} />

      <CameraController />

      <IntroScene />
      <Portal />
      <EventXScene />
      <VortexTunnel />
      <BattleScene />
      <CurtainLayers />
      <SpotlightScene />
      <PaintTunnel />
      <MuralScene />
      <UnveilScene />
      <BeatTheStreetScene />
      <ParodyScene />

      <PostProcessing />
    </>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================
export function TheEvents3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (containerRef.current) {
      setContainerRef(containerRef.current);
    }

    return () => {
      setContainerRef(null);
    };
  }, []);

  if (!mounted) {
    return (
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ height: "500vh" }}
      >
        <div className="sticky top-0 w-full h-screen bg-black flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            <span className="text-white/60 text-sm font-mono">
              Loading Experience...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: "500vh" }}
    >
      <div className="sticky top-0 w-full h-screen">
        <Canvas
          camera={{ position: [0, 0, 0], fov: 50, near: 0.1, far: 10000 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          style={{ background: "#000000" }}
          dpr={[1, 2]}
        >
          <Suspense fallback={<Loader />}>
            <SpectraScene />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}

export default TheEvents3D;
