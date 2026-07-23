import type { Product } from "@/services/productsService";

/** Normalize product.price to cost per single measure unit (e.g. per gram when price is per kg). */
export function resolveWasteCostPerUnit(product: Pick<Product, "price" | "unit">): number {
  const price = product.price || 0;
  if (!price) return 0;

  const unit = (product.unit || "").trim().toLowerCase();

  if (["گرم", "g"].some(u => unit.includes(u)) && price >= 10_000) {
    return price / 1000;
  }
  if (["میلی‌لیتر", "میلی لیتر", "ml"].some(u => unit.includes(u)) && price >= 10_000) {
    return price / 1000;
  }

  return price;
}

export function wasteCostPerUnitHint(product: Pick<Product, "price" | "unit">): string | null {
  const normalized = resolveWasteCostPerUnit(product);
  if (normalized !== product.price && product.price > 0) {
    return `قیمت خرید ${product.price.toLocaleString("fa-IR")} تومان به ازای هر کیلو/لیتر — هر ${product.unit}: ${Math.round(normalized).toLocaleString("fa-IR")} تومان`;
  }
  return null;
}

export function calcWasteTotal(quantity: string, costPerUnit: string): number {
  const q = parseFloat(quantity);
  const c = parseFloat(costPerUnit);
  if (!Number.isFinite(q) || !Number.isFinite(c)) return 0;
  return q * c;
}
