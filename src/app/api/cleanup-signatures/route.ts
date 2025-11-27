import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST() {
  try {
    // Delete duplicates, keeping the one with the highest ID (latest)
    const result = db.prepare(`
      DELETE FROM signatures 
      WHERE id NOT IN (
        SELECT MAX(id) 
        FROM signatures 
        GROUP BY nickname
      )
    `).run();
    
    return NextResponse.json({ 
      message: `清理成功，共删除了 ${result.changes} 条重复记录` 
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: '清理失败' }, { status: 500 });
  }
}
