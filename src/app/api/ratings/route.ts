import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { verifyCustomerAuth } from '@/lib/customerAuthMiddleware';

// GET all ratings (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const menuItemId = searchParams.get('menu_item_id');
    const approvedOnly = searchParams.get('approved_only') !== 'false'; // Default true
    const customerId = searchParams.get('customer_id');

    let query = `
      SELECT r.*, c.name as customer_name, c.phone as customer_phone, c.profilePicture as customer_profile_picture
      FROM ratings r
      LEFT JOIN customers c ON r.customer_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (menuItemId) {
      query += ` AND r.menu_item_id = ?`;
      params.push(menuItemId);
    }

    if (approvedOnly) {
      query += ` AND r.admin_approved = 1`;
    }

    if (customerId) {
      query += ` AND r.customer_id = ?`;
      params.push(customerId);
    }

    query += ` ORDER BY r.createdAt DESC`;

    const ratings = db.prepare(query).all(...params);

    const formattedRatings = (ratings as any[]).map(rating => ({
      ...rating,
      rating: Number(rating.rating),
      admin_approved: Boolean(rating.admin_approved),
      createdAt: Number(rating.createdAt), // Keep as number (Unix timestamp in seconds)
      updatedAt: Number(rating.updatedAt), // Keep as number (Unix timestamp in seconds)
    }));

    // Calculate average rating if menu_item_id is provided
    let averageRating = null;
    if (menuItemId) {
      const avgResult = db.prepare(`
        SELECT AVG(rating) as avg, COUNT(*) as count
        FROM ratings
        WHERE menu_item_id = ? AND admin_approved = 1
      `).get(menuItemId) as { avg: number | null; count: number };
      
      if (avgResult.avg !== null) {
        averageRating = {
          average: Number(avgResult.avg.toFixed(1)),
          count: Number(avgResult.count),
        };
      }
    }

    return NextResponse.json({
      ratings: formattedRatings,
      averageRating,
    });
  } catch (error) {
    console.error('Ratings GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
}

// POST create new rating
export async function POST(request: NextRequest) {
  try {
    // Verify customer authentication
    const auth = await verifyCustomerAuth(request);
    if (!auth.authenticated || !auth.customer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDatabase();
    const body = await request.json();
    const { menu_item_id, rating, review_text } = body;

    if (!menu_item_id || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields: menu_item_id, rating' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if customer already rated this item
    const existing = db.prepare(`
      SELECT id FROM ratings
      WHERE menu_item_id = ? AND customer_id = ?
    `).get(menu_item_id, auth.customer.id);

    if (existing) {
      return NextResponse.json(
        { error: 'You have already rated this item' },
        { status: 400 }
      );
    }

    // Verify menu item exists
    const menuItem = db.prepare('SELECT id FROM menu_items WHERE id = ?').get(menu_item_id);
    if (!menuItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }

    // Create rating
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    
    db.prepare(`
      INSERT INTO ratings (id, menu_item_id, customer_id, rating, review_text, admin_approved, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, menu_item_id, auth.customer.id, rating, review_text || null, 0, now, now);

    const newRating = db.prepare('SELECT * FROM ratings WHERE id = ?').get(id) as any;

    return NextResponse.json(
      {
        ...newRating,
        rating: Number(newRating.rating),
        admin_approved: Boolean(newRating.admin_approved),
        createdAt: Number(newRating.createdAt), // Keep as number (Unix timestamp in seconds)
        updatedAt: Number(newRating.updatedAt), // Keep as number (Unix timestamp in seconds)
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Ratings POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create rating' },
      { status: 500 }
    );
  }
}

