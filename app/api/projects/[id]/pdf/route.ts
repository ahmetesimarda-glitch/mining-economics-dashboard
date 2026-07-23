export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  generateRiskMatrix,
  performFullAnalysis,
  runMonteCarloSimulation,
  sensitivityAnalysis,
  type ProjectParams,
  type SensitivityPoint,
} from '@/lib/calculations';
import { buildConsultingPdfHtml, renderHtmlToPdf } from '@/lib/reports/pdf';
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
        methodCosts: true,
      },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const p = project as unknown as ProjectParams & Record<string, unknown>;
    const analysis = performFullAnalysis(p);

    const sensParams = ['price', 'capex', 'opex', 'discountRate'] as const;
    const sensData: Record<string, SensitivityPoint[]> = {};
    for (const param of sensParams) {
      sensData[param] = sensitivityAnalysis(p, param);
    }

    // Reuse existing Monte Carlo / tornado / risk engines (unchanged formulas).
    const monteCarlo = runMonteCarloSimulation(p, 2000);
    const tornado = buildTornadoBars(p, analysis.npv);
    const risks = generateRiskMatrix(p);

    const html = buildConsultingPdfHtml({
      project: project as unknown as Record<string, unknown>,
      analysis,
      params: p,
      equipments: (project.equipments ?? []) as unknown as Record<string, unknown>[],
      sensitivity: sensData,
      monteCarlo,
      tornado,
      risks,
      version: '1.0',
    });

    const pdfBuffer = await renderHtmlToPdf(html);
    const safeName = String(project.name ?? 'report').replace(/[^\w\- ]+/g, '').trim() || 'report';
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(
          `${safeName}_Economic_Evaluation.pdf`
        )}; filename="economic_evaluation.pdf"`,
      },
    });
  } catch (error: unknown) {
    console.error('PDF error:', error);
    const message = 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
