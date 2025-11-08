import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM gratitudes').get() as { count: number };
    if (count.count === 0) {
      return NextResponse.json({ error: 'No gratitudes found' }, { status: 404 });
    }
    const random = Math.floor(Math.random() * count.count);
    const gratitude = db.prepare('SELECT * FROM gratitudes LIMIT 1 OFFSET ?').get(random);
    return NextResponse.json(gratitude);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch random gratitude' }, { status: 500 });
  }
}