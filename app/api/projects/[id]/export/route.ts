export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * CSV export uses English headers for international / consulting delivery.
 * Numeric values are unchanged from stored analysis results.
 */
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
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const p = project ?? ({} as any);
    const cfs = p?.cashFlows ?? [];
    const safeName = String(p?.name ?? 'export').replace(/[^\w\-]+/g, '_');

    const lines: string[] = [];
    lines.push(`Project Name,${p?.name ?? ''}`);
    lines.push(`Commodity,${p?.mineType ?? ''}`);
    lines.push(`Method,${p?.miningMethod ?? ''}`);
    lines.push(`NPV (MUSD),${(p?.npv ?? 0).toFixed(2)}`);
    lines.push(`IRR (%),${(p?.irr ?? 0).toFixed(2)}`);
    lines.push(`Payback (years),${(p?.paybackPeriod ?? 0).toFixed(1)}`);
    lines.push(`Total CAPEX (MUSD),${(p?.totalCapex ?? 0).toFixed(2)}`);
    lines.push(`Total OPEX (MUSD/year),${(p?.totalOpex ?? 0).toFixed(2)}`);
    lines.push(`Breakeven Price (USD/ton),${(p?.breakevenPrice ?? 0).toFixed(2)}`);
    lines.push(`Currency,${p?.currency ?? 'USD'}`);
    lines.push(`Exchange Rate,${(p?.exchangeRate ?? 1).toFixed(2)}`);
    lines.push(`Fuel Price (USD/L),${(p?.fuelPricePerLiter ?? 0).toFixed(2)}`);
    lines.push(`Electricity Price (USD/kWh),${(p?.electricityUnitPrice ?? 0).toFixed(4)}`);
    lines.push(`Total Reserves (Mt),${(p?.totalReserves ?? 0).toFixed(2)}`);
    lines.push(`Ore Grade,${p?.oreGrade ?? 0} ${p?.oreGradeUnit ?? '%'}`);
    lines.push('');
    lines.push(
      'Year,Revenue,OPEX,Depreciation,Tax,Royalty,Debt Service,Net Cash Flow,Cumulative'
    );
    for (const cf of cfs) {
      lines.push(
        [
          cf?.year ?? 0,
          (cf?.revenue ?? 0).toFixed(2),
          (cf?.opex ?? 0).toFixed(2),
          (cf?.depreciation ?? 0).toFixed(2),
          (cf?.taxPayment ?? 0).toFixed(2),
          (cf?.royalty ?? 0).toFixed(2),
          (cf?.creditPayment ?? 0).toFixed(2),
          (cf?.netCashFlow ?? 0).toFixed(2),
          (cf?.cumulativeCashFlow ?? 0).toFixed(2),
        ].join(',')
      );
    }

    const csv = '\uFEFF' + lines.join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="export_analysis.csv"; filename*=UTF-8''${encodeURIComponent(safeName + '_analysis.csv')}`,
      },
    });
  } catch (error: unknown) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
