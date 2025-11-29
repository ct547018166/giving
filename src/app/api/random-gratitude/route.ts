import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // 1. 先随机选出一个昵称
    const randomNickname = db.prepare(`
      SELECT nickname 
      FROM gratitudes 
      GROUP BY nickname 
      ORDER BY RANDOM() 
      LIMIT 1
    `).get() as { nickname: string } | undefined;

    if (!randomNickname) {
      return NextResponse.json({ error: 'No gratitudes found' }, { status: 404 });
    }

    // 2. 再从该昵称的所有记录中随机选出一条
    const gratitude = db.prepare(`
      SELECT * FROM gratitudes 
      WHERE nickname = ? 
      ORDER BY RANDOM() 
      LIMIT 1
    `).get(randomNickname.nickname);
    
    return NextResponse.json(gratitude);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch random gratitude' }, { status: 500 });
  }
}