import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // 从去重后的数据中随机抽取一条
    const signature = db.prepare(`
      SELECT * FROM signatures 
      WHERE id IN (
        SELECT MAX(id) 
        FROM signatures 
        GROUP BY nickname
      )
      ORDER BY RANDOM() 
      LIMIT 1
    `).get();

    if (!signature) {
      return NextResponse.json({ error: 'No signatures found' }, { status: 404 });
    }
    
    return NextResponse.json(signature);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch random signature' }, { status: 500 });
  }
}