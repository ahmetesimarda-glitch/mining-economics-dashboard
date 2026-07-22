import { DEMO_PROJECT_ID, DEMO_STORAGE_KEYS } from './constants';

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
  if (!canUseStorage() || !id || id === DEMO_PROJECT_ID) return;
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
 * always include the Copper Mine Demo, plus projects this browser created.
 */
export function filterDemoWorkspaceProjects<T extends { id?: string | null }>(
  projects: T[]
): T[] {
  const created = new Set(getCreatedProjectIds());
  const visible = projects.filter((p) => {
    const id = p?.id ?? '';
    return id === DEMO_PROJECT_ID || created.has(id);
  });

  // Pin demo first when present.
  return visible.sort((a, b) => {
    if (a?.id === DEMO_PROJECT_ID) return -1;
    if (b?.id === DEMO_PROJECT_ID) return 1;
    return 0;
  });
}
