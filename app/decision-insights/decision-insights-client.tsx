'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/app/components/header';
import { useLanguage } from '@/lib/i18n/context';
import { filterDemoWorkspaceProjects } from '@/lib/demo';
import { formatMUSD, formatPercent, formatYear } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { DecisionInsight } from '@/lib/decision-insights';
import {
  InsightBadge,
  recommendationTone,
  riskTone,
  strengthTone,
} from '@/app/components/decision-insights/insight-badge';
import { InsightSectionCard } from '@/app/components/decision-insights/insight-section-card';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Eye,
  FileText,
  Lightbulb,
  Loader2,
  Mountain,
  Scale,
  Shield,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface ProjectListItem {
  id: string;
  name: string;
  mineType: string;
  npv: number;
  irr: number;
  paybackPeriod: number;
  totalCapex: number;
  status: string;
}

interface DecisionInsightsResponse {
  projectId: string;
  projectName: string;
  inputs: {
    npv: number;
    irr: number;
    paybackPeriod: number;
    totalCapex: number;
    totalOpex: number;
    initialInvestment: number;
    averageAnnualCashFlow: number;
    commodity: string;
    country: string;
    mineType: string;
    productionRate: number;
    productionUnit: string;
    monteCarloPositiveNpvProb: number;
  };
  insight: DecisionInsight;
}

const ADVANTAGE_I18N: Record<string, string> = {
  'High IRR': 'di.adv.highIrr',
  'Fast Payback': 'di.adv.fastPayback',
  'Robust NPV': 'di.adv.robustNpv',
  'Stable Cash Flow': 'di.adv.stableCashFlow',
  'Low Sensitivity': 'di.adv.lowSensitivity',
  'Strong Probability of Positive NPV': 'di.adv.strongPositiveNpv',
};

const RISK_I18N: Record<string, string> = {
  'Large Initial Capital': 'di.risk.largeCapital',
  'High Commodity Sensitivity': 'di.risk.commoditySensitivity',
  'Long Payback': 'di.risk.longPayback',
  'Country Risk': 'di.risk.country',
  'Low Monte Carlo Confidence': 'di.risk.lowMcConfidence',
  'Negative Downside Scenario': 'di.risk.negativeDownside',
};

const OBSERVATION_I18N: Record<string, string> = {
  'Project remains profitable across most simulated scenarios.': 'di.obs.profitableMost',
  'A material share of simulated scenarios produces non-positive NPV.': 'di.obs.materialDownside',
  'Cash flow is concentrated in later years.': 'di.obs.lateCashFlow',
  'Capital recovery occurs rapidly.': 'di.obs.rapidRecovery',
  'Commodity price changes have significant influence.': 'di.obs.priceInfluence',
  'Average operating cash flow supports the headline valuation.': 'di.obs.avgCfSupports',
};

const RECOMMENDATION_I18N: Record<string, string> = {
  'Strong Investment': 'di.rec.strongInvestment',
  Promising: 'di.rec.promising',
  'Requires Review': 'di.rec.requiresReview',
  'High Risk': 'di.rec.highRisk',
  'Not Recommended': 'di.rec.notRecommended',
};

const RISK_LEVEL_I18N: Record<string, string> = {
  Low: 'di.riskLevel.low',
  Moderate: 'di.riskLevel.moderate',
  High: 'di.riskLevel.high',
  'Very High': 'di.riskLevel.veryHigh',
};

const STRENGTH_I18N: Record<string, string> = {
  Excellent: 'di.strength.excellent',
  Strong: 'di.strength.strong',
  Average: 'di.strength.average',
  Weak: 'di.strength.weak',
};

function localizeList(
  items: string[],
  map: Record<string, string>,
  t: (key: string) => string
): string[] {
  return items.map((item) => {
    const key = map[item];
    return key ? t(key) : item;
  });
}

export function DecisionInsightsClient() {
  const { t, locale } = useLanguage();
  const searchParams = useSearchParams();
  const projectFromQuery = searchParams.get('project');
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(projectFromQuery);
  const [listLoading, setListLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<DecisionInsightsResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        await fetch('/api/demo/ensure');
        const res = await fetch('/api/projects');
        const data: unknown = await res.json();
        const list = filterDemoWorkspaceProjects(Array.isArray(data) ? data : []);
        const evaluated = list.filter(
          (p: ProjectListItem) =>
            typeof p?.npv === 'number' || typeof p?.irr === 'number'
        ) as ProjectListItem[];
        setProjects(evaluated);
        if (projectFromQuery && evaluated.some((p) => p.id === projectFromQuery)) {
          setSelectedId(projectFromQuery);
        }
      } catch (err: unknown) {
        console.error(err);
        setError(t('di.loadProjectsError'));
      } finally {
        setListLoading(false);
      }
    };
    void load();
  }, [t, projectFromQuery]);

  const loadInsights = useCallback(
    async (projectId: string) => {
      setInsightLoading(true);
      setError(null);
      setPayload(null);
      try {
        const res = await fetch(
          `/api/projects/${projectId}/decision-insights?locale=${locale}`
        );
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? t('di.loadInsightError'));
        }
        const data = (await res.json()) as DecisionInsightsResponse;
        setPayload(data);
      } catch (err: unknown) {
        console.error(err);
        setError(err instanceof Error ? err.message : t('di.loadInsightError'));
      } finally {
        setInsightLoading(false);
      }
    },
    [locale, t]
  );

  useEffect(() => {
    if (!selectedId) return;
    void loadInsights(selectedId);
  }, [selectedId, loadInsights]);

  const insight = payload?.insight;
  const inputs = payload?.inputs;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1200px] px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-1 font-display text-2xl font-bold tracking-tight">
            {t('di.title')} <span className="text-primary">{t('di.titleAccent')}</span>
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">{t('di.subtitle')}</p>
        </motion.div>

        {listLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : projects.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card py-20"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <Mountain className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <h3 className="font-display text-lg font-semibold">{t('di.noProjects')}</h3>
            <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
              {t('di.noProjectsHint')}
            </p>
            <Link
              href="/projects/new"
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t('nav.newProject')}
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-medium">{t('di.selectProject')}</h3>
              <div className="flex flex-wrap gap-2">
                {projects.map((p) => {
                  const isSelected = selectedId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all',
                        isSelected
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-border/50 bg-card text-muted-foreground hover:bg-accent'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      <Mountain className="h-3 w-3" />
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {!selectedId && (
              <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
                {t('di.selectHint')}
              </div>
            )}

            {insightLoading && (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">{t('di.generating')}</p>
              </div>
            )}

            {error && !insightLoading && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {insight && inputs && !insightLoading && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {t('di.projectLabel')}
                    </p>
                    <h2 className="font-display text-xl font-semibold tracking-tight">
                      {payload.projectName}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {inputs.commodity} · {inputs.country} · {inputs.productionRate}{' '}
                      {inputs.productionUnit}/{t('fmt.year')}
                    </p>
                  </div>
                  <Link
                    href={`/projects/${payload.projectId}`}
                    className="rounded-lg border border-border/50 bg-card px-3 py-2 text-xs font-medium hover:bg-accent"
                  >
                    {t('di.openProject')}
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {[
                    { label: 'NPV', value: formatMUSD(inputs.npv) },
                    { label: 'IRR', value: formatPercent(inputs.irr) },
                    { label: t('kpi.payback'), value: formatYear(inputs.paybackPeriod) },
                    { label: 'CAPEX', value: formatMUSD(inputs.totalCapex) },
                    { label: 'OPEX', value: formatMUSD(inputs.totalOpex) },
                    {
                      label: t('di.mcPositive'),
                      value: formatPercent(inputs.monteCarloPositiveNpvProb),
                    },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="rounded-xl border border-border/50 bg-card p-3"
                      style={{ boxShadow: 'var(--shadow-sm)' }}
                    >
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {kpi.label}
                      </p>
                      <p className="mt-1 font-mono text-sm font-semibold">{kpi.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <InsightSectionCard title={t('di.overallRecommendation')} icon={Sparkles}>
                    <InsightBadge
                      label={t(
                        RECOMMENDATION_I18N[insight.overallRecommendation] ??
                          insight.overallRecommendation
                      )}
                      tone={recommendationTone(insight.overallRecommendation)}
                      className="text-sm"
                    />
                    <p className="mt-3 text-xs text-muted-foreground">{t('di.recommendationHint')}</p>
                  </InsightSectionCard>

                  <InsightSectionCard title={t('di.financialStrength')} icon={TrendingUp}>
                    <InsightBadge
                      label={t(STRENGTH_I18N[insight.financialStrength] ?? insight.financialStrength)}
                      tone={strengthTone(insight.financialStrength)}
                      className="text-sm"
                    />
                    <p className="mt-3 text-xs text-muted-foreground">{t('di.strengthHint')}</p>
                  </InsightSectionCard>

                  <InsightSectionCard title={t('di.riskAssessment')} icon={Shield}>
                    <InsightBadge
                      label={t(RISK_LEVEL_I18N[insight.riskLevel] ?? insight.riskLevel)}
                      tone={riskTone(insight.riskLevel)}
                      className="text-sm"
                    />
                    <p className="mt-3 text-xs text-muted-foreground">{t('di.riskHint')}</p>
                  </InsightSectionCard>
                </div>

                <InsightSectionCard title={t('di.executiveSummary')} icon={FileText}>
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {insight.executiveSummary}
                  </p>
                </InsightSectionCard>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <InsightSectionCard title={t('di.advantages')} icon={CheckCircle2}>
                    <ul className="space-y-2">
                      {localizeList(insight.keyAdvantages, ADVANTAGE_I18N, t).map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 rounded-lg bg-emerald-500/5 px-3 py-2 text-sm"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                      {insight.keyAdvantages.length === 0 && (
                        <li className="text-sm text-muted-foreground">{t('di.noneAdvantages')}</li>
                      )}
                    </ul>
                  </InsightSectionCard>

                  <InsightSectionCard title={t('di.risks')} icon={AlertTriangle}>
                    <ul className="space-y-2">
                      {localizeList(insight.keyRisks, RISK_I18N, t).map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 rounded-lg bg-orange-500/5 px-3 py-2 text-sm"
                        >
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                      {insight.keyRisks.length === 0 && (
                        <li className="text-sm text-muted-foreground">{t('di.noneRisks')}</li>
                      )}
                    </ul>
                  </InsightSectionCard>
                </div>

                <InsightSectionCard title={t('di.observations')} icon={Eye}>
                  <ul className="space-y-2">
                    {localizeList(insight.importantObservations, OBSERVATION_I18N, t).map(
                      (item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 border-b border-border/30 py-2 text-sm last:border-0"
                        >
                          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{item}</span>
                        </li>
                      )
                    )}
                  </ul>
                </InsightSectionCard>

                <div className="flex items-start gap-2 rounded-lg border border-border/40 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                  <Scale className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <p>{t('di.disclaimer')}</p>
                </div>
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
