import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

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
    const externalAssetsDir = process.env.EXTERNAL_ASSETS_DIR;

    // Resolve the base directory
    let baseDir: string;
    if (externalAssetsDir) {
      if (externalAssetsDir.startsWith('../')) {
        baseDir = path.resolve(process.cwd(), externalAssetsDir);
      } else {
        baseDir = externalAssetsDir;
      }
      baseDir = path.join(baseDir, 'site-settings');
    } else {
      baseDir = path.join(process.cwd(), 'public', 'uploads', 'site-settings');
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
    console.error('Site settings asset GET error:', e);
    return NextResponse.json({ error: 'Failed to read asset' }, { status: 500 });
  }
}



