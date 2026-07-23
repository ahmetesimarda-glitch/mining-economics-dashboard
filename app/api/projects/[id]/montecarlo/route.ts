export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  runMonteCarloSimulation,
  calculateTotalCapex,
  calculateTotalOpex,
  type ProjectParams,
} from '@/lib/calculations';

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
    };

    const result = runMonteCarloSimulation(p, 2000);

    return NextResponse.json({
      stats: result?.stats ?? {},
      histogram: result?.histogram ?? [],
    });
  } catch (error: any) {
    console.error('Monte Carlo error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
