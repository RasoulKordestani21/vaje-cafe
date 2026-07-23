import { NextRequest, NextResponse } from "next/server";
import { getDatabase, formatTimestamp } from "@/lib/database";
import { requireAdminAccess } from "@/lib/adminApiAuth";
import { compressAndSaveImage, validateImage, deleteMediaByUrl } from "@/lib/imageService";

// GET single gallery with photos
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDatabase();
    const { id } = await Promise.resolve(params);

    const gallery = db.prepare(`
      SELECT * FROM photo_galleries WHERE id = ?
    `).get(id) as any;

    if (!gallery) {
      return NextResponse.json(
        { error: "Gallery not found" },
        { status: 404 }
      );
    }

    const photos = db.prepare(`
      SELECT * FROM photos 
      WHERE gallery_id = ? 
      ORDER BY display_order ASC, created_at ASC
    `).all(id) as any[];

    return NextResponse.json({
      ...gallery,
      is_active: Boolean(gallery.is_active),
      photos: photos.map(p => ({
        ...p,
        createdAt: formatTimestamp(p.created_at),
      })),
      created_at: formatTimestamp(gallery.created_at),
      updated_at: formatTimestamp(gallery.updated_at),
    });
  } catch (error) {
    console.error("Gallery GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch gallery" },
      { status: 500 }
    );
  }
}

// PUT update gallery (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAdminAccess(request);
  if (!auth.authorized) return auth.error;

  try {
    const db = getDatabase();
    const { id } = await Promise.resolve(params);
    const formData = await request.formData();
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const display_order = formData.get('display_order') as string;
    const is_active = formData.get('is_active') as string;
    const coverImageFile = formData.get('cover_image') as File | null;
    const removeCover = formData.get('remove_cover') === 'true';

    const existing = db.prepare("SELECT * FROM photo_galleries WHERE id = ?").get(id) as any;
    if (!existing) {
      return NextResponse.json(
        { error: "Gallery not found" },
        { status: 404 }
      );
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (title !== undefined && title !== null) {
      updateFields.push("title = ?");
      updateValues.push(title);
    }

    if (description !== undefined && description !== null) {
      updateFields.push("description = ?");
      updateValues.push(description || null);
    }

    // Handle cover image upload if provided
    if (coverImageFile && coverImageFile.size > 0) {
      if (existing.cover_image) {
        deleteMediaByUrl(existing.cover_image);
      }
      const buffer = Buffer.from(await coverImageFile.arrayBuffer());
      validateImage(buffer, coverImageFile.type);
      const { url } = await compressAndSaveImage(buffer, coverImageFile.name, {
        width: 1200,
        height: 800,
        quality: 85
      });
      updateFields.push("cover_image = ?");
      updateValues.push(url);
    } else if (removeCover) {
      if (existing.cover_image) {
        deleteMediaByUrl(existing.cover_image);
      }
      updateFields.push("cover_image = ?");
      updateValues.push(null);
    } else if (formData.has('cover_image') && coverImageFile === null) {
      // Explicitly set to null if cover_image field exists but is empty
      updateFields.push("cover_image = ?");
      updateValues.push(null);
    }

    if (display_order !== undefined && display_order !== null) {
      updateFields.push("display_order = ?");
      updateValues.push(parseInt(display_order));
    }

    if (is_active !== undefined && is_active !== null) {
      updateFields.push("is_active = ?");
      updateValues.push(is_active === 'true' ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    updateFields.push("updated_at = ?");
    updateValues.push(Math.floor(Date.now() / 1000));
    updateValues.push(id);

    db.prepare(`
      UPDATE photo_galleries
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `).run(...updateValues);

    const updated = db.prepare("SELECT * FROM photo_galleries WHERE id = ?").get(id) as any;

    return NextResponse.json({
      ...updated,
      is_active: Boolean(updated.is_active),
      created_at: formatTimestamp(updated.created_at),
      updated_at: formatTimestamp(updated.updated_at),
    });
  } catch (error) {
    console.error("Gallery PUT error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update gallery" },
      { status: 500 }
    );
  }
}

// DELETE gallery (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAdminAccess(request);
  if (!auth.authorized) return auth.error;

  try {
    const db = getDatabase();
    const { id } = await Promise.resolve(params);

    const existing = db.prepare("SELECT * FROM photo_galleries WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Gallery not found" },
        { status: 404 }
      );
    }

    const photos = db.prepare("SELECT image_url FROM photos WHERE gallery_id = ?").all(id) as Array<{ image_url: string }>;

    for (const photo of photos) {
      if (photo.image_url) deleteMediaByUrl(photo.image_url);
    }
    if ((existing as { cover_image?: string }).cover_image) {
      deleteMediaByUrl((existing as { cover_image: string }).cover_image);
    }

    // Delete gallery (photos will be deleted via CASCADE)
    db.prepare("DELETE FROM photo_galleries WHERE id = ?").run(id);

    return NextResponse.json({ success: true, message: "Gallery deleted successfully" });
  } catch (error) {
    console.error("Gallery DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete gallery" },
      { status: 500 }
    );
  }
}
