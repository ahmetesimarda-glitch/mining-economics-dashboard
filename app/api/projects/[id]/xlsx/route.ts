export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { calculateFinancing } from '@/lib/calculations';

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
      },
    });
    if (!project) {
      return NextResponse.json({ error: 'Proje bulunamadı' }, { status: 404 });
    }

    const p = project as any;
    const cfs = p?.cashFlows ?? [];

    const wb = XLSX.utils.book_new();

    // === 1. Özet ===
    const summaryRows: any[][] = [
      ['MADEN FİZİBİLİTE ANALİZİ - ÖZET'],
      [],
      ['Proje Adı', p?.name ?? ''],
      ['Maden Tipi', p?.mineType ?? ''],
      ['Üretim Yöntemi', p?.miningMethod ?? ''],
      ['Lokasyon', p?.location ?? ''],
      ['Proje Ömrü (yıl)', p?.projectLifeYears ?? 0],
      [],
      ['FİNANSAL SONUÇLAR'],
      ['NPV (MUSD)', Number((p?.npv ?? 0).toFixed(2))],
      ['IRR (%)', Number((p?.irr ?? 0).toFixed(2))],
      ['Geri Ödeme Süresi (yıl)', Number((p?.paybackPeriod ?? 0).toFixed(1))],
      ['Başa Baş Fiyatı (USD/ton)', Number((p?.breakevenPrice ?? 0).toFixed(2))],
      ['Toplam Gelir (MUSD)', Number((p?.totalRevenue ?? 0).toFixed(2))],
      ['Yan Ürün Geliri (MUSD/yıl)', Number((p?.byProductRevenue ?? 0).toFixed(2))],
      [],
      ['MALİYETLER'],
      ['Toplam CAPEX (MUSD)', Number((p?.totalCapex ?? 0).toFixed(2))],
      ['Ekipman (MUSD)', Number((p?.equipmentCost ?? 0).toFixed(2))],
      ['Tesis (MUSD)', Number((p?.facilityCost ?? 0).toFixed(2))],
      ['Altyapı (MUSD)', Number((p?.infrastructureCost ?? 0).toFixed(2))],
      ['Beklenmeyen Giderler Oranı (%)', p?.contingencyRate ?? 0],
      ['Toplam OPEX (MUSD/yıl)', Number((p?.totalOpex ?? 0).toFixed(2))],
      ['Yakıt (MUSD/yıl)', Number((p?.fuelCost ?? 0).toFixed(2))],
      ['Personel (MUSD/yıl)', Number((p?.personnelCost ?? 0).toFixed(2))],
      ['Bakım (MUSD/yıl)', Number((p?.maintenanceCost ?? 0).toFixed(2))],
      ['Patlayıcı (MUSD/yıl)', Number((p?.explosivesCost ?? 0).toFixed(2))],
      ['Dekapaj (MUSD/yıl)', Number((p?.strippingCost ?? 0).toFixed(2))],
      ['Diğer (MUSD/yıl)', Number((p?.otherOpex ?? 0).toFixed(2))],
      [],
      ['PARAMETRELER'],
      ['İskonto Oranı (%)', p?.discountRate ?? 0],
      ['Vergi Oranı (%)', p?.taxRate ?? 0],
      ['Devlet Hakkı (%)', p?.royaltyRate ?? 0],
      ['Birim Fiyat (USD/ton)', p?.unitPrice ?? 0],
      ['Yıllık Üretim', `${p?.annualProduction ?? 0} ${p?.productionUnit ?? 'Mt'}`],
      ['Toplam Rezerv (Mt)', p?.totalReserves ?? 0],
      ['Cevher Tenörü', `${p?.oreGrade ?? 0} ${p?.oreGradeUnit ?? '%'}`],
      ['Ekipman Amortisman Ömrü (yıl)', p?.equipmentDepLife ?? 0],
      ['Tesis Amortisman Ömrü (yıl)', p?.facilityDepLife ?? 0],
      ['Makina Yenileme', p?.equipmentRenewalEnabled ? `Açık (${p?.equipmentRenewalCycleYears ?? 10} yıl döngü)` : 'Kapalı'],
      ['Kredi Tutarı (MUSD)', p?.loanAmount ?? 0],
      ['Kredi Faizi (%)', p?.loanInterestRate ?? 0],
      ['Kredi Vadesi (yıl)', p?.loanTermYears ?? 0],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 34 }, { wch: 24 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Özet');

    // === 2. Nakit Akışı ===
    const cfRows: any[][] = [
      ['Yıl', 'Gelir (MUSD)', 'OPEX (MUSD)', 'Amortisman (MUSD)', 'Vergi (MUSD)', 'Devlet Hakkı (MUSD)', 'Kredi Ödemesi (MUSD)', 'Net Nakit Akışı (MUSD)', 'Kümülatif (MUSD)', 'İskontolu (MUSD)'],
      ...cfs.map((cf: any) => [
        cf?.year ?? 0,
        Number((cf?.revenue ?? 0).toFixed(3)),
        Number((cf?.opex ?? 0).toFixed(3)),
        Number((cf?.depreciation ?? 0).toFixed(3)),
        Number((cf?.taxPayment ?? 0).toFixed(3)),
        Number((cf?.royalty ?? 0).toFixed(3)),
        Number((cf?.creditPayment ?? 0).toFixed(3)),
        Number((cf?.netCashFlow ?? 0).toFixed(3)),
        Number((cf?.cumulativeCashFlow ?? 0).toFixed(3)),
        Number((cf?.discountedCashFlow ?? 0).toFixed(3)),
      ]),
    ];
    const wsCf = XLSX.utils.aoa_to_sheet(cfRows);
    wsCf['!cols'] = cfRows[0].map((_, i) => ({ wch: i === 0 ? 6 : 18 }));
    XLSX.utils.book_append_sheet(wb, wsCf, 'Nakit Akışı');

    // === 3. Ekipman Listesi ===
    const eqRows: any[][] = [
      ['Makina Tipi', 'Model', 'Kapasite', 'Adet', 'Yedek', 'Birim Maliyet (MUSD)', 'Toplam (MUSD)', 'Yakıt (lt/saat)', 'Bakım (MUSD/yıl)', 'Güç Tipi'],
      ...(p?.equipments ?? []).map((eq: any) => [
        eq?.machineType ?? '', eq?.model ?? '', eq?.tonnageCapacity ?? '',
        eq?.quantity ?? 0, eq?.spareQuantity ?? 0,
        Number((eq?.unitCost ?? 0).toFixed(3)), Number((eq?.totalCost ?? 0).toFixed(3)),
        eq?.hourlyFuelConsumption ?? 0, Number((eq?.maintenanceCost ?? 0).toFixed(3)), eq?.powerType ?? '',
      ]),
    ];
    const wsEq = XLSX.utils.aoa_to_sheet(eqRows);
    wsEq['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 12 }, { wch: 6 }, { wch: 6 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsEq, 'Ekipman');

    // === 4. Personel ===
    const persRows: any[][] = [
      ['Görev', 'Kişi Sayısı', 'Aylık Maaş (USD)', 'Yıllık Maliyet (MUSD)'],
      ...(p?.personnels ?? []).map((pe: any) => [
        pe?.role ?? '', pe?.count ?? 0, pe?.monthlySalary ?? 0, Number((pe?.annualCost ?? 0).toFixed(3)),
      ]),
    ];
    const wsPers = XLSX.utils.aoa_to_sheet(persRows);
    wsPers['!cols'] = [{ wch: 26 }, { wch: 12 }, { wch: 16 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsPers, 'Personel');

    // === 5. Yan Ürünler (varsa) ===
    if ((p?.byProducts ?? []).length > 0) {
      const bpRows: any[][] = [
        ['Yan Ürün', 'Yıllık Üretim', 'Birim', 'Birim Fiyat', 'Fiyat Birimi', 'Yıllık Gelir (MUSD)'],
        ...(p?.byProducts ?? []).map((bp: any) => [
          bp?.name ?? '', bp?.annualProduction ?? 0, bp?.productionUnit ?? 'ton',
          bp?.unitPrice ?? 0, bp?.priceUnit ?? 'USD/ton', Number((bp?.totalRevenue ?? 0).toFixed(3)),
        ]),
      ];
      const wsBp = XLSX.utils.aoa_to_sheet(bpRows);
      wsBp['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, wsBp, 'Yan Ürünler');
    }

    // === 6. Kredi Ödeme Planı (varsa) ===
    if ((p?.loanAmount ?? 0) > 0 && (p?.loanTermYears ?? 0) > 0) {
      const fin = calculateFinancing(p as any);
      const loanRows: any[][] = [
        ['Yıl', 'Taksit (MUSD)', 'Faiz (MUSD)', 'Anapara (MUSD)', 'Kalan Borç (MUSD)'],
        ...(fin?.schedule ?? []).map((s: any) => [
          s?.year ?? 0,
          Number((s?.payment ?? 0).toFixed(3)),
          Number((s?.interest ?? 0).toFixed(3)),
          Number((s?.principal ?? 0).toFixed(3)),
          Number((s?.endingBalance ?? 0).toFixed(3)),
        ]),
      ];
      const wsLoan = XLSX.utils.aoa_to_sheet(loanRows);
      wsLoan['!cols'] = [{ wch: 6 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, wsLoan, 'Kredi Planı');
    }

    const buf: Buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const fname = `${(p?.name ?? 'proje').replace(/[^a-zA-Z0-9ğüşöçıİĞÜŞÖÇ _-]/g, '')}_analiz.xlsx`;

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="analiz.xlsx"; filename*=UTF-8''${encodeURIComponent(fname)}`,
      },
    });
  } catch (error: any) {
    console.error('XLSX export hatası:', error);
    return NextResponse.json({ error: 'Excel dosyası oluşturulamadı' }, { status: 500 });
  }
}
