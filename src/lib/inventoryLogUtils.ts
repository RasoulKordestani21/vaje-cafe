export type InventoryLogTab = "all" | "buy" | "sell";

export type InventoryLogCategory = "buy" | "sell" | "update";

export interface InventoryLogRecord {
  id: string;
  productId: string;
  changeType: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  unitPrice?: number | null;
  totalPrice?: number | null;
  orderId?: string | null;
  note?: string | null;
  createdAt: number;
}

const BUY_TYPES = new Set(["buy", "manual_add", "restock"]);
const SELL_TYPES = new Set(["sell", "manual_remove", "order_consumed"]);
const UPDATE_TYPES = new Set(["update", "adjustment"]);

export function getLogCategory(changeType: string): InventoryLogCategory {
  if (BUY_TYPES.has(changeType)) return "buy";
  if (SELL_TYPES.has(changeType)) return "sell";
  return "update";
}

export function isBuyLog(changeType: string): boolean {
  return getLogCategory(changeType) === "buy";
}

export function isSellLog(changeType: string): boolean {
  return getLogCategory(changeType) === "sell";
}

export function filterLogsByTab(
  logs: InventoryLogRecord[],
  tab: InventoryLogTab
): InventoryLogRecord[] {
  if (tab === "all") return logs;
  if (tab === "buy") return logs.filter(log => isBuyLog(log.changeType));
  return logs.filter(log => isSellLog(log.changeType));
}

export function getChangeTypeLabel(type: string): string {
  const map: Record<string, string> = {
    buy: "خرید",
    sell: "فروش",
    update: "بروزرسانی",
    order_consumed: "مصرف سفارش",
    manual_add: "افزودن دستی",
    manual_remove: "کاهش دستی",
    restock: "تامین مجدد",
    adjustment: "تنظیم موجودی",
  };
  return map[type] || type;
}

export function getTabLabel(tab: InventoryLogTab): string {
  const map: Record<InventoryLogTab, string> = {
    all: "همه",
    buy: "خرید",
    sell: "فروش",
  };
  return map[tab];
}

export function isLogIncrease(changeType: string, quantity: number): boolean {
  return getLogCategory(changeType) === "buy" || quantity > 0;
}
