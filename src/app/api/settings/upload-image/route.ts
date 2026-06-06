import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/authMiddleware";
import { validateImage } from "@/lib/imageService";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Get site settings upload directory
const getSiteSettingsUploadDir = () => {
  const externalAssetsDir = process.env.EXTERNAL_ASSETS_DIR;
  let uploadDir: string;
  
  if (externalAssetsDir) {
    const resolvedPath = externalAssetsDir.startsWith("../")
      ? path.resolve(process.cwd(), externalAssetsDir)
      : externalAssetsDir;
    uploadDir = path.join(resolvedPath, "site-settings");
  } else {
    uploadDir = path.join(process.cwd(), "public", "uploads", "site-settings");
  }
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  return { uploadDir, isExternal: !!externalAssetsDir };
};

export async function POST(request: NextRequest) {
  try {
    const { user, error } = validateSession(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only super_admin can upload settings images
    if (user.role !== "super_admin") {
      return NextResponse.json(
        { error: "شما دسترسی ندارید" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;
    const type = formData.get("type") as string; // "logo", "favicon", "banner"

    if (!imageFile) {
      return NextResponse.json(
        { error: "فایل تصویر الزامی است" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    validateImage(buffer, imageFile.type);

    const { uploadDir, isExternal } = getSiteSettingsUploadDir();
    
    // Generate unique filename
    const ext = path.extname(imageFile.name);
    const baseName = path.basename(imageFile.name, ext);
    const random = crypto.randomBytes(8).toString("hex");
    const outFileName = `${baseName}-${random}.webp`;
    const filePath = path.join(uploadDir, outFileName);

    // Compression options based on type
    const options = type === "favicon" 
      ? { width: 32, height: 32, quality: 100 }
      : type === "logo"
      ? { width: 200, height: 200, quality: 90 }
      : { width: 1200, height: 400, quality: 80 };

    // Compress and save image
    await sharp(buffer)
      .resize(options.width, options.height, {
        fit: type === "favicon" ? "cover" : "inside",
        position: "center"
      })
      .webp({ quality: options.quality })
      .toFile(filePath);

    // Generate public URL
    let url: string;
    if (isExternal) {
      url = `/api/assets/site-settings/${outFileName}`;
    } else {
      url = `/uploads/site-settings/${outFileName}`;
    }

    return NextResponse.json({
      success: true,
      fileName: outFileName,
      url
    });
  } catch (error: any) {
    console.error("Settings image upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}

