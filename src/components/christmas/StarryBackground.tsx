'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

function RotatingStars() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y -= delta * 0.02; // Slow rotation
      ref.current.rotation.x += delta * 0.01;
    }
  });
  return (
    <group ref={ref}>
      <Stars radius={50} depth={50} count={7000} factor={4} saturation={1} fade speed={1} />
    </group>
  );
}

export default function StarryBackground() {
  return (
    <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1e1b4b] via-[#0f172a] to-[#020617]">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <RotatingStars />
        {/* Gold Dust - Christmas Vibe */}
        <Sparkles count={150} scale={12} size={4} speed={0.4} opacity={0.6} color="#FCD34D" />
        {/* Magical Blue Dust */}
        <Sparkles count={100} scale={15} size={2} speed={0.2} opacity={0.4} color="#67E8F9" />
      </Canvas>
    </div>
  );
}
