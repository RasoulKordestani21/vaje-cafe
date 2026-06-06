import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Serve files from external assets dir if set, otherwise from public/uploads
const externalAssetsDir = process.env.EXTERNAL_ASSETS_DIR;
const protectExternal = process.env.PROTECT_EXTERNAL_ASSETS === '1';

function getMimeType(name: string) {
  const ext = path.extname(name).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.mp4':
      return 'video/mp4';
    case '.mp3':
      return 'audio/mpeg';
    default:
      return 'application/octet-stream';
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { file: string } }
) {
  try {
    const fileName = params.file;

    // If external protection enabled, verify token
    if (protectExternal && externalAssetsDir) {
      const { ensureAdmin } = await import('@/lib/auth');
      const err = ensureAdmin(_request);
      if (err) return err;
    }

    // Resolve the base directory - handle relative paths properly
    let baseDir: string;
    if (externalAssetsDir) {
      // If it's a relative path, resolve from process.cwd()
      if (externalAssetsDir.startsWith('../')) {
        baseDir = path.resolve(process.cwd(), externalAssetsDir);
      } else {
        baseDir = externalAssetsDir;
      }
    } else {
      baseDir = path.join(process.cwd(), 'public', 'uploads');
    }
    
    const filePath = path.join(baseDir, fileName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const data = await fs.promises.readFile(filePath);
    const mime = getMimeType(fileName);

    return new NextResponse(data, {
      status: 200,
      headers: { 'Content-Type': mime },
    });
  } catch (e) {
    console.error('Asset GET error:', e);
    return NextResponse.json({ error: 'Failed to read asset' }, { status: 500 });
  }
}
