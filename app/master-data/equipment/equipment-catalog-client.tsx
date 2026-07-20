'use client';

import { useCallback, useEffect, useState } from 'react';
import { Header } from '@/app/components/header';
import { useLanguage } from '@/lib/i18n/context';
import {
  EMPTY_EQUIPMENT_CATALOG_FORM,
  EQUIPMENT_OEM_MANUFACTURERS,
  equipmentCatalogFormToPayload,
  equipmentCatalogItemToForm,
  equipmentFiltersToSearchParams,
  type EquipmentCatalogFacets,
  type EquipmentCatalogFormState,
  type EquipmentCatalogItemDto,
  type EquipmentCatalogListResult,
  type EquipmentCatalogViewMode,
} from '@/lib/master-data';
import { EquipmentToolbar } from '@/components/master-data/equipment/EquipmentToolbar';
import { EquipmentFilters } from '@/components/master-data/equipment/EquipmentFilters';
import { EquipmentTable } from '@/components/master-data/equipment/EquipmentTable';
import { EquipmentCardGrid } from '@/components/master-data/equipment/EquipmentCardGrid';
import { EquipmentPagination } from '@/components/master-data/equipment/EquipmentPagination';
import { EquipmentDialog } from '@/components/master-data/equipment/EquipmentDialog';
import { EquipmentDetailDrawer } from '@/components/master-data/equipment/EquipmentDetailDrawer';
import { EquipmentAddToProjectDialog } from '@/components/master-data/equipment/EquipmentAddToProjectDialog';
import { toast } from 'sonner';

export function EquipmentCatalogClient() {
  const { t } = useLanguage();
  const [items, setItems] = useState<EquipmentCatalogItemDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [manufacturer, setManufacturer] = useState('all');
  const [category, setCategory] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState<EquipmentCatalogViewMode>('table');
  const [manufacturers, setManufacturers] = useState<string[]>([
    ...EQUIPMENT_OEM_MANUFACTURERS,
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentCatalogItemDto | null>(null);
  const [form, setForm] = useState<EquipmentCatalogFormState>(EMPTY_EQUIPMENT_CATALOG_FORM);

  const [detailItem, setDetailItem] = useState<EquipmentCatalogItemDto | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addToProjectItem, setAddToProjectItem] = useState<EquipmentCatalogItemDto | null>(null);
  const [addToProjectOpen, setAddToProjectOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<EquipmentCatalogItemDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const categoryLabel = useCallback(
    (value: string) => {
      const key = `mktcat.${value}`;
      const translated = t(key);
      return translated === key ? value : translated;
    },
    [t]
  );

  const loadFacets = useCallback(async () => {
    try {
      const res = await fetch('/api/master-data/equipment/facets');
      if (!res.ok) return;
      const data = (await res.json()) as EquipmentCatalogFacets;
      if (data.manufacturers?.length) setManufacturers(data.manufacturers);
    } catch {
      // Facets are non-critical; OEM defaults remain.
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = equipmentFiltersToSearchParams({
        page,
        pageSize,
        sort: 'sortOrder',
        order: 'asc',
        q,
        category,
        manufacturer,
        isActive: activeFilter,
      });

      const res = await fetch(`/api/master-data/equipment?${params.toString()}`);
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(err?.error ?? t('equipCat.loadError'));
        return;
      }
      const data = (await res.json()) as EquipmentCatalogListResult<EquipmentCatalogItemDto>;
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      toast.error(t('equipCat.loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, q, category, manufacturer, activeFilter, t]);

  useEffect(() => {
    void loadFacets();
  }, [loadFacets]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_EQUIPMENT_CATALOG_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item: EquipmentCatalogItemDto) => {
    setDetailOpen(false);
    setEditing(item);
    setForm(equipmentCatalogItemToForm(item));
    setDialogOpen(true);
  };

  const openDetail = (item: EquipmentCatalogItemDto) => {
    setDetailItem(item);
    setDetailOpen(true);
  };

  const openAddToProject = (item: EquipmentCatalogItemDto) => {
    setAddToProjectItem(item);
    setAddToProjectOpen(true);
  };

  const setFormField = <K extends keyof EquipmentCatalogFormState>(
    key: K,
    value: EquipmentCatalogFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.model.trim()) {
      toast.error(t('equipCat.modelRequired'));
      return;
    }
    setSaving(true);
    try {
      const payload = equipmentCatalogFormToPayload(form);
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
      await loadFacets();
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
      setDetailOpen(false);
      await load();
      await loadFacets();
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
        <EquipmentToolbar onCreate={openCreate} />

        <EquipmentFilters
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearch={applySearch}
          manufacturer={manufacturer}
          onManufacturerChange={(v) => {
            setPage(1);
            setManufacturer(v);
          }}
          manufacturers={manufacturers}
          category={category}
          onCategoryChange={(v) => {
            setPage(1);
            setCategory(v);
          }}
          activeFilter={activeFilter}
          onActiveFilterChange={(v) => {
            setPage(1);
            setActiveFilter(v);
          }}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          total={total}
          categoryLabel={categoryLabel}
        />

        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          {viewMode === 'table' ? (
            <EquipmentTable
              items={items}
              loading={loading}
              categoryLabel={categoryLabel}
              onSelect={openDetail}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ) : (
            <EquipmentCardGrid
              items={items}
              loading={loading}
              categoryLabel={categoryLabel}
              onSelect={openDetail}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          )}
          <EquipmentPagination
            page={page}
            totalPages={totalPages}
            loading={loading}
            onPageChange={setPage}
          />
        </div>
      </main>

      <EquipmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        form={form}
        onFormChange={setFormField}
        saving={saving}
        onSave={() => void handleSave()}
        categoryLabel={categoryLabel}
        deleteTarget={deleteTarget}
        onDeleteTargetChange={setDeleteTarget}
        deleting={deleting}
        onConfirmDelete={() => void handleDelete()}
      />

      <EquipmentDetailDrawer
        item={detailItem}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        categoryLabel={categoryLabel}
        onEdit={openEdit}
        onAddToProject={(item) => {
          setDetailOpen(false);
          openAddToProject(item);
        }}
      />

      <EquipmentAddToProjectDialog
        open={addToProjectOpen}
        onOpenChange={setAddToProjectOpen}
        item={addToProjectItem}
      />
    </div>
  );
}
