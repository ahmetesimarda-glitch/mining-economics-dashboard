export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { performFullAnalysis, type ProjectParams } from '@/lib/calculations';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.miningProject.findUnique({
      where: { id: params?.id },
      include: { cashFlows: { orderBy: { year: 'asc' } } },
    });
    if (!project) {
      return NextResponse.json({ error: 'Proje bulunamadı' }, { status: 404 });
    }

    const p: ProjectParams = {
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
      equipmentRenewalEnabled: project?.equipmentRenewalEnabled ?? true,
      equipmentRenewalCycleYears: project?.equipmentRenewalCycleYears ?? 10,
      byProductRevenue: project?.byProductRevenue ?? 0,
      fuelPricePerLiter: project?.fuelPricePerLiter ?? 0,
      electricityUnitPrice: project?.electricityUnitPrice ?? 0,
      explosiveUnitPrice: project?.explosiveUnitPrice ?? 0,
      totalReserves: project?.totalReserves ?? 0,
      maxAnnualCapacity: project?.maxAnnualCapacity ?? 0,
      oreGrade: project?.oreGrade ?? 0,
      exchangeRate: project?.exchangeRate ?? 1,
    };

    const baseNpv = project?.npv ?? performFullAnalysis(p).npv;

    // Parameters to test with ±20% variation
    const parameters = [
      { key: 'unitPrice', label: 'Birim Fiyat', field: 'unitPrice' },
      { key: 'totalCapex', label: 'CAPEX', field: 'totalCapex' },
      { key: 'totalOpex', label: 'OPEX', field: 'totalOpex' },
      { key: 'discountRate', label: 'İndirgenme Oranı', field: 'discountRate' },
      { key: 'annualProduction', label: 'Yıllık Üretim', field: 'annualProduction' },
      { key: 'taxRate', label: 'Vergi Oranı', field: 'taxRate' },
      { key: 'royaltyRate', label: 'Devlet Hakkı', field: 'royaltyRate' },
    ];

    const tornadoData = parameters.map((param) => {
      const baseVal = (p as any)[param.field] ?? 0;
      if (baseVal === 0) {
        return {
          parameter: param.key,
          label: param.label,
          lowNpv: baseNpv,
          highNpv: baseNpv,
          baseNpv,
          impact: 0,
        };
      }
      // Low scenario: -20%
      const lowParams = { ...p, [param.field]: baseVal * 0.8 };
      const lowAnalysis = performFullAnalysis(lowParams);
      // High scenario: +20%
      const highParams = { ...p, [param.field]: baseVal * 1.2 };
      const highAnalysis = performFullAnalysis(highParams);

      // For some params, low value = better NPV (e.g., CAPEX, OPEX)
      const lowNpv = lowAnalysis.npv;
      const highNpv = highAnalysis.npv;

      return {
        parameter: param.key,
        label: param.label,
        lowNpv: Math.min(lowNpv, highNpv),
        highNpv: Math.max(lowNpv, highNpv),
        baseNpv,
        impact: Math.abs(highNpv - lowNpv),
      };
    }).filter((item) => item.impact > 0);

    // Also compute waterfall for average year (typical year)
    const operatingYears = (project?.cashFlows ?? []).filter((cf: any) => cf.year > 0);
    let avgRevenue = 0, avgOpex = 0, avgRoyalty = 0, avgTax = 0, avgCredit = 0, avgInterest = 0, avgNet = 0;
    if (operatingYears.length > 0) {
      avgRevenue = operatingYears.reduce((s: number, cf: any) => s + (cf.revenue ?? 0), 0) / operatingYears.length;
      avgOpex = operatingYears.reduce((s: number, cf: any) => s + (cf.opex ?? 0), 0) / operatingYears.length;
      avgRoyalty = operatingYears.reduce((s: number, cf: any) => s + (cf.royalty ?? 0), 0) / operatingYears.length;
      avgTax = operatingYears.reduce((s: number, cf: any) => s + (cf.taxPayment ?? 0), 0) / operatingYears.length;
      avgCredit = operatingYears.reduce((s: number, cf: any) => s + (cf.creditPayment ?? 0), 0) / operatingYears.length;
      avgInterest = operatingYears.reduce((s: number, cf: any) => s + (cf.creditInterest ?? 0), 0) / operatingYears.length;
      avgNet = operatingYears.reduce((s: number, cf: any) => s + (cf.netCashFlow ?? 0), 0) / operatingYears.length;
    }

    return NextResponse.json({
      tornado: tornadoData,
      waterfall: {
        revenue: avgRevenue,
        opex: avgOpex,
        royalty: avgRoyalty,
        tax: avgTax,
        creditPayment: avgCredit,
        creditInterest: avgInterest,
        netCashFlow: avgNet,
      },
    });
  } catch (error: any) {
    console.error('Tornado error:', error);
    return NextResponse.json({ error: error?.message ?? 'Server error' }, { status: 500 });
  }
}
