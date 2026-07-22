import type { NewsArticle } from './types';

/** Static placeholder articles — no network calls. */
export const PLACEHOLDER_NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'placeholder-copper-outlook',
    title: 'Copper demand outlook remains constructive for long-life projects',
    summary:
      'Placeholder insight: energy-transition demand continues to support copper price scenarios used in feasibility studies. Replace with live commodity API data.',
    category: 'commodity',
    sourceLabel: 'Market Insights (Placeholder)',
    sourceKind: 'placeholder',
    publishedAt: '2026-07-20T08:00:00.000Z',
    commodityTags: ['copper'],
  },
  {
    id: 'placeholder-opex-inflation',
    title: 'Operating cost inflation still a key sensitivity driver',
    summary:
      'Placeholder insight: diesel, labour, and reagents remain the primary OPEX swing factors in open-pit models. Wire to news/API feeds later.',
    category: 'market',
    sourceLabel: 'Market Insights (Placeholder)',
    sourceKind: 'placeholder',
    publishedAt: '2026-07-18T10:30:00.000Z',
    commodityTags: ['opex'],
  },
  {
    id: 'placeholder-permitting',
    title: 'Permitting timelines remain a schedule risk for greenfield mines',
    summary:
      'Placeholder insight: environmental approval sequencing can shift first production by multiple years. Future AI brief can summarise regional updates.',
    category: 'regulation',
    sourceLabel: 'Market Insights (Placeholder)',
    sourceKind: 'placeholder',
    publishedAt: '2026-07-15T14:00:00.000Z',
  },
];
