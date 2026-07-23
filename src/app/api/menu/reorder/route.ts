import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { requireAdminAccess } from '@/lib/adminApiAuth';

// PUT update menu items display order
export async function PUT(request: NextRequest) {
  // Require admin token for reordering menu items
  const auth = requireAdminAccess(request);
  if (!auth.authorized) return auth.error;

  try {
    const db = getDatabase();
    const body = await request.json();
    const { itemOrders } = body; // Array of { id, display_order }

    if (!Array.isArray(itemOrders)) {
      return NextResponse.json(
        { error: 'Invalid request: itemOrders must be an array' },
        { status: 400 }
      );
    }

    // Update display_order for each item
    const updateStmt = db.prepare(`
      UPDATE menu_items 
      SET display_order = ?, updatedAt = ?
      WHERE id = ?
    `);

    const now = Math.floor(Date.now() / 1000);
    const updateMany = db.transaction((itemOrders: Array<{ id: string; display_order: number }>) => {
      for (const item of itemOrders) {
        updateStmt.run(item.display_order, now, item.id);
      }
    });

    updateMany(itemOrders);

    return NextResponse.json({ success: true, message: 'Menu order updated successfully' });
  } catch (error) {
    console.error('Menu reorder error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reorder menu items' },
      { status: 500 }
    );
  }
}
