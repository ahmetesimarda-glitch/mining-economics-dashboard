'use client';

import { useMemo } from 'react';

interface TwoWayHeatmapProps {
  data: { priceChange: number; opexChange: number; npv: number }[];
  priceRange: number[];
  opexRange: number[];
  baseNpv: number;
}

function getNpvColor(npv: number, minNpv: number, maxNpv: number): string {
  if (npv <= 0) {
    // Red scale for negative
    const intensity = Math.min(1, Math.abs(npv) / Math.max(Math.abs(minNpv), 1));
    const r = Math.round(220 + intensity * 35);
    const g = Math.round(80 - intensity * 60);
    const b = Math.round(80 - intensity * 60);
    return `rgb(${r}, ${g}, ${b})`;
  }
  // Green scale for positive
  const intensity = Math.min(1, npv / Math.max(maxNpv, 1));
  const r = Math.round(80 - intensity * 50);
  const g = Math.round(160 + intensity * 60);
  const b = Math.round(80 - intensity * 20);
  return `rgb(${r}, ${g}, ${b})`;
}

export function TwoWayHeatmap({ data, priceRange, opexRange, baseNpv }: TwoWayHeatmapProps) {
  const { grid, minNpv, maxNpv } = useMemo(() => {
    const gridMap = new Map<string, number>();
    let min = Infinity;
    let max = -Infinity;
    for (const d of data) {
      const key = `${d.priceChange}_${d.opexChange}`;
      gridMap.set(key, d.npv);
      if (d.npv < min) min = d.npv;
      if (d.npv > max) max = d.npv;
    }
    return { grid: gridMap, minNpv: min, maxNpv: max };
  }, [data]);

  if (!data || data.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="px-2 py-2 text-left bg-muted/30 border border-border/30 font-semibold text-muted-foreground" rowSpan={2}>
              Fiyat \u2193 / OPEX \u2192
            </th>
            {opexRange.map((o) => (
              <th key={o} className="px-2 py-1.5 text-center bg-muted/30 border border-border/30 font-medium text-muted-foreground">
                {o > 0 ? '+' : ''}{o}%
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {priceRange.map((p) => (
            <tr key={p}>
              <td className="px-2 py-1.5 font-medium bg-muted/30 border border-border/30 text-muted-foreground whitespace-nowrap">
                {p > 0 ? '+' : ''}{p}%
              </td>
              {opexRange.map((o) => {
                const key = `${p}_${o}`;
                const npv = grid.get(key) ?? 0;
                const bgColor = getNpvColor(npv, minNpv, maxNpv);
                const isBase = p === 0 && o === 0;
                return (
                  <td
                    key={o}
                    className={`px-2 py-1.5 text-center font-mono border border-border/20 transition-all ${
                      isBase ? 'ring-2 ring-primary ring-inset font-bold' : ''
                    }`}
                    style={{
                      backgroundColor: bgColor,
                      color: npv <= 0 ? '#fecaca' : '#d1fae5',
                    }}
                    title={`Fiyat: ${p > 0 ? '+' : ''}${p}%, OPEX: ${o > 0 ? '+' : ''}${o}%, NPV: ${npv.toFixed(1)} MUSD`}
                  >
                    {npv.toFixed(0)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-3 rounded" style={{ backgroundColor: 'rgb(255, 20, 20)' }} />
          <span>NPV &lt; 0</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-3 rounded" style={{ backgroundColor: 'rgb(30, 220, 60)' }} />
          <span>NPV &gt; 0</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-3 rounded border-2 border-primary" />
          <span>Baz Durum</span>
        </div>
      </div>
    </div>
  );
}
