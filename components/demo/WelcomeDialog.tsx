'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/lib/i18n/context';
import { Compass, PlusCircle } from 'lucide-react';

interface WelcomeDialogProps {
  open: boolean;
  onExploreDemo: () => void;
  onCreateProject: () => void;
  onDismiss: () => void;
}

export function WelcomeDialog({
  open,
  onExploreDemo,
  onCreateProject,
  onDismiss,
}: WelcomeDialogProps) {
  const { t } = useLanguage();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onDismiss();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3 text-left">
          <DialogTitle className="font-display text-xl">
            {t('demo.welcomeTitle')}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {t('demo.welcomeBody')}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-2 flex-col sm:flex-col gap-2 sm:space-x-0">
          <Button type="button" className="w-full gap-2" onClick={onExploreDemo}>
            <Compass className="h-4 w-4" />
            {t('demo.exploreDemo')}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={onCreateProject}
          >
            <PlusCircle className="h-4 w-4" />
            {t('demo.createNew')}
          </Button>
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs text-muted-foreground hover:text-foreground pt-1 transition-colors"
          >
            {t('demo.dismiss')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
