/**
 * Client-side mapping of sensitivity / tornado parameter keys and
 * known TR/EN human labels → localized display strings via t().
 * Prefer `parameter` (stable key) when available; fall back to label aliases.
 */

type TranslateFn = (key: string) => string;

/** Stable API/param keys → i18n keys */
const PARAM_KEY_TO_I18N: Record<string, string> = {
  price: 'sens.price',
  unitPrice: 'sens.unitPrice',
  capex: 'sens.capex',
  totalCapex: 'sens.capex',
  opex: 'sens.opex',
  totalOpex: 'sens.opex',
  discountRate: 'sens.discountRate',
  oreGrade: 'sens.oreGrade',
  exchangeRate: 'sens.exchangeRate',
  fuelPrice: 'sens.fuelPrice',
  annualProduction: 'sens.annualProduction',
  taxRate: 'sens.taxRate',
  royaltyRate: 'sens.royaltyRate',
};

/** Known Turkish and English human labels → stable param key */
const LABEL_ALIASES: Record<string, string> = {
  'Birim Fiyat': 'unitPrice',
  'Unit Price': 'unitPrice',
  Fiyat: 'price',
  Price: 'price',
  CAPEX: 'capex',
  OPEX: 'opex',
  'İnd. Oranı': 'discountRate',
  'Ind. Oranı': 'discountRate',
  İndirgenme: 'discountRate',
  'İndirgenme Oranı': 'discountRate',
  İskonto: 'discountRate',
  'İskonto Oranı': 'discountRate',
  'Discount Rate': 'discountRate',
  Tenör: 'oreGrade',
  'Cevher Tenörü': 'oreGrade',
  'Ore Grade': 'oreGrade',
  Döviz: 'exchangeRate',
  'Döviz Kuru': 'exchangeRate',
  'Exchange Rate': 'exchangeRate',
  Yakıt: 'fuelPrice',
  'Yakıt Fiyatı': 'fuelPrice',
  'Fuel Price': 'fuelPrice',
  'Yıllık Üretim': 'annualProduction',
  'Annual Production': 'annualProduction',
  'Vergi Oranı': 'taxRate',
  'Tax Rate': 'taxRate',
  'Devlet Hakkı': 'royaltyRate',
  Royalty: 'royaltyRate',
  'Royalty Rate': 'royaltyRate',
};

function resolveParamKey(parameter?: string, label?: string): string | undefined {
  if (parameter && PARAM_KEY_TO_I18N[parameter]) return parameter;
  if (label) {
    const aliased = LABEL_ALIASES[label];
    if (aliased) return aliased;
    if (PARAM_KEY_TO_I18N[label]) return label;
  }
  return parameter && PARAM_KEY_TO_I18N[parameter] ? parameter : undefined;
}

/**
 * Translate a sensitivity/tornado parameter for display.
 * Pass either a stable `parameter` key, a human `label` from the API, or both.
 */
export function translateParamLabel(
  t: TranslateFn,
  options: { parameter?: string; label?: string }
): string {
  const key = resolveParamKey(options.parameter, options.label);
  if (key && PARAM_KEY_TO_I18N[key]) {
    return t(PARAM_KEY_TO_I18N[key]);
  }
  return options.label ?? options.parameter ?? '';
}

/** i18n key for a known param key (for charts that build series from keys). */
export function paramI18nKey(paramKey: string): string {
  return PARAM_KEY_TO_I18N[paramKey] ?? `sens.${paramKey}`;
}
