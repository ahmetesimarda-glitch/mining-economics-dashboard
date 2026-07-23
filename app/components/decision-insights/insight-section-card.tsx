'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsightSectionCardProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
}

export function InsightSectionCard({
  title,
  icon: Icon,
  children,
  className,
  headerRight,
}: InsightSectionCardProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-border/50 bg-card p-5',
        className
      )}
      style={{ boxShadow: 'var(--shadow-md)' }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="font-display flex items-center gap-2 text-sm font-semibold tracking-tight">
          <Icon className="h-4 w-4 text-primary" aria-hidden />
          {title}
        </h2>
        {headerRight}
      </div>
      {children}
    </section>
  );
}
