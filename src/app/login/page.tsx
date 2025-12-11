'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    if (result?.ok) {
      router.push('/');
      router.refresh();
    } else {
      setError('登录失败，请检查用户名或密码');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-white/10 p-8 rounded-xl backdrop-blur-md w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">登录</h1>
        
        <div className="space-y-4">
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 rounded bg-black/20 border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded bg-black/20 border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors"
            >
              登录
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-400">还没有账号？</span>
            <Link href="/register" className="text-green-400 hover:underline ml-2">
              去注册
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
