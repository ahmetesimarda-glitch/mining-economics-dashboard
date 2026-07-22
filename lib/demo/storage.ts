import { DEMO_PROJECT_ID, DEMO_PROJECT_IDS, DEMO_STORAGE_KEYS, isDemoProjectId } from './constants';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function isWelcomeDismissed(): boolean {
  if (!canUseStorage()) return true;
  return window.localStorage.getItem(DEMO_STORAGE_KEYS.welcomeDismissed) === '1';
}

export function dismissWelcomePermanently(): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(DEMO_STORAGE_KEYS.welcomeDismissed, '1');
}

export function getLastOpenedProjectId(): string | null {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(DEMO_STORAGE_KEYS.lastOpenedProjectId);
}

export function setLastOpenedProjectId(id: string): void {
  if (!canUseStorage() || !id) return;
  window.localStorage.setItem(DEMO_STORAGE_KEYS.lastOpenedProjectId, id);
}

export function getCreatedProjectIds(): string[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEYS.createdProjectIds);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
  } catch {
    return [];
  }
}

export function trackCreatedProjectId(id: string): void {
  if (!canUseStorage() || !id || isDemoProjectId(id)) return;
  const existing = getCreatedProjectIds();
  if (existing.includes(id)) return;
  window.localStorage.setItem(
    DEMO_STORAGE_KEYS.createdProjectIds,
    JSON.stringify([id, ...existing])
  );
}

export function untrackCreatedProjectId(id: string): void {
  if (!canUseStorage() || !id) return;
  const next = getCreatedProjectIds().filter((x) => x !== id);
  window.localStorage.setItem(DEMO_STORAGE_KEYS.createdProjectIds, JSON.stringify(next));
}

/**
 * Public demo workspace visibility:
 * always include every registered demo project, plus projects this browser created.
 * Demo projects are pinned first (catalog order).
 */
export function filterDemoWorkspaceProjects<T extends { id?: string | null }>(
  projects: T[]
): T[] {
  const created = new Set(getCreatedProjectIds());
  const demoOrder = new Map(
    (DEMO_PROJECT_IDS as readonly string[]).map((id, index) => [id, index])
  );

  const visible = projects.filter((p) => {
    const id = p?.id ?? '';
    return isDemoProjectId(id) || created.has(id);
  });

  return visible.sort((a, b) => {
    const aId = a?.id ?? '';
    const bId = b?.id ?? '';
    const aDemo = demoOrder.has(aId);
    const bDemo = demoOrder.has(bId);
    if (aDemo && bDemo) {
      return (demoOrder.get(aId) ?? 0) - (demoOrder.get(bId) ?? 0);
    }
    if (aDemo) return -1;
    if (bDemo) return 1;
    return 0;
  });
}

export { DEMO_PROJECT_ID };
