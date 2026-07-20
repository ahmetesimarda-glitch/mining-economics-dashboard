'use client';

import { Button } from '@/components/ui/button';
import { Plus, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n/context';

interface EquipmentToolbarProps {
  onCreate: () => void;
}

export function EquipmentToolbar({ onCreate }: EquipmentToolbarProps) {
  const { t } = useLanguage();

  return (
    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Database className="h-3.5 w-3.5" />
            <span>{t('equipCat.breadcrumb')}</span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight mb-2">
            {t('equipCat.title')}{' '}
            <span className="text-primary">{t('equipCat.titleAccent')}</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">{t('equipCat.subtitle')}</p>
        </div>
        <Button onClick={onCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('equipCat.add')}
        </Button>
      </div>
    </motion.div>
  );
}
