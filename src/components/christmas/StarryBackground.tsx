'use client';

import { Canvas } from '@react-three/fiber';
import { Stars, Sparkles } from '@react-three/drei';

export default function StarryBackground() {
  return (
    <div className="w-full h-full bg-black">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <color attach="background" args={['#051005']} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Sparkles count={200} scale={20} size={2} speed={0.4} opacity={0.5} color="#FFD700" />
      </Canvas>
    </div>
  );
}
