'use client';

import { useEffect, useState } from 'react';
import {
  BookOpen,
  Factory,
  Fuel,
  Gem,
  Leaf,
  Pickaxe,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';
import {
  getMiningIntelligence,
  miningIntelligenceCategoryLabelKey,
  type MiningIntelligenceBadgeKind,
  type MiningIntelligenceCategory,
  type MiningIntelligenceFeed,
  type MiningIntelligenceItem,
} from '@/lib/mining-intelligence';
import { cn } from '@/lib/utils';

const CATEGORY_ICONS: Record<MiningIntelligenceCategory, LucideIcon> = {
  metal_markets: TrendingUp,
  investment: Gem,
  commodity_demand: Factory,
  esg: Leaf,
  energy: Fuel,
  critical_minerals: Pickaxe,
  exploration: BookOpen,
};

function formatContentDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function badgeLabel(
  kind: MiningIntelligenceBadgeKind,
  t: (key: string) => string
): string {
  if (kind === 'live') return t('mi.badge.live');
  if (kind === 'industry_overview') return t('mi.badge.industryOverview');
  return t('mi.badge.referenceInformation');
}

interface MiningIntelligenceCardProps {
  item: MiningIntelligenceItem;
  className?: string;
}

export function MiningIntelligenceCard({
  item,
  className,
}: MiningIntelligenceCardProps) {
  const { t, locale } = useLanguage();
  const Icon = CATEGORY_ICONS[item.category] ?? BookOpen;
  const categoryLabel = t(miningIntelligenceCategoryLabelKey(item.category));
  const updatedLabel = formatContentDate(item.updatedAt, locale);

  const body = (
    <article
      className={cn(
        'flex h-full flex-col rounded-xl border border-border/50 bg-card p-4 transition-colors hover:bg-accent/30',
        className
      )}
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="mb-3 flex items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            {categoryLabel}
          </p>
          <h3 className="mt-0.5 text-sm font-semibold leading-snug tracking-tight">
            {item.title}
          </h3>
        </div>
      </div>

      <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
        {item.summary}
      </p>

      {item.relatedCommodities.length > 0 ? (
        <div className="mt-3">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {t('mi.relatedCommodities')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {item.relatedCommodities.map((commodity) => (
              <span
                key={commodity}
                className="rounded border border-border/60 bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                {commodity}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
        <span>
          {t('mi.lastUpdated')}: {updatedLabel}
        </span>
        <span>
          {t('mi.contentVersion')}: {item.contentVersion}
        </span>
      </div>
    </article>
  );

  if (item.url) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
      >
        {body}
      </a>
    );
  }

  return body;
}

/**
 * Dashboard Mining Intelligence panel.
 * Data comes only from `lib/mining-intelligence` — swap the provider for live feeds later.
 */
export function MiningIntelligencePanel({
  className,
  limit = 7,
}: {
  className?: string;
  limit?: number;
}) {
  const { t, locale } = useLanguage();
  const [feed, setFeed] = useState<MiningIntelligenceFeed | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next = await getMiningIntelligence({ limit, locale });
      if (!cancelled) setFeed(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [limit, locale]);

  if (!feed || feed.items.length === 0) return null;

  return (
    <section className={cn('mb-8', className)} aria-label={t('mi.sectionTitle')}>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            {t('mi.sectionTitle')}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground max-w-2xl">
            {t('mi.sectionSubtitle')}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 self-start rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            feed.isLive
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border-border/60 bg-muted/40 text-muted-foreground'
          )}
        >
          {badgeLabel(feed.badgeKind, t)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {feed.items.map((item) => (
          <MiningIntelligenceCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
