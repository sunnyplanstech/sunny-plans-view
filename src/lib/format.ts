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
  // `== null` and not `!meters` — a parcel literally on the substation
  // (0 m) is the best possible match, not missing data.
  if (meters == null) return "N/A";
  const miles = meters * 0.000621371;
  return `${Math.round(meters)} m (${miles.toFixed(1)} mi)`;
}

export function formatSubstationDistanceMetric(meters: number | null | undefined): string {
  if (meters == null) return "N/A";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatAcres(acres: number | null | undefined, fractionDigits = 1): string {
  if (acres == null) return "N/A";
  return acres.toFixed(fractionDigits);
}

export function formatHectares(hectares: number | null | undefined, fractionDigits = 1): string {
  if (hectares == null) return "N/A";
  return hectares.toFixed(fractionDigits);
}
