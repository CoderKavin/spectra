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
import Lenis from "lenis";

// ============================================================================
// SPECTRA 8 COLOR PALETTE (extracted from logo)
// ============================================================================
const COLORS = {
  // Primary colors from logo
  teal: "#0d9488",
  cyan: "#06b6d4",
  purple: "#8b5cf6",
  violet: "#7c3aed",
  pink: "#ec4899",
  orange: "#f97316",
  gold: "#fbbf24",
  red: "#ef4444",

  // Scene specific
  eventX: {
    primary: "#0d9488",
    secondary: "#0d4d56",
    background: "#0a1628",
    glow: "#14b8a6",
  },
  battle: {
    primary: "#f97316",
    secondary: "#dc2626",
    background: "#7f1d1d",
    glow: "#fb923c",
  },
  spotlight: {
    primary: "#fbbf24",
    secondary: "#fef3c7",
    background: "#78350f",
    glow: "#fcd34d",
  },
  mural: {
    primary: "#ec4899",
    secondary: "#8b5cf6",
    background: "#581c87",
    glow: "#f472b6",
  },
  unveil: {
    primary: "#e5e7eb",
    secondary: "#f9fafb",
    background: "#1f2937",
    glow: "#ffffff",
  },
  beatTheStreet: {
    primary: "#6b7280",
    secondary: "#374151",
    background: "#111827",
    glow: "#ec4899",
  },
  parody: {
    primary: "#ec4899",
    secondary: "#84cc16",
    background: "#4c1d95",
    glow: "#f472b6",
  },
};

// ============================================================================
// SCROLL STATE STORE
// ============================================================================
interface ScrollState {
  progress: number;
  cameraZ: number;
  currentSection: string;
}

const scrollState: ScrollState = {
  progress: 0,
  cameraZ: 0,
  currentSection: "portal",
};

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
// CAMERA CONTROLLER - Main scroll-driven camera
// ============================================================================
function CameraController() {
  const { camera } = useThree();
  const targetZ = useRef(0);
  const targetY = useRef(0);
  const targetFov = useRef(50);
  const targetRotationZ = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrollY / maxScroll, 1);

      scrollState.progress = progress;
      scrollState.cameraZ = progress * 7500;

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
      else if (z < 7000) scrollState.currentSection = "parody";
      else scrollState.currentSection = "finale";

      // Handle special camera movements

      // Dolly zoom FOV adjustment (Z: 4100-4400)
      if (z >= 4100 && z <= 4400) {
        const dollyProgress = (z - 4100) / 300;
        targetFov.current = 50 + 35 * dollyProgress;
      } else if (z < 4100) {
        targetFov.current = 50;
      } else if (z > 4400 && z < 6300) {
        targetFov.current = 50;
      }

      // Falling Y movement (Z: 5100-5400)
      if (z >= 5100 && z <= 5400) {
        const fallProgress = (z - 5100) / 300;
        targetY.current = -500 * fallProgress;
      } else if (z > 5400 && z < 7200) {
        targetY.current = -500;
      } else if (z >= 7200) {
        // Rise back up for finale
        const riseProgress = Math.min((z - 7200) / 300, 1);
        targetY.current = -500 + 500 * riseProgress;
      } else {
        targetY.current = 0;
      }

      // Glitch spin (Z: 6300-6450)
      if (z >= 6300 && z <= 6450) {
        const spinProgress = (z - 6300) / 150;
        targetRotationZ.current = spinProgress * Math.PI * 2;
      } else if (z > 6450) {
        targetRotationZ.current = 0;
      }

      // Hyperspace FOV for finale (Z: 7200-7400)
      if (z >= 7200 && z <= 7400) {
        const hyperProgress = (z - 7200) / 200;
        targetFov.current = 50 + 40 * hyperProgress;
      } else if (z > 7400) {
        targetFov.current = 50;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useFrame((_, delta) => {
    // Smooth camera movement
    camera.position.z = THREE.MathUtils.lerp(
      camera.position.z,
      targetZ.current,
      0.1,
    );
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      targetY.current,
      0.08,
    );
    camera.rotation.z = THREE.MathUtils.lerp(
      camera.rotation.z,
      targetRotationZ.current,
      0.1,
    );

    // Smooth FOV changes
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov.current, 0.05);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

// ============================================================================
// PARTICLE SYSTEM - Optimized instanced particles
// ============================================================================
interface ParticleSystemProps {
  count: number;
  color: string;
  size?: number;
  zStart: number;
  zEnd: number;
  spread?: number;
  speed?: number;
  opacity?: number;
}

function ParticleSystem({
  count,
  color,
  size = 2,
  zStart,
  zEnd,
  spread = 500,
  speed = 0.5,
  opacity = 0.6,
}: ParticleSystemProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();

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
    if (!meshRef.current) return;

    const cameraZ = camera.position.z;

    // Only update if camera is within range
    if (cameraZ < zStart - 500 || cameraZ > zEnd + 500) {
      meshRef.current.visible = false;
      return;
    }

    meshRef.current.visible = true;

    particles.forEach((particle, i) => {
      // Update position
      particle.position.add(particle.velocity.clone().multiplyScalar(delta));

      // Wrap particles
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
        color={color}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}

// ============================================================================
// PORTAL COMPONENT - Entry transition
// ============================================================================
function Portal() {
  const portalRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!portalRef.current || !ringRef.current) return;

    const cameraZ = camera.position.z;

    // Portal is at Z: 400
    const distance = 400 - cameraZ;

    if (distance > 0 && distance < 500) {
      // Scale portal based on camera distance
      const scale = THREE.MathUtils.mapLinear(distance, 400, 50, 1, 12);
      portalRef.current.scale.setScalar(Math.max(1, scale));
      ringRef.current.scale.setScalar(Math.max(1, scale));

      // Rotate ring
      ringRef.current.rotation.z += 0.02;

      portalRef.current.visible = true;
      ringRef.current.visible = true;
    } else {
      portalRef.current.visible = false;
      ringRef.current.visible = false;
    }
  });

  return (
    <group position={[0, 0, 400]}>
      {/* Portal center (dark) */}
      <mesh ref={portalRef}>
        <circleGeometry args={[50, 64]} />
        <meshBasicMaterial color="#0a1628" side={THREE.DoubleSide} />
      </mesh>

      {/* Portal ring (glowing teal) */}
      <mesh ref={ringRef}>
        <ringGeometry args={[48, 55, 64]} />
        <meshBasicMaterial
          color={COLORS.eventX.glow}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner glow rings */}
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
// EVENT X SCENE
// ============================================================================
function EventXScene() {
  const groupRef = useRef<THREE.Group>(null);
  const textRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame((state) => {
    if (!groupRef.current) return;

    const cameraZ = camera.position.z;
    const sceneZ = 750;
    const distance = Math.abs(cameraZ - sceneZ);

    // Visibility culling
    if (distance > 600) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;

    // Text breathing animation
    if (textRef.current) {
      const breathe = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
      textRef.current.scale.setScalar(breathe);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 750]}>
      {/* Main text */}
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
        </Text>
      </group>

      {/* Floating geometric shapes */}
      <FloatingShapes
        count={15}
        color={COLORS.eventX.primary}
        spread={400}
        zOffset={0}
      />

      {/* Particles */}
      <ParticleSystem
        count={200}
        color={COLORS.eventX.glow}
        size={1.5}
        zStart={500}
        zEnd={1000}
        spread={600}
        speed={0.3}
        opacity={0.5}
      />

      {/* Ambient light for this section */}
      <pointLight
        position={[0, 100, 0]}
        color={COLORS.eventX.glow}
        intensity={50}
        distance={500}
      />
    </group>
  );
}

// ============================================================================
// FLOATING SHAPES - Geometric decorations
// ============================================================================
interface FloatingShapesProps {
  count: number;
  color: string;
  spread: number;
  zOffset: number;
}

function FloatingShapes({
  count,
  color,
  spread,
  zOffset,
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
        <FloatingShape key={i} {...shape} color={color} />
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
}: any) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += rotationSpeed;
    meshRef.current.rotation.y += rotationSpeed * 0.7;
    meshRef.current.position.y =
      position.y +
      Math.sin(state.clock.elapsedTime * floatSpeed + floatOffset) * 10;
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
      <meshBasicMaterial color={color} transparent opacity={0.4} wireframe />
    </mesh>
  );
}

// ============================================================================
// VORTEX TUNNEL - Transition from Event X to Battle
// ============================================================================
function VortexTunnel() {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const { camera } = useThree();

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

      // Color gradient: teal -> purple -> orange
      const colorProgress = z / 300;
      const teal = new THREE.Color(COLORS.eventX.glow);
      const purple = new THREE.Color(COLORS.purple);
      const orange = new THREE.Color(COLORS.battle.primary);

      let finalColor;
      if (colorProgress < 0.5) {
        finalColor = teal.lerp(purple, colorProgress * 2);
      } else {
        finalColor = purple.lerp(orange, (colorProgress - 0.5) * 2);
      }

      colors[i * 3] = finalColor.r;
      colors[i * 3 + 1] = finalColor.g;
      colors[i * 3 + 2] = finalColor.b;
    }

    return { positions, colors };
  }, []);

  useFrame((state) => {
    if (!groupRef.current || !particlesRef.current) return;

    const cameraZ = camera.position.z;

    // Visibility
    if (cameraZ < 1000 || cameraZ > 1600) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;

    // Rotate vortex
    particlesRef.current.rotation.z += 0.03;
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
          size={4}
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>

      {/* Tunnel walls */}
      <mesh position={[0, 0, 1250]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[60, 30, 300, 32, 1, true]} />
        <meshBasicMaterial
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

  useFrame((state) => {
    if (!groupRef.current) return;

    const cameraZ = camera.position.z;
    const sceneZ = 1750;
    const distance = Math.abs(cameraZ - sceneZ);

    if (distance > 600) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;

    // Text vibration effect
    if (text1Ref.current && text2Ref.current) {
      const vibration = Math.sin(state.clock.elapsedTime * 30) * 2;
      text1Ref.current.position.x = vibration;
      text2Ref.current.position.x = -vibration;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 1750]}>
      {/* Title text */}
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

      {/* Sound wave visualizers */}
      <SoundWaves />

      {/* Particles */}
      <ParticleSystem
        count={250}
        color={COLORS.battle.glow}
        size={1.5}
        zStart={1500}
        zEnd={2000}
        spread={500}
        speed={1}
        opacity={0.6}
      />

      {/* Lighting */}
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
// SOUND WAVES - Animated wave visualization
// ============================================================================
function SoundWaves() {
  const wavesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!wavesRef.current) return;

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
            Math.sin((j / (positions.length / 3)) * Math.PI);
        }

        child.geometry.attributes.position.needsUpdate = true;
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
// CURTAIN LAYERS - Transition to Spotlight
// ============================================================================
function CurtainLayers() {
  const layersRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const layerData = useRef(
    [2100, 2200, 2300, 2400, 2500, 2600].map((z, i) => ({
      z,
      direction: i % 2 === 0 ? -1 : 1,
      openProgress: 0,
    })),
  );

  useFrame(() => {
    if (!layersRef.current) return;

    const cameraZ = camera.position.z;

    // Visibility
    if (cameraZ < 1900 || cameraZ > 2700) {
      layersRef.current.visible = false;
      return;
    }

    layersRef.current.visible = true;

    layersRef.current.children.forEach((child, i) => {
      const layer = layerData.current[i];
      const distanceToLayer = layer.z - cameraZ;

      if (distanceToLayer < 80 && distanceToLayer > -100) {
        layer.openProgress = THREE.MathUtils.lerp(layer.openProgress, 1, 0.05);
      }

      child.position.x = layer.direction * layer.openProgress * 600;
      child.rotation.y = layer.direction * layer.openProgress * 0.2;

      const mesh = child as THREE.Mesh;
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.opacity = 0.3 * (1 - layer.openProgress * 0.5);
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
  const { camera } = useThree();

  useFrame((state) => {
    if (!groupRef.current) return;

    const cameraZ = camera.position.z;
    const sceneZ = 2750;
    const distance = Math.abs(cameraZ - sceneZ);

    if (distance > 600) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;

    // Spotlight beam pulse
    if (beamRef.current) {
      const pulse = 0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      (beamRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.15 * pulse;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 2750]}>
      {/* Main text */}
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

      {/* Volumetric spotlight beam */}
      <mesh ref={beamRef} position={[0, 200, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[80, 400, 32, 1, true]} />
        <meshBasicMaterial
          color={COLORS.spotlight.primary}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Golden sparkles */}
      <ParticleSystem
        count={100}
        color={COLORS.spotlight.glow}
        size={2}
        zStart={2500}
        zEnd={3000}
        spread={400}
        speed={0.2}
        opacity={0.7}
      />

      {/* Spotlight from above */}
      <spotLight
        position={[0, 300, 0]}
        angle={0.3}
        penumbra={0.5}
        intensity={200}
        color={COLORS.spotlight.primary}
        target-position={[0, 0, 0]}
      />
    </group>
  );
}

// ============================================================================
// PAINT TUNNEL - Transition to Mural
// ============================================================================
function PaintTunnel() {
  const groupRef = useRef<THREE.Group>(null);
  const ribbonsRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

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

  useFrame((state) => {
    if (!groupRef.current) return;

    const cameraZ = camera.position.z;

    if (cameraZ < 2900 || cameraZ > 3600) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;

    // Rotate ribbons
    if (ribbonsRef.current) {
      ribbonsRef.current.rotation.z += 0.01;
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
          />
        ))}
      </group>

      {/* Burst particles at exit */}
      <ParticleSystem
        count={150}
        color={COLORS.mural.primary}
        size={2}
        zStart={3400}
        zEnd={3600}
        spread={300}
        speed={2}
        opacity={0.6}
      />
    </group>
  );
}

function PaintRibbon({
  color,
  angle,
  zStart,
  zEnd,
}: {
  color: string;
  angle: number;
  zStart: number;
  zEnd: number;
}) {
  const ribbonRef = useRef<THREE.Mesh>(null);

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
    <mesh ref={ribbonRef} geometry={geometry}>
      <meshBasicMaterial
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

  const letterColors = [
    COLORS.pink,
    COLORS.purple,
    COLORS.cyan,
    COLORS.orange,
    COLORS.gold,
  ];

  useFrame(() => {
    if (!groupRef.current) return;

    const cameraZ = camera.position.z;
    const sceneZ = 3750;
    const distance = Math.abs(cameraZ - sceneZ);

    groupRef.current.visible = distance <= 600;
  });

  return (
    <group ref={groupRef} position={[0, 0, 3750]}>
      {/* MURAL text with different colors per letter */}
      {["M", "U", "R", "A", "L"].map((letter, i) => (
        <MuralLetter
          key={i}
          letter={letter}
          color={letterColors[i]}
          position={[(i - 2) * 50, 0, 0]}
          index={i}
        />
      ))}

      {/* Paint splatters */}
      <PaintSplatters />

      {/* Chaotic particles */}
      <ParticleSystem
        count={300}
        color={COLORS.pink}
        size={2}
        zStart={3500}
        zEnd={4000}
        spread={500}
        speed={1.5}
        opacity={0.5}
      />

      {/* Multi-colored lights */}
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
}: {
  letter: string;
  color: string;
  position: number[];
  index: number;
}) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const offset = Math.sin(state.clock.elapsedTime * 2 + index) * 5;
    meshRef.current.position.y = position[1] + offset;
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

function PaintSplatters() {
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

  return (
    <group>
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
// UNVEIL SCENE
// ============================================================================
function UnveilScene() {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!groupRef.current) return;

    const cameraZ = camera.position.z;
    const sceneZ = 4750;
    const distance = Math.abs(cameraZ - sceneZ);

    groupRef.current.visible = distance <= 600;
  });

  return (
    <group ref={groupRef} position={[0, 0, 4750]}>
      {/* Main text */}
      <Text
        fontSize={70}
        color={COLORS.unveil.primary}
        anchorX="center"
        anchorY="middle"
        outlineWidth={1}
        outlineColor={COLORS.unveil.glow}
      >
        UNVEIL
      </Text>

      {/* Silver sparkles */}
      <ParticleSystem
        count={80}
        color="#ffffff"
        size={1.5}
        zStart={4500}
        zEnd={5000}
        spread={400}
        speed={0.1}
        opacity={0.4}
      />

      {/* Soft ambient light */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[0, 100, 50]} intensity={1} color="#ffffff" />
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
  const { camera } = useThree();

  useFrame((state) => {
    if (!groupRef.current) return;

    const cameraZ = camera.position.z;
    const sceneZ = 5750;
    const distance = Math.abs(cameraZ - sceneZ);

    if (distance > 600) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;

    // Neon flicker
    if (neonRef1.current && neonRef2.current) {
      const flicker1 = Math.random() > 0.02 ? 1 : 0.3;
      const flicker2 = Math.random() > 0.05 ? 1 : 0.5;
      (neonRef1.current.material as THREE.MeshBasicMaterial).opacity =
        0.8 * flicker1;
      (neonRef2.current.material as THREE.MeshBasicMaterial).opacity =
        0.8 * flicker2;
    }
  });

  return (
    <group ref={groupRef} position={[0, -500, 5750]}>
      {/* Concrete wall background */}
      <mesh position={[0, 0, -50]}>
        <planeGeometry args={[800, 600]} />
        <meshBasicMaterial color="#374151" />
      </mesh>

      {/* Main text - graffiti style */}
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

      {/* Neon signs */}
      <mesh ref={neonRef1} position={[-200, 100, 20]}>
        <boxGeometry args={[100, 20, 5]} />
        <meshBasicMaterial
          color={COLORS.pink}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh ref={neonRef2} position={[200, 80, 20]}>
        <boxGeometry args={[80, 15, 5]} />
        <meshBasicMaterial
          color={COLORS.cyan}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Graffiti elements */}
      <GraffitiElements />

      {/* Dust particles */}
      <ParticleSystem
        count={100}
        color="#9ca3af"
        size={1}
        zStart={5500}
        zEnd={6000}
        spread={400}
        speed={0.2}
        opacity={0.3}
      />

      {/* Neon lighting */}
      <pointLight
        position={[-200, 100, 50]}
        color={COLORS.pink}
        intensity={30}
      />
      <pointLight position={[200, 80, 50]} color={COLORS.cyan} intensity={25} />
    </group>
  );
}

function GraffitiElements() {
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

  return (
    <group>
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
// PARODY SCENE
// ============================================================================
function ParodyScene() {
  const groupRef = useRef<THREE.Group>(null);
  const textRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame((state) => {
    if (!groupRef.current) return;

    const cameraZ = camera.position.z;
    const sceneZ = 6750;
    const distance = Math.abs(cameraZ - sceneZ);

    if (distance > 600) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;

    // Bouncy text animation
    if (textRef.current) {
      const bounce = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
      const squash = 1 + Math.cos(state.clock.elapsedTime * 4) * 0.05;
      textRef.current.scale.set(bounce, squash, 1);
    }
  });

  return (
    <group ref={groupRef} position={[0, -500, 6750]}>
      {/* Background gradient */}
      <mesh position={[0, 0, -100]}>
        <planeGeometry args={[1000, 800]} />
        <meshBasicMaterial color={COLORS.parody.background} />
      </mesh>

      {/* Bouncy text */}
      <group ref={textRef}>
        <Text
          fontSize={80}
          color={COLORS.parody.primary}
          anchorX="center"
          anchorY="middle"
          outlineWidth={4}
          outlineColor="#000000"
        >
          PARODY
        </Text>
      </group>

      {/* Bouncing particles */}
      <BouncingParticles />

      {/* Bright cartoon lighting */}
      <ambientLight intensity={0.8} />
      <pointLight position={[0, 100, 100]} color={COLORS.pink} intensity={50} />
      <pointLight
        position={[100, -50, 50]}
        color={COLORS.parody.secondary}
        intensity={40}
      />
    </group>
  );
}

function BouncingParticles() {
  const particlesRef = useRef<THREE.Group>(null);

  const particles = useMemo(() => {
    const temp = [];
    const colors = [
      COLORS.pink,
      COLORS.parody.secondary,
      COLORS.cyan,
      COLORS.orange,
    ];

    for (let i = 0; i < 30; i++) {
      temp.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 400,
          (Math.random() - 0.5) * 300,
          (Math.random() - 0.5) * 100,
        ),
        velocity: new THREE.Vector3(0, -2 - Math.random() * 3, 0),
        scale: 10 + Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        bounceHeight: Math.random() * 100 + 50,
      });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (!particlesRef.current) return;

    particlesRef.current.children.forEach((child, i) => {
      const particle = particles[i];
      const bounce =
        Math.abs(Math.sin(state.clock.elapsedTime * 3 + i)) *
        particle.bounceHeight;
      child.position.y = particle.position.y + bounce;

      // Squash and stretch
      const squash = 1 + Math.cos(state.clock.elapsedTime * 3 + i) * 0.3;
      child.scale.set(1 / squash, squash, 1);
    });
  });

  return (
    <group ref={particlesRef}>
      {particles.map((particle, i) => (
        <mesh key={i} position={particle.position} scale={particle.scale}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color={particle.color} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================================
// FINALE SCENE
// ============================================================================
function FinaleScene() {
  const groupRef = useRef<THREE.Group>(null);
  const orbitingNamesRef = useRef<THREE.Group>(null);
  const logoRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const eventNames = useMemo(
    () => [
      { name: "EVENT X", color: COLORS.eventX.primary },
      { name: "BATTLE OF THE BANDS", color: COLORS.battle.primary },
      { name: "SPOTLIGHT", color: COLORS.spotlight.primary },
      { name: "MURAL", color: COLORS.mural.primary },
      { name: "UNVEIL", color: COLORS.unveil.primary },
      { name: "BEAT THE STREET", color: COLORS.beatTheStreet.glow },
      { name: "PARODY", color: COLORS.parody.primary },
    ],
    [],
  );

  useFrame((state) => {
    if (!groupRef.current) return;

    const cameraZ = camera.position.z;
    const sceneZ = 7250;
    const distance = Math.abs(cameraZ - sceneZ);

    if (cameraZ < 6900) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;

    // Calculate finale progress
    const finaleProgress = Math.min((cameraZ - 7000) / 500, 1);

    // Orbiting names
    if (orbitingNamesRef.current) {
      orbitingNamesRef.current.rotation.y = state.clock.elapsedTime * 0.5;

      // Convergence animation (Z: 7200-7400)
      if (cameraZ > 7200 && cameraZ < 7450) {
        const convergeProgress = (cameraZ - 7200) / 250;
        orbitingNamesRef.current.children.forEach((child) => {
          child.scale.setScalar(1 - convergeProgress * 0.9);
        });
      }
    }

    // Logo reveal
    if (logoRef.current) {
      const logoReveal =
        cameraZ > 7400 ? Math.min((cameraZ - 7400) / 100, 1) : 0;
      logoRef.current.scale.setScalar(logoReveal);
      logoRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 7250]}>
      {/* Orbiting event names */}
      <group ref={orbitingNamesRef}>
        {eventNames.map((event, i) => (
          <group
            key={i}
            position={[
              Math.cos((i / 7) * Math.PI * 2) * 300,
              Math.sin((i / 7) * Math.PI * 2) * 100,
              Math.sin((i / 7) * Math.PI * 2) * 300,
            ]}
          >
            <Text
              fontSize={20}
              color={event.color}
              anchorX="center"
              anchorY="middle"
            >
              {event.name}
            </Text>
          </group>
        ))}
      </group>

      {/* Central logo group */}
      <group ref={logoRef} position={[0, 0, 100]}>
        {/* SPECTRA text as placeholder for logo */}
        <Text
          fontSize={50}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={2}
          outlineColor={COLORS.purple}
        >
          SPECTRA
        </Text>

        <Text
          fontSize={30}
          color={COLORS.gold}
          anchorX="center"
          anchorY="middle"
          position={[0, -50, 0]}
        >
          2027
        </Text>

        <Text
          fontSize={15}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          position={[0, -90, 0]}
        >
          BE PART OF IT
        </Text>
      </group>

      {/* Finale particles - all colors */}
      <ParticleSystem
        count={200}
        color={COLORS.purple}
        size={2}
        zStart={7000}
        zEnd={7500}
        spread={600}
        speed={0.5}
        opacity={0.6}
      />

      {/* Ambient glow */}
      <pointLight position={[0, 0, 100]} color="#ffffff" intensity={100} />
      <pointLight
        position={[100, 100, 0]}
        color={COLORS.purple}
        intensity={50}
      />
      <pointLight
        position={[-100, -100, 0]}
        color={COLORS.pink}
        intensity={50}
      />
    </group>
  );
}

// ============================================================================
// BACKGROUND GRADIENT
// ============================================================================
function BackgroundGradient() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!meshRef.current) return;

    const cameraZ = camera.position.z;
    meshRef.current.position.z = cameraZ - 500;

    // Update color based on section
    const material = meshRef.current.material as THREE.MeshBasicMaterial;

    if (cameraZ < 1000) {
      material.color.set(COLORS.eventX.background);
    } else if (cameraZ < 2000) {
      material.color.set(COLORS.battle.background);
    } else if (cameraZ < 3000) {
      material.color.lerp(new THREE.Color(COLORS.spotlight.background), 0.02);
    } else if (cameraZ < 4000) {
      material.color.lerp(new THREE.Color(COLORS.mural.background), 0.02);
    } else if (cameraZ < 5000) {
      material.color.lerp(new THREE.Color(COLORS.unveil.background), 0.02);
    } else if (cameraZ < 6000) {
      material.color.lerp(
        new THREE.Color(COLORS.beatTheStreet.background),
        0.02,
      );
    } else if (cameraZ < 7000) {
      material.color.lerp(new THREE.Color(COLORS.parody.background), 0.02);
    } else {
      material.color.lerp(new THREE.Color("#000000"), 0.02);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -500]}>
      <planeGeometry args={[3000, 2000]} />
      <meshBasicMaterial color={COLORS.eventX.background} />
    </mesh>
  );
}

// ============================================================================
// POST PROCESSING EFFECTS
// ============================================================================
function PostProcessing() {
  const chromaticOffset = useMemo(() => new THREE.Vector2(0.002, 0.002), []);

  return (
    <EffectComposer>
      <Bloom
        intensity={0.5}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
      />
      <ChromaticAberration
        offset={chromaticOffset}
        blendFunction={BlendFunction.NORMAL}
      />
      <Vignette darkness={0.5} offset={0.3} />
      <Noise opacity={0.02} blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  );
}

// ============================================================================
// MAIN SCENE COMPONENT
// ============================================================================
function SpectraScene() {
  return (
    <>
      {/* Global lighting */}
      <ambientLight intensity={0.2} />

      {/* Background */}
      <BackgroundGradient />
      <fog attach="fog" args={["#0a1628", 100, 1500]} />

      {/* Camera controller */}
      <CameraController />

      {/* Scenes and transitions */}
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
      <FinaleScene />

      {/* Post-processing */}
      <PostProcessing />
    </>
  );
}

// ============================================================================
// SCROLL INDICATOR UI
// ============================================================================
function ScrollIndicator() {
  const [progress, setProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState("portal");

  useEffect(() => {
    const handleScroll = () => {
      setProgress(scrollState.progress);
      setCurrentSection(scrollState.currentSection);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const sectionLabels: { [key: string]: string } = {
    portal: "ENTER",
    eventX: "EVENT X",
    vortex: "TRANSITION",
    battle: "BATTLE OF THE BANDS",
    curtain: "TRANSITION",
    spotlight: "SPOTLIGHT",
    paintTunnel: "TRANSITION",
    mural: "MURAL",
    dollyZoom: "TRANSITION",
    unveil: "UNVEIL",
    falling: "TRANSITION",
    beatTheStreet: "BEAT THE STREET",
    glitch: "TRANSITION",
    parody: "PARODY",
    finale: "SPECTRA 2027",
  };

  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-4">
      {/* Progress bar */}
      <div className="w-1 h-48 bg-white/10 rounded-full overflow-hidden">
        <div
          className="w-full bg-gradient-to-b from-teal-500 via-purple-500 to-pink-500 rounded-full transition-all duration-100"
          style={{ height: `${progress * 100}%` }}
        />
      </div>

      {/* Current section label */}
      <div className="text-white/60 text-xs font-mono tracking-wider rotate-90 origin-right whitespace-nowrap">
        {sectionLabels[currentSection] || ""}
      </div>
    </div>
  );
}

// ============================================================================
// SCROLL HINT
// ============================================================================
function ScrollHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 animate-bounce">
      <span className="text-white/60 text-sm font-mono">SCROLL TO BEGIN</span>
      <svg
        className="w-6 h-6 text-white/40"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        />
      </svg>
    </div>
  );
}

// ============================================================================
// MAIN EXPORT COMPONENT
// ============================================================================
export function CinematicScrollExperience() {
  const lenisRef = useRef<Lenis | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Set document height for scroll
    document.body.style.height = "500vh";
    document.body.style.overflowX = "hidden";

    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.8,
      touchMultiplier: 1.5,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      document.body.style.height = "";
      document.body.style.overflowX = "";
    };
  }, []);

  if (!mounted) {
    return (
      <div className="fixed inset-0 w-full h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <span className="text-white/60 text-sm font-mono">
            Initializing...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-screen bg-black">
      <Canvas
        camera={{ position: [0, 0, 0], fov: 50, near: 0.1, far: 10000 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={<Loader />}>
          <SpectraScene />
        </Suspense>
      </Canvas>

      {/* UI Overlays */}
      <ScrollIndicator />
      <ScrollHint />

      {/* Cinematic bars */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-black z-40 pointer-events-none" />
      <div className="fixed bottom-0 left-0 right-0 h-12 bg-black z-40 pointer-events-none" />
    </div>
  );
}

export default CinematicScrollExperience;
