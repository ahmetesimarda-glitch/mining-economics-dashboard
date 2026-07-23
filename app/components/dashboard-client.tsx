'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from './header';
import { ProjectCard } from './project-card';
import type { DashboardCardProject } from './project-card';
import { KPICard } from './kpi-card';
import { formatMUSD, formatPercent } from '@/lib/format';
import { Mountain, TrendingUp, DollarSign, BarChart3, PlusCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n/context';
import { WelcomeDialog } from '@/components/demo/WelcomeDialog';
import { DemoPortfolio } from '@/components/demo/DemoPortfolio';
import { MiningMarketInsights } from '@/app/components/news/mining-market-insights';
import {
  DEMO_PROJECT_ID,
  dismissWelcomePermanently,
  filterDemoWorkspaceProjects,
  isDemoProjectId,
  isWelcomeDismissed,
  untrackCreatedProjectId,
} from '@/lib/demo';
import { bootstrapAnalyticsSession } from '@/lib/analytics';
import { toast } from 'sonner';
import type { DemoEconomics } from '@/components/demo/DemoProjectCard';
import {
  computePortfolioMetrics,
  readPortfolioSelection,
  resolveInitialSelection,
  writePortfolioSelection,
} from '@/lib/dashboard/portfolio-selection';

interface DashboardProject {
  id: string;
  name?: string;
  npv?: number;
  irr?: number;
  totalCapex?: number;
  [key: string]: unknown;
}

export function DashboardClient() {
  const { t } = useLanguage();
  const router = useRouter();
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionReady, setSelectionReady] = useState(false);
  const [selectionInitialized, setSelectionInitialized] = useState(false);

  const fetchProjects = async () => {
    try {
      await fetch('/api/demo/ensure');
      const res = await fetch('/api/projects');
      const data = (await res?.json()) as DashboardProject[] | null;
      const all = Array.isArray(data) ? data : [];
      setProjects(filterDemoWorkspaceProjects(all));
    } catch (err: unknown) {
      console.error('Projeler yüklenemedi:', err);
      toast.error(t('dash.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProjects();
    if (!isWelcomeDismissed()) {
      setWelcomeOpen(true);
    }
    const cleanup = bootstrapAnalyticsSession();
    return () => {
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = projects ?? [];
  const visibleIds = useMemo(
    () => visible.map((p) => p?.id).filter((id): id is string => Boolean(id)),
    [visible]
  );

  useEffect(() => {
    if (loading) return;

    if (!selectionInitialized) {
      const stored = readPortfolioSelection();
      // Avoid persisting an empty "cleared" selection before projects arrive.
      if (stored === null && visibleIds.length === 0) {
        setSelectedIds([]);
        setSelectionReady(true);
        return;
      }
      const next = resolveInitialSelection(visibleIds, stored);
      setSelectedIds(next);
      writePortfolioSelection(next);
      setSelectionInitialized(true);
      setSelectionReady(true);
      return;
    }

    setSelectedIds((prev) => {
      const visible = new Set(visibleIds);
      const next = prev.filter((id) => visible.has(id));
      if (next.length !== prev.length) {
        writePortfolioSelection(next);
        return next;
      }
      return prev;
    });
  }, [loading, visibleIds, selectionInitialized]);

  const persistSelection = (ids: string[]) => {
    setSelectedIds(ids);
    writePortfolioSelection(ids);
  };

  const handleDelete = (id: string) => {
    untrackCreatedProjectId(id);
    setProjects((prev) => (prev ?? []).filter((p) => p?.id !== id));
    persistSelection(selectedIds.filter((x) => x !== id));
  };

  const handleDuplicate = (newProject: DashboardCardProject) => {
    if (newProject?.id) {
      const row: DashboardProject = {
        id: newProject.id,
        name: newProject.name,
        npv: newProject.npv ?? undefined,
        irr: newProject.irr ?? undefined,
        totalCapex: newProject.totalCapex ?? undefined,
        mineType: newProject.mineType,
        miningMethod: newProject.miningMethod,
        location: newProject.location,
      };
      setProjects((prev) => filterDemoWorkspaceProjects([row, ...(prev ?? [])]));
      if (!selectedIds.includes(newProject.id)) {
        persistSelection([newProject.id, ...selectedIds]);
      }
    }
  };

  const userProjects = visible.filter((p) => !isDemoProjectId(p?.id));
  const demoProjects = visible.filter((p) => isDemoProjectId(p?.id));

  const economicsById = useMemo(() => {
    const map: Record<string, DemoEconomics> = {};
    for (const p of demoProjects) {
      if (p?.id) {
        map[p.id] = { npv: p.npv, irr: p.irr };
      }
    }
    return map;
  }, [demoProjects]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const portfolioMetrics = useMemo(
    () => computePortfolioMetrics(visible, selectedSet),
    [visible, selectedSet]
  );

  const toggleProject = (id: string) => {
    if (!id) return;
    if (selectedSet.has(id)) {
      persistSelection(selectedIds.filter((x) => x !== id));
    } else {
      persistSelection([...selectedIds, id]);
    }
  };

  const selectAll = () => persistSelection([...visibleIds]);
  const clearSelection = () => persistSelection([]);

  const dismissWelcome = () => {
    dismissWelcomePermanently();
    setWelcomeOpen(false);
  };

  const exploreDemo = () => {
    dismissWelcomePermanently();
    setWelcomeOpen(false);
    requestAnimationFrame(() => {
      const el = document.getElementById('demo-portfolio');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        router.push(`/projects/${DEMO_PROJECT_ID}`);
      }
    });
  };

  const createNew = () => {
    dismissWelcomePermanently();
    setWelcomeOpen(false);
    router.push('/projects/new');
  };

  const selectedCount = selectionReady ? portfolioMetrics.totalProjects : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1200px] px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold tracking-tight mb-2">
            {t('dash.title')} <span className="text-primary">{t('dash.titleAccent')}</span>{' '}
            {t('dash.titleSuffix')}
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">{t('dash.subtitle')}</p>
        </motion.div>

        <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {t('dash.statsBasedOn').replace('{count}', String(selectedCount))}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={selectAll}
              disabled={loading || visibleIds.length === 0}
              className="inline-flex items-center rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
            >
              {t('dash.selectAll')}
            </button>
            <button
              type="button"
              onClick={clearSelection}
              disabled={loading || selectedIds.length === 0}
              className="inline-flex items-center rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
            >
              {t('dash.clearSelection')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            title={t('dash.totalProjects')}
            value={portfolioMetrics.totalProjects}
            format={(v: number) => Math.round(v).toString()}
            icon={Mountain}
            color="text-primary"
          />
          <KPICard
            title={t('dash.avgNpv')}
            value={portfolioMetrics.averageNpv}
            format={(v: number) => formatMUSD(v)}
            icon={DollarSign}
            color="text-emerald-500"
          />
          <KPICard
            title={t('dash.avgIrr')}
            value={portfolioMetrics.averageIrr}
            format={(v: number) => formatPercent(v)}
            icon={TrendingUp}
            color="text-amber-500"
          />
          <KPICard
            title={t('dash.totalCapex')}
            value={portfolioMetrics.totalCapex}
            format={(v: number) => formatMUSD(v)}
            icon={BarChart3}
            color="text-blue-500"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 mb-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <DemoPortfolio
            economicsById={economicsById}
            selectedIds={selectedSet}
            onToggleSelect={toggleProject}
          />
        )}

        <MiningMarketInsights />

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            {t('dash.yourProjects')}
          </h2>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <PlusCircle className="h-4 w-4" />
            {t('dash.newProject')}
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : userProjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 rounded-xl bg-card border border-border/50"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <Mountain className="h-14 w-14 text-muted-foreground/30 mb-4" />
            <h3 className="font-display text-lg font-semibold mb-2">{t('dash.noProjects')}</h3>
            <p className="text-muted-foreground text-sm mb-4 text-center max-w-md px-4">
              {t('dash.noProjectsDesc')}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={exploreDemo}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t('demo.exploreDemo')}
              </button>
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                <PlusCircle className="h-4 w-4" />
                {t('dash.createProject')}
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userProjects.map((project, i) => (
              <ProjectCard
                key={project?.id ?? i}
                project={project}
                index={i}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                selected={Boolean(project?.id && selectedSet.has(project.id))}
                onToggleSelect={toggleProject}
              />
            ))}
          </div>
        )}
      </main>

      <WelcomeDialog
        open={welcomeOpen}
        onExploreDemo={exploreDemo}
        onCreateProject={createNew}
        onDismiss={dismissWelcome}
      />
    </div>
  );
}
