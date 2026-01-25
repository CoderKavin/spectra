"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ZONE_POSITIONS } from "../CameraPath";

interface ZoneProps {
  progress: number;
  activeZone: number;
}

// Zone 2: Battle of the Bands - Chrome strings, speaker grills, waveforms
function BattleOfBands({ position, isActive }: { position: [number, number, number]; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const stringsRef = useRef<THREE.Group>(null);

  const strings = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      x: (i - 3.5) * 0.6,
      tension: 0.5 + Math.random() * 0.5,
    }));
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (stringsRef.current) {
      stringsRef.current.children.forEach((string, i) => {
        const mesh = string as THREE.Mesh;
        const vibration = Math.sin(time * (10 + i * 2)) * (isActive ? 0.05 : 0.01);
        mesh.scale.x = 1 + vibration;
      });
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(time * 0.2) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Speaker grill backdrop */}
      <mesh position={[0, 0, -1]}>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial
          color="#0f0f1a"
          metalness={0.95}
          roughness={0.3}
        />
      </mesh>

      {/* Speaker grill pattern */}
      {Array.from({ length: 100 }, (_, i) => {
        const row = Math.floor(i / 10);
        const col = i % 10;
        return (
          <mesh
            key={i}
            position={[(col - 4.5) * 0.7, (row - 4.5) * 0.5, -0.9]}
          >
            <circleGeometry args={[0.15, 16]} />
            <meshStandardMaterial
              color="#1a1a2e"
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
        );
      })}

      {/* Chrome strings */}
      <group ref={stringsRef} position={[0, 0, 1]}>
        {strings.map((string, i) => (
          <mesh key={i} position={[string.x, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 5, 8]} />
            <meshStandardMaterial
              color="#e0e0e0"
              metalness={0.99}
              roughness={0.05}
              envMapIntensity={3}
            />
          </mesh>
        ))}
      </group>

      {/* Waveform ribbons */}
      <WaveformRibbon position={[0, 2.5, 0]} color="#EF4444" />
      <WaveformRibbon position={[0, -2.5, 0]} color="#7C3AED" />

      {/* Lights */}
      <pointLight position={[0, 3, 3]} intensity={isActive ? 3 : 1} color="#EF4444" />
      <pointLight position={[0, -3, 3]} intensity={isActive ? 2 : 0.5} color="#7C3AED" />
    </group>
  );
}

function WaveformRibbon({ position, color }: { position: [number, number, number]; color: string }) {
  const ribbonRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ribbonRef.current) {
      const geometry = ribbonRef.current.geometry as THREE.BufferGeometry;
      const posAttr = geometry.attributes.position;
      const time = state.clock.elapsedTime;

      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const wave = Math.sin(x * 2 + time * 3) * 0.2;
        posAttr.setY(i, wave);
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <mesh ref={ribbonRef} position={position}>
      <planeGeometry args={[6, 0.3, 32, 1]} />
      <meshStandardMaterial
        color={color}
        metalness={0.8}
        roughness={0.3}
        emissive={color}
        emissiveIntensity={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Zone 3: Spotlight - Polished stage, moving metal shutters
function Spotlight({ position, isActive }: { position: [number, number, number]; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const shuttersRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (shuttersRef.current) {
      shuttersRef.current.children.forEach((shutter, i) => {
        const mesh = shutter as THREE.Mesh;
        mesh.rotation.z = Math.sin(time * 0.5 + i * 0.3) * 0.3;
      });
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Polished stage floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <circleGeometry args={[5, 64]} />
        <meshStandardMaterial
          color="#0a0a15"
          metalness={0.99}
          roughness={0.05}
          envMapIntensity={3}
        />
      </mesh>

      {/* Metal shutters */}
      <group ref={shuttersRef}>
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 3, 1, Math.sin(angle) * 3]}
              rotation={[0, -angle, 0]}
            >
              <boxGeometry args={[0.1, 3, 1.5]} />
              <meshStandardMaterial
                color="#2a2a3e"
                metalness={0.95}
                roughness={0.15}
              />
            </mesh>
          );
        })}
      </group>

      {/* Central spotlight cone */}
      <mesh position={[0, 4, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[2, 6, 32, 1, true]} />
        <meshBasicMaterial
          color="#7C3AED"
          transparent
          opacity={isActive ? 0.2 : 0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Spotlight source */}
      <spotLight
        position={[0, 6, 0]}
        angle={0.5}
        penumbra={0.5}
        intensity={isActive ? 5 : 1}
        color="#F59E0B"
        castShadow
      />

      {/* Rim lights */}
      <pointLight position={[4, 2, 0]} intensity={isActive ? 2 : 0.5} color="#7C3AED" />
      <pointLight position={[-4, 2, 0]} intensity={isActive ? 2 : 0.5} color="#7C3AED" />
    </group>
  );
}

// Zone 4: Mural - Liquid metal paint splashes
function Mural({ position, isActive }: { position: [number, number, number]; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const splashesRef = useRef<THREE.Group>(null);

  const splashes = useMemo(() => {
    return Array.from({ length: 15 }, () => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 2
      ),
      scale: 0.5 + Math.random() * 1.5,
      rotation: Math.random() * Math.PI * 2,
      color: Math.random() > 0.5 ? "#10B981" : "#7C3AED",
    }));
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (splashesRef.current) {
      splashesRef.current.children.forEach((splash, i) => {
        const mesh = splash as THREE.Mesh;
        mesh.rotation.z += 0.001;
        const pulse = Math.sin(time * 2 + i) * 0.1;
        mesh.scale.setScalar(splashes[i].scale * (1 + pulse * (isActive ? 1 : 0.3)));
      });
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Canvas backdrop */}
      <mesh position={[0, 0, -2]}>
        <planeGeometry args={[10, 7]} />
        <meshStandardMaterial
          color="#0a0a12"
          metalness={0.3}
          roughness={0.8}
        />
      </mesh>

      {/* Liquid metal splashes */}
      <group ref={splashesRef}>
        {splashes.map((splash, i) => (
          <mesh
            key={i}
            position={splash.pos}
            rotation={[0, 0, splash.rotation]}
          >
            <torusGeometry args={[splash.scale * 0.5, splash.scale * 0.2, 8, 16, Math.PI * 1.5]} />
            <meshStandardMaterial
              color={splash.color}
              metalness={0.95}
              roughness={0.1}
              emissive={splash.color}
              emissiveIntensity={isActive ? 0.3 : 0.1}
            />
          </mesh>
        ))}
      </group>

      {/* Paint drips */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[(i - 3.5) * 1.2, -3, -1.5]}>
          <cylinderGeometry args={[0.05, 0.1, 1 + Math.random(), 8]} />
          <meshStandardMaterial
            color="#10B981"
            metalness={0.9}
            roughness={0.15}
          />
        </mesh>
      ))}

      {/* Anodized violet sheen light */}
      <rectAreaLight
        position={[0, 0, 3]}
        width={8}
        height={6}
        intensity={isActive ? 3 : 1}
        color="#7C3AED"
      />
    </group>
  );
}

// Zone 5: Unveil - Reflective runway, satin metal ribbons
function Unveil({ position, isActive }: { position: [number, number, number]; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const ribbonsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (ribbonsRef.current) {
      ribbonsRef.current.children.forEach((ribbon, i) => {
        const mesh = ribbon as THREE.Mesh;
        mesh.rotation.x = Math.sin(time + i * 0.5) * 0.2;
        mesh.rotation.z = Math.cos(time * 0.7 + i) * 0.1;
      });
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Reflective runway */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[4, 12]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.99}
          roughness={0.02}
          envMapIntensity={4}
        />
      </mesh>

      {/* Runway edge lights */}
      {Array.from({ length: 10 }, (_, i) => (
        <group key={i}>
          <mesh position={[-2.2, -1.9, (i - 4.5) * 1.2]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="#EC4899" />
          </mesh>
          <mesh position={[2.2, -1.9, (i - 4.5) * 1.2]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="#EC4899" />
          </mesh>
        </group>
      ))}

      {/* Satin metal ribbons */}
      <group ref={ribbonsRef} position={[0, 2, 0]}>
        {Array.from({ length: 5 }, (_, i) => (
          <mesh
            key={i}
            position={[(i - 2) * 1.5, Math.sin(i) * 0.5, 0]}
            rotation={[0, 0, (i - 2) * 0.2]}
          >
            <planeGeometry args={[0.3, 4]} />
            <meshStandardMaterial
              color="#d4d4dc"
              metalness={0.85}
              roughness={0.25}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>

      {/* Soft highlights */}
      <spotLight
        position={[0, 5, 5]}
        angle={0.6}
        penumbra={0.8}
        intensity={isActive ? 3 : 1}
        color="#fce4ec"
      />
      <pointLight position={[0, 0, 3]} intensity={isActive ? 2 : 0.5} color="#EC4899" />
    </group>
  );
}

// Zone 6: Beat the Street - Obsidian asphalt, neon graffiti
function BeatTheStreet({ position, isActive }: { position: [number, number, number]; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const graffitiRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (graffitiRef.current) {
      graffitiRef.current.children.forEach((graffiti, i) => {
        const material = (graffiti as THREE.Mesh).material as THREE.MeshStandardMaterial;
        const pulse = Math.sin(time * 3 + i) * 0.5 + 0.5;
        material.emissiveIntensity = isActive ? 0.3 + pulse * 0.5 : 0.1 + pulse * 0.2;
      });
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Obsidian glass asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial
          color="#050508"
          metalness={0.7}
          roughness={0.4}
        />
      </mesh>

      {/* Street texture lines */}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1.95, (i - 2) * 1.5]}
        >
          <planeGeometry args={[8, 0.1]} />
          <meshBasicMaterial color="#1a1a2e" />
        </mesh>
      ))}

      {/* Neon chrome graffiti strokes */}
      <group ref={graffitiRef}>
        {/* Abstract graffiti shapes */}
        <mesh position={[-2, 0, -2]} rotation={[0, 0.3, 0.1]}>
          <torusKnotGeometry args={[0.8, 0.15, 64, 8]} />
          <meshStandardMaterial
            color="#22D3EE"
            metalness={0.9}
            roughness={0.1}
            emissive="#22D3EE"
            emissiveIntensity={0.3}
          />
        </mesh>
        <mesh position={[2, 1, -2]} rotation={[0.2, -0.3, 0]}>
          <torusKnotGeometry args={[0.6, 0.1, 64, 8, 2, 3]} />
          <meshStandardMaterial
            color="#7C3AED"
            metalness={0.9}
            roughness={0.1}
            emissive="#7C3AED"
            emissiveIntensity={0.3}
          />
        </mesh>
        <mesh position={[0, -0.5, -1]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[3, 0.15, 0.15]} />
          <meshStandardMaterial
            color="#22D3EE"
            metalness={0.95}
            roughness={0.05}
            emissive="#22D3EE"
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>

      {/* Street lights */}
      <pointLight position={[-4, 4, 0]} intensity={isActive ? 3 : 1} color="#22D3EE" />
      <pointLight position={[4, 4, 0]} intensity={isActive ? 3 : 1} color="#7C3AED" />
    </group>
  );
}

// Zone 7: Parody - Chrome film reels, perforated frames
function Parody({ position, isActive }: { position: [number, number, number]; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const reelRef = useRef<THREE.Mesh>(null);
  const filmStripRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (reelRef.current) {
      reelRef.current.rotation.z = time * (isActive ? 1 : 0.3);
    }

    if (filmStripRef.current) {
      filmStripRef.current.position.y = Math.sin(time * 0.5) * 0.3;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Chrome film reel */}
      <mesh ref={reelRef} position={[-2, 1, 0]}>
        <torusGeometry args={[1.5, 0.3, 16, 32]} />
        <meshStandardMaterial
          color="#c0c0c0"
          metalness={0.98}
          roughness={0.08}
          envMapIntensity={3}
        />
      </mesh>

      {/* Reel spokes */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[
              -2 + Math.cos(angle) * 0.8,
              1 + Math.sin(angle) * 0.8,
              0,
            ]}
            rotation={[0, 0, angle]}
          >
            <boxGeometry args={[1.4, 0.1, 0.1]} />
            <meshStandardMaterial
              color="#808080"
              metalness={0.95}
              roughness={0.1}
            />
          </mesh>
        );
      })}

      {/* Perforated steel frames */}
      <group ref={filmStripRef} position={[1.5, 0, 0]}>
        {Array.from({ length: 4 }, (_, i) => (
          <group key={i} position={[0, (i - 1.5) * 1.8, 0]}>
            {/* Frame */}
            <mesh>
              <boxGeometry args={[2.5, 1.5, 0.1]} />
              <meshStandardMaterial
                color="#1a1a2e"
                metalness={0.9}
                roughness={0.2}
              />
            </mesh>
            {/* Perforations */}
            {Array.from({ length: 4 }, (_, j) => (
              <group key={j}>
                <mesh position={[-1.4, (j - 1.5) * 0.35, 0.06]}>
                  <circleGeometry args={[0.08, 8]} />
                  <meshBasicMaterial color="#000000" />
                </mesh>
                <mesh position={[1.4, (j - 1.5) * 0.35, 0.06]}>
                  <circleGeometry args={[0.08, 8]} />
                  <meshBasicMaterial color="#000000" />
                </mesh>
              </group>
            ))}
          </group>
        ))}
      </group>

      {/* Projector light */}
      <spotLight
        position={[0, 0, 5]}
        angle={0.3}
        penumbra={0.5}
        intensity={isActive ? 4 : 1}
        color="#f5f5f5"
      />
    </group>
  );
}

// Zone 8: Recap - Reflective shard confetti, chrome memory frames
function Recap({ position, isActive }: { position: [number, number, number]; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const shardsRef = useRef<THREE.Group>(null);
  const framesRef = useRef<THREE.Group>(null);

  const shards = useMemo(() => {
    return Array.from({ length: 50 }, () => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6
      ),
      rotation: new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      ),
      scale: 0.1 + Math.random() * 0.3,
      speed: 0.5 + Math.random() * 1.5,
    }));
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (shardsRef.current) {
      shardsRef.current.children.forEach((shard, i) => {
        const mesh = shard as THREE.Mesh;
        mesh.rotation.x += shards[i].speed * 0.01;
        mesh.rotation.y += shards[i].speed * 0.015;
        mesh.position.y = shards[i].pos.y + Math.sin(time + i) * 0.5;
      });
    }

    if (framesRef.current) {
      framesRef.current.children.forEach((frame, i) => {
        const mesh = frame as THREE.Mesh;
        mesh.rotation.y = Math.sin(time * 0.3 + i * 0.5) * 0.2;
      });
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Chrome memory frames - the "8" */}
      <group ref={framesRef}>
        {/* Top circle of 8 */}
        <mesh position={[0, 1.5, 0]}>
          <torusGeometry args={[1.2, 0.15, 16, 32]} />
          <meshStandardMaterial
            color="#e0e0e0"
            metalness={0.98}
            roughness={0.05}
            envMapIntensity={3}
          />
        </mesh>
        {/* Bottom circle of 8 */}
        <mesh position={[0, -1.2, 0]}>
          <torusGeometry args={[1.2, 0.15, 16, 32]} />
          <meshStandardMaterial
            color="#e0e0e0"
            metalness={0.98}
            roughness={0.05}
            envMapIntensity={3}
          />
        </mesh>
      </group>

      {/* Reflective shard confetti */}
      <group ref={shardsRef}>
        {shards.map((shard, i) => (
          <mesh
            key={i}
            position={shard.pos}
            rotation={shard.rotation}
            scale={shard.scale}
          >
            <tetrahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={i % 3 === 0 ? "#7C3AED" : i % 3 === 1 ? "#22D3EE" : "#f0f0f0"}
              metalness={0.95}
              roughness={0.1}
              envMapIntensity={2}
            />
          </mesh>
        ))}
      </group>

      {/* Celebration lighting */}
      <pointLight position={[0, 3, 3]} intensity={isActive ? 4 : 1} color="#7C3AED" />
      <pointLight position={[-3, -2, 2]} intensity={isActive ? 3 : 0.5} color="#22D3EE" />
      <pointLight position={[3, -2, 2]} intensity={isActive ? 3 : 0.5} color="#EC4899" />
    </group>
  );
}

// Main zones component
export function AllZones({ progress, activeZone }: ZoneProps) {
  return (
    <group>
      {/* Zone 1: Event X */}
      <EventXZone
        position={[0, 4, ZONE_POSITIONS[0].z]}
        isActive={activeZone === 0}
      />

      {/* Zone 2: Battle of the Bands */}
      <BattleOfBands
        position={[0, 5, ZONE_POSITIONS[1].z]}
        isActive={activeZone === 1}
      />

      {/* Zone 3: Spotlight */}
      <Spotlight
        position={[0, 6, ZONE_POSITIONS[2].z]}
        isActive={activeZone === 2}
      />

      {/* Zone 4: Mural */}
      <Mural
        position={[0, 7, ZONE_POSITIONS[3].z]}
        isActive={activeZone === 3}
      />

      {/* Zone 5: Unveil */}
      <Unveil
        position={[0, 8, ZONE_POSITIONS[4].z]}
        isActive={activeZone === 4}
      />

      {/* Zone 6: Beat the Street */}
      <BeatTheStreet
        position={[0, 9, ZONE_POSITIONS[5].z]}
        isActive={activeZone === 5}
      />

      {/* Zone 7: Parody */}
      <Parody
        position={[0, 10, ZONE_POSITIONS[6].z]}
        isActive={activeZone === 6}
      />

      {/* Zone 8: Recap */}
      <Recap
        position={[0, 11, ZONE_POSITIONS[7].z]}
        isActive={activeZone === 7}
      />
    </group>
  );
}

// Simplified Event X for the zones file
function EventXZone({ position, isActive }: { position: [number, number, number]; isActive: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Central embossed plate */}
      <mesh>
        <boxGeometry args={[3, 3, 0.1]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.95}
          roughness={0.15}
        />
      </mesh>

      {/* X mark */}
      <mesh position={[0, 0, 0.06]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[2.5, 0.15, 0.05]} />
        <meshStandardMaterial
          color="#7C3AED"
          metalness={0.9}
          roughness={0.2}
          emissive="#7C3AED"
          emissiveIntensity={isActive ? 0.5 : 0.2}
        />
      </mesh>
      <mesh position={[0, 0, 0.06]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[2.5, 0.15, 0.05]} />
        <meshStandardMaterial
          color="#7C3AED"
          metalness={0.9}
          roughness={0.2}
          emissive="#7C3AED"
          emissiveIntensity={isActive ? 0.5 : 0.2}
        />
      </mesh>

      {/* Evidence pins */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 2;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * radius,
              Math.sin(angle) * radius,
              0.1,
            ]}
          >
            <cylinderGeometry args={[0.05, 0.08, 0.4, 8]} />
            <meshStandardMaterial
              color="#c0c0c0"
              metalness={0.98}
              roughness={0.1}
            />
          </mesh>
        );
      })}

      {/* Cold spotlights */}
      <spotLight
        position={[3, 3, 3]}
        angle={0.4}
        penumbra={0.8}
        intensity={isActive ? 2 : 0.5}
        color="#4a5568"
      />
      <spotLight
        position={[-3, 3, 3]}
        angle={0.4}
        penumbra={0.8}
        intensity={isActive ? 1.5 : 0.3}
        color="#7C3AED"
      />
    </group>
  );
}
