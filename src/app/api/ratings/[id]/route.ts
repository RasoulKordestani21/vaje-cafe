import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { ensureAdmin } from '@/lib/auth';

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
    const existing = db.prepare('SELECT * FROM ratings WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Rating not found' },
        { status: 404 }
      );
    }

    // Update approval status
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`
      UPDATE ratings
      SET admin_approved = ?, updatedAt = ?
      WHERE id = ?
    `).run(admin_approved ? 1 : 0, now, id);

    const updatedRating = db.prepare('SELECT * FROM ratings WHERE id = ?').get(id) as any;

    return NextResponse.json(
      {
        ...updatedRating,
        rating: Number(updatedRating.rating),
        admin_approved: Boolean(updatedRating.admin_approved),
        createdAt: Number(updatedRating.createdAt), // Keep as number (Unix timestamp in seconds)
        updatedAt: Number(updatedRating.updatedAt), // Keep as number (Unix timestamp in seconds)
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

