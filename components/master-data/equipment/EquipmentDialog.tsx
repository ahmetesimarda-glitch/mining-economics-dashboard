'use client';

import { Button } from '@/components/ui/button';
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
import type {
  EquipmentCatalogFormState,
  EquipmentCatalogItemDto,
} from '@/lib/master-data';
import { useLanguage } from '@/lib/i18n/context';
import { Loader2 } from 'lucide-react';
import { EquipmentForm } from './EquipmentForm';

interface EquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: EquipmentCatalogItemDto | null;
  form: EquipmentCatalogFormState;
  onFormChange: <K extends keyof EquipmentCatalogFormState>(
    key: K,
    value: EquipmentCatalogFormState[K]
  ) => void;
  saving: boolean;
  onSave: () => void;
  categoryLabel: (value: string) => string;
  deleteTarget: EquipmentCatalogItemDto | null;
  onDeleteTargetChange: (item: EquipmentCatalogItemDto | null) => void;
  deleting: boolean;
  onConfirmDelete: () => void;
}

export function EquipmentDialog({
  open,
  onOpenChange,
  editing,
  form,
  onFormChange,
  saving,
  onSave,
  categoryLabel,
  deleteTarget,
  onDeleteTargetChange,
  deleting,
  onConfirmDelete,
}: EquipmentDialogProps) {
  const { t } = useLanguage();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t('equipCat.editTitle') : t('equipCat.createTitle')}
            </DialogTitle>
          </DialogHeader>

          <EquipmentForm
            form={form}
            onChange={onFormChange}
            categoryLabel={categoryLabel}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('equipCat.cancel')}
            </Button>
            <Button type="button" onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('equipCat.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) onDeleteTargetChange(null);
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
                onConfirmDelete();
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
    </>
  );
}
