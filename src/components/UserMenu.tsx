'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export default function UserMenu() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="space-y-3 mb-4">
        <Link 
          href="/login" 
          className="block w-full py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg transition-all border border-blue-400"
        >
          🔑 登录账号
        </Link>
        <Link 
          href="/register" 
          className="block w-full py-3 px-6 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-lg transition-all border border-green-400"
        >
          📝 注册账号
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-300 mb-2">
        欢迎, {session.user?.name} ({session.user?.role})
      </div>
      
      {session.user?.role === 'admin' && (
        <Link 
          href="/admin" 
          className="block w-full py-3 px-6 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-lg transition-all border border-purple-400"
        >
          ⚙️ 管理后台
        </Link>
      )}

      <button 
        onClick={() => signOut({ callbackUrl: '/' })}
        className="block w-full py-3 px-6 bg-gray-600 hover:bg-gray-500 text-white rounded-xl font-bold text-lg transition-all border border-gray-400"
      >
        🚪 退出登录
      </button>
    </div>
  );
}
