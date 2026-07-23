'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Header } from '@/app/components/header';
import { useLanguage } from '@/lib/i18n/context';
import type { CommodityCatalogItemDto, CommodityCatalogListResult } from '@/lib/master-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Gem, Plus, RefreshCw, Search } from 'lucide-react';

type FormState = {
  code: string;
  name: string;
  nameTr: string;
  symbol: string;
  unit: string;
  typicalSellingUnit: string;
  typicalPriceUsd: string;
  gradeMin: string;
  gradeMax: string;
  gradeUnit: string;
  recoveryMinPct: string;
  recoveryMaxPct: string;
  densityTPerM3: string;
  typicalProcessingMethod: string;
  typicalMiningMethods: string;
  typicalMineLifeYears: string;
  refiningCostUsdPerT: string;
  smeltingCostUsdPerT: string;
  payabilityPct: string;
  transportationCostUsdPerT: string;
  royaltyDefaultPct: string;
  environmentalRisk: string;
  colorHex: string;
  iconKey: string;
  notes: string;
  searchAliases: string;
  isActive: boolean;
  sortOrder: string;
};

const EMPTY_FORM: FormState = {
  code: '',
  name: '',
  nameTr: '',
  symbol: '',
  unit: 't',
  typicalSellingUnit: 'USD/t',
  typicalPriceUsd: '',
  gradeMin: '',
  gradeMax: '',
  gradeUnit: '%',
  recoveryMinPct: '',
  recoveryMaxPct: '',
  densityTPerM3: '',
  typicalProcessingMethod: '',
  typicalMiningMethods: 'openPit',
  typicalMineLifeYears: '',
  refiningCostUsdPerT: '',
  smeltingCostUsdPerT: '',
  payabilityPct: '',
  transportationCostUsdPerT: '',
  royaltyDefaultPct: '',
  environmentalRisk: 'medium',
  colorHex: '#64748b',
  iconKey: 'gem',
  notes: '',
  searchAliases: '',
  isActive: true,
  sortOrder: '0',
};

function itemToForm(item: CommodityCatalogItemDto): FormState {
  return {
    code: item.code,
    name: item.name,
    nameTr: item.nameTr,
    symbol: item.symbol,
    unit: item.unit,
    typicalSellingUnit: item.typicalSellingUnit,
    typicalPriceUsd: item.typicalPriceUsd?.toString() ?? '',
    gradeMin: item.gradeMin?.toString() ?? '',
    gradeMax: item.gradeMax?.toString() ?? '',
    gradeUnit: item.gradeUnit,
    recoveryMinPct: item.recoveryMinPct?.toString() ?? '',
    recoveryMaxPct: item.recoveryMaxPct?.toString() ?? '',
    densityTPerM3: item.densityTPerM3?.toString() ?? '',
    typicalProcessingMethod: item.typicalProcessingMethod,
    typicalMiningMethods: item.typicalMiningMethods,
    typicalMineLifeYears: item.typicalMineLifeYears?.toString() ?? '',
    refiningCostUsdPerT: item.refiningCostUsdPerT?.toString() ?? '',
    smeltingCostUsdPerT: item.smeltingCostUsdPerT?.toString() ?? '',
    payabilityPct: item.payabilityPct?.toString() ?? '',
    transportationCostUsdPerT: item.transportationCostUsdPerT?.toString() ?? '',
    royaltyDefaultPct: item.royaltyDefaultPct?.toString() ?? '',
    environmentalRisk: item.environmentalRisk,
    colorHex: item.colorHex,
    iconKey: item.iconKey,
    notes: item.notes,
    searchAliases: item.searchAliases,
    isActive: item.isActive,
    sortOrder: String(item.sortOrder ?? 0),
  };
}

function formToPayload(form: FormState) {
  const n = (v: string) => (v.trim() === '' ? null : Number(v));
  return {
    code: form.code,
    name: form.name,
    nameTr: form.nameTr,
    symbol: form.symbol,
    unit: form.unit,
    typicalSellingUnit: form.typicalSellingUnit,
    typicalPriceUsd: n(form.typicalPriceUsd),
    gradeMin: n(form.gradeMin),
    gradeMax: n(form.gradeMax),
    gradeUnit: form.gradeUnit,
    recoveryMinPct: n(form.recoveryMinPct),
    recoveryMaxPct: n(form.recoveryMaxPct),
    densityTPerM3: n(form.densityTPerM3),
    typicalProcessingMethod: form.typicalProcessingMethod,
    typicalMiningMethods: form.typicalMiningMethods,
    typicalMineLifeYears: n(form.typicalMineLifeYears),
    refiningCostUsdPerT: n(form.refiningCostUsdPerT),
    smeltingCostUsdPerT: n(form.smeltingCostUsdPerT),
    payabilityPct: n(form.payabilityPct),
    transportationCostUsdPerT: n(form.transportationCostUsdPerT),
    royaltyDefaultPct: n(form.royaltyDefaultPct),
    environmentalRisk: form.environmentalRisk,
    colorHex: form.colorHex,
    iconKey: form.iconKey,
    notes: form.notes,
    searchAliases: form.searchAliases,
    isActive: form.isActive,
    sortOrder: n(form.sortOrder) ?? 0,
  };
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function CommodityCatalogClient() {
  const { t, locale } = useLanguage();
  const [items, setItems] = useState<CommodityCatalogItemDto[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CommodityCatalogItemDto | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetch('/api/master-data/commodity/ensure');
      } catch {
        // listing may still succeed
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '100',
        isActive: 'all',
      });
      if (q) params.set('q', q);
      // isActive=all means no filter — remove invalid value
      params.delete('isActive');
      const res = await fetch(`/api/master-data/commodity?${params}`);
      if (!res.ok) throw new Error('load failed');
      const data = (await res.json()) as CommodityCatalogListResult;
      setItems(data.items);
      setTotal(data.total);
    } catch {
      toast.error(t('cmdtyCat.loadError'));
    } finally {
      setLoading(false);
    }
  }, [q, ready, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item: CommodityCatalogItemDto) => {
    setEditing(item);
    setForm(itemToForm(item));
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error(t('cmdtyCat.nameRequired'));
      return;
    }
    setSaving(true);
    try {
      const payload = formToPayload(form);
      const res = await fetch(
        editing ? `/api/master-data/commodity/${editing.id}` : '/api/master-data/commodity',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? 'save failed');
      }
      toast.success(editing ? t('cmdtyCat.updated') : t('cmdtyCat.created'));
      setDialogOpen(false);
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t('cmdtyCat.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const displayName = (item: CommodityCatalogItemDto) =>
    locale === 'tr' && item.nameTr ? item.nameTr : item.name;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1200px] px-4 py-8 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t('cmdtyCat.breadcrumb')}</p>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {t('cmdtyCat.title')}{' '}
              <span className="text-primary">{t('cmdtyCat.titleAccent')}</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t('cmdtyCat.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="h-4 w-4 mr-1" /> {t('cmdtyCat.refresh')}
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" /> {t('cmdtyCat.add')}
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setQ(searchInput.trim());
              }}
              placeholder={t('cmdtyCat.searchPlaceholder')}
            />
          </div>
          <Button variant="secondary" onClick={() => setQ(searchInput.trim())}>
            {t('cmdtyCat.search')}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {t('cmdtyCat.resultCount').replace('{count}', String(total))}
        </p>

        <div className="overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5 font-medium">{t('cmdtyCat.colCommodity')}</th>
                <th className="px-3 py-2.5 font-medium">{t('cmdtyCat.colSymbol')}</th>
                <th className="px-3 py-2.5 font-medium">{t('cmdtyCat.colPrice')}</th>
                <th className="px-3 py-2.5 font-medium">{t('cmdtyCat.colGrade')}</th>
                <th className="px-3 py-2.5 font-medium">{t('cmdtyCat.colLife')}</th>
                <th className="px-3 py-2.5 font-medium">{t('cmdtyCat.colRisk')}</th>
                <th className="px-3 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                    {t('cmdtyCat.loading')}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                    {t('cmdtyCat.empty')}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-t border-border/50 hover:bg-accent/30">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md"
                          style={{ backgroundColor: `${item.colorHex}33` }}
                        >
                          <Gem className="h-3.5 w-3.5" style={{ color: item.colorHex }} />
                        </span>
                        <div>
                          <p className="font-medium">{displayName(item)}</p>
                          <p className="text-[11px] text-muted-foreground">{item.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs">{item.symbol}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">
                      {item.typicalPriceUsd != null
                        ? `${item.typicalPriceUsd.toLocaleString()} ${item.typicalSellingUnit}`
                        : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      {item.gradeMin != null && item.gradeMax != null
                        ? `${item.gradeMin}–${item.gradeMax} ${item.gradeUnit}`
                        : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      {item.typicalMineLifeYears != null
                        ? `${item.typicalMineLifeYears} ${t('cmdtyCat.years')}`
                        : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {item.environmentalRisk}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                        {t('cmdtyCat.edit')}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t('cmdtyCat.editTitle') : t('cmdtyCat.addTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label={t('cmdtyCat.fieldCode')}>
              <Input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                disabled={Boolean(editing)}
              />
            </Field>
            <Field label={t('cmdtyCat.fieldName')}>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </Field>
            <Field label={t('cmdtyCat.fieldNameTr')}>
              <Input
                value={form.nameTr}
                onChange={(e) => setForm((f) => ({ ...f, nameTr: e.target.value }))}
              />
            </Field>
            <Field label={t('cmdtyCat.fieldSymbol')}>
              <Input
                value={form.symbol}
                onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
              />
            </Field>
            <Field label={t('cmdtyCat.fieldPrice')}>
              <Input
                value={form.typicalPriceUsd}
                onChange={(e) => setForm((f) => ({ ...f, typicalPriceUsd: e.target.value }))}
              />
            </Field>
            <Field label={t('cmdtyCat.fieldSellingUnit')}>
              <Input
                value={form.typicalSellingUnit}
                onChange={(e) => setForm((f) => ({ ...f, typicalSellingUnit: e.target.value }))}
              />
            </Field>
            <Field label={t('cmdtyCat.fieldGradeMin')}>
              <Input
                value={form.gradeMin}
                onChange={(e) => setForm((f) => ({ ...f, gradeMin: e.target.value }))}
              />
            </Field>
            <Field label={t('cmdtyCat.fieldGradeMax')}>
              <Input
                value={form.gradeMax}
                onChange={(e) => setForm((f) => ({ ...f, gradeMax: e.target.value }))}
              />
            </Field>
            <Field label={t('cmdtyCat.fieldGradeUnit')}>
              <Input
                value={form.gradeUnit}
                onChange={(e) => setForm((f) => ({ ...f, gradeUnit: e.target.value }))}
              />
            </Field>
            <Field label={t('cmdtyCat.fieldRecoveryMin')}>
              <Input
                value={form.recoveryMinPct}
                onChange={(e) => setForm((f) => ({ ...f, recoveryMinPct: e.target.value }))}
              />
            </Field>
            <Field label={t('cmdtyCat.fieldRecoveryMax')}>
              <Input
                value={form.recoveryMaxPct}
                onChange={(e) => setForm((f) => ({ ...f, recoveryMaxPct: e.target.value }))}
              />
            </Field>
            <Field label={t('cmdtyCat.fieldMineLife')}>
              <Input
                value={form.typicalMineLifeYears}
                onChange={(e) => setForm((f) => ({ ...f, typicalMineLifeYears: e.target.value }))}
              />
            </Field>
            <Field label={t('cmdtyCat.fieldRoyalty')}>
              <Input
                value={form.royaltyDefaultPct}
                onChange={(e) => setForm((f) => ({ ...f, royaltyDefaultPct: e.target.value }))}
              />
            </Field>
            <Field label={t('cmdtyCat.fieldMethods')}>
              <Input
                value={form.typicalMiningMethods}
                onChange={(e) => setForm((f) => ({ ...f, typicalMiningMethods: e.target.value }))}
              />
            </Field>
            <Field label={t('cmdtyCat.fieldColor')}>
              <Input
                value={form.colorHex}
                onChange={(e) => setForm((f) => ({ ...f, colorHex: e.target.value }))}
              />
            </Field>
            <div className="md:col-span-3">
              <Field label={t('cmdtyCat.fieldProcessing')}>
                <Input
                  value={form.typicalProcessingMethod}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, typicalProcessingMethod: e.target.value }))
                  }
                />
              </Field>
            </div>
            <div className="md:col-span-3">
              <Field label={t('cmdtyCat.fieldNotes')}>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </Field>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('cmdtyCat.cancel')}
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? t('cmdtyCat.saving') : t('cmdtyCat.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
