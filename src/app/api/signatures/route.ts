import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // 只获取每个昵称的最新一条签名
    const signatures = db.prepare(`
      SELECT * FROM signatures 
      WHERE id IN (
        SELECT MAX(id) 
        FROM signatures 
        GROUP BY nickname
      )
      ORDER BY id DESC
    `).all();
    return NextResponse.json(signatures);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch signatures' }, { status: 500 });
  }
}