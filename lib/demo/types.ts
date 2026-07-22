import type { ProjectParams } from '@/lib/calculations';

/**
 * Shared shape for public demonstration projects.
 * Add a new file under `lib/demo/projects/` and register it in `catalog.ts`.
 */
export interface DemoProjectDefinition {
  id: string;
  name: string;
  /** Commodity key — matches `mine.*` i18n where available. */
  mineType: string;
  miningMethod: 'openPit' | 'underground' | string;
  /** Full location string stored on MiningProject.location */
  location: string;
  /** ISO-style country label for demo cards (EN canonical). */
  country: string;
  /** Short production label for demo cards, e.g. "85 ktpa Cu". */
  productionLabel: string;
  /** Accent token for card thumbnail (commodity color). */
  accent: DemoAccent;
  currency: string;
  exchangeRate: number;
  fuelPricePerLiter: number;
  electricityUnitPrice: number;
  explosiveUnitPrice: number;
  totalReserves: number;
  maxAnnualCapacity: number;
  oreGrade: number;
  oreGradeUnit: string;
  /** Waste:ore stripping ratio (open-pit) or N/A proxy for underground. */
  strippingRatio: number;
  /** Metallurgical recovery % used for engineering narrative (not a separate engine input). */
  recoveryPercent: number;
  waterConsumptionDaily: number;
  rehabilitationAreaHa: number;
  rehabilitationCostPerHa: number;
  loanAmount: number;
  loanInterestRate: number;
  loanTermYears: number;
  equityRatio: number;
  depreciationMethod: string;
  equipmentRenewalEnabled: boolean;
  equipmentRenewalCycleYears: number;
  latitude: number;
  longitude: number;
  params: ProjectParams;
  equipments: Record<string, unknown>[];
  personnels: Record<string, unknown>[];
  byProducts: Record<string, unknown>[];
  methodCosts: Record<string, unknown>[];
}

export type DemoAccent =
  | 'copper'
  | 'gold'
  | 'iron'
  | 'lithium'
  | 'nickel'
  | 'coal'
  | 'zinc'
  | 'rareEarth';
