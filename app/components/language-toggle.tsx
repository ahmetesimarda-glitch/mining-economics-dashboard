'use client';

import { useLanguage } from '@/lib/i18n/context';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <button
      onClick={() => setLocale(locale === 'tr' ? 'en' : 'tr')}
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
        'border border-border/50 hover:bg-accent hover:text-accent-foreground text-muted-foreground'
      )}
      title={locale === 'tr' ? 'Switch to English' : 'T\u00fcrk\u00e7eye ge\u00e7'}
    >
      <Globe className="h-3.5 w-3.5" />
      <span>{locale === 'tr' ? 'EN' : 'TR'}</span>
    </button>
  );
}
