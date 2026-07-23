'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Header } from '@/app/components/header';
import { useLanguage } from '@/lib/i18n/context';
import type { CountryCatalogItemDto, CountryCatalogListResult } from '@/lib/master-data';
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
import { Globe2, Plus, RefreshCw, Search } from 'lucide-react';

type FormState = {
  code: string;
  name: string;
  nameTr: string;
  currencyCode: string;
  corporateTaxPct: string;
  royaltyPct: string;
  inflationPct: string;
  discountRateRecommendation: string;
  dieselPriceUsdPerLiter: string;
  electricityCostUsdPerKwh: string;
  waterCostUsdPerM3: string;
  laborCostIndex: string;
  exchangeRateToUsd: string;
  environmentalCostIndex: string;
  infrastructureRating: string;
  miningInvestmentRisk: string;
  esgDifficulty: string;
  typicalPermittingYears: string;
  typicalRehabilitationCostUsdPerHa: string;
  politicalRisk: string;
  notes: string;
  searchAliases: string;
  isActive: boolean;
  sortOrder: string;
};

const EMPTY_FORM: FormState = {
  code: '',
  name: '',
  nameTr: '',
  currencyCode: 'USD',
  corporateTaxPct: '',
  royaltyPct: '',
  inflationPct: '',
  discountRateRecommendation: '',
  dieselPriceUsdPerLiter: '',
  electricityCostUsdPerKwh: '',
  waterCostUsdPerM3: '',
  laborCostIndex: '',
  exchangeRateToUsd: '',
  environmentalCostIndex: '',
  infrastructureRating: '',
  miningInvestmentRisk: 'medium',
  esgDifficulty: 'medium',
  typicalPermittingYears: '',
  typicalRehabilitationCostUsdPerHa: '',
  politicalRisk: 'medium',
  notes: '',
  searchAliases: '',
  isActive: true,
  sortOrder: '0',
};

function itemToForm(item: CountryCatalogItemDto): FormState {
  return {
    code: item.code,
    name: item.name,
    nameTr: item.nameTr,
    currencyCode: item.currencyCode,
    corporateTaxPct: item.corporateTaxPct?.toString() ?? '',
    royaltyPct: item.royaltyPct?.toString() ?? '',
    inflationPct: item.inflationPct?.toString() ?? '',
    discountRateRecommendation: item.discountRateRecommendation?.toString() ?? '',
    dieselPriceUsdPerLiter: item.dieselPriceUsdPerLiter?.toString() ?? '',
    electricityCostUsdPerKwh: item.electricityCostUsdPerKwh?.toString() ?? '',
    waterCostUsdPerM3: item.waterCostUsdPerM3?.toString() ?? '',
    laborCostIndex: item.laborCostIndex?.toString() ?? '',
    exchangeRateToUsd: item.exchangeRateToUsd?.toString() ?? '',
    environmentalCostIndex: item.environmentalCostIndex?.toString() ?? '',
    infrastructureRating: item.infrastructureRating?.toString() ?? '',
    miningInvestmentRisk: item.miningInvestmentRisk,
    esgDifficulty: item.esgDifficulty,
    typicalPermittingYears: item.typicalPermittingYears?.toString() ?? '',
    typicalRehabilitationCostUsdPerHa:
      item.typicalRehabilitationCostUsdPerHa?.toString() ?? '',
    politicalRisk: item.politicalRisk,
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
    currencyCode: form.currencyCode,
    corporateTaxPct: n(form.corporateTaxPct),
    royaltyPct: n(form.royaltyPct),
    inflationPct: n(form.inflationPct),
    discountRateRecommendation: n(form.discountRateRecommendation),
    dieselPriceUsdPerLiter: n(form.dieselPriceUsdPerLiter),
    electricityCostUsdPerKwh: n(form.electricityCostUsdPerKwh),
    waterCostUsdPerM3: n(form.waterCostUsdPerM3),
    laborCostIndex: n(form.laborCostIndex),
    exchangeRateToUsd: n(form.exchangeRateToUsd),
    environmentalCostIndex: n(form.environmentalCostIndex),
    infrastructureRating: n(form.infrastructureRating),
    miningInvestmentRisk: form.miningInvestmentRisk,
    esgDifficulty: form.esgDifficulty,
    typicalPermittingYears: n(form.typicalPermittingYears),
    typicalRehabilitationCostUsdPerHa: n(form.typicalRehabilitationCostUsdPerHa),
    politicalRisk: form.politicalRisk,
    notes: form.notes,
    searchAliases: form.searchAliases,
    isActive: form.isActive,
    sortOrder: n(form.sortOrder) ?? 0,
  };
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function CountryCatalogClient() {
  const { t, locale } = useLanguage();
  const [items, setItems] = useState<CountryCatalogItemDto[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CountryCatalogItemDto | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetch('/api/master-data/country/ensure');
      } catch {
        // ignore
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
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (q) params.set('q', q);
      const res = await fetch(`/api/master-data/country?${params}`);
      if (!res.ok) throw new Error('load failed');
      const data = (await res.json()) as CountryCatalogListResult;
      setItems(data.items);
      setTotal(data.total);
    } catch {
      toast.error(t('ctryCat.loadError'));
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

  const openEdit = (item: CountryCatalogItemDto) => {
    setEditing(item);
    setForm(itemToForm(item));
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      toast.error(t('ctryCat.nameRequired'));
      return;
    }
    setSaving(true);
    try {
      const payload = formToPayload(form);
      const res = await fetch(
        editing ? `/api/master-data/country/${editing.id}` : '/api/master-data/country',
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
      toast.success(editing ? t('ctryCat.updated') : t('ctryCat.created'));
      setDialogOpen(false);
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t('ctryCat.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const displayName = (item: CountryCatalogItemDto) =>
    locale === 'tr' && item.nameTr ? item.nameTr : item.name;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1200px] px-4 py-8 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t('ctryCat.breadcrumb')}</p>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {t('ctryCat.title')}{' '}
              <span className="text-primary">{t('ctryCat.titleAccent')}</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t('ctryCat.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="h-4 w-4 mr-1" /> {t('ctryCat.refresh')}
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" /> {t('ctryCat.add')}
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
              placeholder={t('ctryCat.searchPlaceholder')}
            />
          </div>
          <Button variant="secondary" onClick={() => setQ(searchInput.trim())}>
            {t('ctryCat.search')}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {t('ctryCat.resultCount').replace('{count}', String(total))}
        </p>

        <div className="overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5 font-medium">{t('ctryCat.colCountry')}</th>
                <th className="px-3 py-2.5 font-medium">{t('ctryCat.colCurrency')}</th>
                <th className="px-3 py-2.5 font-medium">{t('ctryCat.colTax')}</th>
                <th className="px-3 py-2.5 font-medium">{t('ctryCat.colRoyalty')}</th>
                <th className="px-3 py-2.5 font-medium">{t('ctryCat.colDiscount')}</th>
                <th className="px-3 py-2.5 font-medium">{t('ctryCat.colRisk')}</th>
                <th className="px-3 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                    {t('ctryCat.loading')}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                    {t('ctryCat.empty')}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-t border-border/50 hover:bg-accent/30">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Globe2 className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <p className="font-medium">{displayName(item)}</p>
                          <p className="text-[11px] text-muted-foreground">{item.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs">{item.currencyCode}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">
                      {item.corporateTaxPct != null ? `%${item.corporateTaxPct}` : '—'}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs">
                      {item.royaltyPct != null ? `%${item.royaltyPct}` : '—'}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs">
                      {item.discountRateRecommendation != null
                        ? `%${item.discountRateRecommendation}`
                        : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {item.miningInvestmentRisk}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                        {t('ctryCat.edit')}
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
              {editing ? t('ctryCat.editTitle') : t('ctryCat.addTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label={t('ctryCat.fieldCode')}>
              <Input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                disabled={Boolean(editing)}
              />
            </Field>
            <Field label={t('ctryCat.fieldName')}>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </Field>
            <Field label={t('ctryCat.fieldNameTr')}>
              <Input
                value={form.nameTr}
                onChange={(e) => setForm((f) => ({ ...f, nameTr: e.target.value }))}
              />
            </Field>
            <Field label={t('ctryCat.fieldCurrency')}>
              <Input
                value={form.currencyCode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currencyCode: e.target.value.toUpperCase() }))
                }
              />
            </Field>
            <Field label={t('ctryCat.fieldTax')}>
              <Input
                value={form.corporateTaxPct}
                onChange={(e) => setForm((f) => ({ ...f, corporateTaxPct: e.target.value }))}
              />
            </Field>
            <Field label={t('ctryCat.fieldRoyalty')}>
              <Input
                value={form.royaltyPct}
                onChange={(e) => setForm((f) => ({ ...f, royaltyPct: e.target.value }))}
              />
            </Field>
            <Field label={t('ctryCat.fieldDiscount')}>
              <Input
                value={form.discountRateRecommendation}
                onChange={(e) =>
                  setForm((f) => ({ ...f, discountRateRecommendation: e.target.value }))
                }
              />
            </Field>
            <Field label={t('ctryCat.fieldInflation')}>
              <Input
                value={form.inflationPct}
                onChange={(e) => setForm((f) => ({ ...f, inflationPct: e.target.value }))}
              />
            </Field>
            <Field label={t('ctryCat.fieldDiesel')}>
              <Input
                value={form.dieselPriceUsdPerLiter}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dieselPriceUsdPerLiter: e.target.value }))
                }
              />
            </Field>
            <Field label={t('ctryCat.fieldElectricity')}>
              <Input
                value={form.electricityCostUsdPerKwh}
                onChange={(e) =>
                  setForm((f) => ({ ...f, electricityCostUsdPerKwh: e.target.value }))
                }
              />
            </Field>
            <Field label={t('ctryCat.fieldFx')}>
              <Input
                value={form.exchangeRateToUsd}
                onChange={(e) => setForm((f) => ({ ...f, exchangeRateToUsd: e.target.value }))}
              />
            </Field>
            <Field label={t('ctryCat.fieldRehab')}>
              <Input
                value={form.typicalRehabilitationCostUsdPerHa}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    typicalRehabilitationCostUsdPerHa: e.target.value,
                  }))
                }
              />
            </Field>
            <Field label={t('ctryCat.fieldPermit')}>
              <Input
                value={form.typicalPermittingYears}
                onChange={(e) =>
                  setForm((f) => ({ ...f, typicalPermittingYears: e.target.value }))
                }
              />
            </Field>
            <Field label={t('ctryCat.fieldInvestRisk')}>
              <Input
                value={form.miningInvestmentRisk}
                onChange={(e) =>
                  setForm((f) => ({ ...f, miningInvestmentRisk: e.target.value }))
                }
              />
            </Field>
            <Field label={t('ctryCat.fieldPolitical')}>
              <Input
                value={form.politicalRisk}
                onChange={(e) => setForm((f) => ({ ...f, politicalRisk: e.target.value }))}
              />
            </Field>
            <div className="md:col-span-3">
              <Field label={t('ctryCat.fieldNotes')}>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </Field>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('ctryCat.cancel')}
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? t('ctryCat.saving') : t('ctryCat.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
