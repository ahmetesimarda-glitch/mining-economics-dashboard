'use client';

import { useLanguage } from '@/lib/i18n/context';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface NpvBuildupChartProps {
  cashFlows: Array<{
    year: number;
    discountedCashFlow: number;
  }>;
}

export function NpvBuildupChart({ cashFlows }: NpvBuildupChartProps) {
  const { t } = useLanguage();
  if (!cashFlows || cashFlows.length === 0) return null;

  let cumNpv = 0;
  const data = cashFlows.map((cf) => {
    cumNpv += cf.discountedCashFlow;
    return {
      year: cf.year,
      cumulativeNpv: parseFloat(cumNpv.toFixed(2)),
      discounted: parseFloat(cf.discountedCashFlow.toFixed(2)),
    };
  });

  // Find break-even year
  const breakEvenYear = data.find((d) => d.cumulativeNpv >= 0)?.year;

  const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{ payload?: { year?: number; cumulativeNpv?: number; discounted?: number } }>;
  }) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="rounded-lg bg-background/95 border border-border p-3 shadow-xl text-sm">
        <p className="font-semibold mb-1">{t('chart.year')} {d?.year}</p>
        <p className="text-blue-400">{t('chart.cumulativeNpv')}: {d?.cumulativeNpv?.toFixed(2)} MUSD</p>
        <p className="text-muted-foreground">{t('chart.discountedCf')}: {d?.discounted?.toFixed(2)} MUSD</p>
      </div>
    );
  };

  return (
    <div>
      {breakEvenYear !== undefined && (
        <div className="text-center mb-2">
          <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
            {t('chart.npvBreakevenYear')} {breakEvenYear}
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="npvGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis dataKey="year" fontSize={11} label={{ value: t('fin.year'), position: 'insideBottomRight', offset: -5, fontSize: 11 }} />
          <YAxis fontSize={11} tickFormatter={(v: number) => `${v.toFixed(0)}`} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeDasharray="5 5" strokeOpacity={0.5} />
          <Area type="monotone" dataKey="cumulativeNpv" stroke="hsl(217, 91%, 60%)" fill="url(#npvGrad)" strokeWidth={2.5} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
