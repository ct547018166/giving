import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-700 to-green-800 flex flex-col items-center justify-center text-white p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 text-center">
        <h1 className="text-4xl font-bold mb-8 drop-shadow-lg">🎄 圣诞快乐 🎁 </h1>
        
        <div className="space-y-4">
          <Link 
            href="/christmas-tree" 
            className="block w-full py-4 px-6 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg border-2 border-green-400"
          >
            🎄 圣诞树
          </Link>
          
          <Link 
            href="/christmas-lottery" 
            className="block w-full py-4 px-6 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg border-2 border-red-400"
          >
            🎁 圣诞大抽奖
          </Link>

          <div className="pt-4 border-t border-white/20 mt-6">
            <Link 
              href="/maintenance" 
              className="block w-full py-3 px-6 bg-white/5 hover:bg-white/10 text-gray-200 rounded-xl font-bold text-lg transition-all border border-white/10"
            >
              🛠 数据维护
            </Link>
          </div>

          {/* 感恩节内容暂时隐藏
          <div className="pt-4 border-t border-white/20 mt-6 opacity-50">
            <p className="text-sm text-gray-300 mb-4">感恩节活动</p>
            <Link href="/upload" className="block py-2 px-4 bg-orange-500/50 text-white rounded mb-2">信息录入</Link>
            <Link href="/gratitude-display" className="block py-2 px-4 bg-orange-500/50 text-white rounded mb-2">感恩展示</Link>
            <Link href="/lottery-gratitude" className="block py-2 px-4 bg-orange-500/50 text-white rounded mb-2">感恩抽奖</Link>
            <Link href="/signature-wall" className="block py-2 px-4 bg-orange-500/50 text-white rounded mb-2">签名墙</Link>
            <Link href="/signature-display" className="block py-2 px-4 bg-orange-500/50 text-white rounded mb-2">签名展示</Link>
            <Link href="/lottery-signature" className="block py-2 px-4 bg-orange-500/50 text-white rounded mb-2">签名抽奖</Link>
          </div> 
          */}
        </div>
        
        <div className="mt-12 text-sm text-gray-300">
          Merry Christmas & Happy New Year
        </div>
      </div>
    </div>
  );
}
