'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export default function ParticleProgressBar({ progress }: { progress: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 30;
    
    const colors = ['#FFD700', '#FFA500', '#FF4500', '#FFFFFF', '#32CD32'];

    const render = () => {
      // Clear with trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw background bar outline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      // Target fill width
      const targetWidth = (progress / 100) * canvas.width;

      // Spawn particles at the leading edge (the "head" of the progress)
      if (progress < 100 && progress > 0) {
          for (let i = 0; i < 8; i++) {
            particles.current.push({
              x: targetWidth,
              y: Math.random() * canvas.height,
              vx: (Math.random() - 0.5) * 4 - 2, // Fly back slightly
              vy: (Math.random() - 0.5) * 4,
              life: 1.0,
              color: colors[Math.floor(Math.random() * colors.length)],
              size: Math.random() * 3 + 1
            });
          }
      }

      // Update and draw particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        p.size *= 0.95;

        if (p.life <= 0) {
          particles.current.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Draw the solid bar up to progress
      // Use a gradient for the bar
      const barGradient = ctx.createLinearGradient(0, 0, targetWidth, 0);
      barGradient.addColorStop(0, '#FFD700');
      barGradient.addColorStop(1, '#FFA500');
      
      ctx.fillStyle = barGradient;
      ctx.fillRect(0, 0, targetWidth, canvas.height);
      
      // Glow at the tip
      if (targetWidth > 0) {
          ctx.shadowColor = '#FFF';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#FFF';
          ctx.fillRect(targetWidth - 2, 0, 4, canvas.height);
          ctx.shadowBlur = 0;
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [progress]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
        <div className="text-center space-y-2">
            <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-300 to-gold animate-pulse">
            正在上传照片...
            </h3>
            <p className="text-white/60 font-mono text-lg">{Math.round(progress)}%</p>
        </div>
        
        <div className="relative p-2 border border-white/10 rounded-lg bg-black/40 shadow-[0_0_30px_rgba(255,215,0,0.15)]">
            <canvas 
                ref={canvasRef} 
                className="rounded" 
                style={{ width: '400px', height: '30px' }} 
            />
        </div>
        
        <p className="text-sm text-white/40 animate-pulse">
            正在将您的祝福挂上圣诞树...
        </p>
      </div>
    </div>
  );
}
