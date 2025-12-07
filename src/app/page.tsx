'use client';

import { useState } from 'react';
import { GameProvider } from '@/components/christmas/GameContext';
import Experience from '@/components/christmas/Experience';
import HandController from '@/components/christmas/HandController';
import BackgroundMusic from '@/components/christmas/BackgroundMusic';

export default function Home() {
  const [photos, setPhotos] = useState<string[]>([
    '/thanksgiving-bg.JPG', // Placeholder
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

        {/* UI Overlay */}
        <div className="absolute top-4 left-4 z-10 text-white/80 pointer-events-none">
          <h1 className="text-4xl font-bold text-gold mb-2 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
            🎄 圣诞树
          </h1>
          <div className="space-y-2 text-sm bg-black/30 p-4 rounded-lg backdrop-blur-md border border-white/10">
            <p><span className="font-bold text-green-400">✊ 握拳</span> : 合拢成树</p>
            <p><span className="font-bold text-blue-400">🖐 张开</span> : 散开许愿</p>
            <p><span className="font-bold text-yellow-400">👋 挥手</span> : 旋转视角</p>
            <p><span className="font-bold text-red-400">👌 捏合</span> : 聚焦照片</p>
          </div>
        </div>

        {/* Menu Button (Top Right) */}
        <a href="/menu" className="absolute top-4 right-4 z-20 text-white/50 hover:text-white transition-colors flex flex-col items-center group">
          <div className="p-2 bg-white/10 rounded-full group-hover:bg-white/20 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <span className="text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity">菜单</span>
        </a>

        {/* Photo Upload & Controls */}
        <div className="absolute bottom-8 left-8 z-20 flex items-center gap-4">
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

          {photos.length > 1 && (
            <button 
              onClick={() => setPhotos(['/thanksgiving-bg.JPG'])}
              className="bg-black/40 hover:bg-black/60 text-white/80 hover:text-white px-4 py-3 rounded-full backdrop-blur-md border border-white/20 transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>清空照片</span>
            </button>
          )}
        </div>

        {/* Background Music */}
        <BackgroundMusic />
      </main>
    </GameProvider>
  );
}
