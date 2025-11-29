'use client';

import { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { useRouter } from 'next/navigation';

interface Signature {
  id: number;
  nickname: string;
  signature: string;
}

export default function SignatureDisplay() {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isQrExpanded, setIsQrExpanded] = useState(false);
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
    const loadSignatures = async () => {
      try {
        const response = await fetch('/api/signatures');
        const data = await response.json();
        setSignatures(data);
      } catch (error) {
        console.error('Error loading signatures:', error);
      }
    };

    loadSignatures();
    const interval = setInterval(loadSignatures, 30000);
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

  useEffect(() => {
    // 生成二维码
    const generateQRCode = async () => {
      try {
        const url = `${window.location.origin}/signature-wall`;
        // 生成高分辨率二维码，防止放大后模糊
        const qrCodeDataUrl = await QRCode.toDataURL(url, { width: 1000, margin: 2 });
        setQrCodeUrl(qrCodeDataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQRCode();
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

      {/* 二维码区域 */}
      <div 
        className={`absolute z-50 transition-all duration-500 ease-in-out cursor-pointer ${
          isQrExpanded 
            ? 'top-0 left-0 w-screen h-screen bg-transparent flex items-center justify-start pl-20' 
            : 'top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg'
        }`}
        onClick={() => setIsQrExpanded(!isQrExpanded)}
        title={isQrExpanded ? "点击缩小" : "点击放大二维码"}
      >
        {!isQrExpanded && (
          <>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">签名墙</h3>
            <p className="text-sm text-gray-600 mb-3">扫码进入签名墙界面</p>
          </>
        )}
        {qrCodeUrl && (
          <img
            src={qrCodeUrl}
            alt="签名墙页面二维码"
            className={`transition-all duration-500 bg-white ${
              isQrExpanded 
                ? 'h-[85vh] w-[85vh] object-contain rounded-xl shadow-2xl' 
                : 'w-[180px] h-[180px] border-2 border-gray-300 rounded'
            }`}
          />
        )}
        {isQrExpanded && (
          <div className="ml-10 text-white">
            <h2 className="text-4xl font-bold mb-4">扫码参与签名</h2>
            <p className="text-xl opacity-80">点击屏幕任意位置缩小</p>
          </div>
        )}
      </div>
      {signatures.slice(0, 25).map((item, index) => {  // 增加显示数量到25
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const verticalPosition = Math.random() * 80 + 10;  // 随机垂直位置
        const horizontalStart = Math.random() * 100;  // 随机水平起始位置
        const moveType = Math.floor(Math.random() * 8);  // 8种不同的移动类型
        
        // 根据移动类型设置不同的动画
        let animationName = 'scroll-diagonal';
        let customStyles = {};
        
        switch (moveType) {
          case 0: // 右上斜向
            animationName = 'scroll-right-up';
            break;
          case 1: // 右下斜向
            animationName = 'scroll-right-down';
            break;
          case 2: // 左上斜向
            animationName = 'scroll-left-up';
            break;
          case 3: // 左下斜向
            animationName = 'scroll-left-down';
            break;
          case 4: // 水平向右
            animationName = 'scroll-horizontal';
            break;
          case 5: // 垂直向上
            animationName = 'scroll-vertical';
            break;
          case 6: // 螺旋移动
            animationName = 'scroll-spiral';
            break;
          case 7: // 波浪移动
            animationName = 'scroll-wave';
            break;
        }
        
        return (
          <div
            key={item.id}
            className={`absolute text-black p-3 rounded shadow-lg border-2 ${randomColor} ${animationName} overflow-hidden`}
            style={{
              left: `${horizontalStart}%`,  // 随机起始位置
              top: `${verticalPosition}%`,   // 随机垂直位置
              animationDelay: `${Math.random() * 8}s`,  // 随机延迟
              animationDuration: `${Math.random() * 10 + 20}s`,  // 随机速度 20-30秒
              maxWidth: '450px',  // 相应增加最大宽度
              minWidth: '280px',  // 增加最小宽度
              maxHeight: '250px',  // 增加最大高度
              minHeight: '60px',  // 设置最小高度
              wordWrap: 'break-word',  // 允许单词换行
              overflowWrap: 'break-word',  // 确保长单词也能换行
              hyphens: 'auto',  // 自动断字
              whiteSpace: (item.nickname + item.signature).length > 12 ? 'pre-wrap' : 'nowrap',  // 更早换行
              padding: '16px',  // 增加内边距
              fontSize: '18px',  // 增大字体大小
              lineHeight: '1.5',  // 调整行高
              ...customStyles,
            }}
          >
            <strong>{item.nickname}</strong>: {item.signature}
          </div>
        );
      })}
      <style jsx>{`
        @keyframes scroll-right-up {
          0% { transform: translate(0px, 0px); }
          25% { transform: translate(250px, -120px); }
          50% { transform: translate(500px, -240px); }
          75% { transform: translate(750px, -360px); }
          100% { transform: translate(1000px, -480px); }
        }
        
        @keyframes scroll-right-down {
          0% { transform: translate(0px, 0px); }
          25% { transform: translate(250px, 120px); }
          50% { transform: translate(500px, 240px); }
          75% { transform: translate(750px, 360px); }
          100% { transform: translate(1000px, 480px); }
        }
        
        @keyframes scroll-left-up {
          0% { transform: translate(0px, 0px); }
          25% { transform: translate(-250px, -120px); }
          50% { transform: translate(-500px, -240px); }
          75% { transform: translate(-750px, -360px); }
          100% { transform: translate(-1000px, -480px); }
        }
        
        @keyframes scroll-left-down {
          0% { transform: translate(0px, 0px); }
          25% { transform: translate(-250px, 120px); }
          50% { transform: translate(-500px, 240px); }
          75% { transform: translate(-750px, 360px); }
          100% { transform: translate(-1000px, 480px); }
        }
        
        @keyframes scroll-horizontal {
          0% { transform: translateX(0px); }
          100% { transform: translateX(calc(100vw + 300px)); }
        }
        
        @keyframes scroll-vertical {
          0% { transform: translateY(0px); }
          100% { transform: translateY(calc(-100vh - 300px)); }
        }
        
        @keyframes scroll-spiral {
          0% { transform: translate(0px, 0px); }
          25% { transform: translate(200px, -200px); }
          50% { transform: translate(0px, -400px); }
          75% { transform: translate(-200px, -200px); }
          100% { transform: translate(0px, 0px); }
        }
        
        @keyframes scroll-wave {
          0% { transform: translateX(0px) translateY(0px); }
          25% { transform: translateX(300px) translateY(-80px); }
          50% { transform: translateX(600px) translateY(0px); }
          75% { transform: translateX(900px) translateY(-80px); }
          100% { transform: translateX(1200px) translateY(0px); }
        }
        
        .scroll-right-up, .scroll-right-down, .scroll-left-up, .scroll-left-down, 
        .scroll-horizontal, .scroll-vertical, .scroll-spiral, .scroll-wave {
          animation: var(--animation-name) linear infinite;
        }
        
        .scroll-right-up { --animation-name: scroll-right-up; }
        .scroll-right-down { --animation-name: scroll-right-down; }
        .scroll-left-up { --animation-name: scroll-left-up; }
        .scroll-left-down { --animation-name: scroll-left-down; }
        .scroll-horizontal { --animation-name: scroll-horizontal; }
        .scroll-vertical { --animation-name: scroll-vertical; }
        .scroll-spiral { --animation-name: scroll-spiral; }
        .scroll-wave { --animation-name: scroll-wave; }
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