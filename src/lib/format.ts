/** ₹72,500 — whole rupees with Indian digit grouping. */
export function inr(value: number): string {
  return "₹" + Math.round(Math.max(0, value)).toLocaleString("en-IN");
}

/** ₹850 / ₹72.5K / ₹1.85L / ₹1.2Cr — compact form for tight spots. */
export function inrShort(value: number): string {
  const n = Math.round(value);
  if (n >= 1e7) return "₹" + (n / 1e7).toFixed(2).replace(/\.?0+$/, "") + "Cr";
  if (n >= 1e5) return "₹" + (n / 1e5).toFixed(2).replace(/\.?0+$/, "") + "L";
  if (n >= 1e3) return "₹" + (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return "₹" + n;
}

/** 0.874 → 87% */
export function percent(fraction: number): string {
  return Math.round(fraction * 100) + "%";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("");
}

/** Rahul Menon → Rahul M. */
export function shortName(name: string): string {
  const [first, second] = name.split(" ");
  return second ? `${first} ${second[0]}.` : first;
}
