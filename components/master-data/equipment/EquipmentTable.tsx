'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { EquipmentCatalogItemDto } from '@/lib/master-data';
import { formatEquipmentUsd } from '@/lib/master-data';
import { useLanguage } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { Loader2, Pencil, Trash2, Truck } from 'lucide-react';

interface EquipmentTableProps {
  items: EquipmentCatalogItemDto[];
  loading: boolean;
  categoryLabel: (value: string) => string;
  onEdit: (item: EquipmentCatalogItemDto) => void;
  onDelete: (item: EquipmentCatalogItemDto) => void;
}

export function EquipmentTable({
  items,
  loading,
  categoryLabel,
  onEdit,
  onDelete,
}: EquipmentTableProps) {
  const { t } = useLanguage();

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('equipCat.colManufacturer')}</TableHead>
            <TableHead>{t('equipCat.colModel')}</TableHead>
            <TableHead>{t('equipCat.colCategory')}</TableHead>
            <TableHead>{t('equipCat.colCapacity')}</TableHead>
            <TableHead className="text-right">{t('equipCat.colPrice')}</TableHead>
            <TableHead className="text-right">{t('equipCat.colFuel')}</TableHead>
            <TableHead>{t('equipCat.colStatus')}</TableHead>
            <TableHead className="text-right">{t('equipCat.colActions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                <Loader2 className="inline h-5 w-5 animate-spin mr-2" />
                {t('equipCat.loading')}
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                <Truck className="inline h-5 w-5 mr-2 opacity-40" />
                {t('equipCat.empty')}
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.manufacturer || '—'}</TableCell>
                <TableCell>
                  <div className="font-mono text-sm">{item.model}</div>
                  {item.description ? (
                    <div className="text-[11px] text-muted-foreground line-clamp-1">
                      {item.description}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {categoryLabel(item.category)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.capacityLabel || '—'}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatEquipmentUsd(item.purchasePriceUsd)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {item.fuelConsumptionLph}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
                      item.isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {item.isActive ? t('equipCat.active') : t('equipCat.inactive')}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => onEdit(item)}
                      aria-label={t('equipCat.edit')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete(item)}
                      aria-label={t('equipCat.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
