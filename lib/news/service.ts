import { PLACEHOLDER_NEWS_ARTICLES } from './placeholder-data';
import type { NewsArticle, NewsFeedResult, NewsSourceKind } from './types';

/**
 * News service layer — currently returns placeholders only.
 * Swap provider implementation later without changing consumers.
 */
export interface NewsService {
  getMarketInsights(limit?: number): Promise<NewsFeedResult>;
}

class PlaceholderNewsService implements NewsService {
  async getMarketInsights(limit = 3): Promise<NewsFeedResult> {
    const articles: NewsArticle[] = PLACEHOLDER_NEWS_ARTICLES.slice(0, Math.max(1, limit));
    return {
      articles,
      generatedAt: new Date().toISOString(),
      provider: 'placeholder' satisfies NewsSourceKind,
      isPlaceholder: true,
    };
  }
}

/** Singleton service — replace with CompositeNewsService when live APIs land. */
let newsService: NewsService = new PlaceholderNewsService();

export function getNewsService(): NewsService {
  return newsService;
}

/** Test / future DI hook — do not call from UI in production paths. */
export function setNewsServiceForTests(service: NewsService): void {
  newsService = service;
}

export async function fetchMarketInsights(limit = 3): Promise<NewsFeedResult> {
  return getNewsService().getMarketInsights(limit);
}
