'use client';

import { Mountain, TrendingUp, Clock, DollarSign, Trash2, Edit, Copy, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { formatMUSD, formatPercent, formatYear } from '@/lib/format';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/context';
import { DemoBadge } from '@/components/demo/DemoBadge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  isDemoProjectId,
  setLastOpenedProjectId,
  trackCreatedProjectId,
} from '@/lib/demo';

interface DashboardCardProject {
  id?: string;
  name?: string;
  npv?: number | null;
  irr?: number | null;
  paybackPeriod?: number | null;
  totalCapex?: number | null;
  mineType?: string;
  miningMethod?: string;
  location?: string;
}

interface ProjectCardProps {
  project: DashboardCardProject;
  index: number;
  onDelete?: (id: string) => void;
  onDuplicate?: (project: DashboardCardProject) => void;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export type { DashboardCardProject };

export function ProjectCard({
  project,
  index,
  onDelete,
  onDuplicate,
  selected = false,
  onToggleSelect,
}: ProjectCardProps) {
  const [duplicating, setDuplicating] = useState(false);
  const p = project ?? {};
  const npv = p?.npv ?? 0;
  const irr = p?.irr ?? 0;
  const isPositive = npv >= 0;
  const isDemo = isDemoProjectId(p?.id);
  const { t } = useLanguage();

  const getMineTypeLabel = (v: string) =>
    t(`mine.${v}`) !== `mine.${v}` ? t(`mine.${v}`) : (v ?? t('fmt.unknown'));
  const getMiningMethodLabel = (v: string) =>
    t(`method.${v}`) !== `method.${v}` ? t(`method.${v}`) : (v ?? t('fmt.unknown'));

  const handleDelete = async (e: React.MouseEvent) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (isDemo) {
      toast.error(t('demo.cannotDelete'));
      return;
    }
    if (!confirm(t('card.deleteConfirm'))) return;
    try {
      const res = await fetch(`/api/projects/${p?.id}`, { method: 'DELETE' });
      if (res?.ok) {
        toast.success(t('card.deleted'));
        onDelete?.(p?.id ?? '');
      } else if (res?.status === 403) {
        toast.error(t('demo.cannotDelete'));
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error(t('card.deleteFailed'));
    }
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (duplicating) return;
    setDuplicating(true);
    try {
      const res = await fetch(`/api/projects/${p?.id}/duplicate`, { method: 'POST' });
      if (res?.ok) {
        const newProject = (await res?.json()) as DashboardCardProject;
        if (newProject?.id) trackCreatedProjectId(newProject.id);
        toast.success(t('card.duplicated'));
        onDuplicate?.(newProject);
      } else {
        toast.error(t('card.duplicateFailed'));
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error(t('card.duplicateFailed'));
    } finally {
      setDuplicating(false);
    }
  };

  const handleCardClick = () => {
    if (p?.id) setLastOpenedProjectId(p.id);
    window.location.href = `/projects/${p?.id ?? ''}`;
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e?.stopPropagation?.();
    window.location.href = `/projects/${p?.id}/edit`;
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (p?.id) onToggleSelect?.(p.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index ?? 0) * 0.1, duration: 0.4 }}
    >
      <div
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
        className={cn(
          'group relative overflow-hidden rounded-xl bg-card border border-border/50 p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-xl cursor-pointer',
          selected && 'border-primary/40 ring-1 ring-primary/20'
        )}
        style={{ boxShadow: 'var(--shadow-md)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {onToggleSelect && p?.id ? (
              <div
                className="pt-0.5"
                onClick={handleSelectClick}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => onToggleSelect(p.id!)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={t('dash.selectProject')}
                />
              </div>
            ) : null}
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
              )}
            >
              <Mountain className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-semibold text-base tracking-tight">
                  {p?.name ?? t('card.project')}
                </h3>
                {isDemo ? <DemoBadge /> : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {getMineTypeLabel(p?.mineType ?? '')} • {getMiningMethodLabel(p?.miningMethod ?? '')}
                {p?.location ? ` • ${p.location}` : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handleEditClick}
              aria-label={t('card.edit')}
              title={t('card.edit')}
              className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              <Edit className="h-3.5 w-3.5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={handleDuplicate}
              aria-label={t('card.duplicate')}
              title={t('card.duplicate')}
              className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              {duplicating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden />
              )}
            </button>
            {!isDemo ? (
              <button
                type="button"
                onClick={handleDelete}
                aria-label={t('card.delete')}
                title={t('card.delete')}
                className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" /> NPV
            </div>
            <p
              className={cn(
                'font-mono text-sm font-bold',
                isPositive ? 'text-emerald-500' : 'text-red-500'
              )}
            >
              {formatMUSD(npv)}
            </p>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" /> IRR
            </div>
            <p className="font-mono text-sm font-bold text-amber-500">{formatPercent(irr)}</p>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> {t('card.payback')}
            </div>
            <p className="font-mono text-sm font-bold">{formatYear(p?.paybackPeriod)}</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            CAPEX: {formatMUSD(p?.totalCapex)}
          </span>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
              isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
            )}
          >
            {isPositive ? t('card.feasible') : t('card.notFeasible')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
