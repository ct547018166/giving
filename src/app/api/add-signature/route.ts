import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { nickname, signature } = await request.json();
    const insert = db.prepare('INSERT INTO signatures (nickname, signature) VALUES (?, ?)');
    insert.run(nickname, signature);
    return NextResponse.json({ message: '提交成功' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to add signature' }, { status: 500 });
  }
}