'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useLanguage } from '@/lib/i18n/context';
import { paramI18nKey } from '@/lib/i18n/param-labels';

const PARAM_COLORS: Record<string, string> = {
  price: '#60B5FF',
  capex: '#FF9149',
  opex: '#FF9898',
  discountRate: '#80D8C3',
  oreGrade: '#C084FC',
  exchangeRate: '#F59E0B',
  fuelPrice: '#EF4444',
};

interface SensitivityChartProps {
  data: Record<string, Array<{ changePercent?: number; npv?: number; irr?: number }>>;
  metric: 'npv' | 'irr';
}

export function SensitivityChart({ data, metric }: SensitivityChartProps) {
  const { t } = useLanguage();
  const safeData = data ?? {};
  const paramKeys = Object.keys(safeData).filter((k) => (safeData[k]?.length ?? 0) > 0);
  if (paramKeys.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-8">{t('chart.noData')}</p>;
  }

  const changeKey = t('chart.changePercent');
  const referenceArr = safeData[paramKeys[0]] ?? [];
  const seriesLabels: Record<string, string> = {};
  for (const key of paramKeys) {
    seriesLabels[key] = t(paramI18nKey(key));
  }

  const chartData = referenceArr.map((_, i) => {
    const point: Record<string, number> = {
      [changeKey]: referenceArr[i]?.changePercent ?? 0,
    };
    for (const key of paramKeys) {
      const label = seriesLabels[key];
      point[label] = Number((safeData[key]?.[i]?.[metric] ?? 0).toFixed(2));
    }
    return point;
  });

  const yLabel = metric === 'npv' ? t('chart.npvMusd') : t('chart.irrPercent');

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
          <XAxis dataKey={changeKey} tickLine={false} tick={{ fontSize: 10 }}
            label={{ value: changeKey, position: 'insideBottom', offset: -15, style: { textAnchor: 'middle', fontSize: 11 } }} />
          <YAxis tickLine={false} tick={{ fontSize: 10 }}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }} />
          <Tooltip contentStyle={{ fontSize: 11 }} />
          <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
          {paramKeys.map((key) => {
            const lk = seriesLabels[key];
            return (
              <Line key={key} dataKey={lk} stroke={PARAM_COLORS[key] ?? '#888'} strokeWidth={2} dot={{ r: 3 }} />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
