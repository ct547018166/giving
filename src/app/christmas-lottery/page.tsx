import { auth } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import LotteryClient from './client';

export default async function LotteryPage() {
  const session = await auth();

  // Do not force redirect to login; allow checkPermission to determine guest access
  const hasPermission = await checkPermission('/christmas-lottery');
  if (!hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">访问被拒绝</h1>
          <p>您没有权限访问此页面。</p>
          <a href="/" className="mt-4 inline-block text-blue-400 hover:underline">返回首页</a>
        </div>
      </div>
    );
  }

  return <LotteryClient />;
}
