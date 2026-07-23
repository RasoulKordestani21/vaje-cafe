import { NextRequest, NextResponse } from "next/server";
import { getDatabase, formatTimestamp } from "@/lib/database";
import { requireAdminAccess } from "@/lib/adminApiAuth";
import { compressAndSaveImage, validateImage, saveVideo, validateVideo, isVideoMime } from "@/lib/imageService";
import crypto from "crypto";

// GET photos for a gallery
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDatabase();
    const { id } = await Promise.resolve(params);

    const photos = db.prepare(`
      SELECT * FROM photos 
      WHERE gallery_id = ? 
      ORDER BY display_order ASC, created_at ASC
    `).all(id) as any[];

    const formattedPhotos = photos.map(p => ({
      ...p,
      createdAt: formatTimestamp(p.created_at),
    }));

    return NextResponse.json({ photos: formattedPhotos });
  } catch (error) {
    console.error("Photos GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    );
  }
}

// POST add photo to gallery (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAdminAccess(request);
  if (!auth.authorized) return auth.error;

  try {
    const db = getDatabase();
    const { id } = await Promise.resolve(params);
    const formData = await request.formData();
    
    const mediaFile = (formData.get("media") ?? formData.get("image")) as File | null;
    const caption = formData.get("caption") as string;
    const display_order = formData.get("display_order") as string;

    if (!mediaFile || mediaFile.size === 0) {
      return NextResponse.json(
        { error: "فایل تصویر یا ویدیو الزامی است" },
        { status: 400 }
      );
    }

    // Verify gallery exists
    const gallery = db.prepare("SELECT * FROM photo_galleries WHERE id = ?").get(id);
    if (!gallery) {
      return NextResponse.json(
        { error: "Gallery not found" },
        { status: 404 }
      );
    }

    const buffer = Buffer.from(await mediaFile.arrayBuffer());
    const isVideo = isVideoMime(mediaFile.type);
    let image_url: string;
    let media_type: "image" | "video" = "image";

    if (isVideo) {
      validateVideo(buffer, mediaFile.type);
      const saved = await saveVideo(buffer, mediaFile.name);
      image_url = saved.url;
      media_type = "video";
    } else {
      validateImage(buffer, mediaFile.type);
      const saved = await compressAndSaveImage(buffer, mediaFile.name, {
        width: 1200,
        height: 1200,
        quality: 85,
      });
      image_url = saved.url;
    }

    const photoId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    // Get max display_order if not provided
    let order = display_order ? parseInt(display_order) : undefined;
    if (order === undefined || order === null) {
      const maxOrder = db.prepare(`
        SELECT MAX(display_order) as max_order FROM photos WHERE gallery_id = ?
      `).get(id) as any;
      order = (maxOrder?.max_order || 0) + 1;
    }

    db.prepare(`
      INSERT INTO photos (id, gallery_id, image_url, caption, display_order, media_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(photoId, id, image_url, caption || null, order, media_type, now);

    const newPhoto = db.prepare("SELECT * FROM photos WHERE id = ?").get(photoId) as any;

    return NextResponse.json({
      ...newPhoto,
      createdAt: formatTimestamp(newPhoto.created_at),
    }, { status: 201 });
  } catch (error) {
    console.error("Photo POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add photo" },
      { status: 500 }
    );
  }
}
