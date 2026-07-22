/**
 * Mining Market Insights — architecture only (no live APIs).
 *
 * Future providers can implement NewsService without changing UI contracts:
 * - commodity price APIs
 * - mining news APIs
 * - AI-generated daily summaries
 */

export type NewsSourceKind = 'placeholder' | 'commodity_api' | 'news_api' | 'ai_brief';

export type NewsCategory =
  | 'commodity'
  | 'project'
  | 'regulation'
  | 'market'
  | 'technology'
  | 'general';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: NewsCategory;
  sourceLabel: string;
  sourceKind: NewsSourceKind;
  publishedAt: string; // ISO
  url?: string;
  commodityTags?: string[];
}

export interface NewsFeedResult {
  articles: NewsArticle[];
  generatedAt: string;
  provider: NewsSourceKind;
  /** True when data is static placeholder (no live fetch). */
  isPlaceholder: boolean;
}
