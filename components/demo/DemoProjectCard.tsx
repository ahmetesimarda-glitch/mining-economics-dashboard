'use client';

import { motion } from 'framer-motion';
import {
  Clock,
  Globe2,
  Mountain,
  Pickaxe,
  TrendingUp,
  DollarSign,
  Layers,
} from 'lucide-react';
import { DemoBadge } from '@/components/demo/DemoBadge';
import { formatMUSD, formatPercent } from '@/lib/format';
import { useLanguage } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import {
  DEMO_ACCENT_STYLES,
  type DemoCardMeta,
} from '@/lib/demo/portfolio-meta';
import { setLastOpenedProjectId } from '@/lib/demo/storage';

export interface DemoEconomics {
  npv?: number | null;
  irr?: number | null;
}

interface DemoProjectCardProps {
  meta: DemoCardMeta;
  economics?: DemoEconomics;
  index: number;
}

export function DemoProjectCard({ meta, economics, index }: DemoProjectCardProps) {
  const { t } = useLanguage();
  const accent = DEMO_ACCENT_STYLES[meta.accent];
  const npv = economics?.npv ?? 0;
  const irr = economics?.irr ?? 0;
  const isPositive = npv >= 0;

  const mineLabel =
    t(`mine.${meta.mineType}`) !== `mine.${meta.mineType}`
      ? t(`mine.${meta.mineType}`)
      : meta.mineType;
  const methodLabel =
    t(`method.${meta.miningMethod}`) !== `method.${meta.miningMethod}`
      ? t(`method.${meta.miningMethod}`)
      : meta.miningMethod;

  const open = () => {
    setLastOpenedProjectId(meta.id);
    window.location.href = `/projects/${meta.id}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.06, duration: 0.35 }}
    >
      <button
        type="button"
        onClick={open}
        className={cn(
          'group relative w-full overflow-hidden rounded-xl border border-border/50 bg-card text-left transition-all duration-300',
          accent.ring,
          'hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60'
        )}
        style={{ boxShadow: 'var(--shadow-md)' }}
      >
        <div
          className={cn(
            'relative h-24 bg-gradient-to-br',
            accent.gradient,
            'border-b border-border/30'
          )}
        >
          <div className="absolute inset-0 opacity-[0.12] bg-[radial-gradient(circle_at_20%_20%,white,transparent_45%),radial-gradient(circle_at_80%_60%,white,transparent_40%)]" />
          <div className="absolute bottom-3 left-4 flex items-center gap-2">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                accent.iconBg,
                accent.iconText
              )}
            >
              <Mountain className="h-5 w-5" />
            </div>
            <DemoBadge />
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-md bg-background/50 px-2 py-1 text-[10px] font-medium text-muted-foreground backdrop-blur-sm">
            <Globe2 className="h-3 w-3" />
            {meta.country}
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-display text-base font-semibold tracking-tight group-hover:text-primary transition-colors">
              {meta.name}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="inline-flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {mineLabel}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Pickaxe className="h-3 w-3" />
                {methodLabel}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-muted/40 px-2.5 py-2">
              <p className="text-[10px] text-muted-foreground mb-0.5">
                {t('demo.annualProduction')}
              </p>
              <p className="font-mono font-semibold">{meta.productionLabel}</p>
            </div>
            <div className="rounded-lg bg-muted/40 px-2.5 py-2">
              <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t('demo.mineLife')}
              </p>
              <p className="font-mono font-semibold">
                {meta.projectLifeYears} {t('demo.years')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/30">
            <div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                <DollarSign className="h-3 w-3" /> NPV
              </div>
              <p
                className={cn(
                  'font-mono text-sm font-bold',
                  isPositive ? 'text-emerald-500' : 'text-red-500'
                )}
              >
                {formatMUSD(npv)}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                <TrendingUp className="h-3 w-3" /> IRR
              </div>
              <p className="font-mono text-sm font-bold text-amber-500">
                {formatPercent(irr)}
              </p>
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
}
