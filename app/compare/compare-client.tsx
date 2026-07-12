'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/app/components/header';
import { formatMUSD, formatPercent, formatYear } from '@/lib/format';
import { BarChart3, Check, Loader2, Mountain } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell } from 'recharts';
import { useLanguage } from '@/lib/i18n/context';

const COLORS = ['#60B5FF', '#FF9149', '#FF9898', '#80D8C3', '#A19AD3', '#FF90BB', '#72BF78', '#FF6363'];

export function CompareClient() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projects');
        const data = await res?.json();
        setProjects(data ?? []);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev: string[]) => {
      if ((prev ?? []).includes(id)) return (prev ?? []).filter((s: string) => s !== id);
      if ((prev?.length ?? 0) >= 6) return prev ?? [];
      return [...(prev ?? []), id];
    });
  };

  const selectedProjects = (projects ?? []).filter((p: any) => (selected ?? []).includes(p?.id));

  const npvData = selectedProjects.map((p: any) => ({ name: p?.name?.substring?.(0, 15) ?? '', NPV: Number((p?.npv ?? 0).toFixed(2)) }));
  const irrData = selectedProjects.map((p: any) => ({ name: p?.name?.substring?.(0, 15) ?? '', IRR: Number((p?.irr ?? 0).toFixed(2)) }));

  const maxNpv = Math.max(...selectedProjects.map((p: any) => Math.abs(p?.npv ?? 1)), 1);
  const maxIrr = Math.max(...selectedProjects.map((p: any) => Math.abs(p?.irr ?? 1)), 1);
  const maxCapex = Math.max(...selectedProjects.map((p: any) => p?.totalCapex ?? 1), 1);
  const maxOpex = Math.max(...selectedProjects.map((p: any) => p?.totalOpex ?? 1), 1);

  const { t } = useLanguage();
  const getMineTypeLabel = (v: string) => t(`mine.${v}`) !== `mine.${v}` ? t(`mine.${v}`) : (v ?? t('fmt.unknown'));
  const getMiningMethodLabel = (v: string) => t(`method.${v}`) !== `method.${v}` ? t(`method.${v}`) : (v ?? t('fmt.unknown'));

  const radarData = [
    { metric: 'NPV', ...Object.fromEntries(selectedProjects.map((p: any, i: number) => [p?.name?.substring?.(0, 10) ?? `P${i}`, ((Math.abs(p?.npv ?? 0)) / maxNpv * 100)])) },
    { metric: 'IRR', ...Object.fromEntries(selectedProjects.map((p: any, i: number) => [p?.name?.substring?.(0, 10) ?? `P${i}`, ((Math.abs(p?.irr ?? 0)) / maxIrr * 100)])) },
    { metric: 'CAPEX', ...Object.fromEntries(selectedProjects.map((p: any, i: number) => [p?.name?.substring?.(0, 10) ?? `P${i}`, ((p?.totalCapex ?? 0) / maxCapex * 100)])) },
    { metric: 'OPEX', ...Object.fromEntries(selectedProjects.map((p: any, i: number) => [p?.name?.substring?.(0, 10) ?? `P${i}`, ((p?.totalOpex ?? 0) / maxOpex * 100)])) },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1200px] px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold tracking-tight mb-1">
            {t('compare.title')} <span className="text-primary">{t('compare.titleAccent')}</span>
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            {t('compare.subtitle')}
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (projects?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-xl bg-card border border-border/50" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <Mountain className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="font-display text-lg font-semibold">{t('compare.createFirst')}</h3>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">{t('compare.selectProjects')}</h3>
              <div className="flex flex-wrap gap-2">
                {(projects ?? []).map((p: any) => {
                  const isSelected = (selected ?? []).includes(p?.id);
                  return (
                    <button
                      key={p?.id}
                      onClick={() => toggleSelect(p?.id)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all border',
                        isSelected
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-card border-border/50 text-muted-foreground hover:bg-accent'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      <Mountain className="h-3 w-3" />
                      {p?.name ?? t('card.project')}
                    </button>
                  );
                })}
              </div>
            </div>

            {(selected?.length ?? 0) >= 2 ? (
              <div className="space-y-6">
                <div className="rounded-xl bg-card border border-border/50 overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
                  <div className="p-5">
                    <h3 className="font-display text-sm font-semibold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" /> {t('compare.table')}
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-4 py-2 text-left font-medium">{t('compare.indicator')}</th>
                          {selectedProjects.map((p: any) => (
                            <th key={p?.id} className="px-4 py-2 text-right font-medium">{p?.name?.substring?.(0, 20) ?? ''}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: t('compare.mineType'), fn: (p: any) => getMineTypeLabel(p?.mineType) },
                          { label: t('compare.method'), fn: (p: any) => getMiningMethodLabel(p?.miningMethod) },
                          { label: t('compare.npvMusd'), fn: (p: any) => formatMUSD(p?.npv) },
                          { label: t('compare.irrPct'), fn: (p: any) => formatPercent(p?.irr) },
                          { label: t('compare.payback'), fn: (p: any) => formatYear(p?.paybackPeriod) },
                          { label: t('compare.breakeven'), fn: (p: any) => `${(p?.breakevenPrice ?? 0).toFixed(2)} USD/ton` },
                          { label: t('compare.capexMusd'), fn: (p: any) => formatMUSD(p?.totalCapex) },
                          { label: t('compare.opexMusd'), fn: (p: any) => formatMUSD(p?.totalOpex) },
                          { label: t('compare.unitPrice'), fn: (p: any) => `${p?.unitPrice ?? 0} USD/ton` },
                          { label: t('compare.production'), fn: (p: any) => `${p?.annualProduction ?? 0} Mt/${t('fmt.year')}` },
                          { label: t('compare.discountRate'), fn: (p: any) => formatPercent(p?.discountRate) },
                          { label: t('compare.projectLife'), fn: (p: any) => `${p?.projectLifeYears ?? 0} ${t('fmt.years')}` },
                        ].map((row: any, i: number) => (
                          <tr key={i} className={cn('border-t border-border/20', i % 2 === 0 ? '' : 'bg-muted/20')}>
                            <td className="px-4 py-2 font-medium text-muted-foreground">{row?.label}</td>
                            {selectedProjects.map((p: any) => (
                              <td key={p?.id} className="px-4 py-2 text-right font-mono">{row?.fn?.(p) ?? '-'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                    <h3 className="font-display text-sm font-semibold mb-4">{t('compare.npv')}</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={npvData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                          <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                          <YAxis tickLine={false} tick={{ fontSize: 10 }} label={{ value: 'MUSD', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }} />
                          <Tooltip contentStyle={{ fontSize: 11 }} />
                          <Bar dataKey="NPV" radius={[4, 4, 0, 0]}>
                            {npvData.map((_: any, i: number) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                    <h3 className="font-display text-sm font-semibold mb-4">{t('compare.irr')}</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={irrData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                          <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                          <YAxis tickLine={false} tick={{ fontSize: 10 }} label={{ value: '%', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }} />
                          <Tooltip contentStyle={{ fontSize: 11 }} />
                          <Bar dataKey="IRR" radius={[4, 4, 0, 0]}>
                            {irrData.map((_: any, i: number) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {(selected?.length ?? 0) >= 2 && (selected?.length ?? 0) <= 4 && (
                  <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                    <h3 className="font-display text-sm font-semibold mb-4">{t('compare.multiMetric')}</h3>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                          <PolarRadiusAxis tick={{ fontSize: 9 }} />
                          {selectedProjects.map((p: any, i: number) => (
                            <Radar
                              key={p?.id}
                              name={p?.name?.substring?.(0, 10) ?? `P${i}`}
                              dataKey={p?.name?.substring?.(0, 10) ?? `P${i}`}
                              stroke={COLORS[i % COLORS.length]}
                              fill={COLORS[i % COLORS.length]}
                              fillOpacity={0.15}
                            />
                          ))}
                          <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                          <Tooltip contentStyle={{ fontSize: 11 }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 rounded-xl bg-card border border-border/50" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground text-sm">{t('compare.selectMin')}</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
