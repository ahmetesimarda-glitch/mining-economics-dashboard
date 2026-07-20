/**
 * Helpers for controlled numeric inputs.
 * Empty strings are preserved while editing so Backspace/Delete can clear a field;
 * coerce to numbers only for display math and API payloads.
 */

/** Value held in form state while a number field is being edited. */
export type NumericDraft = number | '';

/**
 * Parse a raw <input type="number"> string without coercing empty → 0.
 * Intermediate typing states like "-" / "." stay empty so the field can be cleared.
 */
export function parseNumericInput(raw: string): NumericDraft {
  if (raw === '' || raw === '-' || raw === '.' || raw === '-.') return '';
  const n = Number(raw);
  return Number.isFinite(n) ? n : '';
}

/** Integer variant of parseNumericInput (quantity, count, years, etc.). */
export function parseIntegerInput(raw: string): NumericDraft {
  if (raw === '' || raw === '-') return '';
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : '';
}

/**
 * Coerce a draft / unknown value to a finite number for calculations and payloads.
 * Empty string, null, undefined, and NaN map to `fallback` (default 0).
 */
export function toNumber(value: unknown, fallback = 0): number {
  if (value === '' || value === null || value === undefined) return fallback;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Deep-coerce every numeric draft in a plain object to numbers (for submit payloads). */
export function coerceNumericFields<T extends Record<string, unknown>>(
  obj: T,
  keys: readonly (keyof T)[]
): T {
  const next = { ...obj };
  for (const key of keys) {
    const current = next[key];
    if (typeof current === 'number' || current === '' || typeof current === 'string') {
      (next as Record<string, unknown>)[key as string] = toNumber(current);
    }
  }
  return next;
}
