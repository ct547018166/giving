'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StarryBackground from '@/components/christmas/StarryBackground';

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
  const [rollingIndices, setRollingIndices] = useState<number[]>([]);
  const [availableNumbers, setAvailableNumbers] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const singleRollingIntervals = useRef<Record<number, NodeJS.Timeout>>({});
  const [musicPlaying, setMusicPlaying] = useState(false);

  // Initialize pool 1-1000
  useEffect(() => {
    const pool = Array.from({ length: 1000 }, (_, i) => i + 1);
    setAvailableNumbers(pool);
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
  const [customCount, setCustomCount] = useState(currentPrize?.count || 0);
  const customCountRef = useRef(customCount);
  const isFinished = currentPrizeIndex >= PRIZES.length;

  useEffect(() => {
    customCountRef.current = customCount;
  }, [customCount]);

  useEffect(() => {
    if (currentPrize) {
      setCustomCount(currentPrize.count);
    }
  }, [currentPrizeIndex, currentPrize]);

  const startRolling = () => {
    if (isFinished || isRolling) return;
    setIsRolling(true);
    
    // Start music if not playing
    if (audioRef.current) {
        audioRef.current.currentTime = 46;
        audioRef.current.play().catch(() => {});
        setMusicPlaying(true);
    }

    intervalRef.current = setInterval(() => {
      const tempWinners: number[] = [];
      for (let i = 0; i < customCountRef.current; i++) {
        tempWinners.push(Math.floor(Math.random() * 1000) + 1);
      }
      setRollingNumbers(tempWinners);
    }, 50);
  };

  const stopRolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Stop music
    if (audioRef.current) {
        audioRef.current.pause();
        setMusicPlaying(false);
    }

    drawWinners();
    setIsRolling(false);
  };

  const drawWinners = () => {
    const count = customCount;
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

  const resetCurrentPrize = () => {
    const currentWinners = winners[currentPrize.id];
    if (currentWinners.length === 0) return;

    // Return numbers to pool
    setAvailableNumbers(prev => [...prev, ...currentWinners].sort((a, b) => a - b));
    
    // Clear winners for current prize
    setWinners(prev => ({
      ...prev,
      [currentPrize.id]: []
    }));
    
    setRollingNumbers([]);
    
    // Automatically start rolling
    startRolling();
  };

  const startRedrawSingle = (index: number) => {
    if (availableNumbers.length === 0) {
      alert('奖池已空！');
      return;
    }
    
    if (rollingIndices.includes(index)) return;

    // Start music if not playing
    if (audioRef.current && !musicPlaying) {
        audioRef.current.currentTime = 46;
        audioRef.current.play().catch(() => {});
        setMusicPlaying(true);
    }

    // Start rolling animation for this index
    setRollingIndices(prev => [...prev, index]);

    // Continuous rolling effect
    const interval = setInterval(() => {
      setWinners(prev => {
        const currentWinners = [...prev[currentPrize.id]];
        currentWinners[index] = Math.floor(Math.random() * 1000) + 1;
        return {
          ...prev,
          [currentPrize.id]: currentWinners
        };
      });
    }, 50);
    
    singleRollingIntervals.current[index] = interval;
  };

  const stopRedrawSingle = (index: number) => {
    const interval = singleRollingIntervals.current[index];
    if (interval) {
      clearInterval(interval);
      delete singleRollingIntervals.current[index];
    }

    setAvailableNumbers(prevPool => {
      const pool = [...prevPool];
      if (pool.length === 0) return pool;

      const randomIndex = Math.floor(Math.random() * pool.length);
      const newNumber = pool[randomIndex];
      pool.splice(randomIndex, 1); // Remove used number

      setWinners(prev => {
        const currentWinners = [...prev[currentPrize.id]];
        currentWinners[index] = newNumber;
        return {
          ...prev,
          [currentPrize.id]: currentWinners
        };
      });
      
      return pool;
    });

    setRollingIndices(prev => {
        const next = prev.filter(i => i !== index);
        // Stop music if no more rolling
        if (next.length === 0 && !isRolling) {
             if (audioRef.current) {
                audioRef.current.pause();
                setMusicPlaying(false);
             }
        }
        return next;
    });
  };

  const stopAllRedraws = () => {
    [...rollingIndices].forEach(index => {
        stopRedrawSingle(index);
    });
  };

  const nextPrize = () => {
    if (rollingIndices.length > 0) {
        stopAllRedraws();
    }
    if (currentPrizeIndex < PRIZES.length) {
      setCurrentPrizeIndex(prev => prev + 1);
      setRollingNumbers([]);
    }
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black text-white font-sans">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
          <StarryBackground />
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
            圣诞大抽奖
          </h1>
          <p className="text-xl text-blue-200 tracking-widest">CHRISTMAS LOTTERY 2025</p>
        </motion.div>

        {/* Prize Selector */}
        <div className="flex flex-wrap justify-center gap-4 mb-8 z-20">
            {PRIZES.map((prize, index) => (
                <button
                    key={prize.id}
                    onClick={() => {
                        if (!isRolling) {
                            setCurrentPrizeIndex(index);
                            setRollingNumbers([]);
                        }
                    }}
                    disabled={isRolling}
                    className={`px-6 py-2 rounded-full transition-all border ${
                        currentPrizeIndex === index 
                        ? 'bg-yellow-500 border-yellow-400 text-black font-bold shadow-[0_0_15px_rgba(234,179,8,0.5)] scale-110' 
                        : 'bg-white/10 border-white/20 hover:bg-white/20 text-white/80 hover:scale-105'
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                >
                    {prize.name}
                </button>
            ))}
        </div>

        {/* Main Display */}
        {!isFinished ? (
          <div className="w-full max-w-[95vw]">
            <div className="text-center mb-8">
              <h2 className="text-5xl font-bold text-red-500 mb-4 drop-shadow-lg">{currentPrize.name}</h2>
              <div className="flex items-center justify-center gap-4 text-xl text-gray-400">
                <span>正在抽取</span>
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2 border border-white/20">
                  <button 
                    onClick={() => setCustomCount(Math.max(1, customCount - 1))}
                    className="px-3 py-1 hover:text-white hover:bg-white/10 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-2xl leading-none pb-2"
                  >-</button>
                  <span className="font-bold text-white w-12 text-center text-2xl">{customCount}</span>
                  <button 
                    onClick={() => setCustomCount(Math.min(12, customCount + 1))}
                    className="px-3 py-1 hover:text-white hover:bg-white/10 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-2xl leading-none pb-2"
                  >+</button>
                </div>
                <span>位幸运观众</span>
              </div>
            </div>

            {/* Numbers Display */}
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              {isRolling ? (
                // Rolling State
                Array.from({ length: customCount }).map((_, i) => (
                  <div key={i} className="w-64 h-64 bg-gradient-to-br from-red-600 to-red-800 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.5)] border-4 border-yellow-400/50">
                    <span className="text-[7rem] font-mono font-bold text-white leading-none">
                      {rollingNumbers[i] || '?'}
                    </span>
                  </div>
                ))
              ) : winners[currentPrize.id].length > 0 ? (
                // Winners Revealed
                Array.from({ length: customCount }).map((_, i) => {
                  const num = winners[currentPrize.id][i];
                  const isSingleRolling = rollingIndices.includes(i);
                  
                  if (isSingleRolling) {
                    return (
                      <div 
                        key={`rolling-${i}`} 
                        className="relative w-64 h-64 bg-gradient-to-br from-red-600 to-red-800 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.5)] border-4 border-yellow-400/50"
                      >
                        <span className="text-[7rem] font-mono font-bold text-white leading-none pb-8">
                          {num}
                        </span>
                        <button
                             onClick={(e) => {
                                e.stopPropagation();
                                stopRedrawSingle(i);
                             }}
                             className="absolute bottom-4 text-lg font-bold bg-yellow-400 text-red-900 px-8 py-2 rounded-full shadow-lg hover:bg-yellow-300 transition-colors z-10"
                        >
                            停止
                        </button>
                      </div>
                    );
                  }

                  if (num !== undefined) {
                    return (
                        <motion.div 
                        key={`${currentPrize.id}-${i}-${num}`}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring" }}
                        className="relative group w-64 h-64 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.6)] border-8 border-white cursor-pointer"
                        >
                        <span className="text-[7rem] font-mono font-bold text-white drop-shadow-md leading-none">
                            {num}
                        </span>
                        
                        {/* Hover Overlay */}
                        <div 
                            className="absolute inset-0 bg-black/50 rounded-[1.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                            onClick={(e) => {
                            e.stopPropagation();
                            startRedrawSingle(i);
                            }}
                        >
                            <span className="text-white font-bold text-2xl bg-red-600 px-4 py-2 rounded-full shadow-lg hover:bg-red-500 transition-colors">
                            点击重抽
                            </span>
                        </div>
                        </motion.div>
                    );
                  }

                  // Empty slot
                  return (
                    <div 
                        key={`empty-${i}`} 
                        className="relative w-64 h-64 bg-white/5 rounded-3xl flex items-center justify-center border-4 border-dashed border-white/20 cursor-pointer hover:bg-white/10 transition-colors group"
                        onClick={() => startRedrawSingle(i)}
                    >
                        <span className="text-7xl text-white/20 group-hover:text-white/40 transition-colors">?</span>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <span className="text-white font-bold text-xl bg-green-600 px-4 py-2 rounded-full shadow-lg">点击抽取</span>
                        </div>
                    </div>
                  );
                })
              ) : (
                // Initial State
                Array.from({ length: customCount }).map((_, i) => (
                  <div key={i} className="w-64 h-64 bg-white/5 rounded-3xl flex items-center justify-center border-4 border-dashed border-white/20">
                    <span className="text-7xl text-white/20">?</span>
                  </div>
                ))
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-6">
              {winners[currentPrize.id].length === 0 ? (
                !isRolling ? (
                  <button
                    onClick={startRolling}
                    className="px-12 py-4 bg-gradient-to-r from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-white text-2xl font-bold rounded-full shadow-lg transform transition-all hover:scale-105 border border-green-400/30"
                  >
                    开始抽奖
                  </button>
                ) : (
                  <button
                    onClick={stopRolling}
                    className="px-12 py-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white text-2xl font-bold rounded-full shadow-lg transform transition-all hover:scale-105 border border-red-400/30"
                  >
                    停止抽奖
                  </button>
                )
              ) : (
                <div className="flex gap-4">
                  {rollingIndices.length > 0 ? (
                    <button
                      onClick={stopAllRedraws}
                      className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-red-900 text-xl font-bold rounded-full backdrop-blur-md border border-yellow-400/30 transition-all shadow-lg"
                    >
                      停止
                    </button>
                  ) : (
                    <button
                      onClick={resetCurrentPrize}
                      className="px-8 py-4 bg-red-600/80 hover:bg-red-500 text-white text-xl font-bold rounded-full backdrop-blur-md border border-red-400/30 transition-all"
                    >
                      重新抽取
                    </button>
                  )}
                  <button
                    onClick={nextPrize}
                    className="px-12 py-4 bg-white/10 hover:bg-white/20 text-white text-xl font-bold rounded-full backdrop-blur-md border border-white/30 transition-all"
                  >
                    下一轮
                  </button>
                </div>
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
        <div className="fixed left-4 top-4 w-56 bg-black/40 backdrop-blur-xl p-4 rounded-xl border border-white/10 hidden lg:block z-20">
          <h3 className="text-lg font-bold text-yellow-400 mb-3 border-b border-white/10 pb-2">中奖名单</h3>
          <div className="space-y-4">
            {PRIZES.slice().reverse().map((prize) => (
              <div key={prize.id} className="opacity-90">
                <div className="text-xs text-gray-400 mb-1">{prize.name}</div>
                <div className="flex flex-wrap gap-3">
                  {winners[prize.id].length > 0 ? (
                    winners[prize.id].map((num, i) => (
                      <span key={`${num}-${i}`} className="text-green-400 font-mono font-bold">{num}</span>
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

      </main>
  );
}
