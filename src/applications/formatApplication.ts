/** A salary range for display: "90,000–130,000 EUR", "From 90,000", or "—". */
export function formatSalary(
  min: number | null,
  max: number | null,
  currency: string | null,
): string {
  const suffix = currency === null ? '' : ` ${currency}`;
  const amount = (value: number) => value.toLocaleString('en-IE');

  if (min !== null && max !== null) return `${amount(min)}–${amount(max)}${suffix}`;
  if (min !== null) return `From ${amount(min)}${suffix}`;
  if (max !== null) return `Up to ${amount(max)}${suffix}`;
  return '—';
}
