import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = db.prepare('SELECT id, name, email, role, created_at FROM users').all();
  return NextResponse.json(users);
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, role } = await request.json();
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
  
  return NextResponse.json({ success: true });
}
