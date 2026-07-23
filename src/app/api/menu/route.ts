import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, getDatabase, formatTimestamp } from '@/lib/database';
import { compressAndSaveImage } from '@/lib/imageService';
import { requireAdminAccess } from '@/lib/adminApiAuth';
import { getMenuItemsStockStatus } from '@/services/productsService';
import { v4 as uuidv4 } from 'uuid';

// Initialize database on first call
initializeDatabase();

// GET all menu items
export async function GET() {
  try {
    const db = getDatabase();
    const items = db.prepare(`
      SELECT * FROM menu_items ORDER BY is_pinned DESC, is_suggested DESC, display_order ASC, category, name
    `).all();

    const stockStatus = getMenuItemsStockStatus();

    const formattedItems = (items as any[]).map(item => ({
      ...item,
      createdAt: formatTimestamp(item.createdAt),
      updatedAt: formatTimestamp(item.updatedAt),
      available: Boolean(item.available),
      inStockFromInventory: stockStatus[item.id] ?? true,
      is_pinned: Boolean(item.is_pinned),
      is_suggested: Boolean(item.is_suggested),
    }));

    return NextResponse.json(formattedItems);
  } catch (error) {
    console.error('Menu GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}

// POST new menu item
export async function POST(request: NextRequest) {
  // Require admin token for creating menu items
  const auth = requireAdminAccess(request);
  if (!auth.authorized) return auth.error;
  try {
    const db = getDatabase();
    const formData = await request.formData();

    const id = uuidv4();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = parseInt(formData.get('price') as string);
    const category = formData.get('category') as string;
    const available = formData.get('available') === 'true';
    const imageFile = formData.get('image') as File | null;

    if (!name || !price || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, price, category' },
        { status: 400 }
      );
    }

    let imageUrl = '';
    let imageFileName = '';

    // Handle image upload if provided
    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const { fileName, url } = await compressAndSaveImage(buffer, imageFile.name);
      imageUrl = url;
      imageFileName = fileName;
    }

    // Get max display_order to set for new item
    const maxOrderResult = db.prepare('SELECT COALESCE(MAX(display_order), 0) as max_order FROM menu_items').get() as { max_order: number };
    const newDisplayOrder = (maxOrderResult.max_order || 0) + 1;

    // Insert into database
    const stmt = db.prepare(`
      INSERT INTO menu_items (id, name, description, price, category, available, imageUrl, imageFileName, is_pinned, is_suggested, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, name, description, price, category, available ? 1 : 0, imageUrl, imageFileName, 0, 0, newDisplayOrder);

    const newItem = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id) as any;

    if (!newItem) {
      return NextResponse.json(
        { error: 'Failed to create menu item' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ...newItem,
        createdAt: formatTimestamp(newItem.createdAt),
        updatedAt: formatTimestamp(newItem.updatedAt),
        available: Boolean(newItem.available),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Menu POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create menu item' },
      { status: 500 }
    );
  }
}
