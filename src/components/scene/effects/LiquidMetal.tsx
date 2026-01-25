"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface LiquidMetalParticlesProps {
  count?: number;
  progress: number;
}

export function LiquidMetalParticles({ count = 500, progress }: LiquidMetalParticlesProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, velocities, scales } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15 + 10;
      positions[i * 3 + 2] = 60 - Math.random() * 200;

      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      scales[i] = 0.5 + Math.random() * 1.5;
    }

    return { positions, velocities, scales };
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("scale", new THREE.BufferAttribute(scales, 1));
    return geo;
  }, [positions, scales]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uColor1: { value: new THREE.Color("#7C3AED") },
      uColor2: { value: new THREE.Color("#22D3EE") },
    }),
    []
  );

  useFrame((state) => {
    if (particlesRef.current && materialRef.current) {
      const time = state.clock.elapsedTime;
      materialRef.current.uniforms.uTime.value = time;
      materialRef.current.uniforms.uProgress.value = progress;

      const posAttr = particlesRef.current.geometry.attributes.position;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        (posAttr.array as Float32Array)[i3] += Math.sin(time * 0.5 + i) * velocities[i3];
        (posAttr.array as Float32Array)[i3 + 1] += Math.cos(time * 0.3 + i) * velocities[i3 + 1];
        (posAttr.array as Float32Array)[i3 + 2] += velocities[i3 + 2];

        const clusterForce = Math.sin(progress * Math.PI * 8 + i * 0.1) * 0.01;
        (posAttr.array as Float32Array)[i3] += clusterForce;
      }

      posAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={`
          attribute float scale;
          uniform float uTime;
          uniform float uProgress;
          varying float vAlpha;
          varying vec3 vColor;
          uniform vec3 uColor1;
          uniform vec3 uColor2;

          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

            float pulse = sin(uTime * 2.0 + position.z * 0.1) * 0.5 + 0.5;
            gl_PointSize = scale * (200.0 / -mvPosition.z) * (0.5 + pulse * 0.5);

            float colorMix = sin(position.z * 0.05 + uTime * 0.5) * 0.5 + 0.5;
            vColor = mix(uColor1, uColor2, colorMix);

            vAlpha = smoothstep(50.0, 10.0, abs(mvPosition.z)) * 0.6;

            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying float vAlpha;
          varying vec3 vColor;

          void main() {
            vec2 center = gl_PointCoord - 0.5;
            float dist = length(center);

            if (dist > 0.5) discard;

            float highlight = pow(1.0 - dist * 2.0, 2.0);
            vec3 finalColor = vColor + highlight * 0.5;

            float alpha = vAlpha * smoothstep(0.5, 0.0, dist);

            gl_FragColor = vec4(finalColor, alpha);
          }
        `}
      />
    </points>
  );
}

export function LiquidMetalRipple({ active, position }: { active: boolean; position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uActive.value = active ? 1.0 : 0.0;
    }
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uActive: { value: 0 },
    }),
    []
  );

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[20, 20, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        side={THREE.DoubleSide}
        uniforms={uniforms}
        vertexShader={`
          uniform float uTime;
          uniform float uActive;
          varying vec2 vUv;
          varying float vElevation;

          void main() {
            vUv = uv;

            vec3 pos = position;

            float dist = length(uv - 0.5);
            float ripple = sin(dist * 20.0 - uTime * 3.0) * uActive * 0.3;
            ripple *= smoothstep(1.0, 0.0, dist * 2.0);

            pos.z += ripple;
            vElevation = ripple;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform float uActive;
          varying vec2 vUv;
          varying float vElevation;

          void main() {
            vec3 color = vec3(0.486, 0.227, 0.929);

            float highlight = abs(vElevation) * 3.0;
            color += highlight * vec3(0.5, 0.5, 0.6);

            float dist = length(vUv - 0.5);
            float rim = smoothstep(0.5, 0.3, dist);

            float alpha = uActive * rim * 0.5 * (0.3 + highlight);

            gl_FragColor = vec4(color, alpha);
          }
        `}
      />
    </mesh>
  );
}

export function ChromeShardsEight({ progress, position }: { progress: number; position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  const shards = useMemo(() => {
    const shardData: {
      startPos: THREE.Vector3;
      endPos: THREE.Vector3;
      startRot: THREE.Euler;
      endRot: THREE.Euler;
      scale: number;
    }[] = [];

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 1.5;
      shardData.push({
        startPos: new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 10
        ),
        endPos: new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius + 2,
          0
        ),
        startRot: new THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        ),
        endRot: new THREE.Euler(0, 0, angle),
        scale: 0.15 + Math.random() * 0.1,
      });
    }

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 1.5;
      shardData.push({
        startPos: new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 10
        ),
        endPos: new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius - 1.5,
          0
        ),
        startRot: new THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        ),
        endRot: new THREE.Euler(0, 0, angle),
        scale: 0.15 + Math.random() * 0.1,
      });
    }

    return shardData;
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const shard = shards[i];

        mesh.position.lerpVectors(shard.startPos, shard.endPos, progress);

        mesh.rotation.x = THREE.MathUtils.lerp(shard.startRot.x, shard.endRot.x, progress);
        mesh.rotation.y = THREE.MathUtils.lerp(shard.startRot.y, shard.endRot.y, progress);
        mesh.rotation.z = THREE.MathUtils.lerp(shard.startRot.z, shard.endRot.z, progress);
      });
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {shards.map((shard, i) => (
        <mesh key={i} scale={shard.scale}>
          <tetrahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color="#e0e0e0"
            metalness={0.98}
            roughness={0.05}
            envMapIntensity={3}
          />
        </mesh>
      ))}
    </group>
  );
}

export function MetallicDust({ count = 200 }: { count?: number }) {
  const particlesRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 25;
      positions[i * 3 + 2] = 60 - Math.random() * 200;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count]);

  useFrame((state) => {
    if (particlesRef.current) {
      const time = state.clock.elapsedTime;
      const posAttr = particlesRef.current.geometry.attributes.position;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        (posAttr.array as Float32Array)[i3 + 1] += Math.sin(time + i) * 0.003;
        (posAttr.array as Float32Array)[i3] += Math.cos(time * 0.5 + i) * 0.002;
      }
      posAttr.needsUpdate = true;

      particlesRef.current.rotation.y = time * 0.02;
    }
  });

  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial
        size={0.08}
        color="#c0c0c0"
        transparent
        opacity={0.3}
        sizeAttenuation
      />
    </points>
  );
}
