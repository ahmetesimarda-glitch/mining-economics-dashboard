/** Stable id for the always-available public demo project. */
export const DEMO_PROJECT_ID = 'demo-copper-mine';

export const DEMO_STORAGE_KEYS = {
  welcomeDismissed: 'med.welcomeDismissed',
  lastOpenedProjectId: 'med.lastOpenedProjectId',
  createdProjectIds: 'med.createdProjectIds',
} as const;

export function isDemoProjectId(id: string | null | undefined): boolean {
  return id === DEMO_PROJECT_ID;
}
