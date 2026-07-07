// Marketing constants shared across the storefront. The €45 threshold matches
// the EU shipping zone's free_over rate and all site copy.
export const FREE_SHIPPING_THRESHOLD = 45;

// Automatic multi-buy ("Bundle & Save") tiers. Must match
// QTY_DISCOUNT_TIERS in backend/orders/services.py — the server recomputes
// and is the source of truth.
export const QTY_TIERS: { qty: number; percentOff: number; badge?: string }[] = [
  { qty: 1, percentOff: 0 },
  { qty: 2, percentOff: 10, badge: "Most popular" },
  { qty: 3, percentOff: 15, badge: "Best value" },
];

export function qtyDiscountPercent(qty: number): number {
  if (qty >= 3) return 15;
  if (qty >= 2) return 10;
  return 0;
}
