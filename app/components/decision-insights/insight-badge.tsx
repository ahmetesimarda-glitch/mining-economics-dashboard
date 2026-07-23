'use client';

import { cn } from '@/lib/utils';
import type {
  FinancialStrength,
  OverallRecommendation,
  RiskLevel,
} from '@/lib/decision-insights';

export type InsightBadgeTone = 'green' | 'yellow' | 'orange' | 'red';

const TONE_CLASSES: Record<InsightBadgeTone, string> = {
  green: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400',
  yellow: 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400',
  orange: 'bg-orange-500/15 text-orange-700 border-orange-500/30 dark:text-orange-400',
  red: 'bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400',
};

export function recommendationTone(value: OverallRecommendation): InsightBadgeTone {
  switch (value) {
    case 'Strong Investment':
      return 'green';
    case 'Promising':
      return 'yellow';
    case 'Requires Review':
      return 'orange';
    case 'High Risk':
      return 'red';
    case 'Not Recommended':
      return 'red';
    default:
      return 'orange';
  }
}

export function riskTone(value: RiskLevel): InsightBadgeTone {
  switch (value) {
    case 'Low':
      return 'green';
    case 'Moderate':
      return 'yellow';
    case 'High':
      return 'orange';
    case 'Very High':
      return 'red';
    default:
      return 'orange';
  }
}

export function strengthTone(value: FinancialStrength): InsightBadgeTone {
  switch (value) {
    case 'Excellent':
      return 'green';
    case 'Strong':
      return 'green';
    case 'Average':
      return 'yellow';
    case 'Weak':
      return 'red';
    default:
      return 'yellow';
  }
}

interface InsightBadgeProps {
  label: string;
  tone: InsightBadgeTone;
  className?: string;
}

export function InsightBadge({ label, tone, className }: InsightBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold tracking-wide',
        TONE_CLASSES[tone],
        className
      )}
    >
      {label}
    </span>
  );
}
