"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface MetallicCorridorProps {
  progress: number;
}

export function MetallicCorridor({ progress }: MetallicCorridorProps) {
  const corridorRef = useRef<THREE.Group>(null);
  const panelsRef = useRef<THREE.InstancedMesh>(null);

  // Generate corridor panels
  const { panelCount, panelData } = useMemo(() => {
    const count = 200;
    const data: { position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 }[] = [];

    for (let i = 0; i < count; i++) {
      const z = 60 - i * 1.2;
      const side = i % 2 === 0 ? -1 : 1;
      const yOffset = Math.floor(i / 4) % 3;

      data.push({
        position: new THREE.Vector3(side * 8, yOffset * 4 - 2, z),
        rotation: new THREE.Euler(0, side * Math.PI * 0.1, 0),
        scale: new THREE.Vector3(0.2, 3, 2),
      });
    }

    return { panelCount: count, panelData: data };
  }, []);

  // Create floor panels
  const floorPanels = useMemo(() => {
    const panels: { position: THREE.Vector3; scale: THREE.Vector3 }[] = [];
    for (let i = 0; i < 100; i++) {
      const z = 60 - i * 2;
      panels.push({
        position: new THREE.Vector3(0, -4, z),
        scale: new THREE.Vector3(16, 0.1, 1.8),
      });
    }
    return panels;
  }, []);

  // Ceiling beams
  const ceilingBeams = useMemo(() => {
    const beams: { position: THREE.Vector3; scale: THREE.Vector3 }[] = [];
    for (let i = 0; i < 50; i++) {
      const z = 60 - i * 4;
      beams.push({
        position: new THREE.Vector3(0, 12, z),
        scale: new THREE.Vector3(18, 0.3, 0.3),
      });
    }
    return beams;
  }, []);

  useFrame((state) => {
    if (panelsRef.current) {
      const time = state.clock.elapsedTime;
      const dummy = new THREE.Object3D();

      for (let i = 0; i < panelCount; i++) {
        const panel = panelData[i];
        dummy.position.copy(panel.position);
        dummy.rotation.copy(panel.rotation);
        dummy.scale.copy(panel.scale);

        // Subtle breathing animation
        const breathe = Math.sin(time * 0.5 + i * 0.1) * 0.02;
        dummy.scale.x += breathe;

        dummy.updateMatrix();
        panelsRef.current.setMatrixAt(i, dummy.matrix);
      }
      panelsRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={corridorRef}>
      {/* Side panels */}
      <instancedMesh ref={panelsRef} args={[undefined, undefined, panelCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.95}
          roughness={0.2}
          envMapIntensity={1.5}
        />
      </instancedMesh>

      {/* Floor */}
      {floorPanels.map((panel, i) => (
        <mesh
          key={`floor-${i}`}
          position={panel.position}
          scale={panel.scale}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#0a0a15"
            metalness={0.98}
            roughness={0.1}
            envMapIntensity={2}
          />
        </mesh>
      ))}

      {/* Ceiling beams */}
      {ceilingBeams.map((beam, i) => (
        <mesh
          key={`ceiling-${i}`}
          position={beam.position}
          scale={beam.scale}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#15151f"
            metalness={0.9}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* Energy lines along the corridor */}
      <EnergyLines progress={progress} />
    </group>
  );
}

function EnergyLines({ progress }: { progress: number }) {
  const linesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (linesRef.current) {
      const time = state.clock.elapsedTime;
      linesRef.current.children.forEach((line, i) => {
        const material = (line as THREE.Mesh).material as THREE.MeshBasicMaterial;
        const pulse = Math.sin(time * 2 + i * 0.5) * 0.5 + 0.5;
        material.opacity = 0.3 + pulse * 0.4;
      });
    }
  });

  const lines = useMemo(() => {
    const lineData: { position: THREE.Vector3; side: number }[] = [];
    for (let i = 0; i < 100; i++) {
      const z = 60 - i * 2;
      lineData.push({ position: new THREE.Vector3(-7, -3.5, z), side: -1 });
      lineData.push({ position: new THREE.Vector3(7, -3.5, z), side: 1 });
    }
    return lineData;
  }, []);

  return (
    <group ref={linesRef}>
      {lines.map((line, i) => (
        <mesh key={i} position={line.position}>
          <boxGeometry args={[0.05, 0.05, 1.5]} />
          <meshBasicMaterial
            color="#7C3AED"
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}
