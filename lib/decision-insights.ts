/**
 * Decision Insights — read-only interpretation layer over existing project outputs.
 *
 * Does NOT recompute NPV, IRR, cash flow, sensitivity, or Monte Carlo.
 * Consumes already-produced metrics and returns executive investment insights.
 */

// ---------------------------------------------------------------------------
// Public enums / result shape
// ---------------------------------------------------------------------------

export type OverallRecommendation =
  | 'Strong Investment'
  | 'Promising'
  | 'Requires Review'
  | 'High Risk'
  | 'Not Recommended';

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Very High';

export type FinancialStrength = 'Excellent' | 'Strong' | 'Average' | 'Weak';

export interface DecisionInsight {
  overallRecommendation: OverallRecommendation;
  riskLevel: RiskLevel;
  financialStrength: FinancialStrength;
  keyAdvantages: string[];
  keyRisks: string[];
  importantObservations: string[];
  executiveSummary: string;
}

// ---------------------------------------------------------------------------
// Input — all values must already exist; this module only interprets them
// ---------------------------------------------------------------------------

export interface MonteCarloInsightStats {
  npvMean: number;
  npvMedian: number;
  npvStdDev: number;
  npvMin: number;
  npvMax: number;
  /** Probability of NPV ≥ 0, expressed as 0–100 (matches engine output). */
  npvPositiveProb: number;
  irrMean: number;
  irrMedian: number;
  irrStdDev: number;
}

export interface SensitivitySeriesPoint {
  changePercent: number;
  npv: number;
  irr: number;
}

export interface SensitivityInsightResults {
  price?: SensitivitySeriesPoint[];
  capex?: SensitivitySeriesPoint[];
  opex?: SensitivitySeriesPoint[];
  discountRate?: SensitivitySeriesPoint[];
  oreGrade?: SensitivitySeriesPoint[];
  exchangeRate?: SensitivitySeriesPoint[];
  fuelPrice?: SensitivitySeriesPoint[];
}

/** Country jurisdiction risk labels from CountryCatalogItem (snapshot / lookup). */
export type CountryRiskLabel = 'low' | 'medium' | 'high' | string;

export interface DecisionInsightsInput {
  name: string;
  npv: number;
  irr: number;
  paybackPeriod: number;
  totalCapex: number;
  totalOpex: number;
  /** Year-0 style initial outlay already known from project outputs (MUSD). */
  initialInvestment: number;
  /** Mean operating-year net cash flow from existing cash-flow rows (MUSD). */
  averageAnnualCashFlow: number;
  sensitivityResults: SensitivityInsightResults;
  monteCarloResults: MonteCarloInsightStats;
  commodity: string;
  country: string;
  countryRisk?: CountryRiskLabel;
  mineType: string;
  productionRate: number;
  productionUnit?: string;
  projectLifeYears?: number;
  discountRate?: number;
  /** Optional: fraction of operating years with negative net CF (0–1). */
  negativeCashFlowYearRatio?: number;
  /** Optional: share of lifetime positive CF occurring in the final third of life (0–1). */
  lateCashFlowConcentration?: number;
}

// ---------------------------------------------------------------------------
// Thresholds — named constants only (no inline magic numbers)
// ---------------------------------------------------------------------------

const FINANCIAL = {
  IRR_EXCELLENT: 20,
  IRR_STRONG: 15,
  IRR_AVERAGE: 10,
  NPV_EXCELLENT: 100,
  NPV_STRONG: 25,
  NPV_AVERAGE: 0,
  PAYBACK_EXCELLENT: 5,
  PAYBACK_STRONG: 8,
  PAYBACK_AVERAGE: 12,
  PAYBACK_LONG: 15,
} as const;

const MONTE_CARLO = {
  POSITIVE_PROB_LOW_RISK: 80,
  POSITIVE_PROB_MODERATE: 60,
  POSITIVE_PROB_HIGH: 40,
  POSITIVE_PROB_STRONG_ADVANTAGE: 75,
  POSITIVE_PROB_LOW_CONFIDENCE: 55,
  DOWNSIDE_NEGATIVE_NPV: 0,
} as const;

const SENSITIVITY = {
  /** Absolute NPV swing (MUSD) at ±PRICE_SHOCK_PERCENT considered high commodity sensitivity. */
  PRICE_SHOCK_PERCENT: 20,
  HIGH_PRICE_NPV_SWING: 30,
  LOW_SENSITIVITY_NPV_SWING: 10,
} as const;

const CASH_FLOW = {
  STABLE_NEGATIVE_YEAR_RATIO: 0.15,
  UNSTABLE_NEGATIVE_YEAR_RATIO: 0.35,
  LATE_CONCENTRATION_HIGH: 0.55,
} as const;

const CAPITAL = {
  /** Capex (MUSD) above which “large initial capital” is flagged. */
  LARGE_CAPEX: 150,
} as const;

const LIST_LIMITS = {
  MAX_ADVANTAGES: 6,
  MAX_RISKS: 6,
  MAX_OBSERVATIONS: 5,
  MAX_SUMMARY_WORDS: 200,
} as const;

// ---------------------------------------------------------------------------
// Pure helpers (aggregation / classification only — no economic engine calls)
// ---------------------------------------------------------------------------

function clampWordCount(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(' ')}…`;
}

function npvAtShock(
  series: SensitivitySeriesPoint[] | undefined,
  changePercent: number
): number | null {
  if (!series || series.length === 0) return null;
  const point = series.find((p) => p.changePercent === changePercent);
  return point ? point.npv : null;
}

function commodityPriceNpvSwing(sensitivity: SensitivityInsightResults): number {
  const downside = npvAtShock(sensitivity.price, -SENSITIVITY.PRICE_SHOCK_PERCENT);
  const upside = npvAtShock(sensitivity.price, SENSITIVITY.PRICE_SHOCK_PERCENT);
  if (downside === null || upside === null) return 0;
  return Math.abs(upside - downside);
}

function isElevatedCountryRisk(label: CountryRiskLabel | undefined): boolean {
  if (!label) return false;
  const normalized = label.toLowerCase();
  return normalized === 'high' || normalized === 'very high' || normalized === 'very_high';
}

function assessFinancialStrength(input: DecisionInsightsInput): FinancialStrength {
  const { irr, npv, paybackPeriod } = input;
  let score = 0;

  if (irr >= FINANCIAL.IRR_EXCELLENT) score += 3;
  else if (irr >= FINANCIAL.IRR_STRONG) score += 2;
  else if (irr >= FINANCIAL.IRR_AVERAGE) score += 1;

  if (npv >= FINANCIAL.NPV_EXCELLENT) score += 3;
  else if (npv >= FINANCIAL.NPV_STRONG) score += 2;
  else if (npv >= FINANCIAL.NPV_AVERAGE) score += 1;

  if (paybackPeriod > 0 && paybackPeriod <= FINANCIAL.PAYBACK_EXCELLENT) score += 3;
  else if (paybackPeriod > 0 && paybackPeriod <= FINANCIAL.PAYBACK_STRONG) score += 2;
  else if (paybackPeriod > 0 && paybackPeriod <= FINANCIAL.PAYBACK_AVERAGE) score += 1;

  if (score >= 8) return 'Excellent';
  if (score >= 5) return 'Strong';
  if (score >= 3) return 'Average';
  return 'Weak';
}

function assessRiskLevel(input: DecisionInsightsInput): RiskLevel {
  const { monteCarloResults, sensitivityResults, negativeCashFlowYearRatio } = input;
  let riskScore = 0;

  const positiveProb = monteCarloResults.npvPositiveProb;
  if (positiveProb < MONTE_CARLO.POSITIVE_PROB_HIGH) riskScore += 3;
  else if (positiveProb < MONTE_CARLO.POSITIVE_PROB_MODERATE) riskScore += 2;
  else if (positiveProb < MONTE_CARLO.POSITIVE_PROB_LOW_RISK) riskScore += 1;

  if (monteCarloResults.npvMin < MONTE_CARLO.DOWNSIDE_NEGATIVE_NPV) riskScore += 1;

  const priceSwing = commodityPriceNpvSwing(sensitivityResults);
  if (priceSwing >= SENSITIVITY.HIGH_PRICE_NPV_SWING) riskScore += 2;
  else if (priceSwing >= SENSITIVITY.LOW_SENSITIVITY_NPV_SWING) riskScore += 1;

  const negRatio = negativeCashFlowYearRatio ?? 0;
  if (negRatio >= CASH_FLOW.UNSTABLE_NEGATIVE_YEAR_RATIO) riskScore += 2;
  else if (negRatio > CASH_FLOW.STABLE_NEGATIVE_YEAR_RATIO) riskScore += 1;

  if (isElevatedCountryRisk(input.countryRisk)) riskScore += 1;

  if (riskScore >= 7) return 'Very High';
  if (riskScore >= 5) return 'High';
  if (riskScore >= 3) return 'Moderate';
  return 'Low';
}

function assessRecommendation(
  strength: FinancialStrength,
  risk: RiskLevel,
  npv: number
): OverallRecommendation {
  if (npv < 0) {
    if (risk === 'Very High' || risk === 'High' || strength === 'Weak') {
      return 'Not Recommended';
    }
    return 'Requires Review';
  }

  if (risk === 'Very High') {
    return strength === 'Weak' || strength === 'Average' ? 'Not Recommended' : 'High Risk';
  }

  if (risk === 'High') {
    if (strength === 'Excellent' || strength === 'Strong') return 'High Risk';
    if (strength === 'Weak') return 'Not Recommended';
    return 'Requires Review';
  }

  if (strength === 'Excellent' && (risk === 'Low' || risk === 'Moderate')) {
    return 'Strong Investment';
  }

  if (strength === 'Strong' && risk === 'Low') {
    return 'Strong Investment';
  }

  if (
    (strength === 'Strong' || strength === 'Excellent' || strength === 'Average') &&
    (risk === 'Low' || risk === 'Moderate')
  ) {
    return strength === 'Average' && risk === 'Moderate' ? 'Requires Review' : 'Promising';
  }

  if (strength === 'Weak') {
    return risk === 'Low' ? 'Requires Review' : 'Not Recommended';
  }

  return 'Requires Review';
}

function buildAdvantages(input: DecisionInsightsInput, strength: FinancialStrength): string[] {
  const items: string[] = [];
  const { irr, npv, paybackPeriod, monteCarloResults, sensitivityResults, averageAnnualCashFlow } =
    input;

  if (irr >= FINANCIAL.IRR_STRONG) items.push('High IRR');
  if (paybackPeriod > 0 && paybackPeriod <= FINANCIAL.PAYBACK_STRONG) items.push('Fast Payback');
  if (npv >= FINANCIAL.NPV_STRONG) items.push('Robust NPV');
  if (
    averageAnnualCashFlow > 0 &&
    (input.negativeCashFlowYearRatio ?? 0) <= CASH_FLOW.STABLE_NEGATIVE_YEAR_RATIO
  ) {
    items.push('Stable Cash Flow');
  }
  if (commodityPriceNpvSwing(sensitivityResults) <= SENSITIVITY.LOW_SENSITIVITY_NPV_SWING) {
    items.push('Low Sensitivity');
  }
  if (monteCarloResults.npvPositiveProb >= MONTE_CARLO.POSITIVE_PROB_STRONG_ADVANTAGE) {
    items.push('Strong Probability of Positive NPV');
  }
  if (strength === 'Excellent' || strength === 'Strong') {
    if (!items.includes('Robust NPV') && npv > 0) items.push('Robust NPV');
  }

  return items.slice(0, LIST_LIMITS.MAX_ADVANTAGES);
}

function buildRisks(input: DecisionInsightsInput, risk: RiskLevel): string[] {
  const items: string[] = [];
  const { totalCapex, paybackPeriod, monteCarloResults, sensitivityResults, countryRisk } = input;

  if (totalCapex >= CAPITAL.LARGE_CAPEX || input.initialInvestment >= CAPITAL.LARGE_CAPEX) {
    items.push('Large Initial Capital');
  }
  if (commodityPriceNpvSwing(sensitivityResults) >= SENSITIVITY.HIGH_PRICE_NPV_SWING) {
    items.push('High Commodity Sensitivity');
  }
  if (paybackPeriod <= 0 || paybackPeriod > FINANCIAL.PAYBACK_LONG) {
    items.push('Long Payback');
  }
  if (isElevatedCountryRisk(countryRisk)) {
    items.push('Country Risk');
  }
  if (monteCarloResults.npvPositiveProb < MONTE_CARLO.POSITIVE_PROB_LOW_CONFIDENCE) {
    items.push('Low Monte Carlo Confidence');
  }
  if (monteCarloResults.npvMin < MONTE_CARLO.DOWNSIDE_NEGATIVE_NPV) {
    items.push('Negative Downside Scenario');
  }
  if (risk === 'High' || risk === 'Very High') {
    if (!items.includes('Negative Downside Scenario') && input.npv < 0) {
      items.push('Negative Downside Scenario');
    }
  }

  return items.slice(0, LIST_LIMITS.MAX_RISKS);
}

function buildObservations(input: DecisionInsightsInput): string[] {
  const items: string[] = [];
  const { monteCarloResults, lateCashFlowConcentration, paybackPeriod, sensitivityResults } = input;

  if (monteCarloResults.npvPositiveProb >= MONTE_CARLO.POSITIVE_PROB_MODERATE) {
    items.push('Project remains profitable across most simulated scenarios.');
  } else {
    items.push('A material share of simulated scenarios produces non-positive NPV.');
  }

  if ((lateCashFlowConcentration ?? 0) >= CASH_FLOW.LATE_CONCENTRATION_HIGH) {
    items.push('Cash flow is concentrated in later years.');
  }

  if (paybackPeriod > 0 && paybackPeriod <= FINANCIAL.PAYBACK_STRONG) {
    items.push('Capital recovery occurs rapidly.');
  }

  if (commodityPriceNpvSwing(sensitivityResults) >= SENSITIVITY.HIGH_PRICE_NPV_SWING) {
    items.push('Commodity price changes have significant influence.');
  }

  if (input.averageAnnualCashFlow > 0 && input.npv >= 0) {
    items.push('Average operating cash flow supports the headline valuation.');
  }

  return items.slice(0, LIST_LIMITS.MAX_OBSERVATIONS);
}

function formatMusd(value: number): string {
  return `${value.toFixed(1)} MUSD`;
}

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

function buildExecutiveSummary(
  input: DecisionInsightsInput,
  recommendation: OverallRecommendation,
  risk: RiskLevel,
  strength: FinancialStrength
): string {
  const commodity = input.commodity || input.mineType || 'commodity';
  const country = input.country || 'the host jurisdiction';
  const productionUnit = input.productionUnit ?? 'Mt';
  const life = input.projectLifeYears ?? 0;
  const mineTypeNote =
    input.mineType &&
    input.mineType.toLowerCase() !== commodity.toLowerCase()
      ? ` (${input.mineType})`
      : '';

  const paragraph = [
    `The ${commodity}${mineTypeNote} project located in ${country}`,
    `presents a ${recommendation.toLowerCase()} profile based on evaluated outputs.`,
    `Headline results show NPV of ${formatMusd(input.npv)}, IRR of ${formatPct(input.irr)},`,
    `and payback of ${input.paybackPeriod > 0 ? `${input.paybackPeriod.toFixed(1)} years` : 'not recovered within the modelled life'}.`,
    `Initial investment is approximately ${formatMusd(input.initialInvestment)} against CAPEX of ${formatMusd(input.totalCapex)}`,
    `and annual OPEX of ${formatMusd(input.totalOpex)}, with average annual cash flow of ${formatMusd(input.averageAnnualCashFlow)}.`,
    `Production is modelled at ${input.productionRate.toFixed(2)} ${productionUnit}/year${life > 0 ? ` over ${life} years` : ''}.`,
    `Financial strength is assessed as ${strength.toLowerCase()}, while overall risk is ${risk.toLowerCase()},`,
    `supported by a Monte Carlo positive-NPV probability of ${formatPct(input.monteCarloResults.npvPositiveProb)}.`,
    `These insights interpret existing economic, sensitivity, and simulation outputs and do not replace a full feasibility study.`,
  ].join(' ');

  return clampWordCount(paragraph.replace(/\s+/g, ' ').trim(), LIST_LIMITS.MAX_SUMMARY_WORDS);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate executive Decision Insights from existing project outputs.
 * Pure interpretation — does not invoke the economic calculation engine.
 */
export function generateDecisionInsights(project: DecisionInsightsInput): DecisionInsight {
  const financialStrength = assessFinancialStrength(project);
  const riskLevel = assessRiskLevel(project);
  const overallRecommendation = assessRecommendation(
    financialStrength,
    riskLevel,
    project.npv
  );

  return {
    overallRecommendation,
    riskLevel,
    financialStrength,
    keyAdvantages: buildAdvantages(project, financialStrength),
    keyRisks: buildRisks(project, riskLevel),
    importantObservations: buildObservations(project),
    executiveSummary: buildExecutiveSummary(
      project,
      overallRecommendation,
      riskLevel,
      financialStrength
    ),
  };
}

/** Derive average annual cash flow from existing cash-flow year rows (operating years only). */
export function deriveAverageAnnualCashFlow(
  cashFlows: Array<{ year: number; netCashFlow: number }>
): number {
  const operating = cashFlows.filter((row) => row.year > 0);
  if (operating.length === 0) return 0;
  const sum = operating.reduce((acc, row) => acc + (row.netCashFlow ?? 0), 0);
  return sum / operating.length;
}

/** Derive initial investment magnitude from Year-0 cash flow when available. */
export function deriveInitialInvestmentFromCashFlows(
  cashFlows: Array<{ year: number; netCashFlow: number }>,
  fallbackCapexComponents: {
    totalCapex: number;
    forestCost: number;
    landCost: number;
    rehabilitationCost: number;
  }
): number {
  const year0 = cashFlows.find((row) => row.year === 0);
  if (year0) {
    return Math.abs(year0.netCashFlow ?? 0);
  }
  return (
    (fallbackCapexComponents.totalCapex ?? 0) +
    (fallbackCapexComponents.forestCost ?? 0) +
    (fallbackCapexComponents.landCost ?? 0) +
    (fallbackCapexComponents.rehabilitationCost ?? 0)
  );
}

/** Share of operating years with negative net cash flow (stability signal). */
export function deriveNegativeCashFlowYearRatio(
  cashFlows: Array<{ year: number; netCashFlow: number }>
): number {
  const operating = cashFlows.filter((row) => row.year > 0);
  if (operating.length === 0) return 0;
  const negative = operating.filter((row) => (row.netCashFlow ?? 0) < 0).length;
  return negative / operating.length;
}

/** Share of positive operating cash flow occurring in the final third of project life. */
export function deriveLateCashFlowConcentration(
  cashFlows: Array<{ year: number; netCashFlow: number }>
): number {
  const operating = cashFlows.filter((row) => row.year > 0);
  if (operating.length === 0) return 0;
  const maxYear = Math.max(...operating.map((row) => row.year));
  const lateThreshold = Math.ceil((maxYear * 2) / 3);
  const totalPositive = operating.reduce(
    (acc, row) => acc + Math.max(0, row.netCashFlow ?? 0),
    0
  );
  if (totalPositive <= 0) return 0;
  const latePositive = operating
    .filter((row) => row.year > lateThreshold)
    .reduce((acc, row) => acc + Math.max(0, row.netCashFlow ?? 0), 0);
  return latePositive / totalPositive;
}
