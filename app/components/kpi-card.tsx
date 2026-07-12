'use client';

import { type LucideIcon } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: number;
  format: (v: number) => string;
  icon: LucideIcon;
  color?: string;
  description?: string;
}

export function KPICard({ title, value, format, icon: Icon, color = 'text-primary', description }: KPICardProps) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const steps = 40;
    const increment = (value ?? 0) / steps;
    let current = 0;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, value ?? 0);
      setDisplayVal(current);
      if (step >= steps) {
        setDisplayVal(value ?? 0);
        clearInterval(timer);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <div
      ref={ref}
      className="group relative overflow-hidden rounded-xl bg-card p-5 transition-all duration-300 hover:shadow-lg border border-border/50"
      style={{ boxShadow: 'var(--shadow-md)' }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title ?? ''}</p>
          <p className={cn('font-mono text-2xl font-bold tracking-tight', color)}>
            {format?.(displayVal) ?? '0'}
          </p>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10', color)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary/50 to-primary transition-all duration-500 group-hover:w-full" style={{ width: inView ? '100%' : '0%' }} />
    </div>
  );
}
