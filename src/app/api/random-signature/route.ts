import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // 1. 先随机选出一个昵称
    const randomNickname = db.prepare(`
      SELECT nickname 
      FROM signatures 
      GROUP BY nickname 
      ORDER BY RANDOM() 
      LIMIT 1
    `).get() as { nickname: string } | undefined;

    if (!randomNickname) {
      return NextResponse.json({ error: 'No signatures found' }, { status: 404 });
    }

    // 2. 再从该昵称的所有记录中随机选出一条
    const signature = db.prepare(`
      SELECT * FROM signatures 
      WHERE nickname = ? 
      ORDER BY RANDOM() 
      LIMIT 1
    `).get(randomNickname.nickname);
    
    return NextResponse.json(signature);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch random signature' }, { status: 500 });
  }
}