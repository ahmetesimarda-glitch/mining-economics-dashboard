'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useLanguage } from '@/lib/i18n/context';

const COLORS = ['#60B5FF', '#FF9149', '#FF9898', '#FF90BB', '#80D8C3', '#A19AD3', '#72BF78', '#FF6363'];

interface CostPieChartProps {
  data: { name: string; value: number }[];
  title?: string;
}

export function CostPieChart({ data, title }: CostPieChartProps) {
  const { t } = useLanguage();
  const safeData = (data ?? []).filter((d: any) => (d?.value ?? 0) > 0);
  
  if (safeData?.length === 0) {
    return <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">{t('cost.noData')}</div>;
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={safeData}
            cx="50%"
            cy="55%"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {safeData.map((_: any, i: number) => (
              <Cell key={`cell-${i}`} fill={COLORS[i % COLORS?.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ fontSize: 11 }} formatter={(val: any) => `${Number(val ?? 0).toFixed(2)} MUSD`} />
          <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
