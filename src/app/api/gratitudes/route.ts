import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const gratitudes = db.prepare('SELECT * FROM gratitudes').all();
    return NextResponse.json(gratitudes);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch gratitudes' }, { status: 500 });
  }
}