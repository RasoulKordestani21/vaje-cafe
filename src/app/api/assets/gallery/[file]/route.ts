import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { file: string } }
) {
  try {
    const { file } = await Promise.resolve(params);
    
    // Sanitize filename
    const sanitizedFile = path.basename(file);
    
    const externalAssetsDir = process.env.EXTERNAL_ASSETS_DIR;
    let filePath: string;
    
    if (externalAssetsDir) {
      const resolvedPath = externalAssetsDir.startsWith("../")
        ? path.resolve(process.cwd(), externalAssetsDir)
        : externalAssetsDir;
      filePath = path.join(resolvedPath, "gallery", sanitizedFile);
    } else {
      filePath = path.join(process.cwd(), "public", "uploads", "gallery", sanitizedFile);
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(sanitizedFile).toLowerCase();

    const contentType = ext === ".webp" 
      ? "image/webp"
      : ext === ".jpg" || ext === ".jpeg"
      ? "image/jpeg"
      : ext === ".png"
      ? "image/png"
      : "image/webp";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Gallery asset serve error:", error);
    return NextResponse.json(
      { error: "Failed to serve file" },
      { status: 500 }
    );
  }
}



