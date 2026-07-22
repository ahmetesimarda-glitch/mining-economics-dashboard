import type { DemoProjectDefinition } from './types';
import { DEMO_PROJECT_IDS } from './constants';
import { COPPER_CHILE_DEMO } from './projects/copper-chile';
import { GOLD_TURKIYE_DEMO } from './projects/gold-turkiye';
import { IRON_BRAZIL_DEMO } from './projects/iron-brazil';
import { LITHIUM_ARGENTINA_DEMO } from './projects/lithium-argentina';
import { NICKEL_CANADA_DEMO } from './projects/nickel-canada';
import { COAL_AUSTRALIA_DEMO } from './projects/coal-australia';
import { ZINC_PERU_DEMO } from './projects/zinc-peru';
import { RARE_EARTH_SWEDEN_DEMO } from './projects/rare-earth-sweden';

/**
 * Ordered public demonstration portfolio.
 * To add a demo: create `projects/<slug>.ts`, append here, and add the id to `DEMO_PROJECT_IDS`.
 */
export const DEMO_PROJECTS: readonly DemoProjectDefinition[] = [
  COPPER_CHILE_DEMO,
  GOLD_TURKIYE_DEMO,
  IRON_BRAZIL_DEMO,
  LITHIUM_ARGENTINA_DEMO,
  NICKEL_CANADA_DEMO,
  COAL_AUSTRALIA_DEMO,
  ZINC_PERU_DEMO,
  RARE_EARTH_SWEDEN_DEMO,
];

if (process.env.NODE_ENV !== 'production') {
  const catalogIds = DEMO_PROJECTS.map((p) => p.id);
  const missing = DEMO_PROJECT_IDS.filter((id) => !catalogIds.includes(id));
  const extra = catalogIds.filter((id) => !(DEMO_PROJECT_IDS as readonly string[]).includes(id));
  if (missing.length || extra.length) {
    console.warn('[demo catalog] ID mismatch', { missing, extra });
  }
}

export function getDemoProjectById(id: string): DemoProjectDefinition | undefined {
  return DEMO_PROJECTS.find((p) => p.id === id);
}

/** Re-export for callers that imported COPPER_MINE_DEMO historically. */
export const COPPER_MINE_DEMO = COPPER_CHILE_DEMO;
