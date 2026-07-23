/**
 * Dashboard portfolio selection — client-side only.
 * KPIs are derived from selected project IDs; selection persists in localStorage.
 * Does not touch the economic engine or any API.
 */

export const DASHBOARD_SELECTION_STORAGE_KEY = 'mining-dashboard:portfolio-selection-v1';

export interface PortfolioProjectMetrics {
  id: string;
  npv?: number | null;
  irr?: number | null;
  totalCapex?: number | null;
}

export interface PortfolioAggregateMetrics {
  totalProjects: number;
  averageNpv: number;
  averageIrr: number;
  totalCapex: number;
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/** Returns null when nothing has been persisted yet (first visit). */
export function readPortfolioSelection(): string[] | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(DASHBOARD_SELECTION_STORAGE_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
  } catch {
    return null;
  }
}

export function writePortfolioSelection(ids: string[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(DASHBOARD_SELECTION_STORAGE_KEY, JSON.stringify(ids));
}

/**
 * Resolve selection against currently visible projects.
 * First visit (no storage): select all. Otherwise keep stored ∩ visible.
 */
export function resolveInitialSelection(
  visibleIds: readonly string[],
  stored: string[] | null
): string[] {
  const visible = new Set(visibleIds.filter(Boolean));
  if (stored === null) {
    return [...visible];
  }
  return stored.filter((id) => visible.has(id));
}

export function computePortfolioMetrics(
  projects: readonly PortfolioProjectMetrics[],
  selectedIds: ReadonlySet<string> | readonly string[]
): PortfolioAggregateMetrics {
  const selected =
    selectedIds instanceof Set ? selectedIds : new Set(selectedIds);
  const rows = projects.filter((p) => p?.id && selected.has(p.id));
  const n = rows.length;
  if (n === 0) {
    return {
      totalProjects: 0,
      averageNpv: 0,
      averageIrr: 0,
      totalCapex: 0,
    };
  }
  const sumNpv = rows.reduce((s, p) => s + (p.npv ?? 0), 0);
  const sumIrr = rows.reduce((s, p) => s + (p.irr ?? 0), 0);
  const sumCapex = rows.reduce((s, p) => s + (p.totalCapex ?? 0), 0);
  return {
    totalProjects: n,
    averageNpv: sumNpv / n,
    averageIrr: sumIrr / n,
    totalCapex: sumCapex,
  };
}
