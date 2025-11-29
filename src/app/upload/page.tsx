'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clearMessage, setClearMessage] = useState('');
  const router = useRouter();

  const ADMIN_PASSWORD = 'hpjh2025'; // 设置管理员密码

  const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setMessage('');
    } else {
      setMessage('密码错误');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/upload-excel', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      setMessage(result.message || result.error);
    } catch (error) {
      setMessage('上传失败');
    }
  };

  const handleClearSignatures = async () => {
    if (!confirm('确定要清除所有签名信息吗？此操作不可恢复！')) {
      return;
    }

    try {
      const response = await fetch('/api/clear-signatures', {
        method: 'POST',
      });
      const result = await response.json();
      setClearMessage(result.message || result.error);
    } catch (error) {
      setClearMessage('清除失败');
    }
  };

  const handleCleanupSignatures = async () => {
    if (!confirm('确定要清理重复的签名吗？每个昵称将只保留最新的一条记录。')) {
      return;
    }

    try {
      const response = await fetch('/api/cleanup-signatures', {
        method: 'POST',
      });
      const result = await response.json();
      setClearMessage(result.message || result.error);
    } catch (error) {
      setClearMessage('清理失败');
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4" style={{ backgroundImage: "url('/thanksgiving-bg.svg')" }}>
      <div className="bg-white bg-opacity-90 p-8 rounded-lg text-center max-w-md w-full">
        {!isAuthenticated ? (
          <>
            <h2 className="text-2xl font-bold mb-4">管理员验证</h2>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入管理员密码"
                className="w-full p-2 border border-gray-300 rounded mb-4"
                required
              />
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                验证密码
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">上传Excel文件</h2>
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
              <p className="font-bold">⚠️ 重要提醒</p>
              <p>上传新文件将清空所有之前的感恩信息，请谨慎操作！</p>
            </div>
            <form onSubmit={handleSubmit}>
              <input type="file" name="excel" accept=".xlsx,.xls" required className="mb-4" />
              <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
                上传并替换数据
              </button>
            </form>
            
            <hr className="my-6 border-gray-300" />
            
            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
              <p className="font-bold">ℹ️ 数据维护</p>
              <p>清理重复的昵称数据，只保留最新的一条。</p>
            </div>
            <button
              onClick={handleCleanupSignatures}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4 w-full"
            >
              清理重复签名
            </button>

            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
              <p className="font-bold">⚠️ 危险操作</p>
              <p>清除所有签名信息，此操作不可恢复！</p>
            </div>
            <button
              onClick={handleClearSignatures}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mb-4 w-full"
            >
              一键清除所有签名
            </button>
            {clearMessage && <p className="text-red-600 font-semibold">{clearMessage}</p>}
          </>
        )}
        {message && <p className={`mt-4 ${message === '密码错误' ? 'text-red-600' : 'text-green-600'} font-semibold`}>{message}</p>}
      </div>
      
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