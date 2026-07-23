/**
 * Country Intelligence — reference profiles for mining jurisdictions.
 *
 * Rules:
 * - Never invent values. Unknown fields stay null → UI shows "Not Available".
 * - Catalog fiscal/risk fields enrich the profile when a CountryCatalogItem is provided.
 * - Future infrastructure / risk fields are typed here so they can be filled later
 *   without refactoring callers or the panel component.
 */

import type { CountryCatalogItemDto } from '@/lib/master-data/country-types';
import type { Locale } from '@/lib/i18n/translations';

/** Display value: string, or null when unavailable. */
export type CountryIntelValue = string | null;

/**
 * Core + future-compatible intelligence fields.
 * Add new optional fields here; register them in COUNTRY_INTEL_FIELD_DEFS to show in UI.
 */
export interface CountryIntelligenceProfile {
  countryCode: string;
  country: CountryIntelValue;
  capital: CountryIntelValue;
  officialLanguage: CountryIntelValue;
  currency: CountryIntelValue;
  governmentType: CountryIntelValue;
  population: CountryIntelValue;
  timeZone: CountryIntelValue;
  drivingSide: CountryIntelValue;
  voltage: CountryIntelValue;
  climate: CountryIntelValue;
  miningOverview: CountryIntelValue;
  majorCommodities: CountryIntelValue;
  corporateTax: CountryIntelValue;
  minimumWage: CountryIntelValue;
  politicalStability: CountryIntelValue;
  miningFriendliness: CountryIntelValue;

  // Future-compatible (null until curated data exists)
  infrastructure: CountryIntelValue;
  ports: CountryIntelValue;
  railways: CountryIntelValue;
  airports: CountryIntelValue;
  powerGrid: CountryIntelValue;
  waterAvailability: CountryIntelValue;
  environmentalRisk: CountryIntelValue;
  seismicRisk: CountryIntelValue;
}

export type CountryIntelligenceFieldKey = keyof Omit<
  CountryIntelligenceProfile,
  'countryCode'
>;

export type CountryIntelligenceFieldGroup =
  | 'identity'
  | 'governance'
  | 'mining'
  | 'infrastructure';

export interface CountryIntelligenceFieldDef {
  key: CountryIntelligenceFieldKey;
  /** i18n key under ci.field.* */
  labelKey: string;
  group: CountryIntelligenceFieldGroup;
  /** When false, field is reserved for future UI without showing empty rows today. */
  visible: boolean;
}

/** Field registry — toggle `visible` or add keys to extend the panel without refactoring. */
export const COUNTRY_INTEL_FIELD_DEFS: readonly CountryIntelligenceFieldDef[] = [
  { key: 'country', labelKey: 'ci.field.country', group: 'identity', visible: true },
  { key: 'capital', labelKey: 'ci.field.capital', group: 'identity', visible: true },
  { key: 'officialLanguage', labelKey: 'ci.field.officialLanguage', group: 'identity', visible: true },
  { key: 'currency', labelKey: 'ci.field.currency', group: 'identity', visible: true },
  { key: 'governmentType', labelKey: 'ci.field.governmentType', group: 'governance', visible: true },
  { key: 'population', labelKey: 'ci.field.population', group: 'identity', visible: true },
  { key: 'timeZone', labelKey: 'ci.field.timeZone', group: 'identity', visible: true },
  { key: 'drivingSide', labelKey: 'ci.field.drivingSide', group: 'identity', visible: true },
  { key: 'voltage', labelKey: 'ci.field.voltage', group: 'identity', visible: true },
  { key: 'climate', labelKey: 'ci.field.climate', group: 'identity', visible: true },
  { key: 'miningOverview', labelKey: 'ci.field.miningOverview', group: 'mining', visible: true },
  { key: 'majorCommodities', labelKey: 'ci.field.majorCommodities', group: 'mining', visible: true },
  { key: 'corporateTax', labelKey: 'ci.field.corporateTax', group: 'governance', visible: true },
  { key: 'minimumWage', labelKey: 'ci.field.minimumWage', group: 'governance', visible: true },
  { key: 'politicalStability', labelKey: 'ci.field.politicalStability', group: 'governance', visible: true },
  { key: 'miningFriendliness', labelKey: 'ci.field.miningFriendliness', group: 'mining', visible: true },
  { key: 'infrastructure', labelKey: 'ci.field.infrastructure', group: 'infrastructure', visible: false },
  { key: 'ports', labelKey: 'ci.field.ports', group: 'infrastructure', visible: false },
  { key: 'railways', labelKey: 'ci.field.railways', group: 'infrastructure', visible: false },
  { key: 'airports', labelKey: 'ci.field.airports', group: 'infrastructure', visible: false },
  { key: 'powerGrid', labelKey: 'ci.field.powerGrid', group: 'infrastructure', visible: false },
  { key: 'waterAvailability', labelKey: 'ci.field.waterAvailability', group: 'infrastructure', visible: false },
  { key: 'environmentalRisk', labelKey: 'ci.field.environmentalRisk', group: 'infrastructure', visible: false },
  { key: 'seismicRisk', labelKey: 'ci.field.seismicRisk', group: 'infrastructure', visible: false },
] as const;

interface CountryReferenceRow {
  countryEn: string;
  countryTr: string;
  capitalEn: string;
  capitalTr: string;
  officialLanguageEn: string;
  officialLanguageTr: string;
  currencyCode: string;
  currencyNameEn: string;
  currencyNameTr: string;
  governmentTypeEn: string;
  governmentTypeTr: string;
  populationEn: string;
  populationTr: string;
  timeZone: string;
  drivingSideEn: 'Left' | 'Right';
  drivingSideTr: 'Sol' | 'Sağ';
  voltage: string;
  climateEn: string;
  climateTr: string;
  miningOverviewEn: string;
  miningOverviewTr: string;
  majorCommoditiesEn: string;
  majorCommoditiesTr: string;
  /** Only set when a stable published figure is curated; otherwise omit → Not Available. */
  minimumWageEn?: string;
  minimumWageTr?: string;
}

const EMPTY_FUTURE: Pick<
  CountryIntelligenceProfile,
  | 'infrastructure'
  | 'ports'
  | 'railways'
  | 'airports'
  | 'powerGrid'
  | 'waterAvailability'
  | 'environmentalRisk'
  | 'seismicRisk'
> = {
  infrastructure: null,
  ports: null,
  railways: null,
  airports: null,
  powerGrid: null,
  waterAvailability: null,
  environmentalRisk: null,
  seismicRisk: null,
};

/**
 * Curated public reference facts for seeded mining jurisdictions.
 * Fields without a verified value are omitted and resolve to null.
 */
const COUNTRY_REFERENCE: Record<string, CountryReferenceRow> = {
  CL: {
    countryEn: 'Chile',
    countryTr: 'Şili',
    capitalEn: 'Santiago',
    capitalTr: 'Santiago',
    officialLanguageEn: 'Spanish',
    officialLanguageTr: 'İspanyolca',
    currencyCode: 'CLP',
    currencyNameEn: 'Chilean Peso (CLP)',
    currencyNameTr: 'Şili Pesosu (CLP)',
    governmentTypeEn: 'Unitary presidential republic',
    governmentTypeTr: 'Üniter başkanlık cumhuriyeti',
    populationEn: '~19.5 million',
    populationTr: '~19,5 milyon',
    timeZone: 'UTC−3 / UTC−4',
    drivingSideEn: 'Right',
    drivingSideTr: 'Sağ',
    voltage: '220 V / 50 Hz',
    climateEn: 'Mediterranean (central); arid Atacama north; temperate south',
    climateTr: 'Akdeniz (orta); kurak Atacama kuzeyi; ılıman güney',
    miningOverviewEn:
      'World-leading copper producer with a mature mining code, established ports, and deep OEM/contractor ecosystem.',
    miningOverviewTr:
      'Olgun madencilik mevzuatı, liman altyapısı ve güçlü OEM/yüklenici ekosistemiyle dünyanın önde gelen bakır üreticisi.',
    majorCommoditiesEn: 'Copper, lithium, molybdenum, gold, silver',
    majorCommoditiesTr: 'Bakır, lityum, molibden, altın, gümüş',
  },
  TR: {
    countryEn: 'Türkiye',
    countryTr: 'Türkiye',
    capitalEn: 'Ankara',
    capitalTr: 'Ankara',
    officialLanguageEn: 'Turkish',
    officialLanguageTr: 'Türkçe',
    currencyCode: 'TRY',
    currencyNameEn: 'Turkish Lira (TRY)',
    currencyNameTr: 'Türk Lirası (TRY)',
    governmentTypeEn: 'Unitary presidential republic',
    governmentTypeTr: 'Üniter başkanlık cumhuriyeti',
    populationEn: '~85 million',
    populationTr: '~85 milyon',
    timeZone: 'UTC+3',
    drivingSideEn: 'Right',
    drivingSideTr: 'Sağ',
    voltage: '230 V / 50 Hz',
    climateEn: 'Mediterranean, continental inland, temperate Black Sea coast',
    climateTr: 'Akdeniz, iç kesimde karasal, Karadeniz kıyısında ılıman',
    miningOverviewEn:
      'Diversified metals and industrial minerals sector; royalty rates vary by commodity group.',
    miningOverviewTr:
      'Çeşitlendirilmiş metal ve endüstriyel mineral sektörü; devlet hakkı emtia grubuna göre değişir.',
    majorCommoditiesEn: 'Gold, copper, boron, chromium, coal, marble',
    majorCommoditiesTr: 'Altın, bakır, bor, krom, kömür, mermer',
  },
  CA: {
    countryEn: 'Canada',
    countryTr: 'Kanada',
    capitalEn: 'Ottawa',
    capitalTr: 'Ottawa',
    officialLanguageEn: 'English, French',
    officialLanguageTr: 'İngilizce, Fransızca',
    currencyCode: 'CAD',
    currencyNameEn: 'Canadian Dollar (CAD)',
    currencyNameTr: 'Kanada Doları (CAD)',
    governmentTypeEn: 'Federal parliamentary constitutional monarchy',
    governmentTypeTr: 'Federal parlamenter anayasal monarşi',
    populationEn: '~40 million',
    populationTr: '~40 milyon',
    timeZone: 'UTC−3.5 to UTC−8',
    drivingSideEn: 'Right',
    drivingSideTr: 'Sağ',
    voltage: '120 V / 60 Hz',
    climateEn: 'Predominantly continental / subarctic; temperate Pacific coast',
    climateTr: 'Ağırlıklı karasal / yarı-arktik; ılıman Pasifik kıyısı',
    miningOverviewEn:
      'Tier-1 mining jurisdiction with provincial royalties, strong ESG expectations, and Indigenous consultation requirements.',
    miningOverviewTr:
      'Eyalet royaltileri, güçlü ESG beklentileri ve Yerli halklarla istişare yükümlülükleriyle birinci sınıf madencilik yargı alanı.',
    majorCommoditiesEn: 'Gold, copper, nickel, potash, iron ore, uranium, diamonds',
    majorCommoditiesTr: 'Altın, bakır, nikel, potas, demir cevheri, uranyum, elmas',
  },
  AU: {
    countryEn: 'Australia',
    countryTr: 'Avustralya',
    capitalEn: 'Canberra',
    capitalTr: 'Kanberra',
    officialLanguageEn: 'English',
    officialLanguageTr: 'İngilizce',
    currencyCode: 'AUD',
    currencyNameEn: 'Australian Dollar (AUD)',
    currencyNameTr: 'Avustralya Doları (AUD)',
    governmentTypeEn: 'Federal parliamentary constitutional monarchy',
    governmentTypeTr: 'Federal parlamenter anayasal monarşi',
    populationEn: '~27 million',
    populationTr: '~27 milyon',
    timeZone: 'UTC+8 to UTC+10.5',
    drivingSideEn: 'Left',
    drivingSideTr: 'Sol',
    voltage: '230 V / 50 Hz',
    climateEn: 'Arid interior; tropical north; temperate south',
    climateTr: 'Kurak iç kesim; tropikal kuzey; ılıman güney',
    miningOverviewEn:
      'Major bulk and battery-metals exporter; state royalties differ (e.g. WA iron ore vs QLD coal).',
    miningOverviewTr:
      'Önemli dökme ve batarya metalleri ihracatçısı; eyalet royaltileri farklılık gösterir (örn. WA demir, QLD kömür).',
    majorCommoditiesEn: 'Iron ore, coal, gold, copper, lithium, nickel, bauxite',
    majorCommoditiesTr: 'Demir cevheri, kömür, altın, bakır, lityum, nikel, boksit',
  },
  PE: {
    countryEn: 'Peru',
    countryTr: 'Peru',
    capitalEn: 'Lima',
    capitalTr: 'Lima',
    officialLanguageEn: 'Spanish, Quechua, Aymara',
    officialLanguageTr: 'İspanyolca, Keçuva, Aymara',
    currencyCode: 'PEN',
    currencyNameEn: 'Peruvian Sol (PEN)',
    currencyNameTr: 'Peru Solü (PEN)',
    governmentTypeEn: 'Unitary presidential republic',
    governmentTypeTr: 'Üniter başkanlık cumhuriyeti',
    populationEn: '~34 million',
    populationTr: '~34 milyon',
    timeZone: 'UTC−5',
    drivingSideEn: 'Right',
    drivingSideTr: 'Sağ',
    voltage: '220 V / 60 Hz',
    climateEn: 'Arid coast; Andean highlands; Amazon rainforest east',
    climateTr: 'Kurak kıyı; And platoları; doğuda Amazon yağmur ormanı',
    miningOverviewEn:
      'Major copper and precious-metals producer; social licence and community agreements often on the critical path.',
    miningOverviewTr:
      'Önemli bakır ve kıymetli metal üreticisi; sosyal lisans ve toplum anlaşmaları sıklıkla kritik yoldadır.',
    majorCommoditiesEn: 'Copper, gold, silver, zinc, lead, tin',
    majorCommoditiesTr: 'Bakır, altın, gümüş, çinko, kurşun, kalay',
  },
  BR: {
    countryEn: 'Brazil',
    countryTr: 'Brezilya',
    capitalEn: 'Brasília',
    capitalTr: 'Brasília',
    officialLanguageEn: 'Portuguese',
    officialLanguageTr: 'Portekizce',
    currencyCode: 'BRL',
    currencyNameEn: 'Brazilian Real (BRL)',
    currencyNameTr: 'Brezilya Reali (BRL)',
    governmentTypeEn: 'Federal presidential republic',
    governmentTypeTr: 'Federal başkanlık cumhuriyeti',
    populationEn: '~215 million',
    populationTr: '~215 milyon',
    timeZone: 'UTC−2 to UTC−5',
    drivingSideEn: 'Right',
    drivingSideTr: 'Sağ',
    voltage: '127/220 V / 60 Hz',
    climateEn: 'Tropical; subtropical south; Amazon rainforest north',
    climateTr: 'Tropikal; güneyde subtropikal; kuzeyde Amazon yağmur ormanı',
    miningOverviewEn:
      'Large-scale iron ore and bauxite producer; CFEM royalty framework applies nationally.',
    miningOverviewTr:
      'Büyük ölçekli demir cevheri ve boksit üreticisi; ulusal CFEM royalty çerçevesi uygulanır.',
    majorCommoditiesEn: 'Iron ore, bauxite, gold, nickel, niobium, manganese',
    majorCommoditiesTr: 'Demir cevheri, boksit, altın, nikel, niyobyum, manganez',
  },
  US: {
    countryEn: 'United States',
    countryTr: 'Amerika Birleşik Devletleri',
    capitalEn: 'Washington, D.C.',
    capitalTr: 'Washington, D.C.',
    officialLanguageEn: 'English (de facto)',
    officialLanguageTr: 'İngilizce (fiili)',
    currencyCode: 'USD',
    currencyNameEn: 'US Dollar (USD)',
    currencyNameTr: 'ABD Doları (USD)',
    governmentTypeEn: 'Federal presidential constitutional republic',
    governmentTypeTr: 'Federal başkanlık anayasal cumhuriyeti',
    populationEn: '~335 million',
    populationTr: '~335 milyon',
    timeZone: 'UTC−5 to UTC−10 (contiguous & states)',
    drivingSideEn: 'Right',
    drivingSideTr: 'Sağ',
    voltage: '120 V / 60 Hz',
    climateEn: 'Highly varied: arid west, humid east, arctic Alaska, tropical Hawaii',
    climateTr: 'Çok değişken: kurak batı, nemli doğu, arktik Alaska, tropikal Hawaii',
    miningOverviewEn:
      'Federal and state permitting (NEPA-style) can be lengthy; royalties and taxes vary widely by commodity and land tenure.',
    miningOverviewTr:
      'Federal ve eyalet izin süreçleri (NEPA tarzı) uzun sürebilir; royalty ve vergiler emtia ve arazi rejimine göre değişir.',
    majorCommoditiesEn: 'Copper, gold, coal, iron ore, molybdenum, rare earths',
    majorCommoditiesTr: 'Bakır, altın, kömür, demir cevheri, molibden, nadir topraklar',
  },
  ZA: {
    countryEn: 'South Africa',
    countryTr: 'Güney Afrika',
    capitalEn: 'Pretoria (administrative)',
    capitalTr: 'Pretoria (idari)',
    officialLanguageEn: '11 official languages (incl. English, Afrikaans, Zulu, Xhosa)',
    officialLanguageTr: '11 resmi dil (İngilizce, Afrikaans, Zulu, Xhosa dahil)',
    currencyCode: 'ZAR',
    currencyNameEn: 'South African Rand (ZAR)',
    currencyNameTr: 'Güney Afrika Randı (ZAR)',
    governmentTypeEn: 'Unitary parliamentary republic',
    governmentTypeTr: 'Üniter parlamenter cumhuriyet',
    populationEn: '~60 million',
    populationTr: '~60 milyon',
    timeZone: 'UTC+2',
    drivingSideEn: 'Left',
    drivingSideTr: 'Sol',
    voltage: '230 V / 50 Hz',
    climateEn: 'Mostly temperate / semi-arid; subtropical east coast',
    climateTr: 'Çoğunlukla ılıman / yarı kurak; doğu kıyısı subtropikal',
    miningOverviewEn:
      'Deep-level gold and PGM heritage; power reliability and logistics are material opex risks.',
    miningOverviewTr:
      'Derin seviye altın ve PGM mirası; elektrik güvenilirliği ve lojistik önemli opex riskleridir.',
    majorCommoditiesEn: 'Platinum group metals, gold, coal, chrome, iron ore, manganese',
    majorCommoditiesTr: 'Platin grubu metaller, altın, kömür, krom, demir cevheri, manganez',
  },
  ID: {
    countryEn: 'Indonesia',
    countryTr: 'Endonezya',
    capitalEn: 'Jakarta',
    capitalTr: 'Cakarta',
    officialLanguageEn: 'Indonesian',
    officialLanguageTr: 'Endonezce',
    currencyCode: 'IDR',
    currencyNameEn: 'Indonesian Rupiah (IDR)',
    currencyNameTr: 'Endonezya Rupiahı (IDR)',
    governmentTypeEn: 'Unitary presidential republic',
    governmentTypeTr: 'Üniter başkanlık cumhuriyeti',
    populationEn: '~280 million',
    populationTr: '~280 milyon',
    timeZone: 'UTC+7 to UTC+9',
    drivingSideEn: 'Left',
    drivingSideTr: 'Sol',
    voltage: '230 V / 50 Hz',
    climateEn: 'Tropical rainforest / monsoon across the archipelago',
    climateTr: 'Takımadalar genelinde tropikal yağmur ormanı / muson',
    miningOverviewEn:
      'Major nickel and thermal coal producer; downstreaming and export rules change frequently — verify policy.',
    miningOverviewTr:
      'Önemli nikel ve termal kömür üreticisi; aşağı akış ve ihracat kuralları sık değişir — politikayı doğrulayın.',
    majorCommoditiesEn: 'Nickel, coal, tin, copper, gold, bauxite',
    majorCommoditiesTr: 'Nikel, kömür, kalay, bakır, altın, boksit',
  },
  KZ: {
    countryEn: 'Kazakhstan',
    countryTr: 'Kazakistan',
    capitalEn: 'Astana',
    capitalTr: 'Astana',
    officialLanguageEn: 'Kazakh, Russian',
    officialLanguageTr: 'Kazakça, Rusça',
    currencyCode: 'KZT',
    currencyNameEn: 'Kazakhstani Tenge (KZT)',
    currencyNameTr: 'Kazakistan Tengesi (KZT)',
    governmentTypeEn: 'Unitary presidential republic',
    governmentTypeTr: 'Üniter başkanlık cumhuriyeti',
    populationEn: '~20 million',
    populationTr: '~20 milyon',
    timeZone: 'UTC+5 / UTC+6',
    drivingSideEn: 'Right',
    drivingSideTr: 'Sağ',
    voltage: '220 V / 50 Hz',
    climateEn: 'Continental / semi-arid steppes; cold winters',
    climateTr: 'Karasal / yarı kurak bozkırlar; soğuk kışlar',
    miningOverviewEn:
      'Large uranium, copper, and bulk-commodity base; mineral extraction tax (MET) is a key fiscal lever.',
    miningOverviewTr:
      'Geniş uranyum, bakır ve dökme emtia tabanı; maden çıkarma vergisi (MET) temel mali kaldıraçtır.',
    majorCommoditiesEn: 'Uranium, copper, coal, chromium, zinc, lead',
    majorCommoditiesTr: 'Uranyum, bakır, kömür, krom, çinko, kurşun',
  },
  SE: {
    countryEn: 'Sweden',
    countryTr: 'İsveç',
    capitalEn: 'Stockholm',
    capitalTr: 'Stockholm',
    officialLanguageEn: 'Swedish',
    officialLanguageTr: 'İsveççe',
    currencyCode: 'SEK',
    currencyNameEn: 'Swedish Krona (SEK)',
    currencyNameTr: 'İsveç Kronu (SEK)',
    governmentTypeEn: 'Unitary parliamentary constitutional monarchy',
    governmentTypeTr: 'Üniter parlamenter anayasal monarşi',
    populationEn: '~10.5 million',
    populationTr: '~10,5 milyon',
    timeZone: 'UTC+1 / UTC+2 (DST)',
    drivingSideEn: 'Right',
    drivingSideTr: 'Sağ',
    voltage: '230 V / 50 Hz',
    climateEn: 'Temperate to subarctic; cold winters in the north',
    climateTr: 'Ilıman–yarı arktik; kuzeyde soğuk kışlar',
    miningOverviewEn:
      'Low mineral fee but long ESG and permitting timelines; high labour and rehabilitation cost base.',
    miningOverviewTr:
      'Düşük mineral harcı ancak uzun ESG ve izin süreçleri; yüksek işgücü ve rehabilitasyon maliyet tabanı.',
    majorCommoditiesEn: 'Iron ore, copper, zinc, gold, silver',
    majorCommoditiesTr: 'Demir cevheri, bakır, çinko, altın, gümüş',
  },
  FI: {
    countryEn: 'Finland',
    countryTr: 'Finlandiya',
    capitalEn: 'Helsinki',
    capitalTr: 'Helsinki',
    officialLanguageEn: 'Finnish, Swedish',
    officialLanguageTr: 'Fince, İsveççe',
    currencyCode: 'EUR',
    currencyNameEn: 'Euro (EUR)',
    currencyNameTr: 'Euro (EUR)',
    governmentTypeEn: 'Unitary parliamentary republic',
    governmentTypeTr: 'Üniter parlamenter cumhuriyet',
    populationEn: '~5.6 million',
    populationTr: '~5,6 milyon',
    timeZone: 'UTC+2 / UTC+3 (DST)',
    drivingSideEn: 'Right',
    drivingSideTr: 'Sağ',
    voltage: '230 V / 50 Hz',
    climateEn: 'Temperate / subarctic; cold winters',
    climateTr: 'Ilıman / yarı arktik; soğuk kışlar',
    miningOverviewEn:
      'Light royalty/fee structure; permitting and ESG dominate schedule risk for greenfield projects.',
    miningOverviewTr:
      'Hafif royalty/harç yapısı; yeşil alan projelerinde izin ve ESG süre riskini domine eder.',
    majorCommoditiesEn: 'Nickel, copper, gold, chromium, cobalt',
    majorCommoditiesTr: 'Nikel, bakır, altın, krom, kobalt',
  },
  MN: {
    countryEn: 'Mongolia',
    countryTr: 'Moğolistan',
    capitalEn: 'Ulaanbaatar',
    capitalTr: 'Ulan Batur',
    officialLanguageEn: 'Mongolian',
    officialLanguageTr: 'Moğolca',
    currencyCode: 'MNT',
    currencyNameEn: 'Mongolian Tögrög (MNT)',
    currencyNameTr: 'Moğolistan Tugriki (MNT)',
    governmentTypeEn: 'Unitary semi-presidential republic',
    governmentTypeTr: 'Üniter yarı-başkanlık cumhuriyeti',
    populationEn: '~3.4 million',
    populationTr: '~3,4 milyon',
    timeZone: 'UTC+8',
    drivingSideEn: 'Right',
    drivingSideTr: 'Sağ',
    voltage: '220 V / 50 Hz',
    climateEn: 'Continental / cold desert; extreme winters',
    climateTr: 'Karasal / soğuk çöl; aşırı kışlar',
    miningOverviewEn:
      'Coal and copper growth corridor; logistics to China and winter climate drive bulk-commodity costs.',
    miningOverviewTr:
      'Kömür ve bakır büyüme koridoru; Çin’e lojistik ve kış iklimi dökme emtia maliyetlerini belirler.',
    majorCommoditiesEn: 'Coal, copper, gold, fluorspar, molybdenum',
    majorCommoditiesTr: 'Kömür, bakır, altın, florit, molibden',
  },
  AR: {
    countryEn: 'Argentina',
    countryTr: 'Arjantin',
    capitalEn: 'Buenos Aires',
    capitalTr: 'Buenos Aires',
    officialLanguageEn: 'Spanish',
    officialLanguageTr: 'İspanyolca',
    currencyCode: 'ARS',
    currencyNameEn: 'Argentine Peso (ARS)',
    currencyNameTr: 'Arjantin Pesosu (ARS)',
    governmentTypeEn: 'Federal presidential republic',
    governmentTypeTr: 'Federal başkanlık cumhuriyeti',
    populationEn: '~46 million',
    populationTr: '~46 milyon',
    timeZone: 'UTC−3',
    drivingSideEn: 'Right',
    drivingSideTr: 'Sağ',
    voltage: '220 V / 50 Hz',
    climateEn: 'Temperate Pampas; arid west/northwest; cold south',
    climateTr: 'Ilıman Pampas; kurak batı/kuzeybatı; soğuk güney',
    miningOverviewEn:
      'Lithium triangle provinces and Andean copper/gold belts; FX and inflation volatility are material planning risks.',
    miningOverviewTr:
      'Lityum üçgeni eyaletleri ve And bakır/altın kuşakları; döviz ve enflasyon oynaklığı önemli planlama riskidir.',
    majorCommoditiesEn: 'Lithium, copper, gold, silver, boron',
    majorCommoditiesTr: 'Lityum, bakır, altın, gümüş, bor',
  },
  MX: {
    countryEn: 'Mexico',
    countryTr: 'Meksika',
    capitalEn: 'Mexico City',
    capitalTr: 'Mexico City',
    officialLanguageEn: 'Spanish',
    officialLanguageTr: 'İspanyolca',
    currencyCode: 'MXN',
    currencyNameEn: 'Mexican Peso (MXN)',
    currencyNameTr: 'Meksika Pesosu (MXN)',
    governmentTypeEn: 'Federal presidential republic',
    governmentTypeTr: 'Federal başkanlık cumhuriyeti',
    populationEn: '~130 million',
    populationTr: '~130 milyon',
    timeZone: 'UTC−5 to UTC−8',
    drivingSideEn: 'Right',
    drivingSideTr: 'Sağ',
    voltage: '127 V / 60 Hz',
    climateEn: 'Arid north; tropical south; temperate highlands',
    climateTr: 'Kurak kuzey; tropikal güney; ılıman yaylalar',
    miningOverviewEn:
      'Significant silver and gold producer; mining royalty and mining duty frameworks apply.',
    miningOverviewTr:
      'Önemli gümüş ve altın üreticisi; madencilik royalty ve harç çerçeveleri uygulanır.',
    majorCommoditiesEn: 'Silver, gold, copper, zinc, lead, molybdenum',
    majorCommoditiesTr: 'Gümüş, altın, bakır, çinko, kurşun, molibden',
  },
};

export interface CatalogRiskEnrichment {
  corporateTaxPct?: number | null;
  politicalRisk?: string | null;
  miningInvestmentRisk?: string | null;
  currencyCode?: string | null;
  name?: string | null;
  nameTr?: string | null;
}

export interface ResolveCountryIntelligenceInput {
  countryCode: string;
  locale?: Locale;
  catalog?: CatalogRiskEnrichment | CountryCatalogItemDto | null;
}

function pickLocale<T>(locale: Locale, en: T, tr: T): T {
  return locale === 'tr' ? tr : en;
}

function formatCorporateTaxPct(pct: number | null | undefined): CountryIntelValue {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return null;
  return `${pct}%`;
}

/**
 * Map catalog risk tokens to display labels.
 * Unknown tokens return null (Not Available) — never invent a risk rating.
 */
function mapRiskLabel(
  raw: string | null | undefined,
  locale: Locale
): CountryIntelValue {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  const labels: Record<string, { en: string; tr: string }> = {
    low: { en: 'Low', tr: 'Düşük' },
    medium: { en: 'Medium', tr: 'Orta' },
    moderate: { en: 'Medium', tr: 'Orta' },
    high: { en: 'High', tr: 'Yüksek' },
    'very high': { en: 'Very High', tr: 'Çok Yüksek' },
    very_high: { en: 'Very High', tr: 'Çok Yüksek' },
  };
  const hit = labels[key];
  if (!hit) return null;
  return pickLocale(locale, hit.en, hit.tr);
}

function emptyProfile(countryCode: string): CountryIntelligenceProfile {
  return {
    countryCode,
    country: null,
    capital: null,
    officialLanguage: null,
    currency: null,
    governmentType: null,
    population: null,
    timeZone: null,
    drivingSide: null,
    voltage: null,
    climate: null,
    miningOverview: null,
    majorCommodities: null,
    corporateTax: null,
    minimumWage: null,
    politicalStability: null,
    miningFriendliness: null,
    ...EMPTY_FUTURE,
  };
}

/**
 * Resolve a Country Intelligence profile for a project country code.
 * Missing reference or catalog data → null fields (UI: Not Available).
 */
export function resolveCountryIntelligence(
  input: ResolveCountryIntelligenceInput
): CountryIntelligenceProfile {
  const code = (input.countryCode ?? '').trim().toUpperCase();
  const locale: Locale = input.locale === 'tr' ? 'tr' : 'en';
  const catalog = input.catalog ?? null;

  if (!code) {
    return emptyProfile('');
  }

  const ref = COUNTRY_REFERENCE[code];
  const profile = emptyProfile(code);

  if (ref) {
    profile.country = pickLocale(locale, ref.countryEn, ref.countryTr);
    profile.capital = pickLocale(locale, ref.capitalEn, ref.capitalTr);
    profile.officialLanguage = pickLocale(
      locale,
      ref.officialLanguageEn,
      ref.officialLanguageTr
    );
    profile.currency = pickLocale(locale, ref.currencyNameEn, ref.currencyNameTr);
    profile.governmentType = pickLocale(
      locale,
      ref.governmentTypeEn,
      ref.governmentTypeTr
    );
    profile.population = pickLocale(locale, ref.populationEn, ref.populationTr);
    profile.timeZone = ref.timeZone;
    profile.drivingSide = pickLocale(locale, ref.drivingSideEn, ref.drivingSideTr);
    profile.voltage = ref.voltage;
    profile.climate = pickLocale(locale, ref.climateEn, ref.climateTr);
    profile.miningOverview = pickLocale(
      locale,
      ref.miningOverviewEn,
      ref.miningOverviewTr
    );
    profile.majorCommodities = pickLocale(
      locale,
      ref.majorCommoditiesEn,
      ref.majorCommoditiesTr
    );
    profile.minimumWage = pickLocale(
      locale,
      ref.minimumWageEn ?? null,
      ref.minimumWageTr ?? null
    );
  } else if (catalog) {
    // Unknown code but catalog name/currency known — use only verified catalog fields.
    const name =
      locale === 'tr' && catalog.nameTr
        ? catalog.nameTr
        : catalog.name ?? null;
    profile.country = name && name.trim() ? name : code;
    if (catalog.currencyCode) {
      profile.currency = catalog.currencyCode;
    }
  } else {
    profile.country = code;
  }

  if (catalog) {
    profile.corporateTax = formatCorporateTaxPct(catalog.corporateTaxPct);
    profile.politicalStability = mapRiskLabel(catalog.politicalRisk, locale);
    profile.miningFriendliness = mapRiskLabel(catalog.miningInvestmentRisk, locale);
    if (!profile.currency && catalog.currencyCode) {
      profile.currency = catalog.currencyCode;
    }
    if (!ref) {
      const name =
        locale === 'tr' && catalog.nameTr
          ? catalog.nameTr
          : catalog.name ?? null;
      if (name && name.trim()) profile.country = name;
    }
  }

  return profile;
}

export function getVisibleCountryIntelligenceFields(): CountryIntelligenceFieldDef[] {
  return COUNTRY_INTEL_FIELD_DEFS.filter((f) => f.visible);
}

export function hasCountryCode(countryCode: string | null | undefined): boolean {
  return Boolean(countryCode && countryCode.trim());
}
