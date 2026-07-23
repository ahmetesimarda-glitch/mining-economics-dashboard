/**
 * Mining Intelligence service.
 *
 * Architecture (UI-stable):
 *   UI → Mining Intelligence Service → Current Static Data
 *                                    → Future Live API
 *
 * Swap only the provider implementation when a live news/commodity feed
 * is integrated. Card shapes and UI components stay unchanged.
 *
 * Content is educational / evergreen reference material.
 * Never present static briefs as live news.
 */

import type { Locale } from '@/lib/i18n/translations';

/** Provider kinds — `live_*` reserved for future integrations. */
export type MiningIntelligenceSourceKind =
  | 'static_reference'
  | 'news_api'
  | 'commodity_api'
  | 'ai_brief';

export type MiningIntelligenceBadgeKind =
  | 'reference_information'
  | 'industry_overview'
  | 'live';

export type MiningIntelligenceCategory =
  | 'metal_markets'
  | 'investment'
  | 'commodity_demand'
  | 'esg'
  | 'energy'
  | 'critical_minerals'
  | 'exploration';

/**
 * UI contract for one intelligence card.
 * Future live providers must map into this shape — do not change without a UI migration.
 */
export interface MiningIntelligenceItem {
  id: string;
  category: MiningIntelligenceCategory;
  title: string;
  summary: string;
  relatedCommodities: string[];
  /** Human-readable content version (e.g. 2026.07) — not a live news timestamp. */
  contentVersion: string;
  /** ISO date of the static content revision (or live article date when provider is live). */
  updatedAt: string;
  /** Optional deep-link when a live provider supplies one. */
  url?: string;
}

export interface MiningIntelligenceFeed {
  items: MiningIntelligenceItem[];
  badgeKind: MiningIntelligenceBadgeKind;
  sourceKind: MiningIntelligenceSourceKind;
  /** False for static reference content; true only when a live provider is active. */
  isLive: boolean;
  contentVersion: string;
  fetchedAt: string;
}

export interface MiningIntelligenceQuery {
  limit?: number;
  locale?: Locale;
}

/**
 * Provider interface — implement this for a future live news API.
 * UI calls only through `getMiningIntelligence` / `getMiningIntelligenceService`.
 */
export interface MiningIntelligenceProvider {
  getIntelligence(query?: MiningIntelligenceQuery): Promise<MiningIntelligenceFeed>;
}

/** Shared content version for the current static pack. */
export const MINING_INTELLIGENCE_CONTENT_VERSION = '2026.07';
export const MINING_INTELLIGENCE_UPDATED_AT = '2026-07-01T00:00:00.000Z';

interface StaticBrief {
  id: string;
  category: MiningIntelligenceCategory;
  titleEn: string;
  titleTr: string;
  summaryEn: string;
  summaryTr: string;
  relatedCommodities: readonly string[];
}

/**
 * Evergreen industry reference briefs — educational, not live news.
 * Do not invent breaking headlines or fake publish clocks.
 */
const STATIC_BRIEFS: readonly StaticBrief[] = [
  {
    id: 'mi-metal-market-trends',
    category: 'metal_markets',
    titleEn: 'Metal market trends for feasibility planning',
    titleTr: 'Fizibilite planlaması için metal piyasa eğilimleri',
    summaryEn:
      'Long-cycle base metals (copper, nickel, zinc) remain sensitive to energy-transition demand and Chinese construction cycles. Feasibility models should stress-test price decks across multi-year cycles rather than a single spot assumption, and document the source of each price scenario explicitly.',
    summaryTr:
      'Uzun döngülü baz metaller (bakır, nikel, çinko) enerji dönüşümü talebi ve Çin inşaat döngülerine duyarlıdır. Fizibilite modelleri tek bir spot varsayım yerine çok yıllı fiyat senaryolarını stres-test etmeli ve her senaryonun kaynağını açıkça belgelemelidir.',
    relatedCommodities: ['Copper', 'Nickel', 'Zinc', 'Gold'],
  },
  {
    id: 'mi-investment-considerations',
    category: 'investment',
    titleEn: 'Mining investment considerations',
    titleTr: 'Madencilik yatırımında dikkat edilecekler',
    summaryEn:
      'Capital intensity, permitting duration, and social licence often dominate returns more than geological grade alone. Investors typically scrutinise jurisdiction risk, offtake security, power availability, and the realism of ramp-up schedules before committing to development capital.',
    summaryTr:
      'Sermaye yoğunluğu, izin süreleri ve sosyal lisans çoğu zaman getiriyi yalnızca jeolojik tenörden daha fazla etkiler. Yatırımcılar geliştirme sermayesi bağlamadan önce yargı alanı riski, satış anlaşması güvencesi, elektrik erişimi ve ramp-up programlarının gerçekçiliğini inceler.',
    relatedCommodities: ['Copper', 'Gold', 'Iron Ore', 'Lithium'],
  },
  {
    id: 'mi-commodity-demand-outlook',
    category: 'commodity_demand',
    titleEn: 'Commodity demand outlook (structural themes)',
    titleTr: 'Emtia talep görünümü (yapısal temalar)',
    summaryEn:
      'Structural demand themes include electrification (copper, nickel, lithium), steel-linked bulk commodities, and monetary/safe-haven demand for precious metals. Treat these as planning themes for scenario design — not as short-term price forecasts.',
    summaryTr:
      'Yapısal talep temaları elektrifikasyon (bakır, nikel, lityum), çeliğe bağlı dökme emtia ve kıymetli metallerde parasal/güvenli liman talebini kapsar. Bunları kısa vadeli fiyat tahmini değil, senaryo tasarımı için planlama temaları olarak ele alın.',
    relatedCommodities: ['Copper', 'Lithium', 'Nickel', 'Iron Ore', 'Gold'],
  },
  {
    id: 'mi-esg-developments',
    category: 'esg',
    titleEn: 'ESG developments in mining studies',
    titleTr: 'Madencilik çalışmalarında ESG gelişmeleri',
    summaryEn:
      'Environmental baselines, water stewardship, tailings standards, and community agreements increasingly sit on the critical path. Early ESG scoping reduces redesign risk and improves the credibility of rehabilitation and closure cost assumptions in techno-economic models.',
    summaryTr:
      'Çevresel temel çalışmalar, su yönetimi, atık barajı standartları ve toplum anlaşmaları giderek kritik yolda yer alır. Erken ESG kapsam belirleme, yeniden tasarım riskini azaltır ve tekno-ekonomik modellerde rehabilitasyon ile kapanış maliyet varsayımlarının güvenilirliğini artırır.',
    relatedCommodities: ['Copper', 'Gold', 'Coal', 'Rare Earths'],
  },
  {
    id: 'mi-energy-cost-observations',
    category: 'energy',
    titleEn: 'Energy cost observations for mine opex',
    titleTr: 'Maden opex’i için enerji maliyeti gözlemleri',
    summaryEn:
      'Diesel, grid electricity, and on-site generation dominate mobile fleet and processing opex in many open-pit operations. Sensitivity cases should vary fuel and power unit costs independently, and note whether electrification pathways change sustaining capital over the mine life.',
    summaryTr:
      'Dizel, şebeke elektriği ve sahada üretim birçok açık ocak işletmesinde mobil filoyu ve proses opex’ini domine eder. Duyarlılık senaryoları yakıt ve elektrik birim maliyetlerini bağımsız değiştirmeli; elektrifikasyon yollarının maden ömrü boyunca sürdürme yatırımını değiştirip değiştirmediğini not etmelidir.',
    relatedCommodities: ['Diesel', 'Copper', 'Iron Ore', 'Coal'],
  },
  {
    id: 'mi-critical-minerals-overview',
    category: 'critical_minerals',
    titleEn: 'Critical minerals overview',
    titleTr: 'Kritik minerallere genel bakış',
    summaryEn:
      'Critical minerals lists typically emphasise battery metals, rare earths, and specialty inputs to clean-energy and defence supply chains. Project economics should separate geological potential from offtake, refining capacity, and policy incentives — which can shift faster than resource models.',
    summaryTr:
      'Kritik mineral listeleri genellikle batarya metalleri, nadir topraklar ile temiz enerji ve savunma tedarik zincirlerine özel girdileri vurgular. Proje ekonomisi, jeolojik potansiyeli satış anlaşması, rafinaj kapasitesi ve politika teşviklerinden ayırmalıdır — bunlar kaynak modellerinden daha hızlı değişebilir.',
    relatedCommodities: ['Lithium', 'Nickel', 'Rare Earths', 'Cobalt', 'Copper'],
  },
  {
    id: 'mi-exploration-activity-summary',
    category: 'exploration',
    titleEn: 'Exploration activity — planning summary',
    titleTr: 'Arama faaliyetleri — planlama özeti',
    summaryEn:
      'Exploration budgets and drill metres tend to follow metal-price cycles with a lag. For development studies, treat exploration upside as optional value: keep the base case constrained to defined resources/reserves and document any inferred material separately from the cash-flow model.',
    summaryTr:
      'Arama bütçeleri ve sondaj metreleri metal fiyat döngülerini gecikmeli izleme eğilimindedir. Geliştirme çalışmalarında arama potansiyelini opsiyonel değer olarak ele alın: baz senaryoyu tanımlı kaynak/rezerv ile sınırlayın ve çıkarsanan malzemeyi nakit akış modelinden ayrı belgeleyin.',
    relatedCommodities: ['Gold', 'Copper', 'Lithium', 'Nickel'],
  },
] as const;

function pickLocale(locale: Locale, en: string, tr: string): string {
  return locale === 'tr' ? tr : en;
}

function mapBrief(brief: StaticBrief, locale: Locale): MiningIntelligenceItem {
  return {
    id: brief.id,
    category: brief.category,
    title: pickLocale(locale, brief.titleEn, brief.titleTr),
    summary: pickLocale(locale, brief.summaryEn, brief.summaryTr),
    relatedCommodities: [...brief.relatedCommodities],
    contentVersion: MINING_INTELLIGENCE_CONTENT_VERSION,
    updatedAt: MINING_INTELLIGENCE_UPDATED_AT,
  };
}

/**
 * Static reference provider — production default until a live API is wired.
 */
export class StaticMiningIntelligenceProvider implements MiningIntelligenceProvider {
  async getIntelligence(query: MiningIntelligenceQuery = {}): Promise<MiningIntelligenceFeed> {
    const locale: Locale = query.locale === 'tr' ? 'tr' : 'en';
    const limit = Math.max(1, query.limit ?? STATIC_BRIEFS.length);
    const items = STATIC_BRIEFS.slice(0, limit).map((b) => mapBrief(b, locale));

    return {
      items,
      badgeKind: 'reference_information',
      sourceKind: 'static_reference',
      isLive: false,
      contentVersion: MINING_INTELLIGENCE_CONTENT_VERSION,
      fetchedAt: MINING_INTELLIGENCE_UPDATED_AT,
    };
  }
}

let intelligenceService: MiningIntelligenceProvider = new StaticMiningIntelligenceProvider();

export function getMiningIntelligenceService(): MiningIntelligenceProvider {
  return intelligenceService;
}

/** DI hook for tests or a future live provider swap — not used by production UI paths. */
export function setMiningIntelligenceService(
  provider: MiningIntelligenceProvider
): void {
  intelligenceService = provider;
}

export async function getMiningIntelligence(
  query?: MiningIntelligenceQuery
): Promise<MiningIntelligenceFeed> {
  return getMiningIntelligenceService().getIntelligence(query);
}

/** i18n key helper for category labels (`mi.category.<id>`). */
export function miningIntelligenceCategoryLabelKey(
  category: MiningIntelligenceCategory
): string {
  return `mi.category.${category}`;
}
