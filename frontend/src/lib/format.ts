const SYMBOLS: Record<string, string> = { eur: "\u20ac", gbp: "\u00a3", usd: "$" };

export function formatMoney(amount: number | string, currency = "eur"): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  const symbol = SYMBOLS[currency.toLowerCase()] || "";
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}
