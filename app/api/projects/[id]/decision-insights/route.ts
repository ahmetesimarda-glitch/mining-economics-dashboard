export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  runMonteCarloSimulation,
  sensitivityAnalysis,
  type ProjectParams,
} from '@/lib/calculations';
import {
  generateDecisionInsights,
  deriveAverageAnnualCashFlow,
  deriveInitialInvestmentFromCashFlows,
  deriveNegativeCashFlowYearRatio,
  deriveLateCashFlowConcentration,
  type DecisionInsightsInput,
  type SensitivityInsightResults,
} from '@/lib/decision-insights';
import { parseCountryFromLocation } from '@/lib/reports/pdf/helpers';
import { ApiError, publicErrorMessage } from '@/lib/api-errors';
import { translations, type Locale } from '@/lib/i18n/translations';

const SENSITIVITY_RANGE = [-30, -20, -10, 0, 10, 20, 30] as const;

function toProjectParams(project: {
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
  equipmentRenewalEnabled: boolean;
  equipmentRenewalCycleYears: number;
  byProductRevenue: number;
  fuelPricePerLiter: number;
  electricityUnitPrice: number;
  explosiveUnitPrice: number;
  totalReserves: number;
  maxAnnualCapacity: number;
  oreGrade: number;
  exchangeRate: number;
}): ProjectParams {
  return {
    projectLifeYears: project.projectLifeYears ?? 30,
    discountRate: project.discountRate ?? 5.82,
    taxRate: project.taxRate ?? 22,
    royaltyRate: project.royaltyRate ?? 4,
    creditRate: project.creditRate ?? 4,
    creditYears: project.creditYears ?? 10,
    unitPrice: project.unitPrice ?? 75,
    annualProduction: project.annualProduction ?? 2,
    plantProcessingRate: project.plantProcessingRate ?? 35,
    equipmentCost: project.equipmentCost ?? 0,
    facilityCost: project.facilityCost ?? 0,
    infrastructureCost: project.infrastructureCost ?? 0,
    contingencyRate: project.contingencyRate ?? 10,
    totalCapex: project.totalCapex ?? 0,
    fuelCost: project.fuelCost ?? 0,
    personnelCost: project.personnelCost ?? 0,
    maintenanceCost: project.maintenanceCost ?? 0,
    explosivesCost: project.explosivesCost ?? 0,
    tireCost: project.tireCost ?? 0,
    strippingCost: project.strippingCost ?? 0,
    otherOpex: project.otherOpex ?? 0,
    totalOpex: project.totalOpex ?? 0,
    forestCost: project.forestCost ?? 0,
    landCost: project.landCost ?? 0,
    rehabilitationCost: project.rehabilitationCost ?? 0,
    annualStrippingVolume: project.annualStrippingVolume ?? 0,
    strippingUnitCost: project.strippingUnitCost ?? 1.05,
    contractorStrippingCost: project.contractorStrippingCost ?? 0,
    plantOperatingCost: project.plantOperatingCost ?? 0,
    equipmentDepLife: project.equipmentDepLife ?? 6,
    facilityDepLife: project.facilityDepLife ?? 15,
    equipmentRenewalEnabled: project.equipmentRenewalEnabled ?? true,
    equipmentRenewalCycleYears: project.equipmentRenewalCycleYears ?? 10,
    byProductRevenue: project.byProductRevenue ?? 0,
    fuelPricePerLiter: project.fuelPricePerLiter ?? 0,
    electricityUnitPrice: project.electricityUnitPrice ?? 0,
    explosiveUnitPrice: project.explosiveUnitPrice ?? 0,
    totalReserves: project.totalReserves ?? 0,
    maxAnnualCapacity: project.maxAnnualCapacity ?? 0,
    oreGrade: project.oreGrade ?? 0,
    exchangeRate: project.exchangeRate ?? 1,
  };
}

function resolveLocale(request: NextRequest): Locale {
  const param = request.nextUrl.searchParams.get('locale');
  if (param === 'en' || param === 'tr') return param;
  return 'en';
}

function commodityLabel(mineType: string, locale: Locale): string {
  const key = `mine.${mineType}`;
  const labeled = translations[locale]?.[key] ?? translations.en?.[key];
  return labeled && labeled !== key ? labeled : mineType;
}

/**
 * GET — Decision Insights for an evaluated project.
 * Read-only: loads cached project metrics and consumes existing sensitivity /
 * Monte Carlo engine outputs without mutating the project.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params?.id;
    if (!projectId) {
      return NextResponse.json({ error: ApiError.PROJECT_NOT_FOUND }, { status: 404 });
    }

    const project = await prisma.miningProject.findUnique({
      where: { id: projectId },
      include: {
        cashFlows: { orderBy: { year: 'asc' }, select: { year: true, netCashFlow: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: ApiError.PROJECT_NOT_FOUND }, { status: 404 });
    }

    const locale = resolveLocale(request);
    const projectParams = toProjectParams(project);

    // Consume existing analysis modules (same read-and-recompute pattern as
    // /sensitivity and /montecarlo). Decision Insights does not alter formulas.
    const monteCarlo = runMonteCarloSimulation(projectParams, 2000);
    const sensitivityResults: SensitivityInsightResults = {
      price: sensitivityAnalysis(projectParams, 'price', [...SENSITIVITY_RANGE]),
      capex: sensitivityAnalysis(projectParams, 'capex', [...SENSITIVITY_RANGE]),
      opex: sensitivityAnalysis(projectParams, 'opex', [...SENSITIVITY_RANGE]),
      discountRate: sensitivityAnalysis(projectParams, 'discountRate', [...SENSITIVITY_RANGE]),
      oreGrade: sensitivityAnalysis(projectParams, 'oreGrade', [...SENSITIVITY_RANGE]),
      exchangeRate: sensitivityAnalysis(projectParams, 'exchangeRate', [...SENSITIVITY_RANGE]),
      fuelPrice: sensitivityAnalysis(projectParams, 'fuelPrice', [...SENSITIVITY_RANGE]),
    };

    let countryName = parseCountryFromLocation(project.location ?? '');
    let countryRisk: string | undefined;

    if (project.countryCode) {
      const country = await prisma.countryCatalogItem.findUnique({
        where: { code: project.countryCode },
        select: {
          name: true,
          nameTr: true,
          politicalRisk: true,
          miningInvestmentRisk: true,
        },
      });
      if (country) {
        countryName =
          locale === 'tr' && country.nameTr
            ? country.nameTr
            : country.name || countryName;
        countryRisk = country.politicalRisk || country.miningInvestmentRisk;
      }
    }

    const cashFlows = project.cashFlows ?? [];
    const input: DecisionInsightsInput = {
      name: project.name,
      npv: project.npv ?? 0,
      irr: project.irr ?? 0,
      paybackPeriod: project.paybackPeriod ?? 0,
      totalCapex: project.totalCapex ?? 0,
      totalOpex: project.totalOpex ?? 0,
      initialInvestment: deriveInitialInvestmentFromCashFlows(cashFlows, {
        totalCapex: project.totalCapex ?? 0,
        forestCost: project.forestCost ?? 0,
        landCost: project.landCost ?? 0,
        rehabilitationCost: project.rehabilitationCost ?? 0,
      }),
      averageAnnualCashFlow: deriveAverageAnnualCashFlow(cashFlows),
      sensitivityResults,
      monteCarloResults: monteCarlo.stats,
      commodity: commodityLabel(project.mineType, locale),
      country: countryName === '—' ? (project.countryCode || 'Unspecified') : countryName,
      countryRisk,
      mineType: project.mineType,
      productionRate: project.annualProduction ?? 0,
      productionUnit: project.productionUnit ?? 'Mt',
      projectLifeYears: project.projectLifeYears ?? 30,
      discountRate: project.discountRate ?? 5.82,
      negativeCashFlowYearRatio: deriveNegativeCashFlowYearRatio(cashFlows),
      lateCashFlowConcentration: deriveLateCashFlowConcentration(cashFlows),
    };

    const insight = generateDecisionInsights(input);

    return NextResponse.json({
      projectId: project.id,
      projectName: project.name,
      inputs: {
        npv: input.npv,
        irr: input.irr,
        paybackPeriod: input.paybackPeriod,
        totalCapex: input.totalCapex,
        totalOpex: input.totalOpex,
        initialInvestment: input.initialInvestment,
        averageAnnualCashFlow: input.averageAnnualCashFlow,
        commodity: input.commodity,
        country: input.country,
        mineType: input.mineType,
        productionRate: input.productionRate,
        productionUnit: input.productionUnit,
        monteCarloPositiveNpvProb: input.monteCarloResults.npvPositiveProb,
      },
      insight,
    });
  } catch (error: unknown) {
    console.error('Decision insights error:', error);
    return NextResponse.json(
      { error: publicErrorMessage(error, ApiError.ANALYSIS_FAILED) },
      { status: 500 }
    );
  }
}
