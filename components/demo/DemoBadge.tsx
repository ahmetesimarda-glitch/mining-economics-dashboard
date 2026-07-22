'use client';

import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

interface DemoBadgeProps {
  className?: string;
}

export function DemoBadge({ className }: DemoBadgeProps) {
  const { t } = useLanguage();
  return (
    <Badge
      variant="secondary"
      className={cn(
        'font-normal text-[10px] tracking-wide uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
        className
      )}
    >
      {t('demo.badge')}
    </Badge>
  );
}
