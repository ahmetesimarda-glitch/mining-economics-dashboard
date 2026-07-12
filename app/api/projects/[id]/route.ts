export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  performFullAnalysis,
  calculateTotalCapex,
  calculateTotalOpex,
  type ProjectParams,
} from '@/lib/calculations';

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.miningProject.findUnique({
      where: { id: params?.id },
      include: {
        cashFlows: { orderBy: { year: 'asc' } },
        capexItems: true,
        opexItems: true,
        equipments: true,
        personnels: true,
        byProducts: true,
        methodCosts: true,
      },
    });
    if (!project) {
      return NextResponse.json({ error: 'Proje bulunamadı' }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error: any) {
    console.error('GET project error:', error);
    return NextResponse.json({ error: error?.message ?? 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const totalCapex = calculateTotalCapex(body);
    const totalOpex = calculateTotalOpex(body);
    const byProductRevenue = body?.byProductRevenue ?? 0;

    // Always recalculate financial results from input parameters
    const analysisParams: ProjectParams = { ...body, totalCapex, totalOpex, byProductRevenue };
    const analysis = performFullAnalysis(analysisParams);
    const financialData = {
      npv: analysis?.npv ?? 0,
      irr: analysis?.irr ?? 0,
      paybackPeriod: analysis?.paybackPeriod ?? 0,
      breakevenPrice: analysis?.breakevenPrice ?? 0,
      totalRevenue: analysis?.totalRevenue ?? 0,
      totalCost: analysis?.totalCost ?? 0,
    };
    const cashFlowCreate = (analysis?.cashFlows ?? []).map((cf: any) => ({
      year: cf?.year ?? 0, revenue: cf?.revenue ?? 0, opex: cf?.opex ?? 0,
      depreciation: cf?.depreciation ?? 0, taxPayment: cf?.taxPayment ?? 0,
      royalty: cf?.royalty ?? 0, creditPayment: cf?.creditPayment ?? 0,
      creditInterest: cf?.creditInterest ?? 0, netCashFlow: cf?.netCashFlow ?? 0,
      cumulativeCashFlow: cf?.cumulativeCashFlow ?? 0, discountedCashFlow: cf?.discountedCashFlow ?? 0,
    }));

    // Delete related records
    await Promise.all([
      prisma.equipment.deleteMany({ where: { projectId: params?.id } }),
      prisma.personnel.deleteMany({ where: { projectId: params?.id } }),
      prisma.byProduct.deleteMany({ where: { projectId: params?.id } }),
      prisma.methodSpecificCost.deleteMany({ where: { projectId: params?.id } }),
      prisma.cashFlowYear.deleteMany({ where: { projectId: params?.id } }),
    ]);

    const project = await prisma.miningProject.update({
      where: { id: params?.id },
      data: {
        name: body?.name, mineType: body?.mineType,
        miningMethod: body?.miningMethod ?? 'openPit',
        location: body?.location,
        projectLifeYears: body?.projectLifeYears,
        discountRate: body?.discountRate, taxRate: body?.taxRate,
        royaltyRate: body?.royaltyRate, creditRate: body?.creditRate,
        creditYears: body?.creditYears,
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
        unitPrice: body?.unitPrice,
        annualProduction: body?.annualProduction,
        productionUnit: body?.productionUnit,
        plantProcessingRate: body?.plantProcessingRate,
        equipmentCost: body?.equipmentCost,
        facilityCost: body?.facilityCost,
        infrastructureCost: body?.infrastructureCost,
        contingencyRate: body?.contingencyRate,
        totalCapex,
        fuelCost: body?.fuelCost, personnelCost: body?.personnelCost,
        maintenanceCost: body?.maintenanceCost,
        explosivesCost: body?.explosivesCost,
        tireCost: body?.tireCost, strippingCost: body?.strippingCost,
        otherOpex: body?.otherOpex, totalOpex,
        forestCost: body?.forestCost, landCost: body?.landCost,
        rehabilitationCost: body?.rehabilitationCost,
        annualStrippingVolume: body?.annualStrippingVolume,
        strippingUnitCost: body?.strippingUnitCost,
        contractorStrippingCost: body?.contractorStrippingCost,
        plantOperatingCost: body?.plantOperatingCost,
        equipmentDepLife: body?.equipmentDepLife,
        facilityDepLife: body?.facilityDepLife,
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
        ...financialData,
        byProductRevenue,
        ...(cashFlowCreate ? {
          cashFlows: { create: cashFlowCreate },
        } : {}),
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
      include: {
        cashFlows: { orderBy: { year: 'asc' } },
        equipments: true, personnels: true,
        byProducts: true, methodCosts: true,
      },
    });
    return NextResponse.json(project);
  } catch (error: any) {
    console.error('PUT project error:', error);
    return NextResponse.json({ error: error?.message ?? 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.miningProject.delete({ where: { id: params?.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE project error:', error);
    return NextResponse.json({ error: error?.message ?? 'Server error' }, { status: 500 });
  }
}