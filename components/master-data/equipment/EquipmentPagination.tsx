'use client';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/context';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface EquipmentPaginationProps {
  page: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

export function EquipmentPagination({
  page,
  totalPages,
  loading,
  onPageChange,
}: EquipmentPaginationProps) {
  const { t } = useLanguage();

  return (
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
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
