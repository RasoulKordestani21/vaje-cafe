import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { ensureAdmin } from '@/lib/auth';
import { awardLoyaltyPoints, LOYALTY_POINTS_MENU_RATING } from '@/lib/loyaltyService';

// PUT update rating (for admin approval)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Require admin token for approving ratings
  const authErr = ensureAdmin(request);
  if (authErr) return authErr;

  try {
    const db = getDatabase();
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const { admin_approved } = body;

    // Get existing rating
    const existing = db.prepare(`
      SELECT r.*, m.name as menu_item_name
      FROM ratings r
      LEFT JOIN menu_items m ON r.menu_item_id = m.id
      WHERE r.id = ?
    `).get(id) as any;
    if (!existing) {
      return NextResponse.json(
        { error: 'Rating not found' },
        { status: 404 }
      );
    }

    const wasApproved = Boolean(existing.admin_approved);

    // Update approval status
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`
      UPDATE ratings
      SET admin_approved = ?, updatedAt = ?
      WHERE id = ?
    `).run(admin_approved ? 1 : 0, now, id);

    // Award loyalty points on first approval
    let loyaltyAward: { awarded: boolean; points?: number } = { awarded: false };
    if (admin_approved === true && !wasApproved && existing.customer_id) {
      const menuItemName = existing.menu_item_name || "";
      const result = awardLoyaltyPoints(db, {
        customerId: existing.customer_id,
        points: LOYALTY_POINTS_MENU_RATING,
        sourceType: "menu_rating",
        sourceId: id,
        description: `امتیاز نظر/امتیازدهی منو${menuItemName ? `: ${menuItemName}` : ""}`,
      });
      loyaltyAward = {
        awarded: result.awarded,
        points: result.awarded ? LOYALTY_POINTS_MENU_RATING : undefined,
      };
    }

    const updatedRating = db.prepare('SELECT * FROM ratings WHERE id = ?').get(id) as any;

    return NextResponse.json(
      {
        ...updatedRating,
        rating: Number(updatedRating.rating),
        admin_approved: Boolean(updatedRating.admin_approved),
        createdAt: Number(updatedRating.createdAt),
        updatedAt: Number(updatedRating.updatedAt),
        loyalty_awarded: loyaltyAward,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Rating PUT error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update rating' },
      { status: 500 }
    );
  }
}

// DELETE rating
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Require admin token for deleting ratings
  const authErr = ensureAdmin(request);
  if (authErr) return authErr;

  try {
    const db = getDatabase();
    const { id } = await Promise.resolve(params);

    const existing = db.prepare('SELECT * FROM ratings WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Rating not found' },
        { status: 404 }
      );
    }

    db.prepare('DELETE FROM ratings WHERE id = ?').run(id);

    return NextResponse.json({ success: true, message: 'Rating deleted successfully' });
  } catch (error) {
    console.error('Rating DELETE error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete rating' },
      { status: 500 }
    );
  }
}
