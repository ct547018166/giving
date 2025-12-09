'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type PrizeType = 'third' | 'second' | 'first' | 'grand';

interface PrizeConfig {
  id: PrizeType;
  name: string;
  count: number;
  label: string;
}

const PRIZES: PrizeConfig[] = [
  { id: 'third', name: '三等奖', count: 4, label: '三等奖 (4名)' },
  { id: 'second', name: '二等奖', count: 3, label: '二等奖 (3名)' },
  { id: 'first', name: '一等奖', count: 2, label: '一等奖 (2名)' },
  { id: 'grand', name: '特等奖', count: 1, label: '特等奖 (1名)' },
];

export default function LotteryPage() {
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);
  const [winners, setWinners] = useState<Record<PrizeType, number[]>>({
    third: [],
    second: [],
    first: [],
    grand: [],
  });
  const [isRolling, setIsRolling] = useState(false);
  const [rollingNumbers, setRollingNumbers] = useState<number[]>([]);
  const [availableNumbers, setAvailableNumbers] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [snowflakes, setSnowflakes] = useState<Array<{
    left: string;
    width: string;
    height: string;
    animationDuration: string;
    animationDelay: string;
  }>>([]);

  // Initialize pool 1-1000
  useEffect(() => {
    const pool = Array.from({ length: 1000 }, (_, i) => i + 1);
    setAvailableNumbers(pool);
    
    // Generate snowflakes on client side only to avoid hydration mismatch
    setSnowflakes(Array.from({ length: 50 }).map(() => ({
      left: `${Math.random() * 100}%`,
      width: `${Math.random() * 5 + 2}px`,
      height: `${Math.random() * 5 + 2}px`,
      animationDuration: `${Math.random() * 5 + 5}s`,
      animationDelay: `${Math.random() * 5}s`,
    })));
  }, []);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (musicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log("Audio play failed", e));
      }
      setMusicPlaying(!musicPlaying);
    }
  };

  const currentPrize = PRIZES[currentPrizeIndex];
  const isFinished = currentPrizeIndex >= PRIZES.length;

  const startRolling = () => {
    if (isFinished || isRolling) return;
    setIsRolling(true);
    
    // Start music if not playing
    if (audioRef.current && !musicPlaying) {
        audioRef.current.play().catch(() => {});
        setMusicPlaying(true);
    }

    const interval = setInterval(() => {
      const tempWinners: number[] = [];
      for (let i = 0; i < currentPrize.count; i++) {
        tempWinners.push(Math.floor(Math.random() * 1000) + 1);
      }
      setRollingNumbers(tempWinners);
    }, 50);

    // Stop after 3 seconds
    setTimeout(() => {
      clearInterval(interval);
      drawWinners();
      setIsRolling(false);
    }, 3000);
  };

  const drawWinners = () => {
    const count = currentPrize.count;
    const newWinners: number[] = [];
    const currentPool = [...availableNumbers];

    for (let i = 0; i < count; i++) {
      if (currentPool.length === 0) break;
      const randomIndex = Math.floor(Math.random() * currentPool.length);
      newWinners.push(currentPool[randomIndex]);
      currentPool.splice(randomIndex, 1);
    }

    setAvailableNumbers(currentPool);
    setWinners(prev => ({
      ...prev,
      [currentPrize.id]: newWinners
    }));
    
    // Move to next prize
    // Wait a bit before allowing next draw? No, manual control usually better but requirement says "draw all at once" for the category.
    // We just stay on this screen showing winners, user can click "Next Prize"
  };

  const nextPrize = () => {
    if (currentPrizeIndex < PRIZES.length) {
      setCurrentPrizeIndex(prev => prev + 1);
      setRollingNumbers([]);
    }
  };

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white overflow-hidden relative font-sans">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
        {/* Snowflakes (CSS animation) */}
        {snowflakes.map((flake, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full opacity-70 animate-fall"
            style={{
              left: flake.left,
              top: `-10px`,
              width: flake.width,
              height: flake.height,
              animationDuration: flake.animationDuration,
              animationDelay: flake.animationDelay,
            }}
          />
        ))}
      </div>

      {/* Audio */}
      <audio ref={audioRef} loop src="/lottery-music.mp3" />
      
      {/* Music Control */}
      <button 
        onClick={toggleMusic}
        className="fixed top-4 right-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all"
      >
        {musicPlaying ? '🔊' : '🔇'}
      </button>

      <div className="relative z-10 container mx-auto px-4 py-8 flex flex-col items-center min-h-screen justify-center">
        {/* Title */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.5)] mb-4">
            国度降临从马槽到起初
          </h1>
          <p className="text-xl text-blue-200 tracking-widest">CHRISTMAS LOTTERY 2025</p>
        </motion.div>

        {/* Main Display */}
        {!isFinished ? (
          <div className="w-full max-w-4xl">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-red-500 mb-2 drop-shadow-lg">{currentPrize.name}</h2>
              <p className="text-gray-400">正在抽取 {currentPrize.count} 位幸运观众</p>
            </div>

            {/* Numbers Display */}
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              {isRolling ? (
                // Rolling State
                Array.from({ length: currentPrize.count }).map((_, i) => (
                  <div key={i} className="w-40 h-40 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.5)] border-2 border-yellow-400/50">
                    <span className="text-5xl font-mono font-bold text-white">
                      {rollingNumbers[i] || '?'}
                    </span>
                  </div>
                ))
              ) : winners[currentPrize.id].length > 0 ? (
                // Winners Revealed
                winners[currentPrize.id].map((num, i) => (
                  <motion.div 
                    key={i}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.2, type: "spring" }}
                    className="w-40 h-40 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.6)] border-4 border-white"
                  >
                    <span className="text-5xl font-mono font-bold text-white drop-shadow-md">
                      {num}
                    </span>
                  </motion.div>
                ))
              ) : (
                // Initial State
                Array.from({ length: currentPrize.count }).map((_, i) => (
                  <div key={i} className="w-40 h-40 bg-white/5 rounded-2xl flex items-center justify-center border-2 border-dashed border-white/20">
                    <span className="text-4xl text-white/20">?</span>
                  </div>
                ))
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-6">
              {winners[currentPrize.id].length === 0 ? (
                <button
                  onClick={startRolling}
                  disabled={isRolling}
                  className="px-12 py-4 bg-gradient-to-r from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-white text-2xl font-bold rounded-full shadow-lg transform transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed border border-green-400/30"
                >
                  {isRolling ? '抽奖中...' : '开始抽奖'}
                </button>
              ) : (
                <button
                  onClick={nextPrize}
                  className="px-12 py-4 bg-white/10 hover:bg-white/20 text-white text-xl font-bold rounded-full backdrop-blur-md border border-white/30 transition-all"
                >
                  下一轮
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-5xl font-bold text-yellow-400 mb-8">抽奖结束</h2>
            <p className="text-2xl text-white/80">祝大家圣诞快乐！</p>
          </div>
        )}

        {/* History / Sidebar */}
        <div className="fixed left-8 top-1/2 -translate-y-1/2 w-64 bg-black/40 backdrop-blur-xl p-6 rounded-2xl border border-white/10 hidden xl:block">
          <h3 className="text-xl font-bold text-yellow-400 mb-4 border-b border-white/10 pb-2">中奖名单</h3>
          <div className="space-y-6">
            {PRIZES.slice().reverse().map((prize) => (
              <div key={prize.id} className="opacity-80">
                <div className="text-sm text-gray-400 mb-1">{prize.name}</div>
                <div className="flex flex-wrap gap-2">
                  {winners[prize.id].length > 0 ? (
                    winners[prize.id].map(num => (
                      <span key={num} className="text-green-400 font-mono font-bold">{num}</span>
                    ))
                  ) : (
                    <span className="text-gray-600 text-xs">待抽取...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fall {
          0% { transform: translateY(-10vh) translateX(0); }
          100% { transform: translateY(110vh) translateX(20px); }
        }
        .animate-fall {
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </main>
  );
}
