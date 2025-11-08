import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const signatures = db.prepare('SELECT * FROM signatures').all();
    return NextResponse.json(signatures);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch signatures' }, { status: 500 });
  }
}