import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();

const srcDir = path.join(projectRoot, 'node_modules', '@mediapipe', 'hands');
const destDir = path.join(projectRoot, 'public', 'mediapipe', 'hands');

const shouldCopy = (fileName) => {
  // Keep it conservative: copy everything MediaPipe may request at runtime.
  // This avoids relying on external CDNs (unpkg/jsdelivr) which can be slow/blocked.
  const allowedExt = new Set([
    '.js',
    '.wasm',
    '.data',
    '.tflite',
    '.binarypb',
    '.mjs',
    '.json',
    '.txt',
    '.md',
  ]);
  const ext = path.extname(fileName);
  return allowedExt.has(ext);
};

const main = async () => {
  try {
    await fs.access(srcDir);
  } catch {
    console.error(`[copy-mediapipe-assets] Source not found: ${srcDir}`);
    process.exit(1);
  }

  await fs.mkdir(destDir, { recursive: true });

  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile()).map((e) => e.name);

  const toCopy = files.filter(shouldCopy);
  if (toCopy.length === 0) {
    console.error('[copy-mediapipe-assets] No files matched copy filter.');
    process.exit(1);
  }

  await Promise.all(
    toCopy.map(async (name) => {
      const from = path.join(srcDir, name);
      const to = path.join(destDir, name);
      await fs.copyFile(from, to);
    })
  );

  console.log(`[copy-mediapipe-assets] Copied ${toCopy.length} files to ${destDir}`);
};

main().catch((err) => {
  console.error('[copy-mediapipe-assets] Failed:', err);
  process.exit(1);
});
