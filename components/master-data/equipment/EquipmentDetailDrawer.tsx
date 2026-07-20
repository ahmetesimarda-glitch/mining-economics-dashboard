'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { EquipmentCatalogItemDto } from '@/lib/master-data';
import { formatEquipmentUsd, formatSpecNumber } from '@/lib/master-data';
import { useLanguage } from '@/lib/i18n/context';
import { ExternalLink, FolderPlus, Pencil, Truck } from 'lucide-react';

interface EquipmentDetailDrawerProps {
  item: EquipmentCatalogItemDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryLabel: (value: string) => string;
  onEdit: (item: EquipmentCatalogItemDto) => void;
  onAddToProject: (item: EquipmentCatalogItemDto) => void;
}

export function EquipmentDetailDrawer({
  item,
  open,
  onOpenChange,
  categoryLabel,
  onEdit,
  onAddToProject,
}: EquipmentDetailDrawerProps) {
  const { t } = useLanguage();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {item ? (
          <>
            <SheetHeader className="space-y-3 text-left">
              <div className="aspect-[16/9] rounded-lg bg-muted/40 overflow-hidden flex items-center justify-center">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={`${item.manufacturer} ${item.model}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Truck className="h-12 w-12 text-muted-foreground/35" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{item.manufacturer}</p>
                <SheetTitle className="font-mono text-xl">{item.model}</SheetTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary">{categoryLabel(item.category)}</Badge>
                  <Badge variant={item.isActive ? 'default' : 'outline'}>
                    {item.isActive ? t('equipCat.active') : t('equipCat.inactive')}
                  </Badge>
                  {item.country ? <Badge variant="outline">{item.country}</Badge> : null}
                </div>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-5 text-sm">
              {item.description ? (
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              ) : null}

              <SpecSection title={t('equipCat.sectionTechnical')}>
                <SpecRow label={t('equipCat.capacityLabel')} value={item.capacityLabel || '—'} />
                <SpecRow
                  label={t('equipCat.payloadTons')}
                  value={formatSpecNumber(item.payloadTons, { digits: 1, suffix: 't' })}
                />
                <SpecRow
                  label={t('equipCat.bucketCapacityM3')}
                  value={formatSpecNumber(item.bucketCapacityM3, { digits: 1, suffix: 'm³' })}
                />
                <SpecRow
                  label={t('equipCat.enginePowerKw')}
                  value={formatSpecNumber(item.enginePowerKw, { digits: 0, suffix: 'kW' })}
                />
                <SpecRow
                  label={t('equipCat.operatingWeightTons')}
                  value={formatSpecNumber(item.operatingWeightTons, { digits: 1, suffix: 't' })}
                />
                <SpecRow
                  label={t('equipCat.fuelConsumptionLph')}
                  value={formatSpecNumber(item.fuelConsumptionLph, { digits: 1, suffix: 'L/h' })}
                />
                <SpecRow
                  label={t('equipCat.fuelTankCapacityL')}
                  value={formatSpecNumber(item.fuelTankCapacityL, { digits: 0, suffix: 'L' })}
                />
                <SpecRow
                  label={t('equipCat.powerType')}
                  value={t(`equipCat.power.${item.powerType}`)}
                />
              </SpecSection>

              <SpecSection title={t('equipCat.sectionEconomic')}>
                <SpecRow
                  label={t('equipCat.purchasePriceUsd')}
                  value={
                    formatEquipmentUsd(item.purchasePriceUsd) +
                    (item.isPriceEstimated && item.purchasePriceUsd != null
                      ? ` (${t('equipCat.estimated')})`
                      : '')
                  }
                />
                <SpecRow
                  label={t('equipCat.maintenanceCostUsdYear')}
                  value={formatEquipmentUsd(item.maintenanceCostUsdYear)}
                />
                <SpecRow
                  label={t('equipCat.usefulLifeYears')}
                  value={formatSpecNumber(item.usefulLifeYears, { digits: 0 })}
                />
                <SpecRow
                  label={t('equipCat.availabilityPct')}
                  value={formatSpecNumber(item.availabilityPct, { digits: 0, suffix: '%' })}
                />
              </SpecSection>

              <SpecSection title={t('equipCat.sectionMetadata')}>
                {item.oemWebsite ? (
                  <a
                    href={item.oemWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t('equipCat.oemWebsite')}
                  </a>
                ) : (
                  <SpecRow label={t('equipCat.oemWebsite')} value="—" />
                )}
                {item.notes ? (
                  <p className="text-xs text-muted-foreground leading-relaxed pt-2 whitespace-pre-wrap">
                    {item.notes}
                  </p>
                ) : null}
                <p className="text-[10px] text-muted-foreground pt-2">
                  {t('equipCat.lastUpdated')}:{' '}
                  {item.updatedAt
                    ? new Date(item.updatedAt).toLocaleDateString()
                    : '—'}
                </p>
              </SpecSection>
            </div>

            <SheetFooter className="mt-8 flex-col sm:flex-row gap-2 sm:justify-stretch">
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => onEdit(item)}
              >
                <Pencil className="h-4 w-4" />
                {t('equipCat.edit')}
              </Button>
              <Button
                type="button"
                className="flex-1 gap-2"
                onClick={() => onAddToProject(item)}
                disabled={!item.isActive}
              >
                <FolderPlus className="h-4 w-4" />
                {t('equipCat.pickConfirm')}
              </Button>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function SpecSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      <div className="rounded-lg border border-border/50 divide-y divide-border/40">{children}</div>
    </section>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
