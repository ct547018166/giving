
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
        return new NextResponse('Missing url parameter', { status: 400 });
    }

    // Security: only allow accessing files in the uploads directory
    // The url comes in as `/uploads/christmas/filename.HEIC`
    // We need to map this to the filesystem.
    // Assumes public folder structure.

    // Decode URL in case (though we expect generated safe filenames)
    const decodedUrl = decodeURIComponent(imageUrl);
    const safePath = path.normalize(decodedUrl).replace(/^(\.\.[\/\\])+/, '');

    // Construct absolute path
    const absolutePath = path.join(process.cwd(), 'public', safePath);

    // Identify file type
    const isHeic = safePath.toLowerCase().endsWith('.heic') || safePath.toLowerCase().endsWith('.heif');

    // Verify it starts with the correct uploads directory to prevent arbitrary file reading
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!absolutePath.startsWith(uploadsDir)) {
        console.error('Forbidden access attempt:', absolutePath);
        return new NextResponse('Forbidden', { status: 403 });
    }

    if (!fs.existsSync(absolutePath)) {
        console.error('File not found:', absolutePath);
        return new NextResponse('File not found', { status: 404 });
    }

    try {
        const fileBuffer = fs.readFileSync(absolutePath);

        // Cache headers
        const headers = {
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Content-Type': 'image/jpeg',
        };

        let outputBuffer;

        if (isHeic) {
            // FORCE fallback to heic-convert because sharp on this server implies no HEIC support
            // (proven by previous execution logs showing 'heif: Error while loading plugin')
            console.log(`Converting HEIC via heic-convert: ${safePath}`);
            try {
                // Dynamic require to ensure it's loaded
                const heicConvert = require('heic-convert');
                outputBuffer = await heicConvert({
                    buffer: fileBuffer,
                    format: 'JPEG',
                    quality: 0.7 // Lower quality slightly to save memory/cpu
                });
            } catch (heicError) {
                console.error('heic-convert failed:', heicError);
                return new NextResponse('Conversion failed', { status: 500 });
            }
        } else {
            // Standard image processing for other formats
            try {
                const pipeline = sharp(fileBuffer);
                pipeline.rotate();
                pipeline.jpeg({ quality: 80, mozjpeg: true });
                outputBuffer = await pipeline.toBuffer();
            } catch (sharpError) {
                console.error('Sharp processing failed:', sharpError);
                // Fallback: return original buffer if simple processing fails
                // But we must serve allow generic content type if we do that, or hope it's jpeg compatible
                return new NextResponse(fileBuffer, {
                    headers: {
                        'Cache-Control': 'public, max-age=31536000, immutable'
                        // Let browser sniff type if we return raw
                    }
                });
            }
        }

        return new NextResponse(outputBuffer, { headers });

    } catch (error) {
        console.error('Image proxy error:', error);
        return new NextResponse('Error processing image', { status: 500 });
    }
}
