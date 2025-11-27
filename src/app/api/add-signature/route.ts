import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { nickname, signature } = await request.json();

    if (!nickname || !signature) {
      return NextResponse.json({ error: '昵称和签名不能为空' }, { status: 400 });
    }

    // 使用事务处理：删除该昵称的所有旧记录，插入新记录
    // 这样可以确保每个昵称在数据库中只有一条（最新的）记录
    const updateSignature = db.transaction(() => {
      db.prepare('DELETE FROM signatures WHERE nickname = ?').run(nickname);
      db.prepare('INSERT INTO signatures (nickname, signature) VALUES (?, ?)').run(nickname, signature);
    });

    updateSignature();

    return NextResponse.json({ message: '提交成功' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to add signature' }, { status: 500 });
  }
}