/** Stable ids for always-available public demo projects (client-safe — no Prisma / engine imports). */
export const DEMO_PROJECT_IDS = [
  'demo-copper-mine',
  'demo-gold-turkiye',
  'demo-iron-brazil',
  'demo-lithium-argentina',
  'demo-nickel-canada',
  'demo-coal-australia',
  'demo-zinc-peru',
  'demo-rare-earth-sweden',
] as const;

export type DemoProjectId = (typeof DEMO_PROJECT_IDS)[number];

/** Flagship Copper demo id (backward compatible). */
export const DEMO_PROJECT_ID: DemoProjectId = 'demo-copper-mine';

export const DEMO_STORAGE_KEYS = {
  welcomeDismissed: 'med.welcomeDismissed',
  lastOpenedProjectId: 'med.lastOpenedProjectId',
  createdProjectIds: 'med.createdProjectIds',
} as const;

export function isDemoProjectId(id: string | null | undefined): boolean {
  if (!id) return false;
  return (DEMO_PROJECT_IDS as readonly string[]).includes(id);
}
