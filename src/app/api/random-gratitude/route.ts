import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // 直接从所有记录中随机选出一条，这样记录越多的人中奖概率越大
    // 排除 '陈统'
    const gratitude = db.prepare(`
      SELECT * FROM gratitudes 
      WHERE nickname != '陈统'
      ORDER BY RANDOM() 
      LIMIT 1
    `).get();

    if (!gratitude) {
      return NextResponse.json({ error: 'No gratitudes found' }, { status: 404 });
    }
    
    return NextResponse.json(gratitude);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch random gratitude' }, { status: 500 });
  }
}