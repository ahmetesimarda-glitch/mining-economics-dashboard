'use client';

import { useLanguage } from '@/lib/i18n/context';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine,
} from 'recharts';

interface WaterfallItem {
  name: string;
  value: number;
  type: 'positive' | 'negative' | 'total';
}

interface WaterfallChartProps {
  data: WaterfallItem[];
}

export function WaterfallChart({ data }: WaterfallChartProps) {
  const { t } = useLanguage();
  if (!data || data.length === 0) return null;

  // Build waterfall with invisible base + visible bar
  let cumulative = 0;
  const chartData = data.map((item) => {
    if (item.type === 'total') {
      const result = { name: item.name, base: 0, value: item.value, total: item.value, type: item.type };
      cumulative = item.value;
      return result;
    }
    const base = cumulative;
    cumulative += item.value;
    return {
      name: item.name,
      base: item.value >= 0 ? base : base + item.value,
      value: Math.abs(item.value),
      total: cumulative,
      type: item.type,
    };
  });

  const getColor = (type: string) => {
    if (type === 'positive') return 'hsl(142, 71%, 45%)';
    if (type === 'negative') return 'hsl(0, 72%, 51%)';
    return 'hsl(217, 91%, 60%)';
  };

  const typeLabel = (type: string) => {
    if (type === 'total') return t('chart.total');
    if (type === 'positive') return t('chart.income');
    return t('chart.expense');
  };

  const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{ payload?: { name?: string; value?: number; total?: number; type?: string } }>;
  }) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="rounded-lg bg-background/95 border border-border p-3 shadow-xl text-sm">
        <p className="font-semibold mb-1">{d?.name}</p>
        <p>{typeLabel(d?.type ?? '')}: {d?.value?.toFixed(2)} MUSD</p>
        {d?.type !== 'total' && (
          <p className="text-muted-foreground">{t('cf.cumulative')}: {d?.total?.toFixed(2)} MUSD</p>
        )}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis dataKey="name" fontSize={10} angle={-30} textAnchor="end" interval={0} height={60} />
        <YAxis fontSize={11} tickFormatter={(v: number) => `${v.toFixed(0)}`} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.3} />
        <Bar dataKey="base" stackId="stack" fill="transparent" />
        <Bar dataKey="value" stackId="stack" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, idx) => (
            <Cell key={idx} fill={getColor(entry.type)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
