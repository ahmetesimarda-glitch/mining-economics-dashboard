export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  runMonteCarloSimulation,
  sensitivityAnalysis,
  type ProjectParams,
  type SensitivityPoint,
} from '@/lib/calculations';
import { buildProfessionalWorkbook, workbookToBuffer } from '@/lib/reports/excel';

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

    const wb = buildProfessionalWorkbook({
      project: project as unknown as Record<string, unknown>,
      cashFlows: (project.cashFlows ?? []) as unknown as Record<string, unknown>[],
      equipments: (project.equipments ?? []) as unknown as Record<string, unknown>[],
      sensitivity,
      monteCarlo,
    });
    const buf = workbookToBuffer(wb);
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
