"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface CameraPathProps {
  progress: number;
  reducedMotion?: boolean;
}

export function CameraPath({ progress, reducedMotion = false }: CameraPathProps) {
  const { camera } = useThree();
  const driftRef = useRef({ x: 0, y: 0, time: 0 });

  // Create a dramatic camera path through the metallic corridor
  const curve = useMemo(() => {
    const points = [
      // Prologue - Start in darkness
      new THREE.Vector3(0, 0, 50),
      new THREE.Vector3(0, 2, 40),
      // Zone 1 - Event X
      new THREE.Vector3(0, 3, 30),
      new THREE.Vector3(2, 4, 20),
      // Zone 2 - Battle of the Bands
      new THREE.Vector3(-2, 5, 10),
      new THREE.Vector3(0, 6, 0),
      // Zone 3 - Spotlight
      new THREE.Vector3(3, 7, -10),
      new THREE.Vector3(0, 8, -20),
      // Zone 4 - Mural
      new THREE.Vector3(-3, 9, -30),
      new THREE.Vector3(0, 10, -40),
      // Zone 5 - Unveil
      new THREE.Vector3(2, 11, -50),
      new THREE.Vector3(0, 12, -60),
      // Zone 6 - Beat the Street
      new THREE.Vector3(-2, 13, -70),
      new THREE.Vector3(0, 14, -80),
      // Zone 7 - Parody
      new THREE.Vector3(2, 15, -90),
      new THREE.Vector3(0, 16, -100),
      // Zone 8 - Recap
      new THREE.Vector3(-1, 17, -110),
      new THREE.Vector3(0, 18, -120),
      // Epilogue
      new THREE.Vector3(0, 20, -130),
      new THREE.Vector3(0, 22, -140),
    ];

    return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
  }, []);

  // Look-at curve (slightly ahead of camera)
  const lookAtCurve = useMemo(() => {
    const points = curve.getPoints(50).map((p, i, arr) => {
      const next = arr[Math.min(i + 3, arr.length - 1)];
      return new THREE.Vector3(
        next.x,
        next.y + 0.5,
        next.z - 5
      );
    });
    return new THREE.CatmullRomCurve3(points);
  }, [curve]);

  useFrame((state, delta) => {
    // Clamp progress
    const clampedProgress = Math.max(0, Math.min(1, progress));

    // Get position on curve
    const position = curve.getPointAt(clampedProgress);
    const lookAt = lookAtCurve.getPointAt(clampedProgress);

    // Add procedural handheld drift (reduced if accessibility)
    if (!reducedMotion) {
      driftRef.current.time += delta;
      driftRef.current.x = Math.sin(driftRef.current.time * 0.5) * 0.05;
      driftRef.current.y = Math.cos(driftRef.current.time * 0.7) * 0.03;
    }

    // Smooth camera movement
    camera.position.lerp(
      new THREE.Vector3(
        position.x + driftRef.current.x,
        position.y + driftRef.current.y,
        position.z
      ),
      0.1
    );

    // Smooth look-at
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    const targetLookAt = lookAt.clone().sub(camera.position).normalize();

    const smoothedLookAt = currentLookAt.lerp(targetLookAt, 0.05);
    camera.lookAt(camera.position.clone().add(smoothedLookAt.multiplyScalar(10)));
  });

  return null;
}

// Export curve points for zone positioning
export const ZONE_POSITIONS = [
  { z: 30, name: "Event X", index: 0 },
  { z: 10, name: "Battle of the Bands", index: 1 },
  { z: -10, name: "Spotlight", index: 2 },
  { z: -30, name: "Mural", index: 3 },
  { z: -50, name: "Unveil", index: 4 },
  { z: -70, name: "Beat the Street", index: 5 },
  { z: -90, name: "Parody", index: 6 },
  { z: -110, name: "Recap", index: 7 },
];

export const PROLOGUE_Z = 45;
export const EPILOGUE_Z = -130;
