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
  EQUIPMENT_OEM_MANUFACTURERS,
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
      <Section title={t('equipCat.sectionGeneral')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t('equipCat.colManufacturer')}>
            <Input
              list="equipment-oem-list"
              value={form.manufacturer}
              onChange={(e) => onChange('manufacturer', e.target.value)}
              placeholder={EQUIPMENT_OEM_MANUFACTURERS[0]}
            />
            <datalist id="equipment-oem-list">
              {EQUIPMENT_OEM_MANUFACTURERS.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
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
            <Field label={t('equipCat.imageUrl')}>
              <Input
                value={form.imageUrl}
                onChange={(e) => onChange('imageUrl', e.target.value)}
                placeholder="https://"
              />
            </Field>
          </div>
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
      </Section>

      <Section title={t('equipCat.sectionTechnical')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t('equipCat.capacityLabel')}>
            <Input
              value={form.capacityLabel}
              onChange={(e) => onChange('capacityLabel', e.target.value)}
            />
          </Field>
          <NumField
            label={t('equipCat.payloadTons')}
            value={form.payloadTons}
            onChange={(v) => onChange('payloadTons', v)}
          />
          <NumField
            label={t('equipCat.bucketCapacityM3')}
            value={form.bucketCapacityM3}
            onChange={(v) => onChange('bucketCapacityM3', v)}
          />
          <NumField
            label={t('equipCat.enginePowerKw')}
            value={form.enginePowerKw}
            onChange={(v) => onChange('enginePowerKw', v)}
          />
          <NumField
            label={t('equipCat.operatingWeightTons')}
            value={form.operatingWeightTons}
            onChange={(v) => onChange('operatingWeightTons', v)}
          />
          <NumField
            label={t('equipCat.fuelConsumptionLph')}
            value={form.fuelConsumptionLph}
            onChange={(v) => onChange('fuelConsumptionLph', v)}
          />
          <NumField
            label={t('equipCat.fuelTankCapacityL')}
            value={form.fuelTankCapacityL}
            onChange={(v) => onChange('fuelTankCapacityL', v)}
          />
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
      </Section>

      <Section title={t('equipCat.sectionEconomic')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NumField
            label={t('equipCat.purchasePriceUsd')}
            value={form.purchasePriceUsd}
            onChange={(v) => onChange('purchasePriceUsd', v)}
          />
          <NumField
            label={t('equipCat.maintenanceCostUsdYear')}
            value={form.maintenanceCostUsdYear}
            onChange={(v) => onChange('maintenanceCostUsdYear', v)}
          />
          <NumField
            label={t('equipCat.usefulLifeYears')}
            value={form.usefulLifeYears}
            onChange={(v) => onChange('usefulLifeYears', v)}
          />
          <NumField
            label={t('equipCat.availabilityPct')}
            value={form.availabilityPct}
            onChange={(v) => onChange('availabilityPct', v)}
          />
          <Field label={t('equipCat.isPriceEstimated')}>
            <Select
              value={form.isPriceEstimated ? 'true' : 'false'}
              onValueChange={(v) => onChange('isPriceEstimated', v === 'true')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">{t('equipCat.estimated')}</SelectItem>
                <SelectItem value="false">{t('equipCat.confirmed')}</SelectItem>
              </SelectContent>
            </Select>
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
      </Section>

      <Section title={t('equipCat.sectionMetadata')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t('equipCat.oemWebsite')}>
            <Input
              value={form.oemWebsite}
              onChange={(e) => onChange('oemWebsite', e.target.value)}
              placeholder="https://"
            />
          </Field>
          <Field label={t('equipCat.country')}>
            <Input value={form.country} onChange={(e) => onChange('country', e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label={t('equipCat.searchAliases')}>
              <Input
                value={form.searchAliases}
                onChange={(e) => onChange('searchAliases', e.target.value)}
                placeholder={t('equipCat.searchAliasesHint')}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label={t('equipCat.notes')}>
              <Textarea
                value={form.notes}
                onChange={(e) => onChange('notes', e.target.value)}
                rows={2}
              />
            </Field>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
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

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <Input type="number" step="any" value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}
