'use client';

import { useState, useRef, useEffect } from 'react';

export default function BackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("BackgroundMusic component mounted");
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

    const audioEl = audioRef.current;
    if (!audioEl) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    audioEl.addEventListener('play', handlePlay);
    audioEl.addEventListener('pause', handlePause);

    // Only add global interaction handlers if autoplay failed.
    const handleInteraction = (e: Event) => {
      // If the user clicked the music button itself, do not auto-restart.
      const target = e.target as Node | null;
      if (target && containerRef.current?.contains(target)) return;

      if (audioRef.current && audioRef.current.paused) {
        void attemptPlay();
      }
    };

    void (async () => {
      try {
        await attemptPlay();
      } finally {
        // If still not playing, rely on a user gesture.
        if (audioRef.current?.paused) {
          window.addEventListener('click', handleInteraction);
          window.addEventListener('touchstart', handleInteraction);
        }
      }
    })();

    return () => {
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
        audioEl.removeEventListener('play', handlePlay);
        audioEl.removeEventListener('pause', handlePause);
    };
  }, []);

  const togglePlay = async () => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    if (!audioEl.paused) {
      audioEl.pause();
      return;
    }

    try {
      await audioEl.play();
    } catch (error) {
      console.log('Play prevented:', error);
      setIsPlaying(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed bottom-52 left-8 z-[9999] pointer-events-auto"
      style={{ position: 'fixed', bottom: '220px', left: '32px', zIndex: 99999 }}
    >
      <audio ref={audioRef} loop>
        <source src="/ChristmasList.m4a" type="audio/mp4" />
        Your browser does not support the audio element.
      </audio>
      
      <button 
        onClick={togglePlay}
        style={{
          backgroundColor: isPlaying ? 'rgba(234, 179, 8, 0.2)' : 'rgba(220, 38, 38, 0.9)',
          color: isPlaying ? 'rgb(234, 179, 8)' : 'white',
          borderColor: isPlaying ? 'rgb(234, 179, 8)' : 'rgba(255, 255, 255, 0.3)',
          borderWidth: '1px',
          borderStyle: 'solid',
          padding: '10px 20px',
          borderRadius: '9999px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          boxShadow: isPlaying ? '0 0 15px rgba(255, 215, 0, 0.3)' : '0 4px 6px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          fontSize: '14px',
          fontWeight: 500,
          pointerEvents: 'auto'
        }}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full 
          backdrop-blur-md border transition-all duration-300
          ${isPlaying 
            ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-[0_0_15px_rgba(255,215,0,0.3)]' 
            : 'bg-red-600 border-white/30 text-white hover:bg-red-500'}
        `}
      >
        {isPlaying ? (
          <>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
            </span>
            <span className="text-sm font-medium">Playing: Christmas List</span>
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
