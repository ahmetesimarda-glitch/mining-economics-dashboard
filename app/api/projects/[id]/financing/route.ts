export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  calculateFinancing,
  calculateDepreciationTable,
  generateProjectPhases,
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
      byProductRevenue: project?.byProductRevenue ?? 0,
      loanAmount: project?.loanAmount ?? 0,
      loanInterestRate: project?.loanInterestRate ?? 0,
      loanTermYears: project?.loanTermYears ?? 0,
      equityRatio: project?.equityRatio ?? 100,
      depreciationMethod: project?.depreciationMethod ?? 'linear',
      equipmentRenewalEnabled: project?.equipmentRenewalEnabled ?? true,
      equipmentRenewalCycleYears: project?.equipmentRenewalCycleYears ?? 10,
    };

    const financing = calculateFinancing(p);
    const depreciation = calculateDepreciationTable(p);
    const phases = generateProjectPhases(p);

    return NextResponse.json({ financing, depreciation, phases });
  } catch (error: any) {
    console.error('Financing error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
