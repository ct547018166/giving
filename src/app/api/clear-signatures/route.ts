import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST() {
  try {
    // 清除所有签名数据
    const result = db.prepare('DELETE FROM signatures').run();

    return NextResponse.json({
      message: `成功清除 ${result.changes} 条签名信息`,
      cleared: result.changes
    });
  } catch (error) {
    console.error('Error clearing signatures:', error);
    return NextResponse.json({ error: '清除签名失败' }, { status: 500 });
  }
}