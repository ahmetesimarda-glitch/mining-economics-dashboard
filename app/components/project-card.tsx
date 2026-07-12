'use client';

import { Mountain, TrendingUp, Clock, DollarSign, Trash2, Edit, Pickaxe, Copy, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { formatMUSD, formatPercent, formatYear } from '@/lib/format';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/context';

interface ProjectCardProps {
  project: any;
  index: number;
  onDelete?: (id: string) => void;
  onDuplicate?: (project: any) => void;
}

export function ProjectCard({ project, index, onDelete, onDuplicate }: ProjectCardProps) {
  const [duplicating, setDuplicating] = useState(false);
  const p = project ?? {};
  const npv = p?.npv ?? 0;
  const irr = p?.irr ?? 0;
  const isPositive = npv >= 0;
  const { t } = useLanguage();

  const getMineTypeLabel = (v: string) => t(`mine.${v}`) !== `mine.${v}` ? t(`mine.${v}`) : (v ?? t('fmt.unknown'));
  const getMiningMethodLabel = (v: string) => t(`method.${v}`) !== `method.${v}` ? t(`method.${v}`) : (v ?? t('fmt.unknown'));

  const handleDelete = async (e: React.MouseEvent) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!confirm(t('card.deleteConfirm'))) return;
    try {
      const res = await fetch(`/api/projects/${p?.id}`, { method: 'DELETE' });
      if (res?.ok) {
        toast.success(t('card.deleted'));
        onDelete?.(p?.id);
      }
    } catch (err: any) {
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
        const newProject = await res?.json();
        toast.success(t('card.duplicated'));
        onDuplicate?.(newProject);
      } else {
        toast.error(t('card.duplicateFailed'));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(t('card.duplicateFailed'));
    } finally {
      setDuplicating(false);
    }
  };

  const handleCardClick = () => {
    window.location.href = `/projects/${p?.id ?? ''}`;
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e?.stopPropagation?.();
    window.location.href = `/projects/${p?.id}/edit`;
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
        className="group relative overflow-hidden rounded-xl bg-card border border-border/50 p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-xl cursor-pointer"
        style={{ boxShadow: 'var(--shadow-md)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
            )}>
              <Mountain className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base tracking-tight">{p?.name ?? t('card.project')}</h3>
              <p className="text-xs text-muted-foreground">
                {getMineTypeLabel(p?.mineType)} • {getMiningMethodLabel(p?.miningMethod)} {p?.location ? `• ${p.location}` : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEditClick}
              className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleDuplicate}
              title={t('card.duplicate')}
              className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              {duplicating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" /> NPV
            </div>
            <p className={cn('font-mono text-sm font-bold', isPositive ? 'text-emerald-500' : 'text-red-500')}>
              {formatMUSD(npv)}
            </p>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" /> IRR
            </div>
            <p className="font-mono text-sm font-bold text-amber-500">
              {formatPercent(irr)}
            </p>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> {t('card.payback')}
            </div>
            <p className="font-mono text-sm font-bold">
              {formatYear(p?.paybackPeriod)}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">CAPEX: {formatMUSD(p?.totalCapex)}</span>
          <span className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
            isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
          )}>
            {isPositive ? t('card.feasible') : t('card.notFeasible')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
