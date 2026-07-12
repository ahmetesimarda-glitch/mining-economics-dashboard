'use client';

import { useEffect, useState } from 'react';
import { Header } from './header';
import { ProjectCard } from './project-card';
import { KPICard } from './kpi-card';
import { formatMUSD, formatPercent } from '@/lib/format';
import { Mountain, TrendingUp, DollarSign, BarChart3, PlusCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n/context';

export function DashboardClient() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res?.json();
      setProjects(data ?? []);
    } catch (err: any) {
      console.error('Projeler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = (id: string) => {
    setProjects((prev: any[]) => (prev ?? []).filter((p: any) => p?.id !== id));
  };

  const handleDuplicate = (newProject: any) => {
    if (newProject?.id) setProjects((prev: any[]) => [newProject, ...(prev ?? [])]);
  };

  const totalProjects = projects?.length ?? 0;
  const avgNpv = totalProjects > 0
    ? (projects ?? []).reduce((s: number, p: any) => s + (p?.npv ?? 0), 0) / totalProjects
    : 0;
  const avgIrr = totalProjects > 0
    ? (projects ?? []).reduce((s: number, p: any) => s + (p?.irr ?? 0), 0) / totalProjects
    : 0;
  const totalCapex = (projects ?? []).reduce((s: number, p: any) => s + (p?.totalCapex ?? 0), 0);

  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1200px] px-4 py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold tracking-tight mb-2">
            {t('dash.title')} <span className="text-primary">{t('dash.titleAccent')}</span> {t('dash.titleSuffix')}
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            {t('dash.subtitle')}
          </p>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard title={t('dash.totalProjects')} value={totalProjects} format={(v: number) => Math.round(v).toString()} icon={Mountain} color="text-primary" />
          <KPICard title={t('dash.avgNpv')} value={avgNpv} format={(v: number) => formatMUSD(v)} icon={DollarSign} color="text-emerald-500" />
          <KPICard title={t('dash.avgIrr')} value={avgIrr} format={(v: number) => formatPercent(v)} icon={TrendingUp} color="text-amber-500" />
          <KPICard title={t('dash.totalCapex')} value={totalCapex} format={(v: number) => formatMUSD(v)} icon={BarChart3} color="text-blue-500" />
        </div>

        {/* Projects */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold tracking-tight">{t('dash.projects')}</h2>
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
        ) : totalProjects === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 rounded-xl bg-card border border-border/50"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <Mountain className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="font-display text-lg font-semibold mb-2">{t('dash.noProjects')}</h3>
            <p className="text-muted-foreground text-sm mb-4">{t('dash.noProjectsDesc')}</p>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <PlusCircle className="h-4 w-4" />
              {t('dash.createProject')}
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(projects ?? []).map((project: any, i: number) => (
              <ProjectCard key={project?.id ?? i} project={project} index={i} onDelete={handleDelete} onDuplicate={handleDuplicate} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
