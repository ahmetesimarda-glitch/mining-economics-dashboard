import { EditProjectClient } from './edit-client';

export default function EditProjectPage({ params }: { params: { id: string } }) {
  return <EditProjectClient projectId={params?.id ?? ''} />;
}
