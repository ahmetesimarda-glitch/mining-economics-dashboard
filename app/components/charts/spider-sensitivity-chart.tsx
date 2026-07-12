'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from 'recharts';

const PARAM_COLORS: Record<string, string> = {
  price: '#10b981',
  capex: '#ef4444',
  opex: '#f59e0b',
  discountRate: '#8b5cf6',
  oreGrade: '#06b6d4',
  exchangeRate: '#ec4899',
  fuelPrice: '#f97316',
};

const PARAM_LABELS: Record<string, string> = {
  price: 'Birim Fiyat',
  capex: 'CAPEX',
  opex: 'OPEX',
  discountRate: '\u0130skonto',
  oreGrade: 'Ten\u00f6r',
  exchangeRate: 'D\u00f6viz',
  fuelPrice: 'Yak\u0131t',
};

interface SpiderSensitivityChartProps {
  data: any[];
  baseNpv: number;
  activeParams?: string[];
}

export function SpiderSensitivityChart({ data, baseNpv, activeParams }: SpiderSensitivityChartProps) {
  if (!data || data.length === 0) return null;

  const params = activeParams ?? Object.keys(PARAM_COLORS);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg bg-background/95 border border-border p-3 shadow-xl text-sm max-w-xs">
        <p className="font-semibold mb-2 text-foreground">De\u011fi\u015fim: {label > 0 ? '+' : ''}{label}%</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-muted-foreground">{PARAM_LABELS[p.dataKey] ?? p.dataKey}</span>
            </span>
            <span className="font-mono font-medium" style={{ color: p.color }}>
              {(p.value ?? 0).toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis
          dataKey="changePercent"
          tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v}%`}
          fontSize={11}
          label={{ value: 'Parametre De\u011fi\u015fimi (%)', position: 'insideBottom', offset: -2, fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          fontSize={11}
          tickFormatter={(v: number) => `${v.toFixed(0)}`}
          label={{ value: 'NPV (MUSD)', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value: string) => PARAM_LABELS[value] ?? value}
          iconType="circle"
          wrapperStyle={{ fontSize: '11px' }}
        />
        <ReferenceLine y={baseNpv} stroke="hsl(var(--foreground))" strokeWidth={2} strokeDasharray="8 4" strokeOpacity={0.4}
          label={{ value: `Baz: ${baseNpv.toFixed(1)}`, position: 'right', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
        />
        <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeWidth={1} strokeOpacity={0.3} />
        {params.map((p) => (
          <Line
            key={p}
            type="monotone"
            dataKey={p}
            stroke={PARAM_COLORS[p] ?? '#888'}
            strokeWidth={2.5}
            dot={{ r: 3, fill: PARAM_COLORS[p] ?? '#888' }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
