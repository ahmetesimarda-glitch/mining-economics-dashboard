'use client';

import { useEffect, useState } from 'react';
import { ProjectForm } from '@/app/components/project-form';
import { Loader2 } from 'lucide-react';

export function EditProjectClient({ projectId }: { projectId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (res?.ok) {
          const project = await res?.json();
          setData(project);
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (projectId) fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <ProjectForm initialData={data} isEditing />;
}
