import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { auth } from '@/lib/auth';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'christmas');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const photos = db.prepare('SELECT url FROM christmas_photos WHERE user_id = ? ORDER BY created_at ASC').all(session.user.id);
    return NextResponse.json(photos.map((p: any) => p.url));
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    db.prepare('INSERT INTO christmas_photos (url, user_id) VALUES (?, ?)').run(url, session.user.id);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const urlToDelete = searchParams.get('url');
    const targetUserId = searchParams.get('userId');

    // Determine which user's photos to delete
    let targetId = session.user.id;
    
    // Allow admin to delete other user's photos
    if (targetUserId && session.user.role === 'admin') {
      targetId = targetUserId;
    }

    if (urlToDelete) {
      // Delete single photo
      const photo = db.prepare('SELECT url FROM christmas_photos WHERE user_id = ? AND url = ?').get(targetId, urlToDelete) as { url: string } | undefined;
      
      if (photo) {
        const filename = path.basename(photo.url);
        const filepath = path.join(UPLOAD_DIR, filename);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
        db.prepare('DELETE FROM christmas_photos WHERE user_id = ? AND url = ?').run(targetId, urlToDelete);
      }
    } else {
      // Delete all photos for the target user
      const photos = db.prepare('SELECT url FROM christmas_photos WHERE user_id = ?').all(targetId);
      
      // Delete files
      photos.forEach((p: any) => {
        const filename = path.basename(p.url);
        const filepath = path.join(UPLOAD_DIR, filename);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      });

      // Clear database for this user
      db.prepare('DELETE FROM christmas_photos WHERE user_id = ?').run(targetId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing photos:', error);
    return NextResponse.json({ error: 'Failed to clear photos' }, { status: 500 });
  }
}
