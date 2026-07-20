'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EQUIPMENT_CATALOG_CATEGORIES } from '@/lib/master-data';
import { useLanguage } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { LayoutGrid, List, Search } from 'lucide-react';

interface EquipmentFiltersProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  manufacturer: string;
  onManufacturerChange: (value: string) => void;
  manufacturers: string[];
  category: string;
  onCategoryChange: (value: string) => void;
  activeFilter: string;
  onActiveFilterChange: (value: string) => void;
  viewMode: 'table' | 'card';
  onViewModeChange: (mode: 'table' | 'card') => void;
  total: number;
  categoryLabel: (value: string) => string;
}

export function EquipmentFilters({
  searchInput,
  onSearchInputChange,
  onSearch,
  manufacturer,
  onManufacturerChange,
  manufacturers,
  category,
  onCategoryChange,
  activeFilter,
  onActiveFilterChange,
  viewMode,
  onViewModeChange,
  total,
  categoryLabel,
}: EquipmentFiltersProps) {
  const { t } = useLanguage();

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[220px] space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t('equipCat.search')}</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => onSearchInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSearch();
                }}
                placeholder={t('equipCat.searchPlaceholder')}
                className="pl-8"
              />
            </div>
            <Button type="button" variant="secondary" onClick={onSearch}>
              {t('equipCat.search')}
            </Button>
          </div>
        </div>

        <div className="w-44 space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t('equipCat.manufacturer')}</Label>
          <Select value={manufacturer} onValueChange={onManufacturerChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('equipCat.allManufacturers')}</SelectItem>
              {manufacturers.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-44 space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t('equipCat.category')}</Label>
          <Select value={category} onValueChange={onCategoryChange}>
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

        <div className="w-36 space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t('equipCat.status')}</Label>
          <Select value={activeFilter} onValueChange={onActiveFilterChange}>
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

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t('equipCat.view')}</Label>
          <div className="inline-flex rounded-lg border border-border/60 p-0.5">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={cn('h-8 px-2.5', viewMode === 'table' && 'bg-muted')}
              onClick={() => onViewModeChange('table')}
              aria-label={t('equipCat.tableView')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={cn('h-8 px-2.5', viewMode === 'card' && 'bg-muted')}
              onClick={() => onViewModeChange('card')}
              aria-label={t('equipCat.cardView')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {t('equipCat.resultCount').replace('{count}', String(total))}
      </p>
    </div>
  );
}
