export function formatPrice(price: number | null | undefined): string {
  if (!price) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatPricePerAcre(price: number | null | undefined): string {
  if (!price) return "N/A";
  return formatPrice(price) + "/acre";
}

export function formatSubstationDistance(meters: number | null | undefined): string {
  if (!meters) return "N/A";
  const miles = meters * 0.000621371;
  return `${Math.round(meters)} m (${miles.toFixed(1)} mi)`;
}

export function formatAcres(acres: number | null | undefined, fractionDigits = 1): string {
  if (acres == null) return "N/A";
  return acres.toFixed(fractionDigits);
}
