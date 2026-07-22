export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  performFullAnalysis,
  runMonteCarloSimulation,
  sensitivityAnalysis,
  type ProjectParams,
  type SensitivityPoint,
} from '@/lib/calculations';
import { buildConsultingPdfHtml } from '@/lib/reports/pdf';

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
      return NextResponse.json({ error: 'Proje bulunamadı' }, { status: 404 });
    }

    const p = project as unknown as ProjectParams & Record<string, unknown>;
    const analysis = performFullAnalysis(p);

    const sensParams = ['price', 'capex', 'opex', 'discountRate'] as const;
    const sensData: Record<string, SensitivityPoint[]> = {};
    for (const param of sensParams) {
      sensData[param] = sensitivityAnalysis(p, param);
    }

    // Reuse existing Monte Carlo engine (unchanged formulas).
    const monteCarlo = runMonteCarloSimulation(p, 2000);

    const html = buildConsultingPdfHtml({
      project: project as unknown as Record<string, unknown>,
      analysis,
      params: p,
      equipments: (project.equipments ?? []) as unknown as Record<string, unknown>[],
      sensitivity: sensData,
      monteCarlo,
      version: '1.0',
    });

    const createRes = await fetch('https://apps.abacus.ai/api/createConvertHtmlToPdfRequest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        html_content: html,
        pdf_options: {
          format: 'A4',
          margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
          print_background: true,
        },
      }),
    });

    if (!createRes.ok) {
      return NextResponse.json({ error: 'PDF oluşturulamadı' }, { status: 500 });
    }

    const { request_id } = await createRes.json();
    if (!request_id) {
      return NextResponse.json({ error: 'No request_id' }, { status: 500 });
    }

    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const statusRes = await fetch('https://apps.abacus.ai/api/getConvertHtmlToPdfStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id,
          deployment_token: process.env.ABACUSAI_API_KEY,
        }),
      });
      const statusResult = await statusRes.json();
      if (statusResult?.status === 'SUCCESS' && statusResult?.result?.result) {
        const pdfBuffer = Buffer.from(statusResult.result.result, 'base64');
        const safeName = String(project.name ?? 'report').replace(/[^\w\- ]+/g, '').trim() || 'report';
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(
              `${safeName}_Economic_Evaluation.pdf`
            )}; filename="economic_evaluation.pdf"`,
          },
        });
      }
      if (statusResult?.status === 'FAILED') {
        return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
      }
    }
    return NextResponse.json({ error: 'Timeout' }, { status: 500 });
  } catch (error: unknown) {
    console.error('PDF error:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
