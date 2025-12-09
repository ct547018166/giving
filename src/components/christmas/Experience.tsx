'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stars, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import ChristmasTree from './ChristmasTree';
import { Suspense } from 'react';

export default function Experience({ photos }: { photos: string[] }) {
  return (
    <div className="w-full h-screen bg-black relative z-0">
      <div className="absolute top-8 right-8 z-10 pointer-events-none">
         <div style={{ 
          color: '#FFD700', 
          fontFamily: 'Arial, sans-serif', 
          fontSize: '24px', 
          fontWeight: 'bold',
          textShadow: '0 0 10px #FFD700, 0 0 20px #FFD700',
        }}>
            
        </div>
      </div>
      <Canvas camera={{ position: [0, 0, 14], fov: 45 }}>
        <color attach="background" args={['#0a1a0a']} />
        
        <ambientLight intensity={3.0} />
        <hemisphereLight intensity={2} groundColor="#222222" />
        <pointLight position={[10, 10, 10]} intensity={5} />
        <pointLight position={[-10, 10, -10]} intensity={5} />
        <directionalLight position={[0, 10, 5]} intensity={4} color="#fff" />
        <spotLight position={[0, 10, 0]} angle={0.5} penumbra={1} intensity={4} castShadow />

        <Suspense fallback={null}>
          {/* <Environment preset="night" /> */}
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          {/* Background Sparkles */}
          <Sparkles count={200} scale={20} size={2} speed={0.4} opacity={0.5} color="#FFD700" />
          {/* Tree Sparkles (Fairy Lights) */}
          <Sparkles count={100} scale={10} size={3} speed={0.3} opacity={0.8} color="#FFD700" />
          
          <ChristmasTree photos={photos} />
        </Suspense>
          
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={2.0} />
        </EffectComposer>
        
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}
