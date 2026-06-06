import { NextRequest, NextResponse } from "next/server";
import { ensureAdmin } from "@/lib/auth";
import { compressAndSaveImage, validateImage } from "@/lib/imageService";

export async function POST(request: NextRequest) {
  // Use same auth as menu - ensureAdmin checks x-access-token header
  const authErr = ensureAdmin(request);
  if (authErr) return authErr;

  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { error: "فایل تصویر الزامی است" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    validateImage(buffer, imageFile.type);

    // Use same imageService as menu - saves to uploads folder
    const { fileName, url } = await compressAndSaveImage(buffer, imageFile.name, {
      width: 1200,
      height: 1200,
      quality: 85
    });

    return NextResponse.json({
      success: true,
      fileName,
      url
    });
  } catch (error: any) {
    console.error("Gallery image upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}

