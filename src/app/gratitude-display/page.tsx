'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Gratitude {
  id: number;
  serial: number;
  nickname: string;
  time: string;
  gratitude: string;
}

export default function GratitudeDisplay() {
  const [gratitudes, setGratitudes] = useState<Gratitude[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const router = useRouter();

  // 颜色数组
  const colors = [
    'bg-red-100 border-red-200',
    'bg-blue-100 border-blue-200',
    'bg-green-100 border-green-200',
    'bg-yellow-100 border-yellow-200',
    'bg-purple-100 border-purple-200',
    'bg-pink-100 border-pink-200',
    'bg-indigo-100 border-indigo-200',
    'bg-orange-100 border-orange-200',
    'bg-teal-100 border-teal-200',
    'bg-cyan-100 border-cyan-200'
  ];

  useEffect(() => {
    const loadGratitudes = async () => {
      try {
        const response = await fetch('/api/gratitudes');
        const data = await response.json();
        setGratitudes(data);
      } catch (error) {
        console.error('Error loading gratitudes:', error);
      }
    };

    loadGratitudes();
    const interval = setInterval(loadGratitudes, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // 尝试自动播放音乐
    const autoPlayAudio = async () => {
      if (audioRef.current) {
        try {
          audioRef.current.currentTime = 34; // 从34秒开始播放
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.warn('Auto-play failed, user interaction required:', error);
          setIsPlaying(false);
        }
      }
    };

    autoPlayAudio();
  }, []);

  const toggleAudio = async () => {
    if (audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          audioRef.current.currentTime = 34; // 从34秒开始播放
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.warn('Audio play failed:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat overflow-hidden relative" style={{ backgroundImage: "url('/thanksgiving-brush-bg.svg')" }}>
      <audio ref={audioRef} loop autoPlay preload="metadata">
        <source src="/thanksgiving-music.mp3" type="audio/mpeg" />
      </audio>
      
      {/* 音频控制按钮 */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleAudio}
          className="bg-orange-500/60 text-white px-4 py-2 rounded hover:bg-orange-500/80 transition-colors shadow-lg backdrop-blur-sm"
        >
          {isPlaying ? '🔊 音乐播放中' : '🔇 点击播放音乐'}
        </button>
      </div>
            {gratitudes.map((item, index) => {
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const verticalPosition = Math.random() * 80 + 10;  // 随机垂直位置
        const horizontalStart = Math.random() * 100;  // 随机水平起始位置
        const moveType = Math.floor(Math.random() * 8);  // 8种不同的移动类型
        
        // 根据移动类型设置不同的动画
        let animationName = 'float-diagonal';
        let customStyles = {};
        
        switch (moveType) {
          case 0: // 右上斜向
            animationName = 'float-right-up';
            break;
          case 1: // 右下斜向
            animationName = 'float-right-down';
            break;
          case 2: // 左上斜向
            animationName = 'float-left-up';
            break;
          case 3: // 左下斜向
            animationName = 'float-left-down';
            break;
          case 4: // 水平向右
            animationName = 'float-horizontal';
            break;
          case 5: // 垂直向上
            animationName = 'float-vertical';
            break;
          case 6: // 螺旋移动
            animationName = 'float-spiral';
            break;
          case 7: // 波浪移动
            animationName = 'float-wave';
            break;
        }
        
        return (
          <div
            key={item.id}
            className={`absolute text-black p-3 rounded shadow-lg border-2 ${randomColor} ${animationName} overflow-hidden`}
            style={{
              left: `${horizontalStart}%`,  // 随机起始位置
              top: `${verticalPosition}%`,   // 随机垂直位置
              animationDelay: `${Math.random() * 5}s`,  // 随机延迟
              animationDuration: `${Math.random() * 10 + 15}s`,  // 随机速度 15-25秒
              maxWidth: '450px',  // 相应增加最大宽度
              minWidth: '280px',  // 增加最小宽度
              maxHeight: '250px',  // 增加最大高度
              minHeight: '60px',  // 设置最小高度
              wordWrap: 'break-word',  // 允许单词换行
              overflowWrap: 'break-word',  // 确保长单词也能换行
              hyphens: 'auto',  // 自动断字
              whiteSpace: item.gratitude.length > 12 ? 'pre-wrap' : 'nowrap',  // 更早换行
              padding: '16px',  // 增加内边距
              fontSize: '18px',  // 增大字体大小
              lineHeight: '1.5',  // 调整行高
              ...customStyles,
            }}
          >
            <strong>{item.id}</strong>: {item.gratitude}
          </div>
        );
      })}
      <style jsx>{`
        @keyframes float-right-up {
          0% { transform: translate(0px, 0px); }
          25% { transform: translate(200px, -100px); }
          50% { transform: translate(400px, -200px); }
          75% { transform: translate(600px, -300px); }
          100% { transform: translate(800px, -400px); }
        }
        
        @keyframes float-right-down {
          0% { transform: translate(0px, 0px); }
          25% { transform: translate(200px, 100px); }
          50% { transform: translate(400px, 200px); }
          75% { transform: translate(600px, 300px); }
          100% { transform: translate(800px, 400px); }
        }
        
        @keyframes float-left-up {
          0% { transform: translate(0px, 0px); }
          25% { transform: translate(-200px, -100px); }
          50% { transform: translate(-400px, -200px); }
          75% { transform: translate(-600px, -300px); }
          100% { transform: translate(-800px, -400px); }
        }
        
        @keyframes float-left-down {
          0% { transform: translate(0px, 0px); }
          25% { transform: translate(-200px, 100px); }
          50% { transform: translate(-400px, 200px); }
          75% { transform: translate(-600px, 300px); }
          100% { transform: translate(-800px, 400px); }
        }
        
        @keyframes float-horizontal {
          0% { transform: translateX(0px); }
          100% { transform: translateX(calc(100vw + 200px)); }
        }
        
        @keyframes float-vertical {
          0% { transform: translateY(0px); }
          100% { transform: translateY(calc(-100vh - 200px)); }
        }
        
        @keyframes float-spiral {
          0% { transform: translate(0px, 0px); }
          25% { transform: translate(150px, -150px); }
          50% { transform: translate(0px, -300px); }
          75% { transform: translate(-150px, -150px); }
          100% { transform: translate(0px, 0px); }
        }
        
        @keyframes float-wave {
          0% { transform: translateX(0px) translateY(0px); }
          25% { transform: translateX(200px) translateY(-50px); }
          50% { transform: translateX(400px) translateY(0px); }
          75% { transform: translateX(600px) translateY(-50px); }
          100% { transform: translateX(800px) translateY(0px); }
        }
        
        .float-right-up, .float-right-down, .float-left-up, .float-left-down, 
        .float-horizontal, .float-vertical, .float-spiral, .float-wave {
          animation: var(--animation-name) linear infinite;
        }
        
        .float-right-up { --animation-name: float-right-up; }
        .float-right-down { --animation-name: float-right-down; }
        .float-left-up { --animation-name: float-left-up; }
        .float-left-down { --animation-name: float-left-down; }
        .float-horizontal { --animation-name: float-horizontal; }
        .float-vertical { --animation-name: float-vertical; }
        .float-spiral { --animation-name: float-spiral; }
        .float-wave { --animation-name: float-wave; }
      `}</style>
      <style jsx>{`
        @keyframes float {
          0% { transform: translateX(0px) scaleX(var(--direction, 1)); }
          100% { transform: translateX(calc(120vw)) scaleX(var(--direction, 1)); }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
      
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