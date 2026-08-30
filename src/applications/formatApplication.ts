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

/**
 * Whether a stored value is safe to render as an `href` — http(s) only. Guards
 * against `javascript:` / `data:` values that reached the DB by another route
 * (a direct API call, older data) even though the form now rejects them.
 */
export function isSafeHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}
