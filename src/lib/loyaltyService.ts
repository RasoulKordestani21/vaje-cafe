import crypto from "crypto";
import type Database from "better-sqlite3";
import {
  LOYALTY_POINTS_EXPERIENCE_COMMENT,
  LOYALTY_POINTS_MENU_ITEM_COMMENT,
  LOYALTY_POINTS_MENU_RATING,
  rewardTypeLabel,
  loyaltySourceLabel,
} from "@/utils/loyaltyLabels";

export {
  LOYALTY_POINTS_EXPERIENCE_COMMENT,
  LOYALTY_POINTS_MENU_ITEM_COMMENT,
  LOYALTY_POINTS_MENU_RATING,
  rewardTypeLabel,
  loyaltySourceLabel,
};

interface AwardOptions {
  customerId: string;
  points: number;
  transactionType?: "earned" | "adjustment";
  sourceType: "order" | "experience_comment" | "menu_item_comment" | "menu_rating" | "manual";
  sourceId: string;
  orderId?: string | null;
  description?: string;
}

export function awardLoyaltyPoints(
  db: Database.Database,
  opts: AwardOptions
): { awarded: boolean; transactionId?: string; newBalance?: number } {
  const {
    customerId,
    points,
    transactionType = "earned",
    sourceType,
    sourceId,
    orderId,
    description,
  } = opts;

  if (points <= 0) return { awarded: false };

  const existing = db
    .prepare(
      `SELECT id FROM loyalty_points
       WHERE customer_id = ? AND source_type = ? AND source_id = ?
         AND transaction_type IN ('earned', 'adjustment')`
    )
    .get(customerId, sourceType, sourceId);

  if (existing) return { awarded: false };

  const customer = db
    .prepare("SELECT loyalty_points_balance FROM customers WHERE id = ?")
    .get(customerId) as { loyalty_points_balance?: number } | undefined;

  if (!customer) return { awarded: false };

  const transactionId = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const currentBalance = customer.loyalty_points_balance || 0;
  const newBalance =
    transactionType === "adjustment"
      ? currentBalance + points
      : currentBalance + Math.abs(points);

  db.prepare(
    `INSERT INTO loyalty_points
       (id, customer_id, points, transaction_type, order_id, source_type, source_id, description, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    transactionId,
    customerId,
    Math.abs(points),
    transactionType,
    orderId || null,
    sourceType,
    sourceId,
    description || null,
    now
  );

  db.prepare(
    `UPDATE customers SET loyalty_points_balance = ?, updatedAt = ? WHERE id = ?`
  ).run(newBalance, now, customerId);

  return { awarded: true, transactionId, newBalance };
}

export function buildLoyaltySummary(transactions: any[]) {
  const earnedFromOrders = transactions
    .filter(
      t =>
        t.transaction_type === "earned" &&
        (t.source_type === "order" || (!t.source_type && t.order_id))
    )
    .reduce((s, t) => s + Math.abs(t.points), 0);

  const earnedFromExperience = transactions
    .filter(t => t.transaction_type === "earned" && t.source_type === "experience_comment")
    .reduce((s, t) => s + Math.abs(t.points), 0);

  const earnedFromMenuComments = transactions
    .filter(t => t.transaction_type === "earned" && t.source_type === "menu_item_comment")
    .reduce((s, t) => s + Math.abs(t.points), 0);

  const earnedFromMenuRatings = transactions
    .filter(t => t.transaction_type === "earned" && t.source_type === "menu_rating")
    .reduce((s, t) => s + Math.abs(t.points), 0);

  const earnedFromManual = transactions
    .filter(
      t =>
        t.transaction_type === "adjustment" ||
        (t.transaction_type === "earned" && t.source_type === "manual")
    )
    .reduce((s, t) => s + (t.transaction_type === "adjustment" ? t.points : Math.abs(t.points)), 0);

  const redemptions = transactions
    .filter(t => t.transaction_type === "redeemed")
    .map(t => ({
      id: t.id,
      reward_id: t.reward_id,
      reward_name: t.reward_name,
      reward_type: t.reward_type,
      points: Math.abs(t.points),
      created_at: t.created_at,
    }));

  const redeemedByType: Record<string, number> = {};
  for (const r of redemptions) {
    const key = r.reward_type || "unknown";
    redeemedByType[key] = (redeemedByType[key] || 0) + 1;
  }

  return {
    earned_from_orders: earnedFromOrders,
    earned_from_experience: earnedFromExperience,
    earned_from_menu_comments: earnedFromMenuComments,
    earned_from_menu_ratings: earnedFromMenuRatings,
    earned_from_manual: earnedFromManual,
    redemptions,
    redeemed_by_type: redeemedByType,
  };
}
