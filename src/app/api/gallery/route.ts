import { NextRequest, NextResponse } from "next/server";
import { getDatabase, formatTimestamp } from "@/lib/database";
import { ensureAdmin } from "@/lib/auth";
import { compressAndSaveImage, validateImage } from "@/lib/imageService";
import crypto from "crypto";

// GET all galleries (public - no auth required)
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const includePhotos = searchParams.get("include_photos") === "true";

    let galleries;
    if (includePhotos) {
      // Get galleries with photos
      galleries = db.prepare(`
        SELECT g.*, 
               COUNT(p.id) as photo_count
        FROM photo_galleries g
        LEFT JOIN photos p ON g.id = p.gallery_id
        WHERE g.is_active = 1
        GROUP BY g.id
        ORDER BY g.display_order ASC, g.created_at DESC
      `).all() as any[];

      // Get photos for each gallery
      for (const gallery of galleries) {
        const photos = db.prepare(`
          SELECT * FROM photos 
          WHERE gallery_id = ? 
          ORDER BY display_order ASC, created_at ASC
        `).all(gallery.id) as any[];

        gallery.photos = photos.map(p => ({
          ...p,
          createdAt: formatTimestamp(p.created_at),
        }));
      }
    } else {
      // Get galleries only
      galleries = db.prepare(`
        SELECT g.*, 
               COUNT(p.id) as photo_count
        FROM photo_galleries g
        LEFT JOIN photos p ON g.id = p.gallery_id
        WHERE g.is_active = 1
        GROUP BY g.id
        ORDER BY g.display_order ASC, g.created_at DESC
      `).all() as any[];
    }

    const formattedGalleries = galleries.map(g => ({
      ...g,
      is_active: Boolean(g.is_active),
      photo_count: Number(g.photo_count || 0),
      created_at: formatTimestamp(g.created_at),
      updated_at: formatTimestamp(g.updated_at),
    }));

    return NextResponse.json({ galleries: formattedGalleries });
  } catch (error) {
    console.error("Gallery GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch galleries" },
      { status: 500 }
    );
  }
}

// POST create new gallery (admin only)
export async function POST(request: NextRequest) {
  const authErr = ensureAdmin(request);
  if (authErr) return authErr;

  try {
    const db = getDatabase();
    const formData = await request.formData();
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const display_order = formData.get('display_order') as string;
    const is_active = formData.get('is_active') as string;
    const coverImageFile = formData.get('cover_image') as File | null;

    if (!title) {
      return NextResponse.json(
        { error: "عنوان گالری الزامی است" },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    // Handle cover image upload if provided
    let cover_image = null;
    if (coverImageFile) {
      const buffer = Buffer.from(await coverImageFile.arrayBuffer());
      validateImage(buffer, coverImageFile.type);
      const { url } = await compressAndSaveImage(buffer, coverImageFile.name, {
        width: 1200,
        height: 800,
        quality: 85
      });
      cover_image = url;
    }

    // Get max display_order if not provided
    let order = display_order ? parseInt(display_order) : undefined;
    if (order === undefined || order === null) {
      const maxOrder = db.prepare(`
        SELECT MAX(display_order) as max_order FROM photo_galleries
      `).get() as any;
      order = (maxOrder?.max_order || 0) + 1;
    }

    db.prepare(`
      INSERT INTO photo_galleries (id, title, description, cover_image, display_order, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title,
      description || null,
      cover_image || null,
      order,
      is_active === 'true' ? 1 : (is_active === 'false' ? 0 : 1),
      now,
      now
    );

    const newGallery = db.prepare("SELECT * FROM photo_galleries WHERE id = ?").get(id) as any;

    return NextResponse.json({
      ...newGallery,
      is_active: Boolean(newGallery.is_active),
      created_at: formatTimestamp(newGallery.created_at),
      updated_at: formatTimestamp(newGallery.updated_at),
    }, { status: 201 });
  } catch (error) {
    console.error("Gallery POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create gallery" },
      { status: 500 }
    );
  }
}
