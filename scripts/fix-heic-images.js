
const fs = require('fs');
const path = require('path');

// Try to require dependencies, handle if missing (e.g. during partial install)
let heicConvert;
let db;

try {
    heicConvert = require('heic-convert');
    const Database = require('better-sqlite3');
    // Check if database exists
    if (fs.existsSync('database.db')) {
        db = new Database('database.db');
    }
} catch (e) {
    console.warn('Skipping HEIC fix: dependencies not ready or DB missing.', e.message);
    process.exit(0);
}

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'christmas');

async function main() {
    if (!db) {
        console.log('No database.db found, skipping fix.');
        return;
    }

    if (!fs.existsSync(UPLOAD_DIR)) {
        console.log('Upload directory does not exist, skipping fix.');
        return;
    }

    const files = fs.readdirSync(UPLOAD_DIR);
    // Find files that are physically HEIC
    const heicFiles = files.filter(f => f.toLowerCase().endsWith('.heic'));

    if (heicFiles.length === 0) {
        console.log('No HEIC files found to convert.');
        return;
    }

    console.log(`Found ${heicFiles.length} HEIC files.`);

    for (const file of heicFiles) {
        const filePath = path.join(UPLOAD_DIR, file);
        try {
            console.log(`Converting ${file}...`);
            const inputBuffer = fs.readFileSync(filePath);

            const outputBuffer = await heicConvert({
                buffer: inputBuffer,
                format: 'JPEG',
                quality: 0.8
            });

            const newFilename = file.replace(/\.heic$/i, '.jpg');
            const newFilePath = path.join(UPLOAD_DIR, newFilename);

            fs.writeFileSync(newFilePath, outputBuffer);
            console.log(`Saved ${newFilename}`);

            // Update Database
            const oldUrl = `/uploads/christmas/${file}`;
            const newUrl = `/uploads/christmas/${newFilename}`;

            const result = db.prepare('UPDATE christmas_photos SET url = ? WHERE url = ?').run(newUrl, oldUrl);

            if (result.changes > 0) {
                console.log(`Updated database for ${file}`);
                // Delete original file
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.error('Failed to delete original file:', e);
                }
            } else {
                console.warn(`Warning: Could not find DB record for ${oldUrl}. File converted but DB not updated.`);
                // Delete original anyway to save space? 
                // Safer to keep it if we are not sure, but the user wants them fixed.
                // If it's not in DB, it's not displayed on tree anyway.
                // If it WAS in DB but with a different URL format? Unlikely.
                // Let's check if there are entries with the HEIC extension that simply weren't found?
                // Maybe the URL in DB is full path? Route says: /uploads/christmas/...

                // Let's try to find if there is ANY record ending in this filename
                // sometimes path separators differ?
                const fuzzyMatch = db.prepare('SELECT url FROM christmas_photos WHERE url LIKE ?').get(`%/${file}`);
                if (fuzzyMatch) {
                    console.log(`Found fuzzy match for ${file}: ${fuzzyMatch.url}`);
                    db.prepare('UPDATE christmas_photos SET url = ? WHERE url = ?').run(newUrl, fuzzyMatch.url);
                    console.log('Updated fuzzy match.');
                    try { fs.unlinkSync(filePath); } catch (e) { }
                }
            }

        } catch (error) {
            console.error(`Failed to convert ${file}:`, error);
        }
    }

    console.log('HEIC fix completed.');
}

if (heicConvert) {
    main();
}
