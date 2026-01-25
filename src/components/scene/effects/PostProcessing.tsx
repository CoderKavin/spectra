"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  Noise,
} from "@react-three/postprocessing";
import { BlendFunction, KernelSize } from "postprocessing";
import * as THREE from "three";

interface PostProcessingProps {
  quality: "low" | "medium" | "high";
  progress: number;
}

export function PostProcessing({ quality, progress }: PostProcessingProps) {
  const bloomIntensity = quality === "high" ? 1.5 : quality === "medium" ? 1 : 0.5;
  const noiseOpacity = 0.08;

  const dynamicBloom = useMemo(() => {
    const transitionPoints = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    let extraIntensity = 0;

    transitionPoints.forEach((point) => {
      const distance = Math.abs(progress - point);
      if (distance < 0.05) {
        extraIntensity = Math.max(extraIntensity, (0.05 - distance) * 10);
      }
    });

    return bloomIntensity + extraIntensity * 0.5;
  }, [progress, bloomIntensity]);

  if (quality === "low") {
    return (
      <EffectComposer>
        <Bloom
          intensity={bloomIntensity}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
          kernelSize={KernelSize.SMALL}
        />
        <Vignette
          offset={0.3}
          darkness={0.6}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    );
  }

  if (quality === "medium") {
    return (
      <EffectComposer>
        <Bloom
          intensity={dynamicBloom}
          luminanceThreshold={0.4}
          luminanceSmoothing={0.9}
          kernelSize={KernelSize.MEDIUM}
          mipmapBlur
        />
        <Vignette
          offset={0.25}
          darkness={0.7}
          blendFunction={BlendFunction.NORMAL}
        />
        <ChromaticAberration
          offset={new THREE.Vector2(0.001, 0.001)}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={false}
          modulationOffset={0}
        />
        <Noise
          opacity={noiseOpacity}
          blendFunction={BlendFunction.OVERLAY}
        />
      </EffectComposer>
    );
  }

  // High quality
  return (
    <EffectComposer>
      <Bloom
        intensity={dynamicBloom}
        luminanceThreshold={0.4}
        luminanceSmoothing={0.9}
        kernelSize={KernelSize.LARGE}
        mipmapBlur
      />
      <Vignette
        offset={0.25}
        darkness={0.7}
        blendFunction={BlendFunction.NORMAL}
      />
      <ChromaticAberration
        offset={new THREE.Vector2(0.002, 0.002)}
        blendFunction={BlendFunction.NORMAL}
        radialModulation={false}
        modulationOffset={0}
      />
      <Noise
        opacity={noiseOpacity}
        blendFunction={BlendFunction.OVERLAY}
      />
    </EffectComposer>
  );
}

export function FilmGrain({ intensity = 0.05 }: { intensity?: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: intensity },
    }),
    [intensity]
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return null;
}

export function MetallicShimmer({ progress }: { progress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
      material.uniforms.uProgress.value = progress;
    }
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
    }),
    []
  );

  return (
    <mesh ref={meshRef} position={[0, 0, -1]}>
      <planeGeometry args={[100, 100]} />
      <shaderMaterial
        transparent
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform float uProgress;
          varying vec2 vUv;

          void main() {
            float shimmer = sin((vUv.x + vUv.y) * 50.0 + uTime * 2.0) * 0.5 + 0.5;
            shimmer *= sin(uProgress * 3.14159) * 0.1;

            vec3 color = vec3(0.486, 0.227, 0.929);
            gl_FragColor = vec4(color, shimmer * 0.05);
          }
        `}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
