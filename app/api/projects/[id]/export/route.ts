export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    const p = project ?? {} as any;
    const cfs = p?.cashFlows ?? [];

    const lines: string[] = [];
    lines.push(`Proje Adı,${p?.name ?? ''}`);
    lines.push(`Maden Tipi,${p?.mineType ?? ''}`);
    lines.push(`Yöntem,${p?.miningMethod ?? ''}`);
    lines.push(`NPV (MUSD),${(p?.npv ?? 0).toFixed(2)}`);
    lines.push(`IRR (%),${(p?.irr ?? 0).toFixed(2)}`);
    lines.push(`Geri Ödeme (yıl),${(p?.paybackPeriod ?? 0).toFixed(1)}`);
    lines.push(`Toplam CAPEX (MUSD),${(p?.totalCapex ?? 0).toFixed(2)}`);
    lines.push(`Toplam OPEX (MUSD/yıl),${(p?.totalOpex ?? 0).toFixed(2)}`);
    lines.push(`Başa Baş Fiyatı (USD/ton),${(p?.breakevenPrice ?? 0).toFixed(2)}`);
    lines.push(`Döviz,${p?.currency ?? 'USD'}`);
    lines.push(`Döviz Kuru,${(p?.exchangeRate ?? 1).toFixed(2)}`);
    lines.push(`Yakıt Fiyatı (USD/lt),${(p?.fuelPricePerLiter ?? 0).toFixed(2)}`);
    lines.push(`Elektrik Fiyatı (USD/kWh),${(p?.electricityUnitPrice ?? 0).toFixed(4)}`);
    lines.push(`Toplam Rezerv (Mt),${(p?.totalReserves ?? 0).toFixed(2)}`);
    lines.push(`Cevher Tenörü,${p?.oreGrade ?? 0} ${p?.oreGradeUnit ?? '%'}`);
    lines.push('');
    lines.push('Yıl,Gelir,OPEX,Amortisman,Vergi,Devlet Hakkı,Kredi Ödemesi,Net Nakit,Kümülatif');
    for (const cf of cfs) {
      lines.push([
        cf?.year ?? 0,
        (cf?.revenue ?? 0).toFixed(2),
        (cf?.opex ?? 0).toFixed(2),
        (cf?.depreciation ?? 0).toFixed(2),
        (cf?.taxPayment ?? 0).toFixed(2),
        (cf?.royalty ?? 0).toFixed(2),
        (cf?.creditPayment ?? 0).toFixed(2),
        (cf?.netCashFlow ?? 0).toFixed(2),
        (cf?.cumulativeCashFlow ?? 0).toFixed(2),
      ].join(','));
    }

    const csv = '\uFEFF' + lines.join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="export_analiz.csv"; filename*=UTF-8''${encodeURIComponent((p?.name ?? 'export') + '_analiz.csv')}`,
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error?.message ?? 'Server error' }, { status: 500 });
  }
}
