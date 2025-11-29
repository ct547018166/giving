import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '感恩节活动',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center" style={{ backgroundImage: "url('/thanksgiving-bg.svg')" }}>
      <div className="bg-white bg-opacity-90 p-8 rounded-lg text-center transform -translate-x-5">
        <h1 className="text-3xl font-bold mb-6">感恩节活动</h1>
        <div className="space-y-4">
          <a href="/upload" className="block bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">信息录入</a>
          <a href="/gratitude-display" className="block bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">感恩展示</a>
          <a href="/lottery-gratitude" className="block bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">感恩抽奖</a>
          <a href="/signature-wall" className="block bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">签名墙</a>
          <a href="/signature-display" className="block bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">签名展示</a>
          <a href="/lottery-signature" className="block bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">签名抽奖</a>
        </div>
      </div>
    </div>
  );
}
