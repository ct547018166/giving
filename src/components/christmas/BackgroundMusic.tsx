'use client';

import { useState, useRef, useEffect } from 'react';

export default function BackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Auto-play attempt
    const attemptPlay = async () => {
        if (audioRef.current) {
            audioRef.current.volume = 0.4; 
            try {
                await audioRef.current.play();
                setIsPlaying(true);
            } catch (error) {
                console.log("Auto-play prevented:", error);
                setIsPlaying(false);
            }
        }
    };

    attemptPlay();

    // Add global click listener to start music if autoplay failed
    const handleInteraction = () => {
        if (audioRef.current && audioRef.current.paused) {
            attemptPlay();
        }
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
      <audio ref={audioRef} loop>
        <source src="/MerryChristmas.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      
      <button 
        onClick={togglePlay}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full 
          backdrop-blur-md border transition-all duration-300
          ${isPlaying 
            ? 'bg-gold/20 border-gold text-gold shadow-[0_0_15px_rgba(255,215,0,0.3)]' 
            : 'bg-white/10 border-white/30 text-white/70 hover:bg-white/20'}
        `}
      >
        {isPlaying ? (
          <>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-gold"></span>
            </span>
            <span className="text-sm font-medium">Playing: Merry Christmas</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Play Music</span>
          </>
        )}
      </button>
    </div>
  );
}
