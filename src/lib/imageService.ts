import sharp from "sharp";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Allow storing assets outside the project using EXTERNAL_ASSETS_DIR env var.
// Example (sibling folder): ../vaje-cafe-assets
const externalAssetsDir = process.env.EXTERNAL_ASSETS_DIR;
console.log("Using external assets dir:", externalAssetsDir);

let uploadDir = path.join(process.cwd(), "public", "uploads");

if (externalAssetsDir) {
  // If provided a directory, ensure it exists and use it
  try {
    // Handle relative paths like ../vaje-cafe-assets
    const resolvedPath = externalAssetsDir.startsWith("../")
      ? path.resolve(process.cwd(), externalAssetsDir)
      : externalAssetsDir;

    if (!fs.existsSync(resolvedPath)) {
      fs.mkdirSync(resolvedPath, { recursive: true });
    }
    uploadDir = resolvedPath;
    console.log("Resolved assets directory:", uploadDir);
  } catch (e) {
    console.warn(
      "Could not use EXTERNAL_ASSETS_DIR, falling back to public/uploads",
      e
    );
  }
}

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

interface CompressOptions {
  width?: number;
  height?: number;
  quality?: number;
}

/**
 * Compress and save image
 * Returns the public URL path to the compressed image
 */
export async function compressAndSaveImage(
  buffer: Buffer,
  originalFileName: string,
  options: CompressOptions = {}
): Promise<{ fileName: string; url: string }> {
  const { width = 800, height = 600, quality = 80 } = options;

  try {
    // Generate unique filename
    const ext = path.extname(originalFileName);
    const baseName = path.basename(originalFileName, ext);
    const random = crypto.randomBytes(8).toString("hex");
    const outFileName = `${baseName}-${random}.webp`;
    const filePath = path.join(uploadDir, outFileName);

    // Compress image using sharp and save as WebP
    await sharp(buffer)
      .resize(width, height, {
        fit: "cover",
        position: "center"
      })
      .webp({ quality })
      .toFile(filePath);

    // Public URL: if using project public/uploads, keep same URL path
    let url = `/uploads/${outFileName}`;
    if (externalAssetsDir) {
      // If assets are stored externally, serve via API route
      url = `/api/assets/${outFileName}`;
    }

    return {
      fileName: outFileName,
      url
    };
  } catch (error) {
    console.error("Image compression error:", error);
    throw new Error(
      `Failed to compress image: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Delete image file
 */
export function deleteImage(fileName: string): boolean {
  try {
    const filePath = path.join(uploadDir, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error deleting image:", error);
    return false;
  }
}

/** Extract stored filename from a public upload URL */
export function urlToFileName(url: string): string | null {
  if (url.startsWith("/uploads/")) return url.slice("/uploads/".length);
  if (url.startsWith("/api/assets/")) return url.slice("/api/assets/".length);
  return null;
}

/** Delete a stored media file by its public URL */
export function deleteMediaByUrl(url: string): boolean {
  const fileName = urlToFileName(url);
  if (!fileName) return false;
  return deleteImage(fileName);
}

const VIDEO_MIMES = ["video/mp4", "video/webm", "video/quicktime"];
const VIDEO_EXTS = [".mp4", ".webm", ".mov"];

export function isVideoMime(mimetype: string): boolean {
  return VIDEO_MIMES.includes(mimetype) || mimetype.startsWith("video/");
}

/**
 * Validate video file
 */
export function validateVideo(buffer: Buffer, mimetype: string): boolean {
  const maxSize = 50 * 1024 * 1024; // 50MB

  if (!isVideoMime(mimetype)) {
    throw new Error("فرمت ویدیو پشتیبانی نمی‌شود. MP4، WebM یا MOV مجاز است.");
  }

  if (buffer.length > maxSize) {
    throw new Error("حجم ویدیو نباید بیشتر از ۵۰ مگابایت باشد.");
  }

  return true;
}

/**
 * Save video file as-is (no transcoding)
 */
export async function saveVideo(
  buffer: Buffer,
  originalFileName: string
): Promise<{ fileName: string; url: string }> {
  let ext = path.extname(originalFileName).toLowerCase();
  if (!VIDEO_EXTS.includes(ext)) {
    ext = ".mp4";
  }
  const random = crypto.randomBytes(8).toString("hex");
  const outFileName = `video-${random}${ext}`;
  const filePath = path.join(uploadDir, outFileName);

  fs.writeFileSync(filePath, buffer);

  let url = `/uploads/${outFileName}`;
  if (externalAssetsDir) {
    url = `/api/assets/${outFileName}`;
  }

  return { fileName: outFileName, url };
}

/**
 * Validate image file
 */
export function validateImage(buffer: Buffer, mimetype: string): boolean {
  const validMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validMimes.includes(mimetype)) {
    throw new Error(
      "Invalid image type. Only JPEG, PNG, WebP, and GIF are allowed."
    );
  }

  if (buffer.length > maxSize) {
    throw new Error("Image size exceeds 5MB limit.");
  }

  return true;
}
