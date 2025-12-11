'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MaintenancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleClearChristmasPhotos = async () => {
    if (!confirm('确定要清空您上传的所有圣诞树照片吗？此操作不可恢复！')) {
      return;
    }

    try {
      const res = await fetch('/api/christmas-photos', {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage('您的圣诞树照片已清空');
      } else {
        setMessage('清空失败');
      }
    } catch (error) {
      console.error('Error clearing photos:', error);
      setMessage('操作出错');
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  if (!session) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">数据维护中心</h1>
          <Link href="/" className="text-gray-600 hover:text-gray-800">
            返回首页
          </Link>
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
              清空您上传到圣诞树的所有照片。此操作将删除数据库记录和服务器上的文件。
            </p>
            <button
              onClick={handleClearChristmasPhotos}
              className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition-colors font-medium"
            >
              清空我的照片
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
