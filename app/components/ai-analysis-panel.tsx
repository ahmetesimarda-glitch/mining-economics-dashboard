'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import {
  Brain, Loader2, AlertTriangle, TrendingUp, TrendingDown,
  DollarSign, Shield, Zap, Target, ChevronDown, ChevronUp,
  ArrowRight, Sparkles, BarChart3, RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIAnalysisPanelProps {
  projectId: string;
}

const IMPACT_COLORS: Record<string, string> = {
  'y\u00fcksek': 'bg-red-500/15 text-red-400 border-red-500/30',
  'orta': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  'd\u00fc\u015f\u00fck': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'high': 'bg-red-500/15 text-red-400 border-red-500/30',
  'medium': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  'low': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

const SEVERITY_COLORS: Record<string, string> = {
  'kritik': 'bg-red-600/20 text-red-400 border-red-500/40',
  'y\u00fcksek': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  'orta': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  'd\u00fc\u015f\u00fck': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'critical': 'bg-red-600/20 text-red-400 border-red-500/40',
  'high': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  'medium': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  'low': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  'kolay': 'text-emerald-400',
  'orta': 'text-yellow-400',
  'zor': 'text-red-400',
  'easy': 'text-emerald-400',
  'medium': 'text-yellow-400',
  'hard': 'text-red-400',
};

export function AIAnalysisPanel({ projectId }: AIAnalysisPanelProps) {
  const { t } = useLanguage();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    drivers: true, costs: true, revenue: true, risks: true, actions: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      const response = await fetch(`/api/projects/${projectId}/ai-analysis`, {
        method: 'POST',
      });

      if (!response.ok) {
        let errMsg = t('ai.serviceUnavailable');
        try {
          const errData = await response.json();
          errMsg = errData?.error ?? errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error(t('ai.streamUnreadable'));

      const decoder = new TextDecoder();
      let partialRead = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        partialRead += decoder.decode(value, { stream: true });
        const lines = partialRead.split('\n');
        partialRead = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            try {
              const parsed = JSON.parse(data);
              if (parsed.status === 'processing') {
                setProgress((prev) => Math.min(prev + 2, 95));
              } else if (parsed.status === 'completed') {
                let finalResult = parsed.result;
                // If API sent raw string, try to parse it on client side
                if (finalResult?.raw && typeof finalResult.raw === 'string') {
                  try {
                    let cleaned = finalResult.raw.trim();
                    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
                    const firstBrace = cleaned.indexOf('{');
                    const lastBrace = cleaned.lastIndexOf('}');
                    if (firstBrace !== -1 && lastBrace > firstBrace) {
                      finalResult = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
                    }
                  } catch {
                    // Keep raw result as-is
                  }
                }
                setResult(finalResult);
                setProgress(100);
                return;
              } else if (parsed.status === 'error') {
                throw new Error(parsed.message || t('ai.analysisFailed'));
              }
            } catch (e: any) {
              if (e?.message && !e.message.includes('JSON')) throw e;
            }
          }
        }
      }
    } catch (err: any) {
      console.error('AI Analysis error:', err);
      setError(err?.message ?? t('ai.unknownError'));
    } finally {
      setLoading(false);
    }
  };

  const ScoreGauge = ({ score }: { score: number }) => {
    const color = score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
    const bgColor = score >= 75 ? 'from-emerald-500/20' : score >= 50 ? 'from-yellow-500/20' : 'from-red-500/20';
    return (
      <div className="flex items-center gap-4">
        <div className={cn('relative w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br to-transparent', bgColor)}>
          <span className={cn('text-2xl font-bold font-mono', color)}>{score}</span>
          <span className="text-[10px] text-muted-foreground absolute bottom-1">/100</span>
        </div>
      </div>
    );
  };

  const SectionHeader = ({ icon: Icon, title, sectionKey, badge }: { icon: any; title: string; sectionKey: string; badge?: number }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between py-3 group"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="font-display text-sm font-semibold">{title}</span>
        {badge !== undefined && (
          <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-medium">{badge}</span>
        )}
      </div>
      {expandedSections[sectionKey] ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
    </button>
  );

  // Not started state
  if (!result && !loading && !error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Brain className="h-12 w-12 text-primary" />
          </div>
          <Sparkles className="h-5 w-5 text-primary absolute -top-1 -right-1 animate-pulse" />
        </div>
        <div className="text-center space-y-2 max-w-md">
          <h3 className="font-display text-lg font-semibold">{t('ai.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('ai.description')}</p>
        </div>
        <button
          onClick={runAnalysis}
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Sparkles className="h-4 w-4" />
          {t('ai.startAnalysis')}
        </button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-display text-lg font-semibold">{t('ai.analyzing')}</h3>
          <p className="text-sm text-muted-foreground">{t('ai.analyzingDesc')}</p>
        </div>
        <div className="w-64">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">%{progress}</p>
        </div>
      </div>
    );
  }

  // Error state
  const isCreditError = error?.includes('kredi') || error?.includes('credit');
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <p className="text-sm text-red-400 text-center max-w-md">{error}</p>
        {isCreditError && (
          <p className="text-xs text-muted-foreground text-center max-w-md">
            {t('ai.creditHint')}
          </p>
        )}
        {!isCreditError && (
          <button
            onClick={runAnalysis}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" /> {t('ai.retry')}
          </button>
        )}
      </div>
    );
  }

  // Result
  const r = result;
  if (!r) return null;

  return (
    <div className="space-y-6">
      {/* Header: Score + Verdict */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-gradient-to-r from-primary/10 via-card to-card border border-primary/20 p-6"
        style={{ boxShadow: 'var(--shadow-lg)' }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <ScoreGauge score={r.overallScore ?? 0} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-5 w-5 text-primary" />
              <h3 className="font-display text-base font-semibold">{t('ai.projectScore')}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{r.overallVerdict}</p>
          </div>
          <button
            onClick={runAnalysis}
            className="px-3 py-1.5 rounded-lg border border-border/50 text-xs text-muted-foreground hover:bg-accent transition-all flex items-center gap-1.5 self-start"
          >
            <RefreshCw className="h-3 w-3" /> {t('ai.refresh')}
          </button>
        </div>
      </motion.div>

      {/* NPV Drivers */}
      {r.npvDrivers?.length > 0 && (
        <div className="rounded-xl bg-card border border-border/50 overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
          <div className="px-5 border-b border-border/30">
            <SectionHeader icon={TrendingDown} title={t('ai.npvDrivers')} sectionKey="drivers" badge={r.npvDrivers.length} />
          </div>
          <AnimatePresence>
            {expandedSections.drivers && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="p-5 space-y-3">
                  {r.npvDrivers.map((d: any, i: number) => (
                    <div key={i} className="rounded-lg border border-border/30 p-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm font-semibold">{d.factor}</span>
                          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium border', IMPACT_COLORS[d.impact?.toLowerCase()] ?? IMPACT_COLORS['orta'])}>
                            {d.impact}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-2">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('ai.current')}</p>
                          <p className="text-xs font-mono font-medium">{d.currentValue}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('ai.benchmark')}</p>
                          <p className="text-xs font-mono font-medium">{d.benchmarkAvg}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('ai.deviation')}</p>
                          <p className="text-xs font-mono font-medium">{d.deviation}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{d.explanation}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Cost Optimizations */}
      {r.costOptimizations?.length > 0 && (
        <div className="rounded-xl bg-card border border-border/50 overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
          <div className="px-5 border-b border-border/30">
            <SectionHeader icon={DollarSign} title={t('ai.costOpt')} sectionKey="costs" badge={r.costOptimizations.length} />
          </div>
          <AnimatePresence>
            {expandedSections.costs && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="p-5 space-y-3">
                  {r.costOptimizations.map((c: any, i: number) => (
                    <div key={i} className="rounded-lg border border-border/30 p-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-display text-sm font-semibold">{c.category}</span>
                        <span className={cn('text-xs font-medium', DIFFICULTY_COLORS[c.difficulty?.toLowerCase()] ?? 'text-muted-foreground')}>
                          {c.difficulty}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('ai.currentCost')}</p>
                          <p className="text-xs font-mono">{c.currentCost}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('ai.benchmarkCost')}</p>
                          <p className="text-xs font-mono">{c.benchmarkCost}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('ai.savingPotential')}</p>
                          <p className="text-xs font-mono text-emerald-400">{c.savingPotential}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('ai.npvImpact')}</p>
                          <p className="text-xs font-mono text-primary">{c.npvImpact}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{c.recommendation}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Revenue Optimizations */}
      {r.revenueOptimizations?.length > 0 && (
        <div className="rounded-xl bg-card border border-border/50 overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
          <div className="px-5 border-b border-border/30">
            <SectionHeader icon={TrendingUp} title={t('ai.revenueOpt')} sectionKey="revenue" badge={r.revenueOptimizations.length} />
          </div>
          <AnimatePresence>
            {expandedSections.revenue && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="p-5 space-y-3">
                  {r.revenueOptimizations.map((rv: any, i: number) => (
                    <div key={i} className="rounded-lg border border-border/30 p-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-display text-sm font-semibold">{rv.strategy}</span>
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium border',
                          rv.feasibility?.toLowerCase() === 'y\u00fcksek' || rv.feasibility?.toLowerCase() === 'high'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : rv.feasibility?.toLowerCase() === 'orta' || rv.feasibility?.toLowerCase() === 'medium'
                            ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                            : 'bg-red-500/15 text-red-400 border-red-500/30'
                        )}>
                          {rv.feasibility}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{rv.description}</p>
                      <div className="flex items-center gap-1 text-xs">
                        <TrendingUp className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400 font-mono font-medium">{rv.potentialGain}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Risk Warnings */}
      {r.riskWarnings?.length > 0 && (
        <div className="rounded-xl bg-card border border-border/50 overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
          <div className="px-5 border-b border-border/30">
            <SectionHeader icon={Shield} title={t('ai.riskWarnings')} sectionKey="risks" badge={r.riskWarnings.length} />
          </div>
          <AnimatePresence>
            {expandedSections.risks && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="p-5 space-y-3">
                  {r.riskWarnings.map((rw: any, i: number) => (
                    <div key={i} className="rounded-lg border border-border/30 p-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className={cn('h-4 w-4',
                          rw.severity?.toLowerCase() === 'kritik' || rw.severity?.toLowerCase() === 'critical' ? 'text-red-400' :
                          rw.severity?.toLowerCase() === 'y\u00fcksek' || rw.severity?.toLowerCase() === 'high' ? 'text-orange-400' :
                          'text-yellow-400'
                        )} />
                        <span className="font-display text-sm font-semibold">{rw.risk}</span>
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium border', SEVERITY_COLORS[rw.severity?.toLowerCase()] ?? SEVERITY_COLORS['orta'])}>
                          {rw.severity}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{rw.description}</p>
                      <div className="flex items-start gap-1.5">
                        <Shield className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-primary">{rw.mitigation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Action Plan */}
      {r.actionPlan?.length > 0 && (
        <div className="rounded-xl bg-card border border-border/50 overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
          <div className="px-5 border-b border-border/30">
            <SectionHeader icon={Target} title={t('ai.actionPlan')} sectionKey="actions" badge={r.actionPlan.length} />
          </div>
          <AnimatePresence>
            {expandedSections.actions && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="p-5">
                  <div className="space-y-3">
                    {(r.actionPlan ?? []).sort((a: any, b: any) => (a.priority ?? 99) - (b.priority ?? 99)).map((ap: any, i: number) => (
                      <div key={i} className="flex items-start gap-4 rounded-lg border border-border/30 p-4 hover:bg-muted/20 transition-colors">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm',
                          ap.priority === 1 ? 'bg-primary/20 text-primary' :
                          ap.priority === 2 ? 'bg-blue-500/20 text-blue-400' :
                          'bg-muted text-muted-foreground'
                        )}>
                          {ap.priority}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-sm font-semibold mb-1">{ap.action}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3 text-primary" /> {ap.expectedImpact}
                            </span>
                            <span className="flex items-center gap-1">
                              <ArrowRight className="h-3 w-3" /> {ap.timeframe}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}