// Mining Economic Analysis Calculations
// Based on Mining Feasibility Studies criteria

export interface ProjectParams {
  projectLifeYears: number;
  discountRate: number;
  taxRate: number;
  royaltyRate: number;
  creditRate: number;
  creditYears: number;
  unitPrice: number;
  annualProduction: number;
  plantProcessingRate: number;
  equipmentCost: number;
  facilityCost: number;
  infrastructureCost: number;
  contingencyRate: number;
  totalCapex: number;
  fuelCost: number;
  personnelCost: number;
  maintenanceCost: number;
  explosivesCost: number;
  tireCost: number;
  strippingCost: number;
  otherOpex: number;
  totalOpex: number;
  forestCost: number;
  landCost: number;
  rehabilitationCost: number;
  annualStrippingVolume: number;
  strippingUnitCost: number;
  contractorStrippingCost: number;
  plantOperatingCost: number;
  equipmentDepLife: number;
  facilityDepLife: number;
  byProductRevenue?: number;
  // Extended params
  fuelPricePerLiter?: number;
  electricityUnitPrice?: number;
  explosiveUnitPrice?: number;
  totalReserves?: number;
  maxAnnualCapacity?: number;
  oreGrade?: number;
  exchangeRate?: number;
  // Environmental
  waterConsumptionDaily?: number;
  rehabilitationAreaHa?: number;
  rehabilitationCostPerHa?: number;
  // Financing
  loanAmount?: number;
  loanInterestRate?: number;
  loanTermYears?: number;
  equityRatio?: number;
  depreciationMethod?: string;
  equipmentRenewalEnabled?: boolean;
  equipmentRenewalCycleYears?: number;
}

export interface CashFlowRow {
  year: number;
  revenue: number;
  opex: number;
  depreciation: number;
  taxPayment: number;
  royalty: number;
  creditPayment: number;
  creditInterest: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  discountedCashFlow: number;
}

export interface AnalysisResult {
  npv: number;
  irr: number;
  paybackPeriod: number;
  breakevenPrice: number;
  totalRevenue: number;
  totalCost: number;
  cashFlows: CashFlowRow[];
}

export interface OperationalMetrics {
  unitProductionCost: number;
  costPerTonIncCapex: number;
  reserveLife: number;
  capacityUtilization: number;
  personnelProductivity: number;
  totalFuelCostAnnual: number;
  totalMaintenanceCostAnnual: number;
  monthlyRevenue: number;
  monthlyCost: number;
  monthlyProfit: number;
  annualProfit: number;
  productionPerDay: number;
}

export interface FuelAnalysisItem {
  equipmentName: string;
  quantity: number;
  hourlyConsumption: number;
  dailyHours: number;
  dailyConsumption: number;
  monthlyConsumption: number;
  annualConsumption: number;
  annualCost: number;
}

export interface MaintenanceAnalysisItem {
  equipmentName: string;
  quantity: number;
  maintenancePeriodHours: number;
  annualMaintenanceCost: number;
  maintenanceCostPerHour: number;
}

export interface PersonnelProductivityItem {
  role: string;
  count: number;
  annualCost: number;
  productivityTonsPerPerson: number;
  costPerTonProduced: number;
}

export interface ScenarioResult {
  scenario: 'pessimistic' | 'normal' | 'optimistic';
  label: string;
  npv: number;
  irr: number;
  paybackPeriod: number;
  annualRevenue: number;
  annualCost: number;
  annualProfit: number;
}

export function calculateTotalCapex(params: Partial<ProjectParams>): number {
  const equipment = params?.equipmentCost ?? 0;
  const facility = params?.facilityCost ?? 0;
  const infra = params?.infrastructureCost ?? 0;
  const subtotal = equipment + facility + infra;
  const contingency = subtotal * ((params?.contingencyRate ?? 10) / 100);
  return subtotal + contingency;
}

export function calculateTotalOpex(params: Partial<ProjectParams>): number {
  const fuel = params?.fuelCost ?? 0;
  const personnel = params?.personnelCost ?? 0;
  const maintenance = params?.maintenanceCost ?? 0;
  const explosives = params?.explosivesCost ?? 0;
  const tire = params?.tireCost ?? 0;
  const stripping = params?.strippingCost ?? 0;
  const other = params?.otherOpex ?? 0;
  return fuel + personnel + maintenance + explosives + tire + stripping + other;
}

export function calculateAnnualRevenue(unitPrice: number, annualProduction: number, byProductRevenue: number = 0): number {
  return unitPrice * annualProduction * 1_000_000 + byProductRevenue * 1_000_000;
}

function getDepreciation(
  year: number,
  equipmentCost: number,
  facilityCost: number,
  equipmentDepLife: number,
  facilityDepLife: number,
  equipmentRenewalEnabled: boolean = true,
  equipmentRenewalCycleYears: number = 10
): number {
  let equipDep = 0;
  let facDep = 0;
  if (year > 0 && equipmentDepLife > 0 && equipmentCost > 0) {
    if (equipmentRenewalEnabled && equipmentRenewalCycleYears > 0) {
      // Renewal mode: equipment depreciates for equipmentDepLife years within each cycle
      // e.g., cycle=10, depLife=6: years 1-6 ON, 7-10 OFF, 11-16 ON, 17-20 OFF, ...
      const posInCycle = ((year - 1) % equipmentRenewalCycleYears) + 1; // 1-based position in cycle
      if (posInCycle <= equipmentDepLife) {
        equipDep = equipmentCost / equipmentDepLife;
      }
    } else {
      // No renewal: equipment depreciates only once (years 1 to equipmentDepLife)
      if (year <= equipmentDepLife) {
        equipDep = equipmentCost / equipmentDepLife;
      }
    }
  }
  if (year > 0 && year <= facilityDepLife && facilityDepLife > 0 && facilityCost > 0) {
    facDep = facilityCost / facilityDepLife;
  }
  return equipDep + facDep;
}

export function calculateCashFlows(params: ProjectParams): CashFlowRow[] {
  const r = (params?.discountRate ?? 5.82) / 100;
  const taxR = (params?.taxRate ?? 22) / 100;
  const royR = (params?.royaltyRate ?? 4) / 100;
  const creditR = (params?.creditRate ?? 4) / 100;
  const years = params?.projectLifeYears ?? 30;
  const creditYrs = params?.creditYears ?? 10;
  const totalCapex = params?.totalCapex ?? calculateTotalCapex(params);
  const annualRevenue = calculateAnnualRevenue(
    params?.unitPrice ?? 75,
    params?.annualProduction ?? 2,
    params?.byProductRevenue ?? 0
  );
  const capexMUSD = totalCapex;
  const annualRevMUSD = annualRevenue / 1_000_000;
  const totalOpexMUSD = (params?.totalOpex ?? 0);
  const forestEtcMUSD = (params?.forestCost ?? 0) + (params?.landCost ?? 0) + (params?.rehabilitationCost ?? 0);
  const strippingMUSD = (params?.annualStrippingVolume ?? 0) * (params?.strippingUnitCost ?? 1.05);
  const contractorMUSD = params?.contractorStrippingCost ?? 0;
  const plantOpMUSD = params?.plantOperatingCost ?? 0;
  const loanAmountMUSD = params?.loanAmount ?? 0;
  const creditTotal = loanAmountMUSD > 0 ? loanAmountMUSD : 0;
  const annualCreditPayment = (creditYrs > 0 && creditTotal > 0) ? creditTotal / creditYrs : 0;
  const annualCreditInterest = (creditYrs > 0 && creditTotal > 0) ? creditTotal * creditR : 0;
  // Year 0: total investment (CAPEX + forest/land/rehab) - loan is NOT subtracted
  const totalInvestment = capexMUSD + forestEtcMUSD;
  const cashFlows: CashFlowRow[] = [];
  let cumulative = 0;
  for (let t = 0; t <= years; t++) {
    const row: CashFlowRow = {
      year: t, revenue: 0, opex: 0, depreciation: 0, taxPayment: 0,
      royalty: 0, creditPayment: 0, creditInterest: 0,
      netCashFlow: 0, cumulativeCashFlow: 0, discountedCashFlow: 0,
    };
    if (t === 0) {
      row.netCashFlow = -totalInvestment;
    } else {
      row.revenue = annualRevMUSD;
      row.opex = totalOpexMUSD + strippingMUSD + contractorMUSD + plantOpMUSD;
      row.depreciation = getDepreciation(
        t, params?.equipmentCost ?? 0, params?.facilityCost ?? 0,
        params?.equipmentDepLife ?? 6, params?.facilityDepLife ?? 15,
        params?.equipmentRenewalEnabled ?? true,
        params?.equipmentRenewalCycleYears ?? 10
      );
      row.royalty = row.revenue * royR;
      if (t <= creditYrs) {
        row.creditPayment = annualCreditPayment;
        row.creditInterest = annualCreditInterest * ((creditYrs - t + 1) / creditYrs);
      }
      const taxableIncome = row.revenue - row.opex - row.depreciation - row.royalty - row.creditInterest;
      row.taxPayment = taxableIncome > 0 ? taxableIncome * taxR : 0;
      row.netCashFlow = row.revenue - row.opex - row.royalty - row.taxPayment - row.creditPayment - row.creditInterest;
    }
    cumulative += row.netCashFlow;
    row.cumulativeCashFlow = cumulative;
    const discountFactor = Math.pow(1 + r, t);
    row.discountedCashFlow = row.netCashFlow / discountFactor;
    cashFlows.push(row);
  }
  return cashFlows;
}

export function calculateNPV(cashFlows: CashFlowRow[]): number {
  return (cashFlows ?? []).reduce((sum: number, cf: CashFlowRow) => sum + (cf?.discountedCashFlow ?? 0), 0);
}

export function calculateIRR(cashFlows: CashFlowRow[], maxIterations: number = 1000): number {
  const flows = (cashFlows ?? []).map((cf: CashFlowRow) => cf?.netCashFlow ?? 0);
  if (flows?.length === 0) return 0;
  let low = -0.5;
  let high = 5.0;
  for (let i = 0; i < maxIterations; i++) {
    const mid = (low + high) / 2;
    let npv = 0;
    for (let t = 0; t < flows.length; t++) {
      npv += (flows[t] ?? 0) / Math.pow(1 + mid, t);
    }
    if (Math.abs(npv) < 0.001) return mid * 100;
    if (npv > 0) low = mid;
    else high = mid;
  }
  return ((low + high) / 2) * 100;
}

export function calculatePaybackPeriod(cashFlows: CashFlowRow[]): number {
  for (let i = 1; i < (cashFlows?.length ?? 0); i++) {
    if ((cashFlows?.[i]?.cumulativeCashFlow ?? 0) >= 0 && (cashFlows?.[i - 1]?.cumulativeCashFlow ?? 0) < 0) {
      const prev = Math.abs(cashFlows?.[i - 1]?.cumulativeCashFlow ?? 0);
      const curr = cashFlows?.[i]?.netCashFlow ?? 1;
      return (i - 1) + (curr !== 0 ? prev / curr : 0);
    }
  }
  if ((cashFlows?.[1]?.cumulativeCashFlow ?? 0) >= 0) return 1;
  return (cashFlows?.length ?? 1) - 1;
}

export function calculateBreakevenPrice(params: ProjectParams): number {
  let low = 0;
  let high = params?.unitPrice ? params.unitPrice * 5 : 500;
  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const testParams = { ...(params ?? {}), unitPrice: mid };
    const cfs = calculateCashFlows(testParams);
    const npv = calculateNPV(cfs);
    if (Math.abs(npv) < 0.01) return mid;
    if (npv > 0) high = mid;
    else low = mid;
  }
  return (low + high) / 2;
}

export function performFullAnalysis(params: ProjectParams): AnalysisResult {
  const cashFlows = calculateCashFlows(params);
  const npv = calculateNPV(cashFlows);
  const irr = calculateIRR(cashFlows);
  const paybackPeriod = calculatePaybackPeriod(cashFlows);
  const breakevenPrice = calculateBreakevenPrice(params);
  const totalRevenue = (cashFlows ?? []).reduce((s: number, cf: CashFlowRow) => s + (cf?.revenue ?? 0), 0);
  const totalCost = (cashFlows ?? []).reduce((s: number, cf: CashFlowRow) => s + (cf?.opex ?? 0) + (cf?.royalty ?? 0) + (cf?.taxPayment ?? 0) + (cf?.creditPayment ?? 0) + (cf?.creditInterest ?? 0), 0);
  return { npv, irr, paybackPeriod, breakevenPrice, totalRevenue, totalCost, cashFlows };
}

// === OPERATIONAL METRICS ===

export function calculateOperationalMetrics(
  params: ProjectParams,
  equipments: any[],
  personnels: any[]
): OperationalMetrics {
  const annualProductionTons = (params?.annualProduction ?? 0) * 1_000_000; // Mt to tons
  const totalOpexUSD = (params?.totalOpex ?? 0) * 1_000_000;
  const totalCapexUSD = (params?.totalCapex ?? 0) * 1_000_000;
  const years = params?.projectLifeYears ?? 30;
  const totalPersonnelCount = (personnels ?? []).reduce((s: number, p: any) => s + (p?.count ?? 0), 0);

  // Unit production cost (OPEX only) USD/ton
  const unitProductionCost = annualProductionTons > 0 ? totalOpexUSD / annualProductionTons : 0;

  // Cost per ton including CAPEX amortized
  const annualCapexAmortized = years > 0 ? totalCapexUSD / years : 0;
  const costPerTonIncCapex = annualProductionTons > 0 ? (totalOpexUSD + annualCapexAmortized) / annualProductionTons : 0;

  // Reserve life
  const totalReserves = (params?.totalReserves ?? 0);
  const reserveLife = (params?.annualProduction ?? 0) > 0 && totalReserves > 0
    ? totalReserves / (params?.annualProduction ?? 1)
    : 0;

  // Capacity utilization
  const maxCapacity = params?.maxAnnualCapacity ?? 0;
  const capacityUtilization = maxCapacity > 0
    ? ((params?.annualProduction ?? 0) / maxCapacity) * 100
    : 0;

  // Personnel productivity
  const personnelProductivity = totalPersonnelCount > 0
    ? annualProductionTons / totalPersonnelCount
    : 0;

  // Fuel totals from equipment
  const fuelPricePerLiter = params?.fuelPricePerLiter ?? 0;
  const totalFuelLitersAnnual = (equipments ?? []).reduce((s: number, eq: any) => {
    const hourly = eq?.hourlyFuelConsumption ?? 0;
    const dailyH = eq?.dailyWorkHours ?? 8;
    const qty = eq?.quantity ?? 1;
    return s + (hourly * dailyH * 365 * qty);
  }, 0);
  const totalFuelCostAnnual = totalFuelLitersAnnual * fuelPricePerLiter;

  // Maintenance totals from equipment
  const totalMaintenanceCostAnnual = (equipments ?? []).reduce((s: number, eq: any) => {
    return s + ((eq?.maintenanceCost ?? 0) * (eq?.quantity ?? 1));
  }, 0);

  // Revenue calculation
  const annualRevMUSD = calculateAnnualRevenue(
    params?.unitPrice ?? 0,
    params?.annualProduction ?? 0,
    params?.byProductRevenue ?? 0
  ) / 1_000_000;
  const monthlyRevenue = annualRevMUSD / 12;
  const monthlyCost = (params?.totalOpex ?? 0) / 12;
  const monthlyProfit = monthlyRevenue - monthlyCost;
  const annualProfit = annualRevMUSD - (params?.totalOpex ?? 0);
  const productionPerDay = annualProductionTons / 365;

  return {
    unitProductionCost,
    costPerTonIncCapex,
    reserveLife,
    capacityUtilization,
    personnelProductivity,
    totalFuelCostAnnual,
    totalMaintenanceCostAnnual,
    monthlyRevenue,
    monthlyCost,
    monthlyProfit,
    annualProfit,
    productionPerDay,
  };
}

// === FUEL ANALYSIS ===

export function calculateFuelAnalysis(equipments: any[], fuelPricePerLiter: number): FuelAnalysisItem[] {
  return (equipments ?? []).filter((eq: any) => (eq?.hourlyFuelConsumption ?? 0) > 0).map((eq: any) => {
    const hourly = eq?.hourlyFuelConsumption ?? 0;
    const dailyH = eq?.dailyWorkHours ?? 8;
    const qty = eq?.quantity ?? 1;
    const daily = hourly * dailyH * qty;
    const monthly = daily * 30;
    const annual = daily * 365;
    return {
      equipmentName: eq?.machineType ?? '',
      quantity: qty,
      hourlyConsumption: hourly,
      dailyHours: dailyH,
      dailyConsumption: daily,
      monthlyConsumption: monthly,
      annualConsumption: annual,
      annualCost: annual * fuelPricePerLiter,
    };
  });
}

// === MAINTENANCE ANALYSIS ===

export function calculateMaintenanceAnalysis(equipments: any[]): MaintenanceAnalysisItem[] {
  return (equipments ?? []).filter((eq: any) => (eq?.maintenanceCost ?? 0) > 0).map((eq: any) => {
    const qty = eq?.quantity ?? 1;
    const maintCost = (eq?.maintenanceCost ?? 0) * qty;
    const dailyH = eq?.dailyWorkHours ?? 8;
    const annualHours = dailyH * 365 * qty;
    return {
      equipmentName: eq?.machineType ?? '',
      quantity: qty,
      maintenancePeriodHours: eq?.maintenancePeriodHours ?? 500,
      annualMaintenanceCost: maintCost,
      maintenanceCostPerHour: annualHours > 0 ? maintCost / annualHours : 0,
    };
  });
}

// === PERSONNEL PRODUCTIVITY ===

export function calculatePersonnelProductivity(
  personnels: any[],
  annualProductionTons: number
): PersonnelProductivityItem[] {
  return (personnels ?? []).filter((p: any) => (p?.count ?? 0) > 0).map((p: any) => {
    const count = p?.count ?? 1;
    const annualCost = (p?.annualCost ?? 0) || (count * (p?.monthlySalary ?? 0) * 12);
    const productivity = count > 0 ? annualProductionTons / count : 0;
    const costPerTon = annualProductionTons > 0 ? annualCost / annualProductionTons : 0;
    return {
      role: p?.role ?? '',
      count,
      annualCost,
      productivityTonsPerPerson: productivity,
      costPerTonProduced: costPerTon,
    };
  });
}

// === SCENARIO ANALYSIS ===

export function calculateScenarioAnalysis(params: ProjectParams): ScenarioResult[] {
  const scenarios: { key: 'pessimistic' | 'normal' | 'optimistic'; label: string; priceFactor: number; costFactor: number; productionFactor: number }[] = [
    { key: 'pessimistic', label: 'Kötümser', priceFactor: 0.8, costFactor: 1.2, productionFactor: 0.85 },
    { key: 'normal', label: 'Normal', priceFactor: 1.0, costFactor: 1.0, productionFactor: 1.0 },
    { key: 'optimistic', label: 'İyimser', priceFactor: 1.2, costFactor: 0.85, productionFactor: 1.1 },
  ];

  return scenarios.map((sc) => {
    const modified: ProjectParams = {
      ...params,
      unitPrice: (params?.unitPrice ?? 0) * sc.priceFactor,
      annualProduction: (params?.annualProduction ?? 0) * sc.productionFactor,
      totalOpex: (params?.totalOpex ?? 0) * sc.costFactor,
      fuelCost: (params?.fuelCost ?? 0) * sc.costFactor,
      personnelCost: (params?.personnelCost ?? 0) * sc.costFactor,
      maintenanceCost: (params?.maintenanceCost ?? 0) * sc.costFactor,
    };
    const cfs = calculateCashFlows(modified);
    const npv = calculateNPV(cfs);
    const irr = calculateIRR(cfs);
    const payback = calculatePaybackPeriod(cfs);
    const annualRev = calculateAnnualRevenue(modified.unitPrice, modified.annualProduction, modified.byProductRevenue ?? 0) / 1_000_000;
    const annualCost = modified.totalOpex;
    return {
      scenario: sc.key,
      label: sc.label,
      npv,
      irr,
      paybackPeriod: payback,
      annualRevenue: annualRev,
      annualCost,
      annualProfit: annualRev - annualCost,
    };
  });
}

// === MONTE CARLO SIMULATION ===

export interface MonteCarloResult {
  npvValues: number[];
  irrValues: number[];
  stats: {
    npvMean: number;
    npvMedian: number;
    npvStdDev: number;
    npvMin: number;
    npvMax: number;
    npvPositiveProb: number;
    irrMean: number;
    irrMedian: number;
    irrStdDev: number;
  };
  histogram: { bin: string; count: number; cumulative: number }[];
}

function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function runMonteCarloSimulation(params: ProjectParams, iterations: number = 2000): MonteCarloResult {
  const npvValues: number[] = [];
  const irrValues: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const priceVariation = 1 + gaussianRandom() * 0.15;
    const costVariation = 1 + gaussianRandom() * 0.10;
    const prodVariation = 1 + gaussianRandom() * 0.08;

    const modified: ProjectParams = {
      ...params,
      unitPrice: (params?.unitPrice ?? 75) * Math.max(0.5, priceVariation),
      totalOpex: (params?.totalOpex ?? 0) * Math.max(0.5, costVariation),
      fuelCost: (params?.fuelCost ?? 0) * Math.max(0.5, costVariation),
      personnelCost: (params?.personnelCost ?? 0) * Math.max(0.5, costVariation),
      maintenanceCost: (params?.maintenanceCost ?? 0) * Math.max(0.5, costVariation),
      annualProduction: (params?.annualProduction ?? 2) * Math.max(0.5, prodVariation),
    };

    const cfs = calculateCashFlows(modified);
    npvValues.push(calculateNPV(cfs));
    irrValues.push(calculateIRR(cfs));
  }

  npvValues.sort((a, b) => a - b);
  irrValues.sort((a, b) => a - b);

  const npvMean = npvValues.reduce((s, v) => s + v, 0) / npvValues.length;
  const irrMean = irrValues.reduce((s, v) => s + v, 0) / irrValues.length;
  const npvMedian = npvValues[Math.floor(npvValues.length / 2)] ?? 0;
  const irrMedian = irrValues[Math.floor(irrValues.length / 2)] ?? 0;
  const npvVariance = npvValues.reduce((s, v) => s + Math.pow(v - npvMean, 2), 0) / npvValues.length;
  const npvStdDev = Math.sqrt(npvVariance);
  const irrVariance = irrValues.reduce((s, v) => s + Math.pow(v - irrMean, 2), 0) / irrValues.length;
  const irrStdDev = Math.sqrt(irrVariance);
  const npvPositiveProb = (npvValues.filter(v => v >= 0).length / npvValues.length) * 100;

  // Build histogram (20 bins)
  const binCount = 20;
  const npvMin = npvValues[0] ?? 0;
  const npvMax = npvValues[npvValues.length - 1] ?? 0;
  const binWidth = (npvMax - npvMin) / binCount || 1;
  const histogram: { bin: string; count: number; cumulative: number }[] = [];
  let cumCount = 0;
  for (let b = 0; b < binCount; b++) {
    const lo = npvMin + b * binWidth;
    const hi = lo + binWidth;
    const count = npvValues.filter(v => v >= lo && (b === binCount - 1 ? v <= hi : v < hi)).length;
    cumCount += count;
    histogram.push({
      bin: `${lo.toFixed(1)}`,
      count,
      cumulative: (cumCount / npvValues.length) * 100,
    });
  }

  return {
    npvValues,
    irrValues,
    stats: { npvMean, npvMedian, npvStdDev, npvMin, npvMax, npvPositiveProb, irrMean, irrMedian, irrStdDev },
    histogram,
  };
}

// === CARBON FOOTPRINT ===

export interface CarbonFootprintResult {
  equipmentEmissions: { name: string; annualFuelLiters: number; annualCO2Tons: number }[];
  totalAnnualCO2: number;
  totalLifetimeCO2: number;
  co2PerTonProduced: number;
  co2PerRevenueUnit: number;
}

const DIESEL_CO2_KG_PER_LITER = 2.68;

export function calculateCarbonFootprint(
  equipments: any[],
  params: ProjectParams
): CarbonFootprintResult {
  const equipmentEmissions = (equipments ?? [])
    .filter((eq: any) => (eq?.hourlyFuelConsumption ?? 0) > 0 && eq?.powerType !== 'electric')
    .map((eq: any) => {
      const hourly = eq?.hourlyFuelConsumption ?? 0;
      const dailyH = eq?.dailyWorkHours ?? 8;
      const qty = eq?.quantity ?? 1;
      const annualFuelLiters = hourly * dailyH * 365 * qty;
      const annualCO2Tons = (annualFuelLiters * DIESEL_CO2_KG_PER_LITER) / 1000;
      return { name: eq?.machineType ?? '', annualFuelLiters, annualCO2Tons };
    });

  const totalAnnualCO2 = equipmentEmissions.reduce((s, e) => s + e.annualCO2Tons, 0);
  const totalLifetimeCO2 = totalAnnualCO2 * (params?.projectLifeYears ?? 30);
  const annualProductionTons = (params?.annualProduction ?? 0) * 1_000_000;
  const co2PerTonProduced = annualProductionTons > 0 ? (totalAnnualCO2 * 1000) / annualProductionTons : 0; // kg CO2/ton
  const annualRevenue = (params?.unitPrice ?? 0) * (params?.annualProduction ?? 0);
  const co2PerRevenueUnit = annualRevenue > 0 ? totalAnnualCO2 / annualRevenue : 0;

  return { equipmentEmissions, totalAnnualCO2, totalLifetimeCO2, co2PerTonProduced, co2PerRevenueUnit };
}

// === WATER CONSUMPTION ===

export interface WaterAnalysisResult {
  dailyConsumption: number;
  monthlyConsumption: number;
  annualConsumption: number;
  lifetimeConsumption: number;
  costPerM3: number;
  annualWaterCost: number;
}

export function calculateWaterAnalysis(params: ProjectParams): WaterAnalysisResult {
  const daily = params?.waterConsumptionDaily ?? 0;
  const monthly = daily * 30;
  const annual = daily * 365;
  const lifetime = annual * (params?.projectLifeYears ?? 30);
  const costPerM3 = 0; // Could be parameterized
  return { dailyConsumption: daily, monthlyConsumption: monthly, annualConsumption: annual, lifetimeConsumption: lifetime, costPerM3, annualWaterCost: annual * costPerM3 };
}

// === REHABILITATION ANALYSIS ===

export interface RehabilitationResult {
  totalArea: number;
  costPerHa: number;
  totalCost: number;
  annualProvision: number;
  phases: { phase: string; percentage: number; cost: number }[];
}

export function calculateRehabilitation(params: ProjectParams): RehabilitationResult {
  const area = params?.rehabilitationAreaHa ?? 0;
  const costPerHa = params?.rehabilitationCostPerHa ?? 0;
  const totalCost = area * costPerHa;
  const years = params?.projectLifeYears ?? 30;
  const annualProvision = years > 0 ? totalCost / years : 0;
  const phases = [
    { phase: 'Toprak Örtüsü Kaldırma', percentage: 15, cost: totalCost * 0.15 },
    { phase: 'Arazi Düzenleme', percentage: 25, cost: totalCost * 0.25 },
    { phase: 'Toprak Serme', percentage: 20, cost: totalCost * 0.20 },
    { phase: 'Ağaçlandırma/Yeşillendirme', percentage: 25, cost: totalCost * 0.25 },
    { phase: 'İzleme ve Bakım', percentage: 15, cost: totalCost * 0.15 },
  ];
  return { totalArea: area, costPerHa, totalCost, annualProvision, phases };
}

// === FINANCING ANALYSIS ===

export interface LoanScheduleRow {
  year: number;
  beginningBalance: number;
  payment: number;
  interest: number;
  principal: number;
  endingBalance: number;
}

export interface FinancingResult {
  totalInvestment: number;
  equityAmount: number;
  loanAmount: number;
  equityRatio: number;
  debtRatio: number;
  annualPayment: number;
  totalInterest: number;
  totalPayment: number;
  dscr: number;
  schedule: LoanScheduleRow[];
}

export function calculateFinancing(params: ProjectParams): FinancingResult {
  const totalInvestment = (params?.totalCapex ?? 0);
  const equityRatio = (params?.equityRatio ?? 100) / 100;
  const equityAmount = totalInvestment * equityRatio;
  const loanAmt = params?.loanAmount ?? (totalInvestment * (1 - equityRatio));
  const rate = (params?.loanInterestRate ?? params?.creditRate ?? 4) / 100;
  const term = params?.loanTermYears ?? params?.creditYears ?? 10;

  // PMT calculation (annuity)
  let annualPayment = 0;
  if (term > 0 && loanAmt > 0) {
    if (rate > 0) {
      annualPayment = loanAmt * (rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
    } else {
      annualPayment = loanAmt / term;
    }
  }

  const schedule: LoanScheduleRow[] = [];
  let balance = loanAmt;
  let totalInterest = 0;
  for (let y = 1; y <= term && balance > 0.01; y++) {
    const interest = balance * rate;
    const principal = annualPayment - interest;
    const endBalance = Math.max(0, balance - principal);
    schedule.push({
      year: y,
      beginningBalance: balance,
      payment: annualPayment,
      interest,
      principal,
      endingBalance: endBalance,
    });
    totalInterest += interest;
    balance = endBalance;
  }

  // DSCR = Net Operating Income / Debt Service
  const annualRev = (params?.unitPrice ?? 0) * (params?.annualProduction ?? 0) * 1_000_000 / 1_000_000;
  const netOperatingIncome = annualRev - (params?.totalOpex ?? 0);
  const dscr = annualPayment > 0 ? netOperatingIncome / annualPayment : 0;

  return {
    totalInvestment,
    equityAmount,
    loanAmount: loanAmt,
    equityRatio: equityRatio * 100,
    debtRatio: (1 - equityRatio) * 100,
    annualPayment,
    totalInterest,
    totalPayment: loanAmt + totalInterest,
    dscr,
    schedule,
  };
}

// === DEPRECIATION TABLE ===

export interface DepreciationRow {
  year: number;
  equipmentDep: number;
  facilityDep: number;
  totalDep: number;
  equipmentBookValue: number;
  facilityBookValue: number;
}

export function calculateDepreciationTable(params: ProjectParams): DepreciationRow[] {
  const eqCost = (params?.equipmentCost ?? 0);
  const facCost = (params?.facilityCost ?? 0);
  const eqLife = params?.equipmentDepLife ?? 6;
  const facLife = params?.facilityDepLife ?? 15;
  const method = params?.depreciationMethod ?? 'linear';
  const years = params?.projectLifeYears ?? 30;
  const renewalEnabled = params?.equipmentRenewalEnabled ?? true;
  const renewalCycle = params?.equipmentRenewalCycleYears ?? 10;

  const rows: DepreciationRow[] = [];
  let eqBook = eqCost;
  let facBook = facCost;

  for (let y = 1; y <= years; y++) {
    let eqDep = 0;
    let facDep = 0;

    // Equipment depreciation with renewal logic
    if (eqLife > 0 && eqCost > 0) {
      if (renewalEnabled && renewalCycle > 0) {
        const posInCycle = ((y - 1) % renewalCycle) + 1;
        // Reset book value at start of each new cycle
        if (posInCycle === 1) eqBook = eqCost;
        if (posInCycle <= eqLife) {
          if (method === 'declining') {
            const eqRate = 2 / eqLife;
            eqDep = Math.min(eqBook * eqRate, eqBook);
          } else {
            eqDep = eqCost / eqLife;
          }
        }
      } else {
        // No renewal: depreciate only once
        if (y <= eqLife) {
          if (method === 'declining') {
            const eqRate = 2 / eqLife;
            eqDep = Math.min(eqBook * eqRate, eqBook);
          } else {
            eqDep = eqCost / eqLife;
          }
        }
      }
    }

    // Facility depreciation (no renewal - single lifecycle)
    if (facLife > 0 && facCost > 0 && y <= facLife) {
      if (method === 'declining') {
        const facRate = 2 / facLife;
        facDep = Math.min(facBook * facRate, facBook);
      } else {
        facDep = facCost / facLife;
      }
    }

    eqBook = Math.max(0, eqBook - eqDep);
    facBook = Math.max(0, facBook - facDep);

    rows.push({ year: y, equipmentDep: eqDep, facilityDep: facDep, totalDep: eqDep + facDep, equipmentBookValue: eqBook, facilityBookValue: facBook });
  }
  return rows;
}

// === RISK MATRIX ===

export interface RiskItem {
  id: string;
  category: string;
  name: string;
  description: string;
  probability: number; // 1-5
  impact: number; // 1-5
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string;
}

export function generateRiskMatrix(params: ProjectParams): RiskItem[] {
  const npv = params?.totalCapex ?? 0;
  const irr = params?.discountRate ?? 5;
  const reserves = params?.totalReserves ?? 0;

  const risks: RiskItem[] = [
    {
      id: 'r1', category: 'Finansal', name: 'Maden Fiyat Dalgalanması',
      description: 'Emtia fiyatlarında beklenmedik düşüş',
      probability: 4, impact: 5, score: 20, level: 'critical',
      mitigation: 'Vadeli satış sözleşmeleri, fiyat koruması (hedging)',
    },
    {
      id: 'r2', category: 'Finansal', name: 'Döviz Kuru Riski',
      description: 'Yerel para biriminde değer kaybı',
      probability: 3, impact: 3, score: 9, level: 'medium',
      mitigation: 'Döviz bazlı gelir yapısı, forward kontratlar',
    },
    {
      id: 'r3', category: 'Finansal', name: 'Maliyet Artışı',
      description: 'İşletme maliyetlerinde enflasyonist artış',
      probability: 4, impact: 3, score: 12, level: 'high',
      mitigation: 'Verimlilik optimizasyonu, uzun vadeli tedarik sözleşmeleri',
    },
    {
      id: 'r4', category: 'Teknik', name: 'Rezerv Belirsizliği',
      description: 'Gerçek rezervlerin tahminden az çıkması',
      probability: reserves > 0 ? 2 : 4, impact: 5, score: 0, level: 'high',
      mitigation: 'Detaylı sondaj programı, jeoistatistik modelleme',
    },
    {
      id: 'r5', category: 'Teknik', name: 'Ekipman Arızası',
      description: 'Ana üretim ekipmanlarında beklenmedik arıza',
      probability: 3, impact: 3, score: 9, level: 'medium',
      mitigation: 'Önleyici bakım programı, yedek ekipman bulundurma',
    },
    {
      id: 'r6', category: 'Teknik', name: 'Tenör Düşüklüğü',
      description: 'Cevher kalitesinde beklenen altında düşüş',
      probability: 3, impact: 4, score: 12, level: 'high',
      mitigation: 'Cevher harmanlama, seçici madencilik, tenör kontrol programı',
    },
    {
      id: 'r7', category: 'Çevresel', name: 'Çevresel İhlal / Ceza',
      description: 'Çevre mevzuatına uyumsuzluk nedeniyle ceza',
      probability: 2, impact: 4, score: 8, level: 'medium',
      mitigation: 'Çevre yönetim sistemi, düzenli denetim, ISO 14001',
    },
    {
      id: 'r8', category: 'Çevresel', name: 'Su Kirliliği',
      description: 'Maden suyu deşarjında kirlilik',
      probability: 2, impact: 5, score: 10, level: 'high',
      mitigation: 'Su arıtma tesisi, kapalı devre su sistemi',
    },
    {
      id: 'r9', category: 'Operasyonel', name: 'İş Kazası',
      description: 'Ciddi iş kazası riskleri',
      probability: 2, impact: 5, score: 10, level: 'high',
      mitigation: 'İSG eğitim programı, kişisel koruyucu donanım, OHSAS 18001',
    },
    {
      id: 'r10', category: 'Operasyonel', name: 'Nitelikli İşgücü Eksikliği',
      description: 'Uzman personel temin zorluğu',
      probability: 3, impact: 2, score: 6, level: 'medium',
      mitigation: 'Rekabetçi ücret politikası, eğitim programları',
    },
    {
      id: 'r11', category: 'Yasal', name: 'Ruhsat / İzin Sorunu',
      description: 'Maden ruhsatı yenileme veya izin sorunları',
      probability: 2, impact: 5, score: 10, level: 'high',
      mitigation: 'Erken başvuru, yasal danışmanlık, çevresel uyum',
    },
    {
      id: 'r12', category: 'Yasal', name: 'Vergi/Royalti Artışı',
      description: 'Devlet paylarında beklenmedik artış',
      probability: 2, impact: 3, score: 6, level: 'medium',
      mitigation: 'Senaryo analizi, lobicilik faaliyetleri',
    },
  ];

  // Recalculate scores
  return risks.map(r => {
    const score = r.probability * r.impact;
    let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (score >= 16) level = 'critical';
    else if (score >= 10) level = 'high';
    else if (score >= 5) level = 'medium';
    return { ...r, score, level };
  });
}

// === PROJECT PHASES / TIMELINE ===

export interface ProjectPhase {
  name: string;
  startYear: number;
  endYear: number;
  color: string;
}

export function generateProjectPhases(params: ProjectParams): ProjectPhase[] {
  const years = params?.projectLifeYears ?? 30;
  return [
    { name: 'Keşif & Fizibilite', startYear: -2, endYear: 0, color: '#8b5cf6' },
    { name: 'İnşaat & Kurulum', startYear: 0, endYear: 2, color: '#3b82f6' },
    { name: 'Üretim (Ramp-up)', startYear: 2, endYear: 4, color: '#f59e0b' },
    { name: 'Tam Kapasite Üretim', startYear: 4, endYear: Math.max(years - 3, 5), color: '#10b981' },
    { name: 'Üretim Azalma', startYear: Math.max(years - 3, 5), endYear: years, color: '#ef4444' },
    { name: 'Kapatma & Rehabilitasyon', startYear: years, endYear: years + 3, color: '#6b7280' },
  ];
}

// === SENSITIVITY ANALYSIS ===

export interface SensitivityPoint {
  changePercent: number;
  npv: number;
  irr: number;
}

export function sensitivityAnalysis(
  params: ProjectParams,
  parameter: 'price' | 'capex' | 'opex' | 'discountRate' | 'oreGrade' | 'exchangeRate' | 'fuelPrice',
  range: number[] = [-30, -20, -10, 0, 10, 20, 30]
): SensitivityPoint[] {
  return (range ?? []).map((pct: number) => {
    const modified = { ...(params ?? {}) };
    const factor = 1 + (pct ?? 0) / 100;

    switch (parameter) {
      case 'price':
        modified.unitPrice = (params?.unitPrice ?? 75) * factor;
        break;
      case 'capex':
        modified.totalCapex = (params?.totalCapex ?? 0) * factor;
        modified.equipmentCost = (params?.equipmentCost ?? 0) * factor;
        modified.facilityCost = (params?.facilityCost ?? 0) * factor;
        break;
      case 'opex':
        modified.totalOpex = (params?.totalOpex ?? 0) * factor;
        modified.fuelCost = (params?.fuelCost ?? 0) * factor;
        modified.personnelCost = (params?.personnelCost ?? 0) * factor;
        break;
      case 'discountRate':
        modified.discountRate = (params?.discountRate ?? 5.82) * factor;
        break;
      case 'oreGrade':
        // Ore grade affects production proportionally
        modified.annualProduction = (params?.annualProduction ?? 2) * factor;
        break;
      case 'exchangeRate':
        // Exchange rate change affects costs (higher rate = higher costs in local currency)
        modified.totalOpex = (params?.totalOpex ?? 0) * factor;
        modified.fuelCost = (params?.fuelCost ?? 0) * factor;
        modified.personnelCost = (params?.personnelCost ?? 0) * factor;
        modified.maintenanceCost = (params?.maintenanceCost ?? 0) * factor;
        break;
      case 'fuelPrice':
        // Fuel price change affects fuel cost directly
        modified.fuelCost = (params?.fuelCost ?? 0) * factor;
        modified.totalOpex = (params?.totalOpex ?? 0) - (params?.fuelCost ?? 0) + (params?.fuelCost ?? 0) * factor;
        break;
    }

    const cfs = calculateCashFlows(modified);
    return {
      changePercent: pct,
      npv: calculateNPV(cfs),
      irr: calculateIRR(cfs),
    };
  });
}
