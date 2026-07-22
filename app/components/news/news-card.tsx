'use client';

import { Newspaper } from 'lucide-react';
import type { NewsArticle } from '@/lib/news';
import { cn } from '@/lib/utils';

interface NewsCardProps {
  article: NewsArticle;
  className?: string;
}

export function NewsCard({ article, className }: NewsCardProps) {
  const dateLabel = (() => {
    try {
      return new Date(article.publishedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  })();

  const body = (
    <article
      className={cn(
        'rounded-lg border border-border/50 bg-card p-4 transition-colors hover:bg-accent/40',
        className
      )}
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="mb-2 flex items-start gap-2">
        <Newspaper className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-snug tracking-tight">{article.title}</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {article.sourceLabel}
            {dateLabel ? ` · ${dateLabel}` : ''}
          </p>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{article.summary}</p>
      {article.commodityTags && article.commodityTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {article.commodityTags.map((tag) => (
            <span
              key={tag}
              className="rounded border border-border/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );

  if (article.url) {
    return (
      <a href={article.url} target="_blank" rel="noopener noreferrer" className="block">
        {body}
      </a>
    );
  }

  return body;
}
