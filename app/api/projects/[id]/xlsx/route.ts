export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  calculateDepreciationTable,
  calculateFuelAnalysis,
  runMonteCarloSimulation,
  sensitivityAnalysis,
  type ProjectParams,
  type SensitivityPoint,
} from '@/lib/calculations';
import { buildProfessionalWorkbook, workbookToBuffer } from '@/lib/reports/excel';
import { buildTornadoBars } from '@/lib/reports/shared/tornado';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.miningProject.findUnique({
      where: { id: params?.id },
      include: {
        cashFlows: { orderBy: { year: 'asc' } },
        equipments: true,
        personnels: true,
        byProducts: true,
        capexItems: true,
        opexItems: true,
      },
    });
    if (!project) {
      return NextResponse.json({ error: 'Proje bulunamadı' }, { status: 404 });
    }

    const p = project as unknown as ProjectParams & Record<string, unknown>;
    const sensParams = ['price', 'capex', 'opex', 'discountRate'] as const;
    const sensitivity: Record<string, SensitivityPoint[]> = {};
    for (const param of sensParams) {
      sensitivity[param] = sensitivityAnalysis(p, param);
    }
    const monteCarlo = runMonteCarloSimulation(p, 2000);
    const tornado = buildTornadoBars(p, Number(project.npv ?? 0));
    const depreciation = calculateDepreciationTable(p);
    const fuelAnalysis = calculateFuelAnalysis(
      (project.equipments ?? []) as unknown as Record<string, unknown>[],
      Number(project.fuelPricePerLiter ?? 0)
    );

    const wb = await buildProfessionalWorkbook({
      project: project as unknown as Record<string, unknown>,
      cashFlows: (project.cashFlows ?? []) as unknown as Record<string, unknown>[],
      equipments: (project.equipments ?? []) as unknown as Record<string, unknown>[],
      personnels: (project.personnels ?? []) as unknown as Record<string, unknown>[],
      byProducts: (project.byProducts ?? []) as unknown as Record<string, unknown>[],
      capexItems: (project.capexItems ?? []) as unknown as Record<string, unknown>[],
      opexItems: (project.opexItems ?? []) as unknown as Record<string, unknown>[],
      sensitivity,
      monteCarlo,
      tornado,
      depreciation,
      fuelAnalysis,
    });
    const buf = await workbookToBuffer(wb);
    const fname = `${String(project.name ?? 'project')
      .replace(/[^\w\- ]+/g, '')
      .trim()}_Economic_Analysis.xlsx`;

    return new NextResponse(buf, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="analysis.xlsx"; filename*=UTF-8''${encodeURIComponent(fname)}`,
      },
    });
  } catch (error: unknown) {
    console.error('XLSX export hatası:', error);
    return NextResponse.json({ error: 'Excel dosyası oluşturulamadı' }, { status: 500 });
  }
}
