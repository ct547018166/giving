import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  // Allow guests to read settings? Maybe not. But the app needs to know.
  // For admin page, we definitely need it.
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = db.prepare('SELECT * FROM system_settings').all();
  const settingsMap = settings.reduce((acc: any, curr: any) => {
    acc[curr.key] = JSON.parse(curr.value);
    return acc;
  }, {});

  return NextResponse.json(settingsMap);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { key, value } = await request.json();
  
  db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
  
  return NextResponse.json({ success: true });
}
