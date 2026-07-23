'use client';

import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <FileQuestion className="h-7 w-7" aria-hidden />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-mono text-muted-foreground">404</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {t('error.notFoundTitle')}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('error.notFoundDescription')}
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Home className="h-4 w-4" aria-hidden />
          {t('error.goHome')}
        </Link>
      </div>
    </div>
  );
}
