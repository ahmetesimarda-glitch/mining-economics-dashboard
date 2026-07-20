'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Header } from '@/app/components/header';
import { useLanguage } from '@/lib/i18n/context';
import { EQUIPMENT_CATALOG_CATEGORIES, EQUIPMENT_POWER_TYPES } from '@/lib/master-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Search,
  Truck,
  ChevronLeft,
  ChevronRight,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EquipmentCatalogItem {
  id: string;
  code: string;
  manufacturer: string;
  model: string;
  category: string;
  description: string;
  capacityLabel: string;
  payloadTons: number;
  bucketCapacityM3: number;
  enginePowerKw: number;
  operatingWeightTons: number;
  purchasePriceUsd: number;
  fuelConsumptionLph: number;
  usefulLifeYears: number;
  availabilityPct: number;
  maintenanceCostUsdYear: number;
  powerType: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface ListResponse {
  items: EquipmentCatalogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type FormState = {
  code: string;
  manufacturer: string;
  model: string;
  category: string;
  description: string;
  capacityLabel: string;
  payloadTons: string;
  bucketCapacityM3: string;
  enginePowerKw: string;
  operatingWeightTons: string;
  purchasePriceUsd: string;
  fuelConsumptionLph: string;
  usefulLifeYears: string;
  availabilityPct: string;
  maintenanceCostUsdYear: string;
  powerType: string;
  isActive: boolean;
  sortOrder: string;
};

const EMPTY_FORM: FormState = {
  code: '',
  manufacturer: '',
  model: '',
  category: 'truck',
  description: '',
  capacityLabel: '',
  payloadTons: '',
  bucketCapacityM3: '',
  enginePowerKw: '',
  operatingWeightTons: '',
  purchasePriceUsd: '',
  fuelConsumptionLph: '',
  usefulLifeYears: '10',
  availabilityPct: '85',
  maintenanceCostUsdYear: '',
  powerType: 'diesel',
  isActive: true,
  sortOrder: '0',
};

function itemToForm(item: EquipmentCatalogItem): FormState {
  return {
    code: item.code,
    manufacturer: item.manufacturer,
    model: item.model,
    category: item.category,
    description: item.description,
    capacityLabel: item.capacityLabel,
    payloadTons: String(item.payloadTons ?? ''),
    bucketCapacityM3: String(item.bucketCapacityM3 ?? ''),
    enginePowerKw: String(item.enginePowerKw ?? ''),
    operatingWeightTons: String(item.operatingWeightTons ?? ''),
    purchasePriceUsd: String(item.purchasePriceUsd ?? ''),
    fuelConsumptionLph: String(item.fuelConsumptionLph ?? ''),
    usefulLifeYears: String(item.usefulLifeYears ?? 10),
    availabilityPct: String(item.availabilityPct ?? 85),
    maintenanceCostUsdYear: String(item.maintenanceCostUsdYear ?? ''),
    powerType: item.powerType || 'diesel',
    isActive: item.isActive,
    sortOrder: String(item.sortOrder ?? 0),
  };
}

function formToPayload(form: FormState): Record<string, unknown> {
  const num = (raw: string, fallback = 0): number => {
    if (raw.trim() === '') return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    code: form.code.trim() || undefined,
    manufacturer: form.manufacturer.trim(),
    model: form.model.trim(),
    category: form.category,
    description: form.description.trim(),
    capacityLabel: form.capacityLabel.trim(),
    payloadTons: num(form.payloadTons),
    bucketCapacityM3: num(form.bucketCapacityM3),
    enginePowerKw: num(form.enginePowerKw),
    operatingWeightTons: num(form.operatingWeightTons),
    purchasePriceUsd: num(form.purchasePriceUsd),
    fuelConsumptionLph: num(form.fuelConsumptionLph),
    usefulLifeYears: num(form.usefulLifeYears, 10),
    availabilityPct: num(form.availabilityPct, 85),
    maintenanceCostUsdYear: num(form.maintenanceCostUsdYear),
    powerType: form.powerType,
    isActive: form.isActive,
    sortOrder: Math.trunc(num(form.sortOrder)),
  };
}

function formatUsd(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function EquipmentCatalogClient() {
  const { t } = useLanguage();
  const [items, setItems] = useState<EquipmentCatalogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentCatalogItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] = useState<EquipmentCatalogItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const categoryLabel = useCallback(
    (value: string) => {
      const key = `mktcat.${value}`;
      const translated = t(key);
      return translated === key ? value : translated;
    },
    [t]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sort: 'sortOrder',
        order: 'asc',
      });
      if (q) params.set('q', q);
      if (category !== 'all') params.set('category', category);
      if (activeFilter !== 'all') params.set('isActive', activeFilter);

      const res = await fetch(`/api/master-data/equipment?${params.toString()}`);
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(err?.error ?? t('equipCat.loadError'));
        return;
      }
      const data = (await res.json()) as ListResponse;
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      toast.error(t('equipCat.loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, q, category, activeFilter, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item: EquipmentCatalogItem) => {
    setEditing(item);
    setForm(itemToForm(item));
    setDialogOpen(true);
  };

  const setFormField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.model.trim()) {
      toast.error(t('equipCat.modelRequired'));
      return;
    }
    setSaving(true);
    try {
      const payload = formToPayload(form);
      const url = editing
        ? `/api/master-data/equipment/${editing.id}`
        : '/api/master-data/equipment';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(err?.error ?? t('equipCat.saveError'));
        return;
      }
      toast.success(editing ? t('equipCat.updated') : t('equipCat.created'));
      setDialogOpen(false);
      await load();
    } catch {
      toast.error(t('equipCat.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/master-data/equipment/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(err?.error ?? t('equipCat.deleteError'));
        return;
      }
      toast.success(t('equipCat.deleted'));
      setDeleteTarget(null);
      await load();
    } catch {
      toast.error(t('equipCat.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  const applySearch = () => {
    setPage(1);
    setQ(searchInput.trim());
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1200px] px-4 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Database className="h-3.5 w-3.5" />
                <span>{t('equipCat.breadcrumb')}</span>
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight mb-2">
                {t('equipCat.title')}{' '}
                <span className="text-primary">{t('equipCat.titleAccent')}</span>
              </h1>
              <p className="text-muted-foreground text-sm max-w-2xl">{t('equipCat.subtitle')}</p>
            </div>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('equipCat.add')}
            </Button>
          </div>
        </motion.div>

        <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t('equipCat.search')}</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') applySearch();
                    }}
                    placeholder={t('equipCat.searchPlaceholder')}
                    className="pl-8"
                  />
                </div>
                <Button type="button" variant="secondary" onClick={applySearch}>
                  {t('equipCat.search')}
                </Button>
              </div>
            </div>
            <div className="w-44 space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t('equipCat.category')}</Label>
              <Select
                value={category}
                onValueChange={(v) => {
                  setPage(1);
                  setCategory(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('equipCat.allCategories')}</SelectItem>
                  {EQUIPMENT_CATALOG_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {categoryLabel(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40 space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t('equipCat.status')}</Label>
              <Select
                value={activeFilter}
                onValueChange={(v) => {
                  setPage(1);
                  setActiveFilter(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('equipCat.allStatuses')}</SelectItem>
                  <SelectItem value="true">{t('equipCat.active')}</SelectItem>
                  <SelectItem value="false">{t('equipCat.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('equipCat.resultCount').replace('{count}', String(total))}
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
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
                        {formatUsd(item.purchasePriceUsd)}
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
                            onClick={() => openEdit(item)}
                            aria-label={t('equipCat.edit')}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(item)}
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

          <div className="flex items-center justify-between border-t border-border/40 px-4 py-3">
            <span className="text-xs text-muted-foreground">
              {t('equipCat.pageOf')
                .replace('{page}', String(page))
                .replace('{total}', String(totalPages))}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t('equipCat.editTitle') : t('equipCat.createTitle')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('equipCat.sectionGeneral')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t('equipCat.colManufacturer')}>
                  <Input
                    value={form.manufacturer}
                    onChange={(e) => setFormField('manufacturer', e.target.value)}
                  />
                </Field>
                <Field label={t('equipCat.colModel')} required>
                  <Input
                    value={form.model}
                    onChange={(e) => setFormField('model', e.target.value)}
                  />
                </Field>
                <Field label={t('equipCat.category')}>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setFormField('category', v)}
                  >
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
                    onChange={(e) => setFormField('code', e.target.value)}
                    placeholder={t('equipCat.codeHint')}
                    className="font-mono text-sm"
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label={t('equipCat.description')}>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setFormField('description', e.target.value)}
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
                    onChange={(e) => setFormField('capacityLabel', e.target.value)}
                  />
                </Field>
                <Field label={t('equipCat.payloadTons')}>
                  <Input
                    type="number"
                    step="any"
                    value={form.payloadTons}
                    onChange={(e) => setFormField('payloadTons', e.target.value)}
                  />
                </Field>
                <Field label={t('equipCat.bucketCapacityM3')}>
                  <Input
                    type="number"
                    step="any"
                    value={form.bucketCapacityM3}
                    onChange={(e) => setFormField('bucketCapacityM3', e.target.value)}
                  />
                </Field>
                <Field label={t('equipCat.enginePowerKw')}>
                  <Input
                    type="number"
                    step="any"
                    value={form.enginePowerKw}
                    onChange={(e) => setFormField('enginePowerKw', e.target.value)}
                  />
                </Field>
                <Field label={t('equipCat.operatingWeightTons')}>
                  <Input
                    type="number"
                    step="any"
                    value={form.operatingWeightTons}
                    onChange={(e) => setFormField('operatingWeightTons', e.target.value)}
                  />
                </Field>
                <Field label={t('equipCat.powerType')}>
                  <Select
                    value={form.powerType}
                    onValueChange={(v) => setFormField('powerType', v)}
                  >
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
                    onChange={(e) => setFormField('purchasePriceUsd', e.target.value)}
                  />
                </Field>
                <Field label={t('equipCat.fuelConsumptionLph')}>
                  <Input
                    type="number"
                    step="any"
                    value={form.fuelConsumptionLph}
                    onChange={(e) => setFormField('fuelConsumptionLph', e.target.value)}
                  />
                </Field>
                <Field label={t('equipCat.usefulLifeYears')}>
                  <Input
                    type="number"
                    step="any"
                    value={form.usefulLifeYears}
                    onChange={(e) => setFormField('usefulLifeYears', e.target.value)}
                  />
                </Field>
                <Field label={t('equipCat.availabilityPct')}>
                  <Input
                    type="number"
                    step="any"
                    value={form.availabilityPct}
                    onChange={(e) => setFormField('availabilityPct', e.target.value)}
                  />
                </Field>
                <Field label={t('equipCat.maintenanceCostUsdYear')}>
                  <Input
                    type="number"
                    step="any"
                    value={form.maintenanceCostUsdYear}
                    onChange={(e) => setFormField('maintenanceCostUsdYear', e.target.value)}
                  />
                </Field>
                <Field label={t('equipCat.status')}>
                  <Select
                    value={form.isActive ? 'true' : 'false'}
                    onValueChange={(v) => setFormField('isActive', v === 'true')}
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              {t('equipCat.cancel')}
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('equipCat.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('equipCat.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('equipCat.deleteDesc').replace(
                '{name}',
                deleteTarget
                  ? `${deleteTarget.manufacturer} ${deleteTarget.model}`.trim()
                  : ''
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('equipCat.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('equipCat.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
