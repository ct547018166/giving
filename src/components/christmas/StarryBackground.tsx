'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

const PLANETS = [
  { name: 'Mercury', size: 0.4, distance: 4, speed: 1.5, color: '#A5A5A5' },
  { name: 'Venus', size: 0.6, distance: 6, speed: 1.2, color: '#E3BB76' },
  { name: 'Earth', size: 0.65, distance: 8, speed: 1.0, color: '#4B9CD3' },
  { name: 'Mars', size: 0.5, distance: 10, speed: 0.8, color: '#E27B58' },
  { name: 'Jupiter', size: 1.4, distance: 14, speed: 0.5, color: '#C88B3A' },
  { name: 'Saturn', size: 1.2, distance: 18, speed: 0.4, color: '#C5AB6E', ring: true },
  { name: 'Uranus', size: 0.9, distance: 22, speed: 0.3, color: '#93B8BE' },
  { name: 'Neptune', size: 0.9, distance: 25, speed: 0.2, color: '#6081FF' },
];

function Planet({ size, distance, speed, color, ring }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * speed * 0.2;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });
  
  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} position={[distance, 0, 0]}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial 
            color={color} 
            roughness={0.7}
            metalness={0.2}
        />
        {ring && (
            <mesh rotation={[Math.PI / 2.2, 0, 0]}>
                <ringGeometry args={[size * 1.4, size * 2.2, 32]} />
                <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.5} />
            </mesh>
        )}
      </mesh>
      {/* Orbit Line */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[distance - 0.05, distance + 0.05, 128]} />
        <meshBasicMaterial color="#ffffff" opacity={0.08} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function SolarSystem() {
  return (
    <group position={[0, -4, -35]} rotation={[0.3, 0, 0]}>
       {/* Sun Light - Strong point light to illuminate planets */}
       <pointLight intensity={3} distance={100} decay={0} color="#FDB813" />
       
       {/* Sun */}
       <mesh>
         <sphereGeometry args={[2.5, 32, 32]} />
         <meshBasicMaterial color="#FDB813" />
       </mesh>
       {/* Sun Glow */}
       <mesh scale={[1.2, 1.2, 1.2]}>
         <sphereGeometry args={[2.5, 32, 32]} />
         <meshBasicMaterial color="#FDB813" transparent opacity={0.2} />
       </mesh>
       
       {PLANETS.map((planet, i) => (
          <Planet key={i} {...planet} />
       ))}
    </group>
  );
}

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
        <ambientLight intensity={0.3} />
        <RotatingStars />
        <SolarSystem />
        {/* Gold Dust - Christmas Vibe */}
        <Sparkles count={150} scale={12} size={4} speed={0.4} opacity={0.6} color="#FCD34D" />
        {/* Magical Blue Dust */}
        <Sparkles count={100} scale={15} size={2} speed={0.2} opacity={0.4} color="#67E8F9" />
      </Canvas>
    </div>
  );
}
