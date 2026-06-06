import { NextRequest, NextResponse } from "next/server";
import { getDatabase, formatTimestamp } from "@/lib/database";
import { ensureAdmin } from "@/lib/auth";
import { compressAndSaveImage, validateImage } from "@/lib/imageService";
import crypto from "crypto";

// GET all active stories (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);
    
    // Get active stories that haven't expired, ordered by display_order
    const stories = db.prepare(`
      SELECT * FROM stories 
      WHERE is_active = 1 
      AND (expires_at IS NULL OR expires_at > ?)
      ORDER BY display_order ASC, created_at DESC
    `).all(now) as any[];

    const formattedStories = stories.map(s => ({
      ...s,
      is_active: Boolean(s.is_active),
      created_at: formatTimestamp(s.created_at),
      updated_at: formatTimestamp(s.updated_at),
      expires_at: s.expires_at ? formatTimestamp(s.expires_at) : null,
    }));

    return NextResponse.json({ stories: formattedStories });
  } catch (error) {
    console.error("Stories GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 }
    );
  }
}

// POST create new story (admin only)
export async function POST(request: NextRequest) {
  const authErr = ensureAdmin(request);
  if (authErr) return authErr;

  try {
    const db = getDatabase();
    const formData = await request.formData();
    
    const imageFile = formData.get("image") as File | null;
    const caption = formData.get("caption") as string;
    const duration = formData.get("duration") as string;
    const display_order = formData.get("display_order") as string;
    const expires_at = formData.get("expires_at") as string;

    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json(
        { error: "فایل تصویر الزامی است" },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    // Handle image upload
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    validateImage(buffer, imageFile.type);
    const { url: image_url } = await compressAndSaveImage(buffer, imageFile.name, {
      width: 1080,
      height: 1920, // Story format (vertical)
      quality: 85
    });

    // Parse optional fields
    const storyDuration = duration ? parseInt(duration) : 20;
    const order = display_order ? parseInt(display_order) : undefined;
    const expiresTimestamp = expires_at ? parseInt(expires_at) : null;

    // Get max display_order if not provided
    let finalOrder = order;
    if (finalOrder === undefined || finalOrder === null) {
      const maxOrder = db.prepare(`
        SELECT MAX(display_order) as max_order FROM stories
      `).get() as any;
      finalOrder = (maxOrder?.max_order || 0) + 1;
    }

    db.prepare(`
      INSERT INTO stories (id, image_url, caption, duration, display_order, is_active, expires_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      image_url,
      caption || null,
      storyDuration,
      finalOrder,
      1,
      expiresTimestamp,
      now,
      now
    );

    const newStory = db.prepare("SELECT * FROM stories WHERE id = ?").get(id) as any;

    return NextResponse.json({
      ...newStory,
      is_active: Boolean(newStory.is_active),
      created_at: formatTimestamp(newStory.created_at),
      updated_at: formatTimestamp(newStory.updated_at),
      expires_at: newStory.expires_at ? formatTimestamp(newStory.expires_at) : null,
    }, { status: 201 });
  } catch (error) {
    console.error("Story POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create story" },
      { status: 500 }
    );
  }
}



