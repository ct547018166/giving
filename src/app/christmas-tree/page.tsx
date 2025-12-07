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

        {/* Background Music - Moved to end for highest z-index stacking */}
        <BackgroundMusic />
      </main>
    </GameProvider>
  );
}
