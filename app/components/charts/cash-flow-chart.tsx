'use client';

import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useLanguage } from '@/lib/i18n/context';

interface CashFlowChartProps {
  data: any[];
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const { t } = useLanguage();
  const netLabel = t('cf.netCashFlow');
  const cumLabel = t('cf.cumulative');
  const yearLabel = t('fin.year');

  const chartData = (data ?? []).map((cf: any) => ({
    year: `Y${cf?.year ?? 0}`,
    [netLabel]: Number((cf?.netCashFlow ?? 0).toFixed(2)),
    [cumLabel]: Number((cf?.cumulativeCashFlow ?? 0).toFixed(2)),
  }));

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
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
          <Bar dataKey={netLabel} fill="#60B5FF" radius={[2, 2, 0, 0]} />
          <Line dataKey={cumLabel} stroke="#FF9149" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
