import type { PrismaClient } from '@prisma/client';
import { performFullAnalysis } from '@/lib/calculations';
import { DEMO_PROJECTS, getDemoProjectById } from './catalog';
import type { DemoProjectDefinition } from './types';

function buildScalarData(demo: DemoProjectDefinition) {
  const analysis = performFullAnalysis(demo.params);
  const cashFlowData = (analysis?.cashFlows ?? []).map((cf) => ({
    year: cf?.year ?? 0,
    revenue: cf?.revenue ?? 0,
    opex: cf?.opex ?? 0,
    depreciation: cf?.depreciation ?? 0,
    taxPayment: cf?.taxPayment ?? 0,
    royalty: cf?.royalty ?? 0,
    creditPayment: cf?.creditPayment ?? 0,
    creditInterest: cf?.creditInterest ?? 0,
    netCashFlow: cf?.netCashFlow ?? 0,
    cumulativeCashFlow: cf?.cumulativeCashFlow ?? 0,
    discountedCashFlow: cf?.discountedCashFlow ?? 0,
  }));

  const scalarData = {
    name: demo.name,
    mineType: demo.mineType,
    miningMethod: demo.miningMethod,
    location: demo.location,
    status: 'demo',
    currency: demo.currency,
    exchangeRate: demo.exchangeRate,
    fuelPricePerLiter: demo.fuelPricePerLiter,
    electricityUnitPrice: demo.electricityUnitPrice,
    explosiveUnitPrice: demo.explosiveUnitPrice,
    totalReserves: demo.totalReserves,
    maxAnnualCapacity: demo.maxAnnualCapacity,
    oreGrade: demo.oreGrade,
    oreGradeUnit: demo.oreGradeUnit,
    waterConsumptionDaily: demo.waterConsumptionDaily,
    rehabilitationAreaHa: demo.rehabilitationAreaHa,
    rehabilitationCostPerHa: demo.rehabilitationCostPerHa,
    loanAmount: demo.loanAmount,
    loanInterestRate: demo.loanInterestRate,
    loanTermYears: demo.loanTermYears,
    equityRatio: demo.equityRatio,
    depreciationMethod: demo.depreciationMethod,
    equipmentRenewalEnabled: demo.equipmentRenewalEnabled,
    equipmentRenewalCycleYears: demo.equipmentRenewalCycleYears,
    latitude: demo.latitude,
    longitude: demo.longitude,
    projectLifeYears: demo.params.projectLifeYears,
    discountRate: demo.params.discountRate,
    taxRate: demo.params.taxRate,
    royaltyRate: demo.params.royaltyRate,
    creditRate: demo.params.creditRate,
    creditYears: demo.params.creditYears,
    unitPrice: demo.params.unitPrice,
    annualProduction: demo.params.annualProduction,
    productionUnit: 'Mt',
    plantProcessingRate: demo.params.plantProcessingRate,
    equipmentCost: demo.params.equipmentCost,
    facilityCost: demo.params.facilityCost,
    infrastructureCost: demo.params.infrastructureCost,
    contingencyRate: demo.params.contingencyRate,
    totalCapex: demo.params.totalCapex,
    fuelCost: demo.params.fuelCost,
    personnelCost: demo.params.personnelCost,
    maintenanceCost: demo.params.maintenanceCost,
    explosivesCost: demo.params.explosivesCost,
    tireCost: demo.params.tireCost,
    strippingCost: demo.params.strippingCost,
    otherOpex: demo.params.otherOpex,
    totalOpex: demo.params.totalOpex,
    forestCost: demo.params.forestCost,
    landCost: demo.params.landCost,
    rehabilitationCost: demo.params.rehabilitationCost,
    annualStrippingVolume: demo.params.annualStrippingVolume,
    strippingUnitCost: demo.params.strippingUnitCost,
    contractorStrippingCost: demo.params.contractorStrippingCost,
    plantOperatingCost: demo.params.plantOperatingCost,
    equipmentDepLife: demo.params.equipmentDepLife,
    facilityDepLife: demo.params.facilityDepLife,
    npv: analysis?.npv ?? 0,
    irr: analysis?.irr ?? 0,
    paybackPeriod: analysis?.paybackPeriod ?? 0,
    breakevenPrice: analysis?.breakevenPrice ?? 0,
    totalRevenue: analysis?.totalRevenue ?? 0,
    totalCost: analysis?.totalCost ?? 0,
    byProductRevenue: demo.params.byProductRevenue ?? 0,
    customCashFlows: false,
  };

  return { scalarData, cashFlowData, analysis };
}

/**
 * Idempotent ensure for one demo definition.
 * Creates with nested children if missing; updates scalars only if present.
 */
export async function ensureDemoProject(
  prisma: PrismaClient,
  demo: DemoProjectDefinition
): Promise<{ id: string; created: boolean }> {
  const { scalarData, cashFlowData } = buildScalarData(demo);

  const existing = await prisma.miningProject.findUnique({
    where: { id: demo.id },
    select: { id: true },
  });

  if (existing) {
    await prisma.miningProject.update({
      where: { id: demo.id },
      data: {
        ...scalarData,
        // Refresh cached cash-flow rows so demo input corrections stay consistent.
        cashFlows: {
          deleteMany: {},
          create: cashFlowData,
        },
      },
    });
    return { id: demo.id, created: false };
  }

  await prisma.miningProject.create({
    data: {
      id: demo.id,
      ...scalarData,
      cashFlows: { create: cashFlowData },
      equipments: {
        create: demo.equipments.map((eq) => ({
          machineType: String(eq.machineType ?? ''),
          equipmentCategory: String(eq.equipmentCategory ?? 'general'),
          model: String(eq.model ?? ''),
          tonnageCapacity: String(eq.tonnageCapacity ?? ''),
          quantity: Number(eq.quantity ?? 1),
          spareQuantity: Number(eq.spareQuantity ?? 0),
          unitCost: Number(eq.unitCost ?? 0),
          totalCost: Number(eq.totalCost ?? 0),
          fuelConsumption: Number(eq.fuelConsumption ?? 0),
          maintenanceCost: Number(eq.maintenanceCost ?? 0),
          dailyWorkHours: Number(eq.dailyWorkHours ?? 8),
          maintenancePeriodHours: Number(eq.maintenancePeriodHours ?? 500),
          operatorCount: Number(eq.operatorCount ?? 1),
          powerType: String(eq.powerType ?? 'diesel'),
          hourlyFuelConsumption: Number(eq.hourlyFuelConsumption ?? 0),
          productionImpact: Number(eq.productionImpact ?? 0),
          drillCapacity: Number(eq.drillCapacity ?? 0),
          holeDiameter: Number(eq.holeDiameter ?? 0),
          maxDrillDepth: Number(eq.maxDrillDepth ?? 0),
          bucketVolume: Number(eq.bucketVolume ?? 0),
          transportCapacity: Number(eq.transportCapacity ?? 0),
          loadingCapacity: Number(eq.loadingCapacity ?? 0),
          crushingCapacity: Number(eq.crushingCapacity ?? 0),
          gallerySuitability: String(eq.gallerySuitability ?? ''),
        })),
      },
      personnels: {
        create: demo.personnels.map((p) => {
          const count = Number(p.count ?? 1);
          const monthlySalary = Number(p.monthlySalary ?? 0);
          return {
            role: String(p.role ?? ''),
            count,
            monthlySalary,
            annualCost: count * monthlySalary * 12,
          };
        }),
      },
      byProducts: {
        create: demo.byProducts.map((bp) => ({
          name: String(bp.name ?? ''),
          annualProduction: Number(bp.annualProduction ?? 0),
          productionUnit: String(bp.productionUnit ?? 'ton'),
          unitPrice: Number(bp.unitPrice ?? 0),
          priceUnit: String(bp.priceUnit ?? 'USD/ton'),
          totalRevenue: Number(bp.totalRevenue ?? 0),
        })),
      },
      methodCosts: {
        create: demo.methodCosts.map((mc) => ({
          name: String(mc.name ?? ''),
          category: String(mc.category ?? 'other'),
          value: Number(mc.value ?? 0),
          unit: String(mc.unit ?? 'MUSD'),
        })),
      },
    },
  });

  return { id: demo.id, created: true };
}

/** Ensure every registered demo project exists (idempotent). */
export async function ensureAllDemoProjects(
  prisma: PrismaClient
): Promise<{ id: string; created: boolean }[]> {
  const results: { id: string; created: boolean }[] = [];
  for (const demo of DEMO_PROJECTS) {
    results.push(await ensureDemoProject(prisma, demo));
  }
  return results;
}

/** @deprecated Use ensureDemoProject / ensureAllDemoProjects. */
export async function ensureCopperMineDemo(
  prisma: PrismaClient
): Promise<{ id: string; created: boolean }> {
  const copper = getDemoProjectById('demo-copper-mine');
  if (!copper) throw new Error('Copper demo definition missing from catalog');
  return ensureDemoProject(prisma, copper);
}
