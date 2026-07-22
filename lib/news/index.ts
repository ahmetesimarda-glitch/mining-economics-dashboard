export type {
  NewsArticle,
  NewsCategory,
  NewsFeedResult,
  NewsSourceKind,
} from './types';
export type { NewsService } from './service';
export { PLACEHOLDER_NEWS_ARTICLES } from './placeholder-data';
export {
  fetchMarketInsights,
  getNewsService,
  setNewsServiceForTests,
} from './service';
