'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { EquipmentCatalogItemDto } from '@/lib/master-data';
import { useLanguage } from '@/lib/i18n/context';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProjectListItem {
  id: string;
  name: string;
  location?: string | null;
  mineType?: string | null;
}

interface EquipmentAddToProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: EquipmentCatalogItemDto | null;
}

/**
 * Snapshot workflow entry point:
 * Catalog → pick project → open project editor with ?addFromCatalog=<id>
 * The project form copies values into project equipment (no catalog FK).
 */
export function EquipmentAddToProjectDialog({
  open,
  onOpenChange,
  item,
}: EquipmentAddToProjectDialogProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) {
        toast.error(t('equipCat.projectsLoadError'));
        return;
      }
      const data = (await res.json()) as ProjectListItem[] | { error?: string };
      setProjects(Array.isArray(data) ? data : []);
    } catch {
      toast.error(t('equipCat.projectsLoadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (open) {
      setSelectedId(null);
      void loadProjects();
    }
  }, [open, loadProjects]);

  const confirm = () => {
    if (!item || !selectedId) return;
    onOpenChange(false);
    router.push(`/projects/${selectedId}/edit?addFromCatalog=${encodeURIComponent(item.id)}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('equipCat.addToProjectTitle')}</DialogTitle>
        </DialogHeader>
        {item ? (
          <p className="text-sm text-muted-foreground mb-3">
            <span className="font-medium text-foreground">
              {[item.manufacturer, item.model].filter(Boolean).join(' ')}
            </span>
            {' — '}
            {t('equipCat.addToProjectHint')}
          </p>
        ) : null}

        <div className="flex-1 overflow-y-auto space-y-1 min-h-[180px] max-h-[45vh] pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {t('equipCat.loading')}
            </div>
          ) : projects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              {t('equipCat.noProjects')}
            </p>
          ) : (
            projects.map((project) => {
              const selected = selectedId === project.id;
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedId(project.id)}
                  className={cn(
                    'w-full text-left rounded-lg border px-3 py-2.5 transition-colors',
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border/50 hover:bg-accent/50'
                  )}
                >
                  <p className="text-sm font-medium">{project.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {[project.mineType, project.location].filter(Boolean).join(' · ') || '—'}
                  </p>
                </button>
              );
            })
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('equipCat.cancel')}
          </Button>
          <Button type="button" disabled={!selectedId || !item} onClick={confirm}>
            {t('equipCat.pickConfirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
