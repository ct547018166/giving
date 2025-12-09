import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'christmas');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function GET() {
  try {
    const photos = db.prepare('SELECT url FROM christmas_photos ORDER BY created_at ASC').all();
    return NextResponse.json(photos.map((p: any) => p.url));
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Simple unique filename generation
    const ext = path.extname(file.name);
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    fs.writeFileSync(filepath, buffer);

    const url = `/uploads/christmas/${filename}`;
    db.prepare('INSERT INTO christmas_photos (url) VALUES (?)').run(url);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    // Get all photos to delete files
    const photos = db.prepare('SELECT url FROM christmas_photos').all();
    
    // Delete files
    photos.forEach((p: any) => {
      const filename = path.basename(p.url);
      const filepath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    });

    // Clear database
    db.prepare('DELETE FROM christmas_photos').run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing photos:', error);
    return NextResponse.json({ error: 'Failed to clear photos' }, { status: 500 });
  }
}
