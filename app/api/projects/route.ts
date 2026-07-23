export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  performFullAnalysis,
  calculateTotalCapex,
  calculateTotalOpex,
  type ProjectParams,
} from '@/lib/calculations';

export async function GET() {
  try {
    const projects = await prisma.miningProject.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        equipments: true,
        personnels: true,
        byProducts: true,
        methodCosts: true,
      },
    });
    return NextResponse.json(projects ?? []);
  } catch (error: any) {
    console.error('GET projects error:', error);
    return NextResponse.json([], { status: 200 });
  }
}

const equipFieldMap = (eq: any) => ({
  machineType: eq?.machineType ?? '',
  model: eq?.model ?? '',
  tonnageCapacity: eq?.tonnageCapacity ?? '',
  quantity: eq?.quantity ?? 1,
  spareQuantity: eq?.spareQuantity ?? 0,
  fuelConsumption: eq?.fuelConsumption ?? 0,
  maintenanceCost: eq?.maintenanceCost ?? 0,
  unitCost: eq?.unitCost ?? 0,
  totalCost: ((eq?.quantity ?? 1) + (eq?.spareQuantity ?? 0)) * (eq?.unitCost ?? 0),
  isCustom: eq?.isCustom ?? false,
  equipmentCategory: eq?.equipmentCategory ?? 'general',
  dailyWorkHours: eq?.dailyWorkHours ?? 8,
  maintenancePeriodHours: eq?.maintenancePeriodHours ?? 500,
  operatorCount: eq?.operatorCount ?? 1,
  powerType: eq?.powerType ?? 'diesel',
  hourlyFuelConsumption: eq?.hourlyFuelConsumption ?? 0,
  productionImpact: eq?.productionImpact ?? 0,
  drillCapacity: eq?.drillCapacity ?? 0,
  holeDiameter: eq?.holeDiameter ?? 0,
  maxDrillDepth: eq?.maxDrillDepth ?? 0,
  bucketVolume: eq?.bucketVolume ?? 0,
  transportCapacity: eq?.transportCapacity ?? 0,
  loadingCapacity: eq?.loadingCapacity ?? 0,
  crushingCapacity: eq?.crushingCapacity ?? 0,
  gallerySuitability: eq?.gallerySuitability ?? '',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const totalCapex = calculateTotalCapex(body);
    const totalOpex = calculateTotalOpex(body);
    const byProductRevenue = body?.byProductRevenue ?? 0;
    const params: ProjectParams = { ...body, totalCapex, totalOpex, byProductRevenue };
    const analysis = performFullAnalysis(params);

    const project = await prisma.miningProject.create({
      data: {
        name: body?.name ?? 'Yeni Proje',
        mineType: body?.mineType ?? 'lignite',
        miningMethod: body?.miningMethod ?? 'openPit',
        location: body?.location ?? '',
        projectLifeYears: body?.projectLifeYears ?? 30,
        discountRate: body?.discountRate ?? 5.82,
        taxRate: body?.taxRate ?? 22,
        royaltyRate: body?.royaltyRate ?? 4,
        creditRate: body?.creditRate ?? 4,
        creditYears: body?.creditYears ?? 10,
        currency: body?.currency ?? 'USD',
        exchangeRate: body?.exchangeRate ?? 1,
        manualExchangeRate: body?.manualExchangeRate ?? false,
        fuelPricePerLiter: body?.fuelPricePerLiter ?? 0,
        electricityUnitPrice: body?.electricityUnitPrice ?? 0,
        explosiveUnitPrice: body?.explosiveUnitPrice ?? 0,
        totalReserves: body?.totalReserves ?? 0,
        maxAnnualCapacity: body?.maxAnnualCapacity ?? 0,
        oreGrade: body?.oreGrade ?? 0,
        oreGradeUnit: body?.oreGradeUnit ?? '%',
        unitPrice: body?.unitPrice ?? 75,
        annualProduction: body?.annualProduction ?? 2,
        productionUnit: body?.productionUnit ?? 'Mt',
        plantProcessingRate: body?.plantProcessingRate ?? 35,
        equipmentCost: body?.equipmentCost ?? 0,
        facilityCost: body?.facilityCost ?? 0,
        infrastructureCost: body?.infrastructureCost ?? 0,
        contingencyRate: body?.contingencyRate ?? 10,
        totalCapex,
        fuelCost: body?.fuelCost ?? 0,
        personnelCost: body?.personnelCost ?? 0,
        maintenanceCost: body?.maintenanceCost ?? 0,
        explosivesCost: body?.explosivesCost ?? 0,
        tireCost: body?.tireCost ?? 0,
        strippingCost: body?.strippingCost ?? 0,
        otherOpex: body?.otherOpex ?? 0,
        totalOpex,
        forestCost: body?.forestCost ?? 0,
        landCost: body?.landCost ?? 0,
        rehabilitationCost: body?.rehabilitationCost ?? 0,
        annualStrippingVolume: body?.annualStrippingVolume ?? 0,
        strippingUnitCost: body?.strippingUnitCost ?? 1.05,
        contractorStrippingCost: body?.contractorStrippingCost ?? 0,
        plantOperatingCost: body?.plantOperatingCost ?? 0,
        equipmentDepLife: body?.equipmentDepLife ?? 6,
        facilityDepLife: body?.facilityDepLife ?? 15,
        depreciationMethod: body?.depreciationMethod ?? 'linear',
        equipmentRenewalEnabled: body?.equipmentRenewalEnabled ?? true,
        equipmentRenewalCycleYears: body?.equipmentRenewalCycleYears ?? 10,
        waterConsumptionDaily: body?.waterConsumptionDaily ?? 0,
        rehabilitationAreaHa: body?.rehabilitationAreaHa ?? 0,
        rehabilitationCostPerHa: body?.rehabilitationCostPerHa ?? 0,
        loanAmount: body?.loanAmount ?? 0,
        loanInterestRate: body?.loanInterestRate ?? 0,
        loanTermYears: body?.loanTermYears ?? 0,
        equityRatio: body?.equityRatio ?? 100,
        latitude: body?.latitude ?? 0,
        longitude: body?.longitude ?? 0,
        countryCode: body?.countryCode ?? '',
        npv: analysis?.npv ?? 0,
        irr: analysis?.irr ?? 0,
        paybackPeriod: analysis?.paybackPeriod ?? 0,
        breakevenPrice: analysis?.breakevenPrice ?? 0,
        totalRevenue: analysis?.totalRevenue ?? 0,
        totalCost: analysis?.totalCost ?? 0,
        byProductRevenue,
        cashFlows: {
          create: (analysis?.cashFlows ?? []).map((cf: any) => ({
            year: cf?.year ?? 0, revenue: cf?.revenue ?? 0, opex: cf?.opex ?? 0,
            depreciation: cf?.depreciation ?? 0, taxPayment: cf?.taxPayment ?? 0,
            royalty: cf?.royalty ?? 0, creditPayment: cf?.creditPayment ?? 0,
            creditInterest: cf?.creditInterest ?? 0, netCashFlow: cf?.netCashFlow ?? 0,
            cumulativeCashFlow: cf?.cumulativeCashFlow ?? 0, discountedCashFlow: cf?.discountedCashFlow ?? 0,
          })),
        },
        equipments: { create: (body?.equipments ?? []).map(equipFieldMap) },
        personnels: {
          create: (body?.personnels ?? []).map((p: any) => ({
            role: p?.role ?? '', count: p?.count ?? 1,
            monthlySalary: p?.monthlySalary ?? 0,
            annualCost: (p?.count ?? 1) * (p?.monthlySalary ?? 0) * 12,
            isCustom: p?.isCustom ?? false,
          })),
        },
        byProducts: {
          create: (body?.byProducts ?? []).map((bp: any) => ({
            name: bp?.name ?? '', annualProduction: bp?.annualProduction ?? 0,
            productionUnit: bp?.productionUnit ?? 'ton', unitPrice: bp?.unitPrice ?? 0,
            priceUnit: bp?.priceUnit ?? 'USD/ton',
            totalRevenue: (bp?.annualProduction ?? 0) * (bp?.unitPrice ?? 0),
          })),
        },
        methodCosts: {
          create: (body?.methodCosts ?? []).filter((c: any) => c?.name).map((c: any) => ({
            name: c?.name ?? '', category: c?.category ?? 'other',
            value: c?.value ?? 0, unit: c?.unit ?? 'MUSD',
          })),
        },
      },
    });
    return NextResponse.json(project);
  } catch (error: any) {
    console.error('POST project error:', error);
    return NextResponse.json({ error: error?.message ?? 'Server error' }, { status: 500 });
  }
}
