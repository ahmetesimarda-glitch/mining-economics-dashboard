'use client';

import { useLanguage } from '@/lib/i18n/context';
import { translateParamLabel } from '@/lib/i18n/param-labels';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface TornadoItem {
  parameter: string;
  label: string;
  lowNpv: number;
  highNpv: number;
  baseNpv: number;
  impact: number;
}

interface TornadoChartProps {
  data: TornadoItem[];
}

export function TornadoChart({ data }: TornadoChartProps) {
  const { t } = useLanguage();
  if (!data || data.length === 0) return null;

  // Sort by impact (highest first)
  const sorted = [...data].sort((a, b) => b.impact - a.impact);
  const baseNpv = sorted[0]?.baseNpv ?? 0;

  // 3-bar stacking approach to avoid overlap:
  // For each parameter we compute:
  //   lowDelta = lowNpv - baseNpv  (negative number, e.g. -200)
  //   highDelta = highNpv - baseNpv (positive number, e.g. +400)
  //
  // We stack 3 bars:
  //   base (invisible): min(lowDelta, 0)  → positions the start
  //   red:  |lowDelta|                     → fills from lowDelta to 0
  //   green: highDelta                     → fills from 0 to highDelta
  const chartData = sorted.map((item) => {
    const lowDelta = item.lowNpv - baseNpv;
    const highDelta = item.highNpv - baseNpv;
    return {
      name: translateParamLabel(t, { parameter: item.parameter, label: item.label }),
      base: Math.min(lowDelta, 0),
      red: Math.abs(Math.min(lowDelta, 0)),
      green: Math.max(highDelta, 0),
      lowNpv: item.lowNpv,
      highNpv: item.highNpv,
      impact: item.impact,
    };
  });

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ payload?: { lowNpv?: number; highNpv?: number; impact?: number } }>;
    label?: string;
  }) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="rounded-lg bg-background/95 border border-border p-3 shadow-xl text-sm">
        <p className="font-semibold mb-1">{label}</p>
        <p className="text-red-400">▼ {t('chart.pessimistic')}: {d?.lowNpv?.toFixed(1)} MUSD</p>
        <p className="text-emerald-400">▲ {t('chart.optimistic')}: {d?.highNpv?.toFixed(1)} MUSD</p>
        <p className="text-muted-foreground">{t('chart.impactRange')}: {d?.impact?.toFixed(1)} MUSD</p>
      </div>
    );
  };

  return (
    <div>
      <div className="text-center mb-2">
        <p className="text-xs text-muted-foreground">{t('chart.baseNpv')}: {baseNpv.toFixed(1)} MUSD</p>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(300, sorted.length * 45)}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis type="number" tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(0)}`} fontSize={11} />
          <YAxis type="category" dataKey="name" fontSize={11} width={110} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeWidth={2} strokeOpacity={0.5} />
          {/* Invisible base bar to position the start of the red bar */}
          <Bar dataKey="base" stackId="tornado" fill="transparent" />
          {/* Red bar: extends left from 0 (pessimistic impact) */}
          <Bar dataKey="red" stackId="tornado" fill="hsl(0, 72%, 51%)" radius={[4, 0, 0, 4]} />
          {/* Green bar: extends right from 0 (optimistic impact) */}
          <Bar dataKey="green" stackId="tornado" fill="hsl(142, 71%, 45%)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
