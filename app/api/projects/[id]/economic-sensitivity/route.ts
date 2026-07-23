export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  sensitivityAnalysis,
  performFullAnalysis,
  type ProjectParams,
} from '@/lib/calculations';

function buildProjectParams(project: any): ProjectParams {
  return {
    projectLifeYears: project?.projectLifeYears ?? 30,
    discountRate: project?.discountRate ?? 5.82,
    taxRate: project?.taxRate ?? 22,
    royaltyRate: project?.royaltyRate ?? 4,
    creditRate: project?.creditRate ?? 4,
    creditYears: project?.creditYears ?? 10,
    unitPrice: project?.unitPrice ?? 75,
    annualProduction: project?.annualProduction ?? 2,
    plantProcessingRate: project?.plantProcessingRate ?? 35,
    equipmentCost: project?.equipmentCost ?? 0,
    facilityCost: project?.facilityCost ?? 0,
    infrastructureCost: project?.infrastructureCost ?? 0,
    contingencyRate: project?.contingencyRate ?? 10,
    totalCapex: project?.totalCapex ?? 0,
    fuelCost: project?.fuelCost ?? 0,
    personnelCost: project?.personnelCost ?? 0,
    maintenanceCost: project?.maintenanceCost ?? 0,
    explosivesCost: project?.explosivesCost ?? 0,
    tireCost: project?.tireCost ?? 0,
    strippingCost: project?.strippingCost ?? 0,
    otherOpex: project?.otherOpex ?? 0,
    totalOpex: project?.totalOpex ?? 0,
    forestCost: project?.forestCost ?? 0,
    landCost: project?.landCost ?? 0,
    rehabilitationCost: project?.rehabilitationCost ?? 0,
    annualStrippingVolume: project?.annualStrippingVolume ?? 0,
    strippingUnitCost: project?.strippingUnitCost ?? 1.05,
    contractorStrippingCost: project?.contractorStrippingCost ?? 0,
    plantOperatingCost: project?.plantOperatingCost ?? 0,
    equipmentDepLife: project?.equipmentDepLife ?? 6,
    facilityDepLife: project?.facilityDepLife ?? 15,
    byProductRevenue: project?.byProductRevenue ?? 0,
    fuelPricePerLiter: project?.fuelPricePerLiter ?? 0,
    electricityUnitPrice: project?.electricityUnitPrice ?? 0,
    explosiveUnitPrice: project?.explosiveUnitPrice ?? 0,
    totalReserves: project?.totalReserves ?? 0,
    maxAnnualCapacity: project?.maxAnnualCapacity ?? 0,
    oreGrade: project?.oreGrade ?? 0,
    exchangeRate: project?.exchangeRate ?? 1,
  };
}

type ParamKey = 'price' | 'capex' | 'opex' | 'discountRate' | 'oreGrade' | 'exchangeRate' | 'fuelPrice';

const PARAM_LABELS: Record<ParamKey, string> = {
  price: 'Birim Fiyat',
  capex: 'CAPEX',
  opex: 'OPEX',
  discountRate: 'İskonto Oranı',
  oreGrade: 'Cevher Tenörü',
  exchangeRate: 'Döviz Kuru',
  fuelPrice: 'Yakıt Fiyatı',
};

function findSwitchoverPercent(
  params: ProjectParams,
  parameter: ParamKey,
  baseNpv: number
): number | null {
  // Binary search to find the % change where NPV = 0
  // For parameters where increasing reduces NPV (capex, opex, discountRate, exchangeRate, fuelPrice)
  // and where decreasing reduces NPV (price, oreGrade)
  if (baseNpv <= 0) return 0; // Already negative

  // Test direction: which way makes NPV go negative?
  const testPoints = [-80, -60, -40, -20, 20, 40, 60, 80, 100, 150, 200];
  let negativePoint: number | null = null;

  for (const pct of testPoints) {
    const result = sensitivityAnalysis(params, parameter, [pct]);
    if (result?.[0]?.npv !== undefined && result[0].npv <= 0) {
      negativePoint = pct;
      break;
    }
  }

  if (negativePoint === null) return null; // NPV never goes to 0 in range

  // Binary search between last positive and first negative
  const prevPoint = negativePoint > 0
    ? (testPoints[testPoints.indexOf(negativePoint) - 1] ?? 0)
    : (testPoints[testPoints.indexOf(negativePoint) + 1] ?? 0);

  let lo = Math.min(prevPoint, negativePoint);
  let hi = Math.max(prevPoint, negativePoint);

  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const result = sensitivityAnalysis(params, parameter, [mid]);
    const npv = result?.[0]?.npv ?? 0;
    if (Math.abs(npv) < 0.1) return Math.round(mid * 10) / 10;
    if (npv > 0) {
      if (negativePoint > prevPoint) lo = mid;
      else hi = mid;
    } else {
      if (negativePoint > prevPoint) hi = mid;
      else lo = mid;
    }
  }
  return Math.round(((lo + hi) / 2) * 10) / 10;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.miningProject.findUnique({
      where: { id: params?.id },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectParams = buildProjectParams(project);
    const baseAnalysis = performFullAnalysis(projectParams);
    const baseNpv = baseAnalysis?.npv ?? 0;
    const baseIrr = baseAnalysis?.irr ?? 0;

    const allParams: ParamKey[] = ['price', 'capex', 'opex', 'discountRate', 'oreGrade', 'exchangeRate', 'fuelPrice'];
    const spiderRange = [-30, -20, -10, 0, 10, 20, 30];

    // 1. Spider chart data: all parameters on same chart
    const spiderData = spiderRange.map((pct) => {
      const point: any = { changePercent: pct };
      for (const p of allParams) {
        const result = sensitivityAnalysis(projectParams, p, [pct]);
        point[p] = result?.[0]?.npv ?? 0;
      }
      return point;
    });

    // 2. Switchover (critical) values - where NPV becomes 0
    const switchoverValues = allParams.map((p) => {
      const switchPct = findSwitchoverPercent(projectParams, p, baseNpv);
      // Calculate base value of the parameter
      let baseValue = 0;
      let unit = '';
      switch (p) {
        case 'price': baseValue = projectParams.unitPrice ?? 75; unit = 'USD/ton'; break;
        case 'capex': baseValue = projectParams.totalCapex ?? 0; unit = 'MUSD'; break;
        case 'opex': baseValue = projectParams.totalOpex ?? 0; unit = 'MUSD/yıl'; break;
        case 'discountRate': baseValue = projectParams.discountRate ?? 5.82; unit = '%'; break;
        case 'oreGrade': baseValue = projectParams.oreGrade ?? 0; unit = '%'; break;
        case 'exchangeRate': baseValue = projectParams.exchangeRate ?? 1; unit = ''; break;
        case 'fuelPrice': baseValue = projectParams.fuelPricePerLiter ?? 0; unit = 'USD/L'; break;
      }
      const switchValue = switchPct !== null ? baseValue * (1 + switchPct / 100) : null;

      return {
        parameter: p,
        label: PARAM_LABELS[p],
        baseValue: Math.round(baseValue * 100) / 100,
        unit,
        switchoverPercent: switchPct,
        switchoverValue: switchValue !== null ? Math.round(switchValue * 100) / 100 : null,
        safetyMargin: switchPct !== null ? Math.abs(switchPct) : null,
      };
    });

    // 3. Two-way sensitivity: Price × OPEX
    const priceRange = [-30, -20, -10, 0, 10, 20, 30];
    const opexRange = [-30, -20, -10, 0, 10, 20, 30];
    const twoWayData: { priceChange: number; opexChange: number; npv: number }[] = [];

    for (const pricePct of priceRange) {
      for (const opexPct of opexRange) {
        const modified = { ...projectParams };
        modified.unitPrice = (projectParams.unitPrice ?? 75) * (1 + pricePct / 100);
        modified.totalOpex = (projectParams.totalOpex ?? 0) * (1 + opexPct / 100);
        modified.fuelCost = (projectParams.fuelCost ?? 0) * (1 + opexPct / 100);
        modified.personnelCost = (projectParams.personnelCost ?? 0) * (1 + opexPct / 100);
        const result = performFullAnalysis(modified);
        twoWayData.push({
          priceChange: pricePct,
          opexChange: opexPct,
          npv: Math.round((result?.npv ?? 0) * 100) / 100,
        });
      }
    }

    // 4. Comprehensive sensitivity table: NPV, IRR, Payback for each param at key levels
    const summaryLevels = [-30, -20, -10, 0, 10, 20, 30];
    const summaryTable = allParams.map((p) => {
      const points = sensitivityAnalysis(projectParams, p, summaryLevels);
      return {
        parameter: p,
        label: PARAM_LABELS[p],
        data: (points ?? []).map((pt: any, i: number) => ({
          changePercent: summaryLevels[i],
          npv: Math.round((pt?.npv ?? 0) * 100) / 100,
          irr: Math.round((pt?.irr ?? 0) * 100) / 100,
        })),
      };
    });

    // 5. Elasticity: % change in NPV / % change in parameter (at ±10%)
    const elasticity = allParams.map((p) => {
      const results = sensitivityAnalysis(projectParams, p, [-10, 10]);
      const npvAt10Down = results?.[0]?.npv ?? 0;
      const npvAt10Up = results?.[1]?.npv ?? 0;
      const elasticityValue = baseNpv !== 0
        ? ((npvAt10Up - npvAt10Down) / (2 * baseNpv)) / (10 / 100) * (10 / 100)
        : 0;
      return {
        parameter: p,
        label: PARAM_LABELS[p],
        elasticity: Math.round(Math.abs(elasticityValue) * 1000) / 1000,
        direction: npvAt10Up > npvAt10Down ? 'positive' : 'negative',
        npvAt10Down: Math.round(npvAt10Down * 100) / 100,
        npvAt10Up: Math.round(npvAt10Up * 100) / 100,
      };
    }).sort((a, b) => b.elasticity - a.elasticity);

    return NextResponse.json({
      baseNpv: Math.round(baseNpv * 100) / 100,
      baseIrr: Math.round(baseIrr * 100) / 100,
      spiderData,
      switchoverValues,
      twoWayData,
      summaryTable,
      elasticity,
      priceRange,
      opexRange,
    });
  } catch (error: any) {
    console.error('Economic sensitivity error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
