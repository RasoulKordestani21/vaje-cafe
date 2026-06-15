/** Points awarded when admin approves an experience-page comment */
export const LOYALTY_POINTS_EXPERIENCE_COMMENT = 10;
/** Points awarded when admin approves a menu-item comment */
export const LOYALTY_POINTS_MENU_ITEM_COMMENT = 10;
/** Points awarded when admin approves a menu-item rating/review */
export const LOYALTY_POINTS_MENU_RATING = 10;

export function rewardTypeLabel(type: string | null | undefined): string {
  const map: Record<string, string> = {
    discount: "تخفیف",
    free_item: "آیتم رایگان",
    cashback: "بازگشت وجه",
  };
  return type ? map[type] || type : "—";
}

export function loyaltySourceLabel(sourceType: string | null | undefined): string {
  const map: Record<string, string> = {
    order: "خرید (سفارش)",
    experience_comment: "نظر تجربه",
    menu_item_comment: "نظر آیتم منو",
    menu_rating: "امتیاز/نظر منو",
    manual: "تنظیم دستی",
    reward: "دریافت پاداش",
  };
  return sourceType ? map[sourceType] || sourceType : "—";
}

export function loyaltyTxDetail(tx: {
  transaction_type: string;
  source_type?: string | null;
  description?: string | null;
  reward_name?: string | null;
  reward_type?: string | null;
  order_total?: number | null;
  experience_comment_text?: string | null;
  experience_menu_item_name?: string | null;
  menu_item_name?: string | null;
  menu_review_text?: string | null;
  menu_rating_value?: number | null;
}): string {
  if (tx.transaction_type === "redeemed" && tx.reward_name) {
    const typeLabel = tx.reward_type ? rewardTypeLabel(tx.reward_type) : "";
    return typeLabel ? `${tx.reward_name} (${typeLabel})` : tx.reward_name;
  }
  if (tx.source_type === "order" || (!tx.source_type && tx.order_total != null)) {
    return tx.description || "امتیاز از سفارش";
  }
  if (tx.source_type === "experience_comment") {
    const preview = tx.experience_comment_text?.slice(0, 60);
    return preview ? `نظر تجربه: ${preview}${tx.experience_comment_text!.length > 60 ? "…" : ""}` : "نظر تجربه مشتری";
  }
  if (tx.source_type === "menu_item_comment") {
    const name = tx.experience_menu_item_name || "آیتم منو";
    return `نظر ${name}`;
  }
  if (tx.source_type === "menu_rating") {
    const name = tx.menu_item_name || "آیتم منو";
    const stars = tx.menu_rating_value ? ` · ${tx.menu_rating_value}/۵` : "";
    return `امتیاز ${name}${stars}`;
  }
  return tx.description || "—";
}
