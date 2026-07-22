/** Shared PDF number/date helpers for consulting reports. */

export function pdfFmt(value: number, digits = 2): string {
  return (value ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function pdfDate(d: Date = new Date()): string {
  return d.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function riskLevelFromNpvProb(positiveProb: number): string {
  if (positiveProb >= 0.8) return 'Low';
  if (positiveProb >= 0.55) return 'Moderate';
  if (positiveProb >= 0.35) return 'Elevated';
  return 'High';
}

export function parseCountryFromLocation(location: string): string {
  const parts = location
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return '—';
  return parts[parts.length - 1] ?? '—';
}
