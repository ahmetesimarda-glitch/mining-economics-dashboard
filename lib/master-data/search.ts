/**
 * Search helpers for Equipment Catalog.
 * Expands short OEM queries (e.g. "CAT") to canonical manufacturer names.
 */

const OEM_ALIAS_GROUPS: string[][] = [
  ['Caterpillar', 'CAT', 'Cat'],
  ['Komatsu'],
  ['Liebherr'],
  ['Hitachi', 'HCM'],
  ['Volvo CE', 'Volvo', 'Volvo Construction Equipment'],
  ['Sandvik'],
  ['Epiroc'],
  ['Atlas Copco', 'AtlasCopco', 'Atlas'],
  ['Metso', 'Metso Outotec'],
  ['FLSmidth', 'FLS', 'FL Smidth'],
  ['Normet'],
  ['MacLean', 'Maclean'],
  ['Bell', 'Bell Equipment'],
  ['XCMG'],
  ['SANY', 'Sany'],
];

/**
 * Expand a single search token into alternate OEM spellings.
 * "CAT" → ["CAT", "Caterpillar", "Cat"]
 */
export function expandEquipmentSearchTerms(token: string): string[] {
  const q = token.trim();
  if (!q) return [];

  const terms = new Set<string>([q]);
  const lower = q.toLowerCase();

  for (const group of OEM_ALIAS_GROUPS) {
    const hit = group.some((alias) => {
      const a = alias.toLowerCase();
      return a === lower || a.startsWith(lower) || lower.startsWith(a);
    });
    if (hit) {
      for (const alias of group) terms.add(alias);
    }
  }

  return Array.from(terms);
}

/**
 * Tokenize a free-text query. Each token expands to OEM aliases.
 * Multi-word queries AND tokens; within a token, aliases OR.
 *
 * Example: "CAT 777" → [["CAT","Caterpillar","Cat"], ["777"]]
 */
export function tokenizeEquipmentSearch(query: string): string[][] {
  const raw = query.trim();
  if (!raw) return [];
  return raw
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => expandEquipmentSearchTerms(token));
}
