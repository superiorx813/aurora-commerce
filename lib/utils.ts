export function money(value: number | string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value));
}

export function discountPercent(price: number, mrp: number) {
  return Math.max(0, Math.round((1 - price / mrp) * 100));
}
