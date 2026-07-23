'use client';

import { useLanguage } from '@/lib/i18n/context';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend,
} from 'recharts';

interface ProductionProfileChartProps {
  cashFlows: Array<{
    year: number;
    revenue: number;
    opex: number;
    netCashFlow: number;
  }>;
}

export function ProductionProfileChart({ cashFlows }: ProductionProfileChartProps) {
  const { t } = useLanguage();
  if (!cashFlows || cashFlows.length === 0) return null;

  const revLabel = t('cf.revenue');
  const opexLabel = t('chart.opex');
  const netLabel = t('chart.netCashFlow');

  const data = cashFlows
    .filter((cf) => cf.year > 0)
    .map((cf) => ({
      year: cf.year,
      revenue: parseFloat(cf.revenue.toFixed(2)),
      opex: parseFloat(cf.opex.toFixed(2)),
      netCash: parseFloat(cf.netCashFlow.toFixed(2)),
    }));

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ name?: string; color?: string; value?: number }>;
    label?: number;
  }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="rounded-lg bg-background/95 border border-border p-3 shadow-xl text-sm">
        <p className="font-semibold mb-1">{t('chart.year')} {label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {p.value?.toFixed(2)} MUSD
          </p>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ComposedChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis dataKey="year" fontSize={11} />
        <YAxis fontSize={11} tickFormatter={(v: number) => `${v.toFixed(0)}`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="revenue" name={revLabel} fill="hsl(142, 71%, 45%)" opacity={0.7} radius={[2, 2, 0, 0]} />
        <Bar dataKey="opex" name={opexLabel} fill="hsl(0, 72%, 51%)" opacity={0.7} radius={[2, 2, 0, 0]} />
        <Line type="monotone" dataKey="netCash" name={netLabel} stroke="hsl(217, 91%, 60%)" strokeWidth={2.5} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
