'use client';

import { useState } from 'react';
import { GameProvider } from '@/components/christmas/GameContext';
import Experience from '@/components/christmas/Experience';
import HandController from '@/components/christmas/HandController';
import BackgroundMusic from '@/components/christmas/BackgroundMusic';

export default function ChristmasPage() {
  const [photos, setPhotos] = useState<string[]>([
    '/lottery-music-placeholder.txt', // Placeholder, will fail to load image but won't crash
    // Add some default placeholder images if available or just empty
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  return (
    <GameProvider>
      <main className="relative w-full h-screen overflow-hidden bg-black">
        {/* 3D Scene */}
        <Experience photos={photos} />

        {/* Hand Controller (Webcam & Logic) */}
        <HandController />

        {/* Background Music */}
        <BackgroundMusic />

        {/* UI Overlay */}
        <div className="absolute top-4 left-4 z-10 text-white/80 pointer-events-none">
          <h1 className="text-4xl font-bold text-gold mb-2 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
            🎄 圣诞许愿树
          </h1>
          <div className="space-y-2 text-sm bg-black/30 p-4 rounded-lg backdrop-blur-md border border-white/10">
            <p><span className="font-bold text-green-400">✊ 握拳</span> : 合拢成树</p>
            <p><span className="font-bold text-blue-400">🖐 张开</span> : 散开许愿</p>
            <p><span className="font-bold text-yellow-400">👋 挥手</span> : 旋转视角</p>
            <p><span className="font-bold text-red-400">👌 捏合</span> : 聚焦照片</p>
          </div>
        </div>

        {/* Back Button */}
        <a href="/" className="absolute top-4 right-4 z-20 text-white/50 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </a>

        {/* Photo Upload */}
        <div className="absolute bottom-8 left-8 z-20">
          <label className="cursor-pointer bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white px-6 py-3 rounded-full shadow-lg transition-all transform hover:scale-105 flex items-center gap-2 border border-gold/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>上传照片挂上树</span>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </main>
    </GameProvider>
  );
}
