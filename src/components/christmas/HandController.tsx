'use client';

import { useEffect, useRef, useState } from 'react';
// import { Hands, Results } from '@mediapipe/hands'; // Removed due to build error
// import { Camera } from '@mediapipe/camera_utils'; // Removed due to build error
// import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils'; // Removed due to build error
import { useGame } from './GameContext';

// Manually define HAND_CONNECTIONS to avoid build error
const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]
];

export default function HandController() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const { handRef, gameState } = useGame();
  const [status, setStatus] = useState('Initializing...');
  
  // Debounce ref for pinch gesture
  const lastPinchTime = useRef<number>(0);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    let hands: any = null;
    let camera: any = null;

    const loadMediaPipe = async () => {
      try {
        const handsModule = await import('@mediapipe/hands');
        const drawingUtils = await import('@mediapipe/drawing_utils');
        
        const Hands = handsModule.Hands;
        const drawConnectors = drawingUtils.drawConnectors;
        const drawLandmarks = drawingUtils.drawLandmarks;

        hands = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          },
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        hands.onResults((results: any) => {
            if (!canvasRef.current || !videoRef.current) return;
        
            const canvasCtx = canvasRef.current.getContext('2d');
            if (!canvasCtx) return;
        
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
        
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
              const landmarks = results.multiHandLandmarks[0];
              
              // Draw landmarks
              drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
              drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1 });
        
              // Analyze Gesture
              const gesture = detectGesture(landmarks);
              
              // Update Game State
              handRef.current.isTracking = true;
              handRef.current.gesture = gesture;
              
              // Normalize position (-1 to 1)
              // MediaPipe x is 0 (left) to 1 (right). We want -1 (left) to 1 (right)
              // But wait, camera is mirrored usually? Let's assume standard webcam.
              // x: 0 -> 1. 
              handRef.current.position = {
                x: (landmarks[9].x - 0.5) * 2, // Middle finger mcp as center
                y: -(landmarks[9].y - 0.5) * 2, // Invert Y
                z: 0
              };
        
              // Rotation control (based on x position for now)
              handRef.current.rotation = -(landmarks[9].x - 0.5) * 4; // -2 to 2 range roughly
        
              // State Machine Logic
              const now = Date.now();

              if (gesture === 'FIST') {
                gameState.current = 'CONE';
              } else if (gesture === 'PINCH') {
                lastPinchTime.current = now;
                if (gameState.current === 'SCATTER' || gameState.current === 'FOCUS') {
                  gameState.current = 'FOCUS';
                }
              } else {
                // OPEN or NONE - Exit focus if active
                if (gameState.current === 'FOCUS') {
                  // Add 500ms debounce to prevent flickering
                  if (now - lastPinchTime.current > 500) {
                    gameState.current = 'SCATTER';
                  }
                }
                
                if (gesture === 'OPEN' && gameState.current === 'CONE') {
                  gameState.current = 'SCATTER';
                }
              }
        
            } else {
              handRef.current.isTracking = false;
              // Also exit focus if hand is lost
              if (gameState.current === 'FOCUS') {
                gameState.current = 'SCATTER';
              }
            }
            canvasCtx.restore();
        });

        // Custom Camera Implementation
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
                });
                
                if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setStatus('Camera Active');
                
                // Start processing frames
                const processFrame = async () => {
                    if (videoRef.current && videoRef.current.readyState === 4) {
                    await hands.send({ image: videoRef.current });
                    }
                    requestRef.current = requestAnimationFrame(processFrame);
                };
                requestRef.current = requestAnimationFrame(processFrame);
                }
            } catch (err: any) {
                setStatus(`Error: ${err.message}`);
            }
        };

        startCamera();

      } catch (error) {
        console.error('Error loading MediaPipe:', error);
        setStatus('Error loading MediaPipe');
      }
    };

    loadMediaPipe();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (hands) hands.close();
    };
  }, []);

  // Moved detectGesture inside or keep it outside? 
  // It's a pure function, can stay outside or be defined here.
  // Let's keep it outside but remove the 'export' if it was exported, or just keep it as helper.
  // But wait, I need to remove the onResults function from the component body since I moved it inside useEffect.

  const detectGesture = (landmarks: any[]): 'FIST' | 'OPEN' | 'PINCH' | 'NONE' => {
    // Simple heuristic based on finger tip vs pip (proximal interphalangeal joint)
    
    const isFingerOpen = (tipIdx: number, pipIdx: number) => {
      // For thumb, we check x distance or simple distance logic, but for others Y is good enough if hand is upright
      // Let's use distance from wrist (0)
      const wrist = landmarks[0];
      const tip = landmarks[tipIdx];
      const pip = landmarks[pipIdx];
      
      const distTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
      const distPip = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);
      
      return distTip > distPip;
    };

    const thumbOpen = isFingerOpen(4, 2);
    const indexOpen = isFingerOpen(8, 6);
    const middleOpen = isFingerOpen(12, 10);
    const ringOpen = isFingerOpen(16, 14);
    const pinkyOpen = isFingerOpen(20, 18);

    const openFingersCount = [thumbOpen, indexOpen, middleOpen, ringOpen, pinkyOpen].filter(Boolean).length;

    // Pinch detection: Thumb tip and Index tip are close
    const pinchDist = Math.hypot(landmarks[4].x - landmarks[8].x, landmarks[4].y - landmarks[8].y);
    // Increased threshold to make it easier (0.05 -> 0.08)
    const isPinch = pinchDist < 0.08;

    // Prioritize Pinch. 
    // We require index finger to be "open" (extended from palm) to distinguish from a tight fist.
    // This allows "OK" sign (Pinch with other fingers open) to work.
    if (isPinch && indexOpen) return 'PINCH';

    if (openFingersCount <= 1) return 'FIST';
    if (openFingersCount >= 4) return 'OPEN';

    return 'NONE';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
      <div className="bg-black/50 text-white p-2 rounded mb-2 text-xs backdrop-blur-sm">
        Status: {status}
      </div>
      <div className="relative w-48 h-36 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg bg-black">
        <video ref={videoRef} className="absolute top-0 left-0 w-full h-full object-cover opacity-50" playsInline />
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full object-cover" width={640} height={480} />
      </div>
    </div>
  );
}
