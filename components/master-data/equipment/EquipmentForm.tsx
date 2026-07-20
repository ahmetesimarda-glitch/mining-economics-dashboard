'use client';

import type { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  EQUIPMENT_CATALOG_CATEGORIES,
  EQUIPMENT_POWER_TYPES,
  type EquipmentCatalogFormState,
} from '@/lib/master-data';
import { useLanguage } from '@/lib/i18n/context';

interface EquipmentFormProps {
  form: EquipmentCatalogFormState;
  onChange: <K extends keyof EquipmentCatalogFormState>(
    key: K,
    value: EquipmentCatalogFormState[K]
  ) => void;
  categoryLabel: (value: string) => string;
}

export function EquipmentForm({ form, onChange, categoryLabel }: EquipmentFormProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-5 py-2">
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('equipCat.sectionGeneral')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t('equipCat.colManufacturer')}>
            <Input
              value={form.manufacturer}
              onChange={(e) => onChange('manufacturer', e.target.value)}
            />
          </Field>
          <Field label={t('equipCat.colModel')} required>
            <Input value={form.model} onChange={(e) => onChange('model', e.target.value)} />
          </Field>
          <Field label={t('equipCat.category')}>
            <Select value={form.category} onValueChange={(v) => onChange('category', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_CATALOG_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {categoryLabel(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t('equipCat.code')}>
            <Input
              value={form.code}
              onChange={(e) => onChange('code', e.target.value)}
              placeholder={t('equipCat.codeHint')}
              className="font-mono text-sm"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label={t('equipCat.description')}>
              <Textarea
                value={form.description}
                onChange={(e) => onChange('description', e.target.value)}
                rows={2}
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('equipCat.sectionTechnical')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t('equipCat.capacityLabel')}>
            <Input
              value={form.capacityLabel}
              onChange={(e) => onChange('capacityLabel', e.target.value)}
            />
          </Field>
          <Field label={t('equipCat.payloadTons')}>
            <Input
              type="number"
              step="any"
              value={form.payloadTons}
              onChange={(e) => onChange('payloadTons', e.target.value)}
            />
          </Field>
          <Field label={t('equipCat.bucketCapacityM3')}>
            <Input
              type="number"
              step="any"
              value={form.bucketCapacityM3}
              onChange={(e) => onChange('bucketCapacityM3', e.target.value)}
            />
          </Field>
          <Field label={t('equipCat.enginePowerKw')}>
            <Input
              type="number"
              step="any"
              value={form.enginePowerKw}
              onChange={(e) => onChange('enginePowerKw', e.target.value)}
            />
          </Field>
          <Field label={t('equipCat.operatingWeightTons')}>
            <Input
              type="number"
              step="any"
              value={form.operatingWeightTons}
              onChange={(e) => onChange('operatingWeightTons', e.target.value)}
            />
          </Field>
          <Field label={t('equipCat.powerType')}>
            <Select value={form.powerType} onValueChange={(v) => onChange('powerType', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_POWER_TYPES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {t(`equipCat.power.${p}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('equipCat.sectionEconomic')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t('equipCat.purchasePriceUsd')}>
            <Input
              type="number"
              step="any"
              value={form.purchasePriceUsd}
              onChange={(e) => onChange('purchasePriceUsd', e.target.value)}
            />
          </Field>
          <Field label={t('equipCat.fuelConsumptionLph')}>
            <Input
              type="number"
              step="any"
              value={form.fuelConsumptionLph}
              onChange={(e) => onChange('fuelConsumptionLph', e.target.value)}
            />
          </Field>
          <Field label={t('equipCat.usefulLifeYears')}>
            <Input
              type="number"
              step="any"
              value={form.usefulLifeYears}
              onChange={(e) => onChange('usefulLifeYears', e.target.value)}
            />
          </Field>
          <Field label={t('equipCat.availabilityPct')}>
            <Input
              type="number"
              step="any"
              value={form.availabilityPct}
              onChange={(e) => onChange('availabilityPct', e.target.value)}
            />
          </Field>
          <Field label={t('equipCat.maintenanceCostUsdYear')}>
            <Input
              type="number"
              step="any"
              value={form.maintenanceCostUsdYear}
              onChange={(e) => onChange('maintenanceCostUsdYear', e.target.value)}
            />
          </Field>
          <Field label={t('equipCat.status')}>
            <Select
              value={form.isActive ? 'true' : 'false'}
              onValueChange={(v) => onChange('isActive', v === 'true')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">{t('equipCat.active')}</SelectItem>
                <SelectItem value="false">{t('equipCat.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">
        {label}
        {required ? <span className="text-destructive ml-0.5">*</span> : null}
      </Label>
      {children}
    </div>
  );
}
