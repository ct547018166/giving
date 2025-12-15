'use client';

import { useEffect, useRef, useState } from 'react';
// import { Hands, Results } from '@mediapipe/hands'; // Removed due to build error
// import { Camera } from '@mediapipe/camera_utils'; // Removed due to build error
// import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils'; // Removed due to build error
import { useGame } from './GameContext';

type HandControllerProps = {
  onPhotoUploaded?: (url: string) => void;
};

type Landmark = {
  x: number;
  y: number;
  z?: number;
};

type MediaPipeResults = {
  image: CanvasImageSource;
  multiHandLandmarks?: Landmark[][];
};

type HandsLike = {
  setOptions: (options: unknown) => void;
  onResults: (callback: (results: MediaPipeResults) => void) => void;
  send: (input: { image: CanvasImageSource }) => Promise<void>;
  close: () => void;
};

// Manually define HAND_CONNECTIONS to avoid build error
const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]
];

export default function HandController({ onPhotoUploaded }: HandControllerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const { handRef, gameState } = useGame();
  const [status, setStatus] = useState('Initializing...');

  const onPhotoUploadedRef = useRef<HandControllerProps['onPhotoUploaded']>(onPhotoUploaded);
  useEffect(() => {
    onPhotoUploadedRef.current = onPhotoUploaded;
  }, [onPhotoUploaded]);

  // V-sign (✌️) photo capture state
  const vSignStartTime = useRef<number | null>(null);
  const capturedThisHold = useRef(false);
  const isCapturing = useRef(false);
  const countdownValueRef = useRef<3 | 2 | 1 | null>(null);
  const [countdownValue, setCountdownValue] = useState<3 | 2 | 1 | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addToTreeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Debounce ref for pinch gesture
  const lastPinchTime = useRef<number>(0);

  const updateCountdownValue = (next: 3 | 2 | 1 | null) => {
    if (countdownValueRef.current === next) return;
    countdownValueRef.current = next;
    setCountdownValue(next);
  };

  const showPreviewForOneSecond = (url: string) => {
    setPreviewUrl(url);
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    previewTimeoutRef.current = setTimeout(() => {
      setPreviewUrl(null);
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    }, 1000);
  };

  const captureAndUploadPhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (isCapturing.current) return;
    isCapturing.current = true;

    try {
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = width;
      captureCanvas.height = height;

      const ctx = captureCanvas.getContext('2d');
      if (!ctx) throw new Error('Failed to create capture canvas context');

      ctx.drawImage(video, 0, 0, width, height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        captureCanvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Failed to encode image'))),
          'image/jpeg',
          0.9
        );
      });

      // Show preview immediately (1s)
      const localPreview = URL.createObjectURL(blob);
      const captureStartedAt = Date.now();
      showPreviewForOneSecond(localPreview);

      // Upload in background
      const formData = new FormData();
      const filename = `gesture-${Date.now()}.jpg`;
      formData.append('file', new File([blob], filename, { type: 'image/jpeg' }));

      const res = await fetch('/api/christmas-photos', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.url && typeof data.url === 'string') {
          // Add to tree after the 1s preview completes (or immediately if upload took longer).
          const elapsed = Date.now() - captureStartedAt;
          const remainingMs = Math.max(0, 1000 - elapsed);

          if (addToTreeTimeoutRef.current) {
            clearTimeout(addToTreeTimeoutRef.current);
          }
          addToTreeTimeoutRef.current = setTimeout(() => {
            onPhotoUploadedRef.current?.(data.url);
          }, remainingMs);
        }
      } else {
        // Keep UI minimal: status only
        setStatus('Upload failed');
      }
    } catch (error) {
      console.error('Gesture capture failed:', error);
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Capture error: ${message}`);
    } finally {
      isCapturing.current = false;
    }
  };

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    let hands: HandsLike | null = null;

    const loadMediaPipe = async () => {
      try {
        const handsModule = await import('@mediapipe/hands');
        const drawingUtils = await import('@mediapipe/drawing_utils');
        
        const Hands = handsModule.Hands as unknown as new (args: { locateFile: (file: string) => string }) => HandsLike;
        const drawConnectors = drawingUtils.drawConnectors as unknown as (
          ctx: CanvasRenderingContext2D,
          landmarks: Landmark[],
          connections: [number, number][],
          style: { color: string; lineWidth: number }
        ) => void;
        const drawLandmarks = drawingUtils.drawLandmarks as unknown as (
          ctx: CanvasRenderingContext2D,
          landmarks: Landmark[],
          style: { color: string; lineWidth: number }
        ) => void;

        hands = new Hands({
          locateFile: (file) => {
            // Use unpkg as fallback if jsdelivr is slow/blocked
            return `https://unpkg.com/@mediapipe/hands@0.4.1675469240/${file}`;
          },
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        hands.onResults((results: MediaPipeResults) => {
            if (!canvasRef.current || !videoRef.current) return;
        
            const canvasCtx = canvasRef.current.getContext('2d');
            if (!canvasCtx) return;
        
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
        
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
              const landmarks = results.multiHandLandmarks[0];
              
              // Distance Check: Calculate hand size (Wrist to Middle Finger MCP)
              // If hand is too small (too far), ignore it
              const wrist = landmarks[0];
              const middleMcp = landmarks[9];
              const handSize = Math.hypot(wrist.x - middleMcp.x, wrist.y - middleMcp.y);
              
              if (handSize < 0.15) {
                 handRef.current.isTracking = false;
                 if (gameState.current === 'FOCUS') gameState.current = 'SCATTER';
                 canvasCtx.restore();
                 return;
              }

              // Draw landmarks
              drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
              drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1 });
        
              // Analyze Gesture
              const gesture = detectGesture(landmarks);
              
              // Update Game State
              handRef.current.isTracking = true;
              handRef.current.gesture = gesture;

              // V-SIGN photo capture timing
              if (gesture === 'V_SIGN') {
                const now = Date.now();
                if (vSignStartTime.current == null) {
                  vSignStartTime.current = now;
                  capturedThisHold.current = false;
                  updateCountdownValue(null);
                }

                const elapsed = now - vSignStartTime.current;
                // After 1s, show 3-2-1 within the remaining 2s
                if (elapsed >= 1000 && elapsed < 3000) {
                  const t = elapsed - 1000; // 0..2000
                  const phase = Math.min(2, Math.floor((t / 2000) * 3));
                  const value: 3 | 2 | 1 = (phase === 0 ? 3 : phase === 1 ? 2 : 1);
                  updateCountdownValue(value);
                } else {
                  updateCountdownValue(null);
                }

                if (elapsed >= 3000 && !capturedThisHold.current) {
                  capturedThisHold.current = true;
                  updateCountdownValue(null);
                  void captureAndUploadPhoto();
                }
              } else {
                vSignStartTime.current = null;
                capturedThisHold.current = false;
                updateCountdownValue(null);
              }
              
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
              // Also exit focus if hand is lost, but with debounce
              if (gameState.current === 'FOCUS') {
                 const now = Date.now();
                 if (now - lastPinchTime.current > 500) {
                    gameState.current = 'SCATTER';
                 }
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
                    const handsInstance = hands;
                    if (handsInstance && videoRef.current && videoRef.current.readyState === 4) {
                      await handsInstance.send({ image: videoRef.current });
                    }
                    requestRef.current = requestAnimationFrame(processFrame);
                };
                requestRef.current = requestAnimationFrame(processFrame);
                }
            } catch (err) {
              const message = err instanceof Error ? err.message : String(err);
              setStatus(`Error: ${message}`);
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

      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }

      if (addToTreeTimeoutRef.current) {
        clearTimeout(addToTreeTimeoutRef.current);
        addToTreeTimeoutRef.current = null;
      }
    };
  }, []);

  // Moved detectGesture inside or keep it outside? 
  // It's a pure function, can stay outside or be defined here.
  // Let's keep it outside but remove the 'export' if it was exported, or just keep it as helper.
  // But wait, I need to remove the onResults function from the component body since I moved it inside useEffect.

  const detectGesture = (landmarks: Landmark[]): 'FIST' | 'OPEN' | 'PINCH' | 'V_SIGN' | 'NONE' => {
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
    // Increased threshold to make it easier (0.08 -> 0.12)
    const isPinch = pinchDist < 0.12;

    // Prioritize Pinch. 
    // We require index finger to be "open" (extended from palm) to distinguish from a tight fist.
    // This allows "OK" sign (Pinch with other fingers open) to work.
    // Relaxed check: If pinch distance is very small, we assume pinch regardless of index state
    if (isPinch && (indexOpen || pinchDist < 0.05)) return 'PINCH';

    // V-sign detection: index + middle open, ring + pinky closed
    // Require index/middle tips to be separated so it doesn't mis-detect other 2-finger poses.
    const indexMiddleDist = Math.hypot(landmarks[8].x - landmarks[12].x, landmarks[8].y - landmarks[12].y);
    const isVSign = indexOpen && middleOpen && !ringOpen && !pinkyOpen && indexMiddleDist > 0.06;
    if (isVSign) return 'V_SIGN';

    if (openFingersCount <= 1) return 'FIST';
    if (openFingersCount >= 4) return 'OPEN';

    return 'NONE';
  };

  return (
    <>
      {/* Fullscreen overlays (countdown + preview) */}
      <div className="fixed inset-0 z-40 pointer-events-none">
        {countdownValue !== null && (
          <CountdownParticles value={countdownValue} />
        )}

        {previewUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-xl p-2">
              <img src={previewUrl} alt="Captured" className="max-h-[60vh] max-w-[80vw] rounded-lg" />
            </div>
          </div>
        )}
      </div>

      {/* Debug / camera view */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
        <div className="bg-black/50 text-white p-2 rounded mb-2 text-xs backdrop-blur-sm">
          Status: {status}
        </div>
        <div className="relative w-48 h-36 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg bg-black">
          <video ref={videoRef} className="absolute top-0 left-0 w-full h-full object-cover opacity-50" playsInline />
          <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full object-cover" width={640} height={480} />
        </div>
      </div>
    </>
  );
}

function CountdownParticles({ value }: { value: 3 | 2 | 1 }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const off = document.createElement('canvas');
    const offW = 420;
    const offH = 260;
    off.width = offW;
    off.height = offH;
    const offCtx = off.getContext('2d');
    if (!offCtx) return;
    offCtx.clearRect(0, 0, offW, offH);
    offCtx.fillStyle = '#ffffff';
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.font = '800 200px Arial';
    offCtx.fillText(String(value), offW / 2, offH / 2 + 10);

    const imageData = offCtx.getImageData(0, 0, offW, offH).data;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = Math.min(canvas.width / offW, canvas.height / offH) * 0.75;

    const particles: Array<{ x: number; y: number; vx: number; vy: number; life: number }> = [];
    const step = 6;
    for (let y = 0; y < offH; y += step) {
      for (let x = 0; x < offW; x += step) {
        const idx = (y * offW + x) * 4 + 3;
        const a = imageData[idx];
        if (a > 40) {
          const px = centerX + (x - offW / 2) * scale;
          const py = centerY + (y - offH / 2) * scale;
          particles.push({
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            life: Math.random() * 0.6 + 0.4,
          });
        }
      }
    }
    particlesRef.current = particles;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const start = performance.now();
    const animate = (t: number) => {
      const elapsed = (t - start) / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fade in/out quickly for a countdown feel
      const alpha = Math.max(0, Math.min(1, 1 - Math.abs(elapsed - 0.45) / 0.45));
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        const r = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return <canvas ref={canvasRef} className="absolute inset-0" />;
}
