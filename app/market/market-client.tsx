'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/app/components/header';
import { useLanguage } from '@/lib/i18n/context';
import { EQUIPMENT_REFERENCE, EMISSION_FACTORS, COMMODITY_REFERENCE } from '@/lib/market-reference';
import { motion } from 'framer-motion';
import {
  Loader2, RefreshCw, TrendingUp, Coins, Truck, Leaf, Globe, AlertCircle, DollarSign,
} from 'lucide-react';

const METAL_ICON_COLORS: Record<string, string> = {
  gold: 'text-yellow-500 bg-yellow-500/10',
  silver: 'text-slate-400 bg-slate-400/10',
  copper: 'text-orange-500 bg-orange-500/10',
  platinum: 'text-cyan-500 bg-cyan-500/10',
  palladium: 'text-purple-500 bg-purple-500/10',
};

const CATEGORY_ORDER = ['truck', 'excavator', 'loader', 'dozer', 'grader', 'drill', 'underground', 'crusher'];

function fmtUsd(v: number, digits = 2) {
  return v?.toLocaleString?.('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits }) ?? '0';
}

export function MarketClient() {
  const { t } = useLanguage();
  const [market, setMarket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchMarket = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/market');
      if (res?.ok) setMarket(await res?.json());
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMarket(); }, []);

  const metals = market?.metals ?? {};
  const currency = market?.currency ?? null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1200px] px-4 py-8 space-y-10">
        {/* Başlık */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight mb-2">
                {t('market.title')} <span className="text-primary">{t('market.titleAccent')}</span>
              </h1>
              <p className="text-muted-foreground text-sm max-w-2xl">{t('market.subtitle')}</p>
            </div>
            <button
              onClick={fetchMarket}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-card border border-border/50 px-3 py-2 text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {t('market.refresh')}
            </button>
          </div>
        </motion.div>

        {/* Canlı Metal Fiyatları */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-semibold tracking-tight">{t('market.liveMetals')}</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-500 px-2 py-0.5 text-[10px] font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> {t('market.live')}
            </span>
          </div>
          {loading && !market ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : error && !market ? (
            <div className="flex items-center gap-2 rounded-xl bg-card border border-border/50 p-6 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 text-amber-500" /> {t('market.error')}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(metals).map(([key, m]: [string, any], i: number) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="rounded-xl bg-card border border-border/50 p-4"
                  style={{ boxShadow: 'var(--shadow-md)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${METAL_ICON_COLORS[key] ?? 'text-primary bg-primary/10'}`}>
                      <Coins className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold">{t(`metal.${key}`)}</span>
                  </div>
                  <p className="font-mono text-lg font-bold">{fmtUsd(m?.priceUsd ?? 0)}</p>
                  <p className="text-[11px] text-muted-foreground">{m?.unit}</p>
                  <p className="font-mono text-xs mt-1.5 text-muted-foreground">
                    ≈ {fmtUsd(m?.altPrice ?? 0, key === 'copper' ? 0 : 2)} <span className="text-[10px]">{m?.altUnit}</span>
                  </p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Döviz Kurları */}
          {currency && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'USD/TRY', value: currency?.usdTry },
                { label: 'EUR/TRY', value: currency?.eurTry },
                { label: 'USD/EUR', value: currency?.usdEur },
              ].map((c) => (
                <div key={c.label} className="rounded-xl bg-card border border-border/50 p-4 flex items-center gap-3" style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    <p className="font-mono text-base font-bold">{c.value ? fmtUsd(c.value, 4) : '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] text-muted-foreground mt-3">
            {t('market.sourceNote')} · {market?.fetchedAt ? new Date(market.fetchedAt).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }) : ''}
          </p>
        </section>

        {/* Emtia Referans Fiyatları */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-semibold tracking-tight">{t('market.commodityTitle')}</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{t('market.commodityDesc')}</p>
          <div className="rounded-xl bg-card border border-border/50 overflow-x-auto" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">{t('market.colCommodity')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('market.colPrice')}</th>
                  <th className="px-4 py-3 font-medium">{t('market.colUnit')}</th>
                  <th className="px-4 py-3 font-medium">{t('market.colNote')}</th>
                </tr>
              </thead>
              <tbody>
                {COMMODITY_REFERENCE.map((c) => (
                  <tr key={c.key} className="border-b border-border/30 last:border-0 hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-2.5 font-medium">{t(`cmdty.${c.key}`)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold">{fmtUsd(c.priceUsd, 0)}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{c.unit}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{c.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Makina Fiyat Kütüphanesi */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Truck className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-semibold tracking-tight">{t('market.machineTitle')}</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{t('market.machineDesc')}</p>
          <div className="space-y-6">
            {CATEGORY_ORDER.map((cat) => {
              const items = EQUIPMENT_REFERENCE.filter((e) => e.category === cat);
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <h3 className="text-sm font-semibold mb-2 text-primary">{t(`mktcat.${cat}`)}</h3>
                  <div className="rounded-xl bg-card border border-border/50 overflow-x-auto" style={{ boxShadow: 'var(--shadow-sm)' }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                          <th className="px-4 py-2.5 font-medium">{t('market.colModel')}</th>
                          <th className="px-4 py-2.5 font-medium">{t('market.colCapacity')}</th>
                          <th className="px-4 py-2.5 font-medium text-right">{t('market.colPriceUsd')}</th>
                          <th className="px-4 py-2.5 font-medium text-right">{t('market.colFuel')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((e) => (
                          <tr key={e.model} className="border-b border-border/30 last:border-0 hover:bg-accent/40 transition-colors">
                            <td className="px-4 py-2 font-medium">{e.model}</td>
                            <td className="px-4 py-2 text-muted-foreground">{e.capacity}</td>
                            <td className="px-4 py-2 text-right font-mono font-semibold">{fmtUsd(e.priceUsd, 0)}</td>
                            <td className="px-4 py-2 text-right font-mono text-muted-foreground">{e.fuelLph > 0 ? e.fuelLph : (e.note ?? '—')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">{t('market.machineDisclaimer')}</p>
        </section>

        {/* Emisyon Faktörleri */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="h-5 w-5 text-emerald-500" />
            <h2 className="font-display text-xl font-semibold tracking-tight">{t('market.emissionTitle')}</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{t('market.emissionDesc')}</p>
          <div className="rounded-xl bg-card border border-border/50 overflow-x-auto" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">{t('market.colEmissionSource')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('market.colFactor')}</th>
                  <th className="px-4 py-3 font-medium">{t('market.colUnit')}</th>
                  <th className="px-4 py-3 font-medium">{t('market.colSource')}</th>
                </tr>
              </thead>
              <tbody>
                {EMISSION_FACTORS.map((f) => (
                  <tr key={f.key} className="border-b border-border/30 last:border-0 hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-2.5 font-medium">{t(`emis.${f.key}`)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold">{f.factor}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{f.unit}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{f.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">{t('market.emissionNote')}</p>
        </section>
      </main>
    </div>
  );
}
