'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProjectForm } from '@/app/components/project-form';
import { Header } from '@/app/components/header';
import { Loader2, Mountain } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

export function EditProjectClient({ projectId }: { projectId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (res?.ok) {
          const project = await res.json();
          setData(project);
          setNotFound(false);
          setLoadError(false);
        } else if (res?.status === 404) {
          setNotFound(true);
        } else {
          setLoadError(true);
        }
      } catch (err: unknown) {
        console.error(err);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    if (projectId) fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
          <span className="sr-only">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  if (notFound || loadError || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
          <Mountain className="h-16 w-16 text-muted-foreground/30 mb-4" aria-hidden />
          <h2 className="font-display text-lg font-semibold">
            {notFound ? t('detail.notFound') : t('error.pageTitle')}
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            {notFound ? t('error.notFoundDescription') : t('error.pageDescription')}
          </p>
          <Link href="/" className="mt-4 text-sm text-primary hover:underline">
            {t('detail.backToDash')}
          </Link>
        </div>
      </div>
    );
  }

  return <ProjectForm initialData={data} isEditing />;
}
