"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";

interface EventXProps {
  position: [number, number, number];
  progress: number;
  isActive: boolean;
}

export function EventX({ position, progress, isActive }: EventXProps) {
  const groupRef = useRef<THREE.Group>(null);
  const evidencePinsRef = useRef<THREE.Group>(null);

  const pins = useMemo(() => {
    const pinData: { pos: THREE.Vector3; height: number; delay: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 2 + Math.random() * 2;
      pinData.push({
        pos: new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.random() * 4 - 2,
          Math.sin(angle) * radius
        ),
        height: 0.3 + Math.random() * 0.5,
        delay: i * 0.1,
      });
    }
    return pinData;
  }, []);

  const wires = useMemo(() => {
    const wireData: { start: THREE.Vector3; end: THREE.Vector3 }[] = [];
    for (let i = 0; i < pins.length - 1; i++) {
      if (Math.random() > 0.4) {
        wireData.push({
          start: pins[i].pos,
          end: pins[(i + 2) % pins.length].pos,
        });
      }
    }
    return wireData;
  }, [pins]);

  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime;
      groupRef.current.rotation.y = Math.sin(time * 0.1) * 0.1;

      if (evidencePinsRef.current) {
        evidencePinsRef.current.children.forEach((pin, i) => {
          const mesh = pin as THREE.Mesh;
          const scale = isActive ? 1 : 0.5;
          mesh.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.05);
          mesh.position.y = pins[i].pos.y + Math.sin(time * 2 + i) * 0.05;
        });
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3, 3, 0.1]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.95}
          roughness={0.15}
          envMapIntensity={2}
        />
      </mesh>

      <mesh position={[0, 0, 0.06]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[2.5, 0.15, 0.05]} />
        <meshStandardMaterial
          color="#7C3AED"
          metalness={0.9}
          roughness={0.2}
          emissive="#7C3AED"
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh position={[0, 0, 0.06]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[2.5, 0.15, 0.05]} />
        <meshStandardMaterial
          color="#7C3AED"
          metalness={0.9}
          roughness={0.2}
          emissive="#7C3AED"
          emissiveIntensity={0.5}
        />
      </mesh>

      <group ref={evidencePinsRef}>
        {pins.map((pin, i) => (
          <mesh key={i} position={pin.pos}>
            <cylinderGeometry args={[0.05, 0.08, pin.height, 8]} />
            <meshStandardMaterial
              color="#c0c0c0"
              metalness={0.98}
              roughness={0.1}
            />
          </mesh>
        ))}
      </group>

      <group>
        {wires.map((wire, i) => (
          <Line
            key={i}
            points={[wire.start.toArray(), wire.end.toArray()]}
            color="#7C3AED"
            lineWidth={1}
            transparent
            opacity={0.5}
          />
        ))}
      </group>

      <FogParticles />

      <spotLight
        position={[3, 5, 3]}
        angle={0.4}
        penumbra={0.8}
        intensity={isActive ? 2 : 0.5}
        color="#4a5568"
        castShadow
      />
      <spotLight
        position={[-3, 5, -3]}
        angle={0.4}
        penumbra={0.8}
        intensity={isActive ? 1.5 : 0.3}
        color="#7C3AED"
      />
    </group>
  );
}

function FogParticles() {
  const particlesRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const count = 100;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      const time = state.clock.elapsedTime;
      const posAttr = particlesRef.current.geometry.attributes.position;

      for (let i = 0; i < 100; i++) {
        const i3 = i * 3;
        (posAttr.array as Float32Array)[i3 + 1] += Math.sin(time + i) * 0.002;
        (posAttr.array as Float32Array)[i3] += Math.cos(time * 0.5 + i) * 0.001;
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial
        size={0.05}
        color="#6b7280"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}
