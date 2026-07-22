'use client';

import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { DemoProjectCard, type DemoEconomics } from '@/components/demo/DemoProjectCard';
import { DEMO_CARD_META } from '@/lib/demo/portfolio-meta';
import { useLanguage } from '@/lib/i18n/context';

interface DemoPortfolioProps {
  economicsById?: Record<string, DemoEconomics>;
}

export function DemoPortfolio({ economicsById = {} }: DemoPortfolioProps) {
  const { t } = useLanguage();

  return (
    <section id="demo-portfolio" className="mb-10 scroll-mt-24">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div>
          <div className="inline-flex items-center gap-2 text-primary mb-2">
            <Compass className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t('demo.portfolioEyebrow')}
            </span>
          </div>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            {t('demo.portfolioTitle')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            {t('demo.portfolioSubtitle')}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {DEMO_CARD_META.map((meta, index) => (
          <DemoProjectCard
            key={meta.id}
            meta={meta}
            economics={economicsById[meta.id]}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
