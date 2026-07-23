'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useLanguage } from '@/lib/i18n/context';
import { translateParamLabel } from '@/lib/i18n/param-labels';

interface ElasticityItem {
  parameter: string;
  label: string;
  elasticity: number;
  direction: string;
  npvAt10Down: number;
  npvAt10Up: number;
}

interface ElasticityBarChartProps {
  data: ElasticityItem[];
}

export function ElasticityBarChart({ data }: ElasticityBarChartProps) {
  const { t } = useLanguage();
  if (!data || data.length === 0) return null;

  const chartData = data.map((d) => ({
    name: translateParamLabel(t, { parameter: d.parameter, label: d.label }),
    elasticity: d.elasticity,
    direction: d.direction,
    npvDown: d.npvAt10Down,
    npvUp: d.npvAt10Up,
  }));

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ payload?: { elasticity?: number; npvDown?: number; npvUp?: number; direction?: string } }>;
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="rounded-lg bg-background/95 border border-border p-3 shadow-xl text-sm">
        <p className="font-semibold mb-1">{label}</p>
        <p className="text-muted-foreground">{t('chart.elasticity')}: {d?.elasticity?.toFixed(3)}</p>
        <p className="text-red-400">-10%: NPV = {d?.npvDown?.toFixed(1)} MUSD</p>
        <p className="text-emerald-400">+10%: NPV = {d?.npvUp?.toFixed(1)} MUSD</p>
        <p className="text-muted-foreground text-xs mt-1">
          {d?.direction === 'positive' ? t('chart.npvIncreases') : t('chart.npvDecreases')}
        </p>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis type="number" fontSize={11} />
        <YAxis type="category" dataKey="name" fontSize={11} width={90} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="elasticity" radius={[0, 4, 4, 0]} maxBarSize={28}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.direction === 'positive' ? 'hsl(142, 71%, 45%)' : 'hsl(0, 72%, 51%)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
