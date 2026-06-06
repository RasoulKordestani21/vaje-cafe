import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, formatTimestamp } from '@/lib/database';
import { ensureAdmin } from '@/lib/auth';
import { verifyStaffAuth } from '@/lib/staffAuthMiddleware';
import { validateSession } from '@/lib/authMiddleware';
import crypto from 'crypto';

// PATCH update order status (admin or barista/manager)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check if admin via session (cookie-based auth)
  const sessionAuth = validateSession(request);
  let isAdmin = false;
  
  if (sessionAuth.user && !sessionAuth.error) {
    // Check if user is admin (user.role is already set by validateSession)
    isAdmin = sessionAuth.user.role === 'admin' || sessionAuth.user.role === 'super_admin';
  }
  
  // Check if admin via token (x-access-token header) - only if session auth didn't work
  let isAdminViaToken = false;
  if (!isAdmin) {
    const tokenAuthError = ensureAdmin(request);
    isAdminViaToken = tokenAuthError === null;
  }
  
  // Check if staff - only if not admin
  const staffAuth = await verifyStaffAuth(request);
  
  // If not admin (neither via session nor token), check staff permissions
  if (!isAdmin && !isAdminViaToken) {
    // Not admin, check if staff has permission
    if (!staffAuth.authenticated || !staffAuth.staff) {
      console.log('Order update failed: Not admin and not authenticated staff');
      return NextResponse.json(
        { error: 'Unauthorized - Admin or staff authentication required' },
        { status: 401 }
      );
    }
    
    const db = getDatabase();
    const permission = db.prepare(`
      SELECT enabled FROM staff_role_permissions 
      WHERE role = ? AND permission_key = 'update_order_status'
    `).get(staffAuth.staff.role) as any;
    
    if (!permission || !permission.enabled) {
      console.log(`Order update failed: Staff ${staffAuth.staff.role} does not have update_order_status permission`);
      return NextResponse.json(
        { error: 'Insufficient permissions to update order status' },
        { status: 403 }
      );
    }
  }
  try {
    const db = getDatabase();
    const { id } = await Promise.resolve(params);
    const body = await request.json();

    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if order exists
    const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get current order status
    const currentOrder = db.prepare('SELECT status FROM orders WHERE id = ?').get(id) as any;
    const oldStatus = currentOrder?.status;

    // Update order status
    const now = Math.floor(Date.now() / 1000);
    const stmt = db.prepare(`
      UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?
    `);

    stmt.run(status, now, id);

    // Record status change in history
    if (oldStatus !== status) {
      let changedByType = 'system';
      let changedById: string | null = null;
      let changedByName: string | null = null;

      if ((isAdmin || isAdminViaToken) && sessionAuth.user) {
        // Admin changed it
        changedByType = 'admin';
        changedById = sessionAuth.user.id;
        const adminUser = db.prepare("SELECT name FROM admin_users WHERE id = ?").get(sessionAuth.user.id) as any;
        changedByName = adminUser?.name || 'Admin';
      } else if (staffAuth.authenticated && staffAuth.staff) {
        // Staff changed it
        changedByType = 'staff';
        changedById = staffAuth.staff.id;
        changedByName = staffAuth.staff.name;
      }

      const historyId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO order_status_history (id, order_id, status, changed_by_type, changed_by_id, changed_by_name, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(historyId, id, status, changedByType, changedById, changedByName, now);
    }

    // Notify waiters if barista confirms order (status changed to 'ready')
    if (status === 'ready' && staffAuth.authenticated && staffAuth.staff?.role === 'barista') {
      // Get all active waiters
      const waiters = db.prepare(`
        SELECT id FROM staff WHERE role = 'waiter' AND is_active = 1
      `).all() as any[];
      
      // Create notification for each waiter
      for (const waiter of waiters) {
        const notificationId = crypto.randomUUID();
        db.prepare(`
          INSERT INTO staff_notifications (id, order_id, staff_role, staff_id, message, created_at, read)
          VALUES (?, ?, ?, ?, ?, ?, 0)
        `).run(
          notificationId,
          id,
          'waiter',
          waiter.id,
          `سفارش #${id.substring(0, 8)} آماده تحویل است`,
          now
        );
      }
    }

    // If order is being completed, decrease inventory (admin or manager only)
    let canCompleteOrder = false;
    if (isAdmin || isAdminViaToken) {
      // Admin can always complete
      canCompleteOrder = true;
    } else {
      // Not admin, check if manager with permission
      if (staffAuth.authenticated && staffAuth.staff?.role === 'manager') {
        const permission = db.prepare(`
          SELECT enabled FROM staff_role_permissions 
          WHERE role = 'manager' AND permission_key = 'complete_orders'
        `).get() as any;
        canCompleteOrder = permission && permission.enabled;
      }
    }
    
    if (status === 'completed' && canCompleteOrder) {
      // Award loyalty points if customer exists (1 point per 1000 tomans)
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
      console.log(`[Loyalty Points] Processing order ${id}, customerId: ${order?.customerId}, totalPrice: ${order?.totalPrice}`);
      
      if (order?.customerId) {
        const pointsToAward = Math.floor((order.totalPrice || 0) / 1000);
        console.log(`[Loyalty Points] Points to award: ${pointsToAward}`);
        
        if (pointsToAward > 0) {
          try {
            // Check if points already awarded for this order
            const existingPoints = db.prepare(`
              SELECT id FROM loyalty_points WHERE order_id = ? AND transaction_type = 'earned'
            `).get(id) as any;
            
            if (!existingPoints) {
              const { randomUUID } = await import("crypto");
              const transactionId = randomUUID();
              
              // Get current balance
              const customer = db.prepare("SELECT loyalty_points_balance FROM customers WHERE id = ?").get(order.customerId) as any;
              const currentBalance = customer?.loyalty_points_balance || 0;
              const newBalance = currentBalance + pointsToAward;
              
              console.log(`[Loyalty Points] Customer ${order.customerId} - Current balance: ${currentBalance}, New balance: ${newBalance}`);
              
              // Create points transaction
              db.prepare(`
                INSERT INTO loyalty_points (id, customer_id, points, transaction_type, order_id, description, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `).run(
                transactionId,
                order.customerId,
                pointsToAward,
                'earned',
                id,
                `Points earned from order #${id.substring(0, 8)}`,
                now
              );
              
              // Update customer balance
              db.prepare(`
                UPDATE customers 
                SET loyalty_points_balance = ?,
                    updatedAt = ?
                WHERE id = ?
              `).run(newBalance, now, order.customerId);
              
              console.log(`[Loyalty Points] Successfully awarded ${pointsToAward} points to customer ${order.customerId}`);
            } else {
              console.log(`[Loyalty Points] Points already awarded for order ${id}`);
            }
          } catch (pointsError) {
            console.error("[Loyalty Points] Failed to award loyalty points:", pointsError);
            console.error("[Loyalty Points] Error details:", JSON.stringify(pointsError, Object.getOwnPropertyNames(pointsError)));
            // Don't fail the order completion if points award fails
          }
        } else {
          console.log(`[Loyalty Points] Points to award is 0 (order total: ${order.totalPrice})`);
        }
      } else {
        console.log(`[Loyalty Points] Order ${id} has no customerId, skipping points award`);
      }
      const orderItems = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(id) as any[];
      const { v4: uuidv4 } = await import('uuid');

      for (const orderItem of orderItems) {
        // Get menu item ingredients (both raw materials and packed products)
        const ingredients = db.prepare(`
          SELECT mi.*, p.type as productType, p.name as productName
          FROM menu_ingredients mi
          INNER JOIN products p ON mi.productId = p.id
          WHERE mi.menuItemId = ?
        `).all(orderItem.menuItemId) as any[];

        // For each ingredient, decrease product stock
        for (const ingredient of ingredients) {
          const product = db.prepare('SELECT * FROM products WHERE id = ?').get(ingredient.productId) as any;
          if (!product) continue;

          // Calculate total quantity needed
          // For raw materials: ingredient.quantity × order item quantity (e.g., 20g × 2 = 40g)
          // For packed products: ingredient.quantity × order item quantity (typically 1 × quantity)
          const totalQuantity = ingredient.quantity * orderItem.quantity;
          const newStock = Math.max(0, product.currentStock - totalQuantity);

          // Update product stock
          db.prepare(`
            UPDATE products SET currentStock = ?, updatedAt = ? WHERE id = ?
          `).run(newStock, now, product.id);

          // Log inventory change
          const logId = uuidv4();
          db.prepare(`
            INSERT INTO inventory_logs (id, productId, changeType, quantity, previousStock, newStock, orderId, note, createdAt)
            VALUES (?, ?, 'order_consumed', ?, ?, ?, ?, ?, ?)
          `).run(
            logId,
            product.id,
            -totalQuantity, // Negative for consumption
            product.currentStock,
            newStock,
            id,
            `${product.type === 'raw_material' ? 'Raw material' : 'Packed product'}: ${ingredient.productName} used for ${orderItem.name} (${orderItem.quantity}x)`,
            now
          );
        }
      }
    }

    // Get updated order with items
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    const items = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(id);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...order,
      items,
      createdAt: formatTimestamp(order.createdAt),
      updatedAt: formatTimestamp(order.updatedAt),
    });
  } catch (error) {
    console.error('Order PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
