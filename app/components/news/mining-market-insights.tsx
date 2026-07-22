'use client';

import { useEffect, useState } from 'react';
import { NewsCard } from './news-card';
import { fetchMarketInsights, type NewsArticle } from '@/lib/news';
import { useLanguage } from '@/lib/i18n/context';

/**
 * Dashboard section — Mining Market Insights.
 * Uses the news service layer (placeholder data only; no live APIs).
 */
export function MiningMarketInsights() {
  const { t } = useLanguage();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isPlaceholder, setIsPlaceholder] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const feed = await fetchMarketInsights(3);
      if (!cancelled) {
        setArticles(feed.articles);
        setIsPlaceholder(feed.isPlaceholder);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (articles.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            {t('news.sectionTitle')}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">{t('news.sectionSubtitle')}</p>
        </div>
        {isPlaceholder && (
          <span className="shrink-0 rounded border border-border/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            {t('news.placeholderBadge')}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {articles.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
