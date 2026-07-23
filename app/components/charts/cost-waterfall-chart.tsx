'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell,
} from 'recharts';
import { useLanguage } from '@/lib/i18n/context';

interface CostWaterfallProps {
  revenue: number;
  opex: number;
  royalty: number;
  tax: number;
  creditPayment: number;
  creditInterest: number;
  netCashFlow: number;
}

export function CostWaterfallChart(props: CostWaterfallProps) {
  const { t } = useLanguage();
  const { revenue, opex, royalty, tax, creditPayment, creditInterest, netCashFlow } = props;
  if (!revenue) return null;

  const items = [
    { name: t('cf.revenue'), value: revenue, type: 'positive' as const },
    { name: t('chart.opex'), value: -opex, type: 'negative' as const },
    { name: t('chart.royalty'), value: -royalty, type: 'negative' as const },
    { name: t('chart.tax'), value: -tax, type: 'negative' as const },
  ];
  if (creditPayment > 0) items.push({ name: t('chart.creditPayment'), value: -creditPayment, type: 'negative' as const });
  if (creditInterest > 0) items.push({ name: t('chart.creditInterest'), value: -creditInterest, type: 'negative' as const });
  items.push({ name: t('chart.netCash'), value: netCashFlow, type: 'positive' as const });

  // Build waterfall
  let cumulative = 0;
  const chartData = items.map((item, idx) => {
    if (idx === items.length - 1) {
      // Last item (Net) starts from 0
      return { name: item.name, base: 0, value: item.value, type: 'total' };
    }
    const base = cumulative;
    cumulative += item.value;
    return {
      name: item.name,
      base: item.value >= 0 ? base : base + item.value,
      value: Math.abs(item.value),
      type: item.type,
    };
  });

  const getColor = (type: string) => {
    if (type === 'positive' || type === 'total') return 'hsl(142, 71%, 45%)';
    return 'hsl(0, 72%, 51%)';
  };

  const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{ payload?: { name?: string; value?: number } }>;
  }) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="rounded-lg bg-background/95 border border-border p-3 shadow-xl text-sm">
        <p className="font-semibold mb-1">{d?.name}</p>
        <p>{d?.value?.toFixed(2)} MUSD</p>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis dataKey="name" fontSize={10} angle={-20} textAnchor="end" interval={0} height={50} />
        <YAxis fontSize={11} tickFormatter={(v: number) => `${v.toFixed(0)}`} />
        <Tooltip content={<CustomTooltip />} />
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
