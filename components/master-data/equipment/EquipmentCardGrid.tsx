'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { EquipmentCatalogItemDto } from '@/lib/master-data';
import { formatEquipmentUsd } from '@/lib/master-data';
import { useLanguage } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { Loader2, Pencil, Trash2, Truck } from 'lucide-react';

interface EquipmentCardGridProps {
  items: EquipmentCatalogItemDto[];
  loading: boolean;
  categoryLabel: (value: string) => string;
  onSelect: (item: EquipmentCatalogItemDto) => void;
  onEdit: (item: EquipmentCatalogItemDto) => void;
  onDelete: (item: EquipmentCatalogItemDto) => void;
}

export function EquipmentCardGrid({
  items,
  loading,
  categoryLabel,
  onSelect,
  onEdit,
  onDelete,
}: EquipmentCardGridProps) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        {t('equipCat.loading')}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Truck className="h-5 w-5 mr-2 opacity-40" />
        {t('equipCat.empty')}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item)}
          className="text-left rounded-xl border border-border/50 bg-background/60 hover:border-primary/40 hover:bg-accent/30 transition-colors overflow-hidden"
        >
          <div className="aspect-[16/9] bg-muted/40 flex items-center justify-center overflow-hidden">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageUrl}
                alt={`${item.manufacturer} ${item.model}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <Truck className="h-10 w-10 text-muted-foreground/40" />
            )}
          </div>
          <div className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">{item.manufacturer || '—'}</p>
                <p className="font-mono text-sm font-medium">{item.model}</p>
              </div>
              <span
                className={cn(
                  'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0',
                  item.isActive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {item.isActive ? t('equipCat.active') : t('equipCat.inactive')}
              </span>
            </div>
            <Badge variant="secondary" className="font-normal">
              {categoryLabel(item.category)}
            </Badge>
            <p className="text-[11px] text-muted-foreground line-clamp-2 min-h-[2rem]">
              {item.description || item.capacityLabel || '—'}
            </p>
            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="font-mono text-sm">
                {formatEquipmentUsd(item.purchasePriceUsd)}
                {item.isPriceEstimated && item.purchasePriceUsd != null ? (
                  <span className="ml-1 text-[10px] text-muted-foreground font-sans">
                    ≈
                  </span>
                ) : null}
              </p>
              <div className="inline-flex gap-0.5" onClick={(e) => e.stopPropagation()}>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => onEdit(item)}
                  aria-label={t('equipCat.edit')}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onDelete(item)}
                  aria-label={t('equipCat.delete')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
