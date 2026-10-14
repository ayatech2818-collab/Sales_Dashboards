/** ₹72,500 — whole rupees with Indian digit grouping. */
export function inr(value: number): string {
  return "₹" + Math.round(Math.max(0, value)).toLocaleString("en-IN");
}

/** ₹72.5K / ₹1.85L — compact form for tight spots. */
export function inrShort(value: number): string {
  return value >= 100000
    ? "₹" + (value / 100000).toFixed(2).replace(/\.?0+$/, "") + "L"
    : "₹" + (value / 1000).toFixed(1).replace(/\.0$/, "") + "K";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("");
}
