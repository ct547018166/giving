import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: urlPath } = await params;
  const filePath = path.join(process.cwd(), 'public', 'uploads', ...urlPath);

  const { searchParams } = new URL(request.url);
  const widthParam = searchParams.get('w') || searchParams.get('width');
  const qualityParam = searchParams.get('q') || searchParams.get('quality');
  const requestedWidth = widthParam ? Number.parseInt(widthParam, 10) : null;
  const requestedQuality = qualityParam ? Number.parseInt(qualityParam, 10) : 80;

  if (!fs.existsSync(filePath)) {
    return new NextResponse('File not found', { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();

  const isRasterImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
  const shouldOptimize =
    isRasterImage &&
    requestedWidth != null &&
    Number.isFinite(requestedWidth) &&
    requestedWidth > 0;

  if (shouldOptimize) {
    const w = Math.min(2048, Math.max(64, requestedWidth!));
    const q = Math.min(95, Math.max(40, Number.isFinite(requestedQuality) ? requestedQuality : 80));

    const rel = urlPath.join('/');
    const key = crypto.createHash('sha1').update(`${rel}|w=${w}|q=${q}|fmt=webp`).digest('hex');
    const cacheDir = path.join(process.cwd(), 'public', 'uploads', '.cache');
    const cachedPath = path.join(cacheDir, `${key}.webp`);

    try {
      if (fs.existsSync(cachedPath)) {
        const cachedBuffer = fs.readFileSync(cachedPath);
        return new NextResponse(new Uint8Array(cachedBuffer), {
          headers: {
            'Content-Type': 'image/webp',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }

      const originalBuffer = fs.readFileSync(filePath);
      const optimizedBuffer = await sharp(originalBuffer)
        .rotate()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: q })
        .toBuffer();

      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      fs.writeFileSync(cachedPath, optimizedBuffer);

      return new NextResponse(new Uint8Array(optimizedBuffer), {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (e) {
      // Fallback to original file below
      console.warn('Image optimize failed, serving original:', e);
    }
  }

  const fileBuffer = fs.readFileSync(filePath);
  
  let contentType = 'application/octet-stream';
  
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      contentType = 'image/jpeg';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.gif':
      contentType = 'image/gif';
      break;
    case '.webp':
      contentType = 'image/webp';
      break;
    case '.svg':
      contentType = 'image/svg+xml';
      break;
  }

  return new NextResponse(new Uint8Array(fileBuffer), {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
