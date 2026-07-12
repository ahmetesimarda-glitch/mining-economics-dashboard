'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useLanguage } from '@/lib/i18n/context';

interface RevenueCostChartProps {
  data: any[];
}

export function RevenueCostChart({ data }: RevenueCostChartProps) {
  const { t } = useLanguage();
  const revLabel = t('cf.revenue');
  const costLabel = t('cf.costLabel');
  const yearLabel = t('fin.year');

  const chartData = (data ?? []).filter((cf: any) => (cf?.year ?? 0) > 0).map((cf: any) => ({
    year: `Y${cf?.year ?? 0}`,
    [revLabel]: Number((cf?.revenue ?? 0).toFixed(2)),
    [costLabel]: Number(((cf?.opex ?? 0) + (cf?.royalty ?? 0) + (cf?.taxPayment ?? 0)).toFixed(2)),
  }));

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
          <XAxis
            dataKey="year"
            tickLine={false}
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
            label={{ value: yearLabel, position: 'insideBottom', offset: -15, style: { textAnchor: 'middle', fontSize: 11 } }}
          />
          <YAxis
            tickLine={false}
            tick={{ fontSize: 10 }}
            label={{ value: 'MUSD', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
          />
          <Tooltip contentStyle={{ fontSize: 11 }} />
          <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey={revLabel} fill="#80D8C3" radius={[2, 2, 0, 0]} />
          <Bar dataKey={costLabel} fill="#FF6363" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
