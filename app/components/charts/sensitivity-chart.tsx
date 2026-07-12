'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const PARAM_COLORS: Record<string, string> = {
  'Fiyat': '#60B5FF',
  'CAPEX': '#FF9149',
  'OPEX': '#FF9898',
  'İnd. Oranı': '#80D8C3',
  'Tenör': '#C084FC',
  'Döviz Kuru': '#F59E0B',
  'Yakıt Fiyatı': '#EF4444',
};

const PARAM_LABELS: Record<string, string> = {
  price: 'Fiyat',
  capex: 'CAPEX',
  opex: 'OPEX',
  discountRate: 'İnd. Oranı',
  oreGrade: 'Tenör',
  exchangeRate: 'Döviz Kuru',
  fuelPrice: 'Yakıt Fiyatı',
};

interface SensitivityChartProps {
  data: Record<string, any[]>;
  metric: 'npv' | 'irr';
}

export function SensitivityChart({ data, metric }: SensitivityChartProps) {
  const safeData = data ?? {};
  const paramKeys = Object.keys(safeData).filter((k) => (safeData[k]?.length ?? 0) > 0);
  if (paramKeys.length === 0) return <p className="text-xs text-muted-foreground text-center py-8">Veri yok</p>;

  const referenceArr = safeData[paramKeys[0]] ?? [];
  const chartData = referenceArr.map((_: any, i: number) => {
    const point: any = { 'Değişim (%)': referenceArr[i]?.changePercent ?? 0 };
    for (const key of paramKeys) {
      const label = PARAM_LABELS[key] ?? key;
      point[label] = Number((safeData[key]?.[i]?.[metric] ?? 0).toFixed(2));
    }
    return point;
  });

  const lineKeys = paramKeys.map((k) => PARAM_LABELS[k] ?? k);
  const label = metric === 'npv' ? 'NPV (MUSD)' : 'IRR (%)';

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
          <XAxis dataKey="Değişim (%)" tickLine={false} tick={{ fontSize: 10 }}
            label={{ value: 'Değişim (%)', position: 'insideBottom', offset: -15, style: { textAnchor: 'middle', fontSize: 11 } }} />
          <YAxis tickLine={false} tick={{ fontSize: 10 }}
            label={{ value: label, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }} />
          <Tooltip contentStyle={{ fontSize: 11 }} />
          <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
          {lineKeys.map((lk: string) => (
            <Line key={lk} dataKey={lk} stroke={PARAM_COLORS[lk] ?? '#888'} strokeWidth={2} dot={{ r: 3 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
