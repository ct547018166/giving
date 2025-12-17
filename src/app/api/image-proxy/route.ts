
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

    // Normalize path to prevent traversal
    const safePath = path.normalize(imageUrl).replace(/^(\.\.[\/\\])+/, '');

    // Construct absolute path
    const absolutePath = path.join(process.cwd(), 'public', safePath);

    // Verify it starts with the correct uploads directory to prevent arbitrary file reading
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!absolutePath.startsWith(uploadsDir)) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    if (!fs.existsSync(absolutePath)) {
        return new NextResponse('File not found', { status: 404 });
    }

    try {
        const fileBuffer = fs.readFileSync(absolutePath);

        // Check if it needs conversion
        const isHeic = safePath.toLowerCase().endsWith('.heic') || safePath.toLowerCase().endsWith('.heif');

        // Cache headers
        const headers = {
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Content-Type': 'image/jpeg', // We will output JPEG
        };

        let outputBuffer;

        // Always run through sharp for optimization/resizing if needed, 
        // but definitely for HEIC conversion.
        // Even for JPEGs, resizing them here (if ?w= is provided) is good practice, 
        // but for now let's just solve the HEIC compatibility.

        // Note: older sharp versions might need specific heic install, but we checked heic-convert before.
        // However, sharp is much faster if it works. 
        // If sharp fails on HEIC, we can try heic-convert as fallback, similar to the upload route.

        try {
            const pipeline = sharp(fileBuffer);
            // Auto-rotate based on EXIF
            pipeline.rotate();

            // Convert to JPEG
            pipeline.jpeg({ quality: 80, mozjpeg: true });

            outputBuffer = await pipeline.toBuffer();
        } catch (sharpError) {
            console.warn('Sharp processing failed, trying heic-convert fallback', sharpError);
            // Fallback for HEIC if sharp lacks codec
            if (isHeic) {
                const heicConvert = require('heic-convert');
                outputBuffer = await heicConvert({
                    buffer: fileBuffer,
                    format: 'JPEG',
                    quality: 0.8
                });
            } else {
                throw sharpError;
            }
        }

        return new NextResponse(outputBuffer, { headers });

    } catch (error) {
        console.error('Image proxy error:', error);
        return new NextResponse('Error processing image', { status: 500 });
    }
}
