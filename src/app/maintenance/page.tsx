'use client';

import { useState } from 'react';

export default function MaintenancePage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'hpjh2025') {
      setIsAuthenticated(true);
      setMessage('');
    } else {
      setMessage('密码错误');
    }
  };

  const handleClearChristmasPhotos = async () => {
    if (!confirm('确定要清空所有圣诞树照片吗？此操作不可恢复！')) {
      return;
    }

    try {
      const res = await fetch('/api/christmas-photos', {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage('圣诞树照片已清空');
      } else {
        setMessage('清空失败');
      }
    } catch (error) {
      console.error('Error clearing photos:', error);
      setMessage('操作出错');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">数据维护 - 登录</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black"
                placeholder="请输入管理员密码"
              />
            </div>
            {message && <p className="text-red-500 text-sm">{message}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              进入维护系统
            </button>
          </form>
          <div className="mt-4 text-center">
            <a href="/menu" className="text-gray-500 hover:text-gray-700 text-sm">返回菜单</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">数据维护中心</h1>
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="text-gray-600 hover:text-gray-800"
          >
            退出登录
          </button>
        </div>

        {message && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded">
            {message}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Christmas Photos Maintenance */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              <span>🎄</span> 圣诞树照片管理
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              清空所有用户上传到圣诞树的照片。此操作将删除数据库记录和服务器上的文件。
            </p>
            <button
              onClick={handleClearChristmasPhotos}
              className="w-full bg-red-600 text-white py-3 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              清空所有照片
            </button>
          </div>

          {/* Placeholder for other maintenance tasks */}
          <div className="bg-white p-6 rounded-lg shadow-md opacity-50">
            <h2 className="text-xl font-bold mb-4 text-gray-800">其他数据</h2>
            <p className="text-gray-600 mb-6 text-sm">
              更多数据维护功能开发中...
            </p>
          </div>
        </div>
        
        <div className="mt-12 text-center">
            <a href="/menu" className="inline-block bg-gray-200 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-300 transition-colors">
                返回主菜单
            </a>
        </div>
      </div>
    </div>
  );
}
