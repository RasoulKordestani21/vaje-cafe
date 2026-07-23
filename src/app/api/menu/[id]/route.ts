import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, getDatabase, formatTimestamp } from '@/lib/database';
import { compressAndSaveImage, deleteImage } from '@/lib/imageService';
import { requireAdminAccess } from '@/lib/adminApiAuth';

initializeDatabase();

// PUT update menu item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Require admin token for updating menu items
  const auth = requireAdminAccess(request);
  if (!auth.authorized) return auth.error;
  try {
    const db = getDatabase();
    const { id } = await Promise.resolve(params);
    
    const formData = await request.formData();

    const name = formData.get('name') as string | null;
    const description = formData.get('description') as string | null;
    const price = formData.get('price') as string | null;
    const category = formData.get('category') as string | null;
    const available_raw = formData.get('available');
    const available = available_raw !== null ? available_raw === 'true' : undefined;
    const is_pinned_raw = formData.get('is_pinned');
    const is_suggested_raw = formData.get('is_suggested');
    const is_pinned = is_pinned_raw !== null ? is_pinned_raw === 'true' : undefined;
    const is_suggested = is_suggested_raw !== null ? is_suggested_raw === 'true' : undefined;
    const imageFile = formData.get('image') as File | null;

    // Get existing item
    const existing = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }

    let imageUrl = (existing as any).imageUrl;
    let imageFileName = (existing as any).imageFileName;

    // Handle image replacement
    if (imageFile) {
      // Delete old image if it exists
      if (imageFileName) {
        deleteImage(imageFileName);
      }
      
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const result = await compressAndSaveImage(buffer, imageFile.name);
      imageUrl = result.url;
      imageFileName = result.fileName;
    }

    // Update in database
    const stmt = db.prepare(`
      UPDATE menu_items 
      SET name = ?, description = ?, price = ?, category = ?, available = ?, imageUrl = ?, imageFileName = ?, is_pinned = ?, is_suggested = ?, updatedAt = ?
      WHERE id = ?
    `);

    const now = Math.floor(Date.now() / 1000);
    const existingItem = existing as any;
    stmt.run(
      name || existingItem.name,
      description || existingItem.description,
      price ? parseInt(price) : existingItem.price,
      category || existingItem.category,
      available !== undefined ? (available ? 1 : 0) : existingItem.available,
      imageUrl,
      imageFileName,
      is_pinned !== undefined ? (is_pinned ? 1 : 0) : (existingItem.is_pinned || 0),
      is_suggested !== undefined ? (is_suggested ? 1 : 0) : (existingItem.is_suggested || 0),
      now,
      id
    );

    const updated = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id) as any;

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update menu item' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...updated,
      createdAt: formatTimestamp(updated.createdAt),
      updatedAt: formatTimestamp(updated.updatedAt),
      available: Boolean(updated.available),
    });
  } catch (error) {
    console.error('Menu PUT error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update menu item' },
      { status: 500 }
    );
  }
}

// DELETE menu item
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Require admin token for deleting menu items
  const auth = requireAdminAccess(_request);
  if (!auth.authorized) return auth.error;
  try {
    const db = getDatabase();
    const { id } = await Promise.resolve(params);

    // Get item to delete image
    const existing = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }

    // Delete image if it exists
    if ((existing as any).imageFileName) {
      deleteImage((existing as any).imageFileName);
    }

    const deleteMenuItem = db.transaction((menuItemId: string) => {
      // experience_comments.menu_item_id has no ON DELETE action
      db.prepare(
        'UPDATE experience_comments SET menu_item_id = NULL WHERE menu_item_id = ?'
      ).run(menuItemId);
      // menu_ingredients + ratings cascade; order_items SET NULL via FK migration
      db.prepare('DELETE FROM menu_items WHERE id = ?').run(menuItemId);
    });

    deleteMenuItem(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Menu DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete menu item' },
      { status: 500 }
    );
  }
}
