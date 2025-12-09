'use client';

import { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from './GameContext';
import { Image, Text, Html } from '@react-three/drei';

const TopStar = () => {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const points = 5;
    const outerRadius = 0.4;
    const innerRadius = 0.2;
    
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const a = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2; 
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
    return s;
  }, []);

  return (
    <group position={[0, 4.2, 0]}>
      <mesh>
        <extrudeGeometry args={[shape, { depth: 0.1, bevelEnabled: false }]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={2} toneMapped={false} />
      </mesh>
    </group>
  );
};

const PARTICLE_COUNT = 1500;
const CONE_HEIGHT = 8;
const CONE_RADIUS = 3.5;

export default function ChristmasTree({ photos }: { photos: string[] }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const lightMeshRef = useRef<THREE.InstancedMesh>(null);
  const { handRef, gameState } = useGame();
  const { camera } = useThree();
  const rotationVelocity = useRef(0);
  
  // Generate initial data
  const particles = useMemo(() => {
    const palette = [
      new THREE.Color('#004225'), // British Racing Green
      new THREE.Color('#1A5D1A'), // Forest Green
      new THREE.Color('#C0C0C0'), // Silver
      new THREE.Color('#8B0000'), // Dark Red
    ];

    const bodyP = [], bodyCPos = [], bodySPos = [], bodyCols = [];
    const lightP = [], lightCPos = [], lightSPos = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Cone Position
      const y = Math.random() * CONE_HEIGHT - CONE_HEIGHT / 2;
      const normalizedY = (y + CONE_HEIGHT / 2) / CONE_HEIGHT; // 0 to 1
      
      // Non-linear radius for better tree shape (curved cone)
      const radius = Math.pow(1 - normalizedY, 1.2) * CONE_RADIUS;
      
      // Golden Angle distribution for organic look
      const theta = i * 2.39996; 
      
      // Add some spiral randomness and thickness
      const r = radius + (Math.random() - 0.5) * 0.5;
      
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);

      // Determine if this is a light (Gold) or body particle
      // 15% chance to be a light
      const isLight = Math.random() < 0.15; 

      if (isLight) {
        lightCPos.push(x, y, z);
        // Scatter widely to form a starry sky
        lightSPos.push(
            (Math.random() - 0.5) * 80, 
            (Math.random() - 0.5) * 60, 
            (Math.random() - 0.5) * 40
        );
        lightP.push({
          scale: Math.random() * 0.03 + 0.01, // Smaller, star-like
          speed: Math.random() * 0.02 + 0.01
        });
      } else {
        // Scatter Position (Explosion effect) for body
        const sx = (Math.random() - 0.5) * 20;
        const sy = (Math.random() - 0.5) * 15;
        const sz = (Math.random() - 0.5) * 10;

        bodyCPos.push(x, y, z);
        bodySPos.push(sx, sy, sz);
        
        const color = palette[Math.floor(Math.random() * palette.length)];
        bodyCols.push(color.r, color.g, color.b);
        
        bodyP.push({
          scale: Math.random() * 0.08 + 0.02,
          speed: Math.random() * 0.02 + 0.01
        });
      }
    }
    
    return { 
      body: { particles: bodyP, conePositions: bodyCPos, scatterPositions: bodySPos, colors: new Float32Array(bodyCols) },
      lights: { particles: lightP, conePositions: lightCPos, scatterPositions: lightSPos }
    };
  }, []);

  // Current positions arrays
  const currentBodyPos = useRef(new Float32Array(particles.body.conePositions));
  const currentLightPos = useRef(new Float32Array(particles.lights.conePositions));
  
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    const mode = gameState.current;
    
    // Rotation logic with Inertia
    if (groupRef.current) {
        let targetVelocity = 0;
        
        if (mode === 'SCATTER') {
            if (handRef.current.isTracking) {
                // Hand controls velocity
                targetVelocity = handRef.current.rotation;
                // Quick response to hand
                rotationVelocity.current += (targetVelocity - rotationVelocity.current) * delta * 10;
            } else {
                // Decay when not tracking (Inertia)
                rotationVelocity.current *= 0.98; 
            }
        } else if (mode === 'CONE') {
             // Auto rotate
             targetVelocity = 0.1;
             rotationVelocity.current += (targetVelocity - rotationVelocity.current) * delta * 2;
        } else if (mode === 'FOCUS') {
             // Stop rotation in focus mode
             targetVelocity = 0;
             rotationVelocity.current += (targetVelocity - rotationVelocity.current) * delta * 5;
        }
        
        groupRef.current.rotation.y += rotationVelocity.current * delta;
    }

    const lerpFactor = delta * 2;
    const time = state.clock.getElapsedTime();

    // Update Body Particles
    if (meshRef.current) {
        const targetPos = mode === 'CONE' ? particles.body.conePositions : particles.body.scatterPositions;
        const count = particles.body.particles.length;
        
        for (let i = 0; i < count; i++) {
            const ix = i * 3;
            currentBodyPos.current[ix] += (targetPos[ix] - currentBodyPos.current[ix]) * lerpFactor;
            currentBodyPos.current[ix+1] += (targetPos[ix+1] - currentBodyPos.current[ix+1]) * lerpFactor;
            currentBodyPos.current[ix+2] += (targetPos[ix+2] - currentBodyPos.current[ix+2]) * lerpFactor;

            const p = particles.body.particles[i];
            const noiseX = Math.sin(time * p.speed + i) * 0.02;
            const noiseY = Math.cos(time * p.speed + i) * 0.02;

            dummy.position.set(
                currentBodyPos.current[ix] + noiseX,
                currentBodyPos.current[ix+1] + noiseY,
                currentBodyPos.current[ix+2]
            );
            dummy.scale.setScalar(p.scale);
            dummy.rotation.set(time, time, time);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update Light Particles
    if (lightMeshRef.current) {
        const targetPos = mode === 'CONE' ? particles.lights.conePositions : particles.lights.scatterPositions;
        const count = particles.lights.particles.length;

        for (let i = 0; i < count; i++) {
            const ix = i * 3;
            currentLightPos.current[ix] += (targetPos[ix] - currentLightPos.current[ix]) * lerpFactor;
            currentLightPos.current[ix+1] += (targetPos[ix+1] - currentLightPos.current[ix+1]) * lerpFactor;
            currentLightPos.current[ix+2] += (targetPos[ix+2] - currentLightPos.current[ix+2]) * lerpFactor;

            const p = particles.lights.particles[i];
            // Lights twinkle
            const twinkle = Math.sin(time * 5 + i) * 0.2 + 1; 

            dummy.position.set(
                currentLightPos.current[ix],
                currentLightPos.current[ix+1],
                currentLightPos.current[ix+2]
            );
            dummy.scale.setScalar(p.scale * twinkle);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            lightMeshRef.current.setMatrixAt(i, dummy.matrix);
        }
        lightMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body Mesh */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, particles.body.particles.length]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          roughness={0.2} 
          metalness={0.6}
        />
        <instancedBufferAttribute attach="instanceColor" args={[particles.body.colors, 3]} />
      </instancedMesh>

      {/* Lights Mesh */}
      <instancedMesh ref={lightMeshRef} args={[undefined, undefined, particles.lights.particles.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial 
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={0.8}
          toneMapped={false}
        />
      </instancedMesh>

      <TopStar />
      
      {/* Photos */}
      <Suspense fallback={null}>
        <PhotoCloud photos={photos} conePositions={particles.body.conePositions} scatterPositions={particles.body.scatterPositions} />
      </Suspense>
    </group>
  );
}

function PhotoCloud({ photos, conePositions, scatterPositions }: { photos: string[], conePositions: number[], scatterPositions: number[] }) {
  const { gameState, handRef, focusedPhotoId } = useGame();
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const prevMode = useRef(gameState.current);
  
  // Assign each photo to a "slot" in the particle system
  const photoPositions = useMemo(() => {
    return photos.map((_, i) => {
      // Pick a random spot in the cone
      const y = Math.random() * CONE_HEIGHT - CONE_HEIGHT / 2;
      const r = (1 - (y + CONE_HEIGHT / 2) / CONE_HEIGHT) * (CONE_RADIUS + 0.5); // Slightly outside
      const theta = (i / photos.length) * Math.PI * 2 * 3; // Wrap around 3 times
      
      return {
        cone: new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta)),
        scatter: new THREE.Vector3((Math.random()-0.5)*12, (Math.random()-0.5)*8, (Math.random()-0.5)*5)
      };
    });
  }, [photos]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const mode = gameState.current;
    
    // Rotation logic removed (handled by parent)

    // Focus Selection Logic
    if (mode === 'FOCUS' && prevMode.current !== 'FOCUS') {
        // Find closest photo to camera to focus on
        let closestDist = Infinity;
        let closestIndex = -1;
        
        photoPositions.forEach((pos, i) => {
            // Calculate world position of the scatter point
            const vec = pos.scatter.clone();
            // Use world matrix to get actual position including parent rotation
            vec.applyMatrix4(groupRef.current!.matrixWorld);
            
            const dist = vec.distanceTo(camera.position);
            if (dist < closestDist) {
                closestDist = dist;
                closestIndex = i;
            }
        });
        
        if (closestIndex !== -1) {
            focusedPhotoId.current = closestIndex.toString();
        }
    } else if (mode !== 'FOCUS') {
        focusedPhotoId.current = null;
    }
    
    prevMode.current = mode;
  });

  return (
    <group ref={groupRef}>
      {photos.map((url, i) => (
        <PhotoItem 
          key={i} 
          url={url} 
          targetPos={photoPositions[i]} 
          index={i}
        />
      ))}
    </group>
  );
}

function PhotoItem({ url, targetPos, index }: { url: string, targetPos: { cone: THREE.Vector3, scatter: THREE.Vector3 }, index: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const { gameState, focusedPhotoId } = useGame();
  const [hovered, setHover] = useState(false);
  
  useFrame((state, delta) => {
    if (!ref.current) return;
    
    const mode = gameState.current;
    let target = mode === 'CONE' ? targetPos.cone : targetPos.scatter;
    
    // Visibility & Scale Logic
    let targetScale = 0; // Hidden in CONE mode
    
    if (mode !== 'CONE') {
      targetScale = 1.5;
      
      // Focus Logic
      if (mode === 'FOCUS' && focusedPhotoId.current === index.toString()) {
        targetScale = 5; // Big zoom
        
        // Move to front of camera
        // Target world position: Camera position + forward vector * distance
        // Camera is at [0, 0, 14], looking at [0, 0, 0]. So forward is -Z.
        // We want it at roughly [0, 0, 10] (4 units in front of camera)
        const worldTarget = new THREE.Vector3(0, 0, 10);
        
        // Convert to local space of the parent group
        if (ref.current.parent) {
            // Ensure parent matrix is up to date to avoid lag
            ref.current.parent.updateWorldMatrix(true, false);
            target = ref.current.parent.worldToLocal(worldTarget.clone());
        }
      } else if (hovered) {
        targetScale = 2.5;
      }
    }

    // Interpolate position
    // If focused, snap faster to avoid lag
    const isFocused = mode === 'FOCUS' && focusedPhotoId.current === index.toString();
    ref.current.position.lerp(target, isFocused ? delta * 10 : delta * 3);
    
    // Look at camera
    ref.current.lookAt(state.camera.position);
    
    // Scale
    ref.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, 1), delta * 3);
  });

  return (
    <Image 
      ref={ref}
      url={url}
      transparent
      scale={[1.5, 1.5]}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    />
  );
}
