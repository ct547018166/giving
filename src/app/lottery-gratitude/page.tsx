'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Gratitude {
  id: number;
  serial: number;
  nickname: string;
  time: string;
  gratitude: string;
}

export default function LotteryGratitude() {
  const [winner, setWinner] = useState<Gratitude | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false); // 添加 ref 来追踪运行状态
  const router = useRouter();

  // 添加键盘事件监听
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault(); // 防止页面滚动
        if (isRunning) {
          stopLottery();
        } else {
          startLottery();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRunning]); // 依赖isRunning状态

  const startLottery = async () => {
    if (isRunning) return;
    setIsRunning(true);
    isRunningRef.current = true; // 更新 ref
    const audio = document.getElementById('lottery-music') as HTMLAudioElement;

    try {
      audio.currentTime = 34; // 从34秒开始播放
      await audio.play();
    } catch (error) {
      console.warn('Audio play failed:', error);
    }

    intervalRef.current = setInterval(async () => {
      // 如果已经停止，就不再请求
      if (!isRunningRef.current) return;
      
      try {
        const response = await fetch('/api/random-gratitude');
        const item = await response.json();
        
        // 请求返回后再次检查是否还在运行
        if (isRunningRef.current) {
          setWinner(item);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }, 200);
  };

  const stopLottery = () => {
    isRunningRef.current = false; // 立即更新 ref
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    const audio = document.getElementById('lottery-music') as HTMLAudioElement;
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch (error) {
      console.warn('Audio pause failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-start justify-center pt-16" style={{ backgroundImage: "url('/thanksgiving-bg.svg')" }}>
      <div className="bg-gradient-to-br from-orange-400 via-red-500 to-yellow-500 bg-opacity-20 p-8 rounded-lg text-center text-white border-2 border-orange-300 border-opacity-50 mt-20 mb-40">
        <div className="min-w-[600px] flex flex-col">
          {winner ? (
            <div className="flex-1 flex flex-col justify-end items-center">
              <div className="bg-gradient-to-br from-orange-400 via-red-500 to-yellow-500 bg-opacity-30 p-6 rounded-lg border border-orange-300 border-opacity-30 w-full">
                <p className="text-3xl"><strong>{winner.id}</strong> - {winner.nickname}</p>
                <p className="text-2xl">{winner.gratitude}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-3xl">点击开始抽奖或按空格键</p>
            </div>
          )}
        </div>
      </div>

      {/* 固定位置的控制按钮和提示 */}
      <div className="fixed bottom-52 left-0 right-0 flex flex-col items-center gap-4 z-10">
        <div className="flex gap-4 justify-center">
          <button
            onClick={startLottery}
            disabled={isRunning}
            className="bg-orange-500 text-white px-6 py-3 rounded hover:bg-orange-600 disabled:opacity-50 shadow-lg"
          >
            {isRunning ? '抽奖中...' : '开始抽奖'}
          </button>
          {isRunning && (
            <button
              onClick={stopLottery}
              className="bg-red-500 text-white px-6 py-3 rounded hover:bg-red-600 shadow-lg"
            >
              结束抽奖
            </button>
          )}
        </div>
        <p className="text-sm text-white/90 font-medium drop-shadow-md">提示：按空格键可以快速开始/结束抽奖</p>
      </div>
      <audio id="lottery-music" preload="auto">
        <source src="/lottery-music.mp3" type="audio/mpeg" />
      </audio>
      
      {/* 右下角首页图标 */}
      <button
        onClick={() => router.push('/')}
        className="fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-full shadow-lg transition-colors duration-200 z-50"
        title="回到首页"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </button>
    </div>
  );
}