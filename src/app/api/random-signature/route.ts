import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM signatures').get() as { count: number };
    if (count.count === 0) {
      return NextResponse.json({ error: 'No signatures found' }, { status: 404 });
    }
    const random = Math.floor(Math.random() * count.count);
    const signature = db.prepare('SELECT * FROM signatures LIMIT 1 OFFSET ?').get(random);
    return NextResponse.json(signature);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch random signature' }, { status: 500 });
  }
}