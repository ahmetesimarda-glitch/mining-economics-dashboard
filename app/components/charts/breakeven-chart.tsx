'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Area, AreaChart, ComposedChart,
} from 'recharts';

interface BreakevenChartProps {
  basePrice: number;
  breakevenPrice: number;
  cashFlows: Array<{ year: number; revenue: number; opex: number; netCashFlow: number }>;
  discountRate: number;
}

export function BreakevenChart({ basePrice, breakevenPrice, cashFlows, discountRate }: BreakevenChartProps) {
  if (!cashFlows || cashFlows.length === 0 || !basePrice) return null;

  // Generate NPV for different price levels
  const r = (discountRate ?? 5.82) / 100;
  const priceRange = [];
  const minPrice = Math.max(0, breakevenPrice * 0.5);
  const maxPrice = basePrice * 1.8;
  const step = (maxPrice - minPrice) / 30;

  for (let price = minPrice; price <= maxPrice; price += step) {
    const ratio = price / basePrice;
    let npv = 0;
    cashFlows.forEach((cf) => {
      const adjustedRevenue = cf.revenue * ratio;
      const adjustedNet = cf.year === 0 ? cf.netCashFlow : (adjustedRevenue - cf.opex - (cf.netCashFlow < cf.revenue - cf.opex ? (cf.revenue - cf.opex - cf.netCashFlow) : 0));
      // Simplified: scale net cash flow by revenue ratio
      const scaledNet = cf.year === 0 ? cf.netCashFlow : cf.netCashFlow + (cf.revenue * (ratio - 1));
      npv += scaledNet / Math.pow(1 + r, cf.year);
    });
    priceRange.push({
      price: parseFloat(price.toFixed(1)),
      npv: parseFloat(npv.toFixed(1)),
    });
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="rounded-lg bg-background/95 border border-border p-3 shadow-xl text-sm">
        <p className="font-semibold mb-1">Fiyat: {d?.price} USD/ton</p>
        <p className={d?.npv >= 0 ? 'text-emerald-400' : 'text-red-400'}>NPV: {d?.npv?.toFixed(1)} MUSD</p>
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 justify-center mb-3">
        <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-500">
          Mevcut Fiyat: {basePrice} USD/ton
        </span>
        <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-500">
          Başabaş Fiyat: {breakevenPrice.toFixed(1)} USD/ton
        </span>
        <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
          Güvenlik Marjı: {((1 - breakevenPrice / basePrice) * 100).toFixed(1)}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={priceRange} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="beGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis dataKey="price" fontSize={11} label={{ value: 'Fiyat (USD/ton)', position: 'insideBottomRight', offset: -5, fontSize: 11 }} />
          <YAxis fontSize={11} tickFormatter={(v: number) => `${v.toFixed(0)}`} label={{ value: 'NPV (MUSD)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeDasharray="5 5" strokeOpacity={0.5} label={{ value: 'NPV=0', position: 'right', fontSize: 10 }} />
          <ReferenceLine x={breakevenPrice} stroke="hsl(38, 92%, 50%)" strokeDasharray="5 5" strokeWidth={2} />
          <ReferenceLine x={basePrice} stroke="hsl(217, 91%, 60%)" strokeDasharray="5 5" strokeWidth={2} />
          <Area type="monotone" dataKey="npv" fill="url(#beGrad)" stroke="none" />
          <Line type="monotone" dataKey="npv" stroke="hsl(217, 91%, 60%)" strokeWidth={2.5} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
