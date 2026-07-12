export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  performFullAnalysis, calculateOperationalMetrics, calculateFuelAnalysis,
  calculateScenarioAnalysis, calculateCarbonFootprint, calculateWaterAnalysis,
  calculateRehabilitation, calculateFinancing, calculateDepreciationTable,
  generateRiskMatrix, generateProjectPhases, sensitivityAnalysis,
  calculateTotalCapex, calculateTotalOpex,
  type ProjectParams,
} from '@/lib/calculations';
import { getMineTypeLabel, getMiningMethodLabel, formatNumber } from '@/lib/format';

function fmt(v: number, d: number = 2): string {
  return (v ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function buildHTML(
  p: any, analysis: any, metrics: any, fuel: any, scenarios: any, carbon: any, water: any,
  rehab: any, risks: any, financing: any, depreciation: any, phases: any,
  equipments: any[], personnels: any[], byProducts: any[], sensitivity: any, params: ProjectParams
): string {
  const isPositive = (p?.npv ?? 0) >= 0;
  const currency = p?.currency ?? 'USD';
  const projYears = p?.projectLifeYears ?? 30;
  const riskColor = (level: string) => {
    if (level === 'critical') return '#ef4444';
    if (level === 'high') return '#f97316';
    if (level === 'medium') return '#eab308';
    return '#22c55e';
  };
  const riskLabel = (level: string) => {
    if (level === 'critical') return 'Kritik';
    if (level === 'high') return 'Yüksek';
    if (level === 'medium') return 'Orta';
    return 'Düşük';
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });

  // CAPEX breakdown
  const capexItems = [
    { name: 'Ekipman Maliyeti', value: p?.equipmentCost ?? 0 },
    { name: 'Tesis Maliyeti', value: p?.facilityCost ?? 0 },
    { name: 'Altyapı Maliyeti', value: p?.infrastructureCost ?? 0 },
    { name: 'Orman Bedeli', value: p?.forestCost ?? 0 },
    { name: 'Arazi Maliyeti', value: p?.landCost ?? 0 },
    { name: 'Rehabilitasyon', value: p?.rehabilitationCost ?? 0 },
  ].filter(i => i.value > 0);
  const contingencyAmt = (p?.totalCapex ?? 0) - capexItems.reduce((s, i) => s + i.value, 0);

  // OPEX breakdown
  const opexItems = [
    { name: 'Yakıt Gideri', value: p?.fuelCost ?? 0 },
    { name: 'Personel Gideri', value: p?.personnelCost ?? 0 },
    { name: 'Bakım Gideri', value: p?.maintenanceCost ?? 0 },
    { name: 'Patlayıcı Gideri', value: p?.explosivesCost ?? 0 },
    { name: 'Lastik Gideri', value: p?.tireCost ?? 0 },
    { name: 'Dekapaj Gideri', value: p?.strippingCost ?? 0 },
    { name: 'Tesis İşletme', value: p?.plantOperatingCost ?? 0 },
    { name: 'Diğer OPEX', value: p?.otherOpex ?? 0 },
  ].filter(i => i.value > 0);

  // Sensitivity data for key params
  const sensParams: ('price' | 'capex' | 'opex' | 'discountRate')[] = ['price', 'capex', 'opex', 'discountRate'];
  const sensLabels: Record<string, string> = { price: 'Fiyat', capex: 'CAPEX', opex: 'OPEX', discountRate: 'İskonto Oranı' };

  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><style>
  @page { size: A4; margin: 18mm 15mm 22mm 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a2e; font-size: 10.5px; line-height: 1.55; }
  h1 { font-size: 26px; color: #0d9488; margin-bottom: 2px; letter-spacing: -0.5px; }
  h2 { font-size: 14px; color: #0f172a; border-bottom: 2.5px solid #0d9488; padding-bottom: 3px; margin: 22px 0 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  h3 { font-size: 11.5px; color: #334155; margin: 14px 0 6px; font-weight: 600; }
  .subtitle { color: #64748b; font-size: 12px; margin-bottom: 6px; }
  .badge { display: inline-block; padding: 3px 12px; border-radius: 12px; font-size: 10px; font-weight: 700; color: white; letter-spacing: 0.5px; }
  .badge-green { background: #10b981; }
  .badge-red { background: #ef4444; }
  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 10px 0; }
  .kpi-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 10px 0; }
  .kpi-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin: 10px 0; }
  .kpi-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; text-align: center; background: #fafbfc; }
  .kpi-label { font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
  .kpi-value { font-size: 15px; font-weight: 700; color: #1a1a2e; margin: 2px 0; }
  .kpi-unit { font-size: 8px; color: #94a3b8; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 9.5px; }
  th { background: #f1f5f9; padding: 5px 7px; text-align: left; font-weight: 700; border-bottom: 2px solid #cbd5e1; font-size: 9px; text-transform: uppercase; letter-spacing: 0.3px; color: #475569; }
  td { padding: 4px 7px; border-bottom: 1px solid #f1f5f9; }
  tr:nth-child(even) { background: #fafafa; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .mono { font-family: 'Courier New', monospace; }
  .text-green { color: #10b981; }
  .text-red { color: #ef4444; }
  .text-amber { color: #d97706; }
  .text-blue { color: #2563eb; }
  .section { page-break-inside: avoid; }
  .page-break { page-break-before: always; }
  .footer { margin-top: 30px; text-align: center; color: #94a3b8; font-size: 8px; border-top: 1px solid #e2e8f0; padding-top: 8px; }
  .risk-badge { display: inline-block; padding: 1px 6px; border-radius: 6px; font-size: 8px; font-weight: 700; color: white; }
  .cover-line { width: 80px; height: 3px; background: #0d9488; margin: 8px 0 16px; }
  .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px 20px; font-size: 10px; margin: 8px 0; }
  .info-grid .label { color: #64748b; font-weight: 600; }
  .info-grid .val { color: #1a1a2e; font-weight: 500; }
  .highlight-box { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 10px 14px; margin: 10px 0; }
  .warn-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 14px; margin: 10px 0; font-size: 10px; }
  .phase-bar { display: inline-block; height: 18px; border-radius: 4px; margin: 1px 2px; vertical-align: middle; }
  .toc { margin: 12px 0; }
  .toc-item { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dotted #e2e8f0; font-size: 10.5px; }
  .toc-item .num { color: #0d9488; font-weight: 700; min-width: 24px; }
  .small-note { font-size: 8.5px; color: #94a3b8; font-style: italic; }
</style></head>
<body>

<!-- ===== KAPAK ===== -->
<div style="text-align: center; padding: 60px 0 40px;">
  <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px;">Maden Fizibilite Raporu</div>
  <h1 style="font-size: 32px; margin-bottom: 6px;">${p?.name ?? 'Proje'}</h1>
  <div class="cover-line" style="margin: 8px auto 16px;"></div>
  <p style="color: #475569; font-size: 13px;">${getMineTypeLabel(p?.mineType)} • ${getMiningMethodLabel(p?.miningMethod)}</p>
  <p style="color: #64748b; font-size: 11px; margin-top: 4px;">${p?.location ? p.location + ' • ' : ''}Proje Ömrü: ${projYears} Yıl</p>
  <div style="margin: 30px auto; width: 200px;">
    <span class="badge ${isPositive ? 'badge-green' : 'badge-red'}" style="font-size: 12px; padding: 5px 20px;">${isPositive ? '✓ EKONOMİK UYGUN' : '✗ EKONOMİK UYGUN DEĞİL'}</span>
  </div>
  <div style="margin-top: 50px; color: #94a3b8; font-size: 10px;">
    <p>Rapor Tarihi: ${dateStr}</p>
    <p>Para Birimi: ${currency}</p>
  </div>
</div>

<!-- ===== İÇİNDEKİLER ===== -->
<div class="page-break"></div>
<h2>İçindekiler</h2>
<div class="toc">
  <div class="toc-item"><span><span class="num">1.</span> Proje Özeti</span></div>
  <div class="toc-item"><span><span class="num">2.</span> Temel Finansal Göstergeler</span></div>
  <div class="toc-item"><span><span class="num">3.</span> Yatırım Maliyetleri (CAPEX)</span></div>
  <div class="toc-item"><span><span class="num">4.</span> İşletme Maliyetleri (OPEX)</span></div>
  <div class="toc-item"><span><span class="num">5.</span> Ekipman Listesi</span></div>
  <div class="toc-item"><span><span class="num">6.</span> Personel Yapısı</span></div>
  <div class="toc-item"><span><span class="num">7.</span> Üretim ve Gelir</span></div>
  <div class="toc-item"><span><span class="num">8.</span> Finansman Yapısı ve Kredi Geri Ödeme Planı</span></div>
  <div class="toc-item"><span><span class="num">9.</span> Amortisman Tablosu</span></div>
  <div class="toc-item"><span><span class="num">10.</span> Nakit Akış Tablosu</span></div>
  <div class="toc-item"><span><span class="num">11.</span> Senaryo Analizi</span></div>
  <div class="toc-item"><span><span class="num">12.</span> Duyarlılık Analizi</span></div>
  <div class="toc-item"><span><span class="num">13.</span> Yakıt Analizi</span></div>
  <div class="toc-item"><span><span class="num">14.</span> Çevresel Etki Analizi</span></div>
  <div class="toc-item"><span><span class="num">15.</span> Risk Matrisi</span></div>
  <div class="toc-item"><span><span class="num">16.</span> Proje Zaman Çizelgesi</span></div>
</div>

<!-- ===== 1. PROJE ÖZETİ ===== -->
<div class="page-break"></div>
<h2>1. Proje Özeti</h2>
<div class="info-grid">
  <span class="label">Proje Adı:</span><span class="val">${p?.name ?? '-'}</span>
  <span class="label">Maden Tipi:</span><span class="val">${getMineTypeLabel(p?.mineType)}</span>
  <span class="label">Madencilik Yöntemi:</span><span class="val">${getMiningMethodLabel(p?.miningMethod)}</span>
  <span class="label">Lokasyon:</span><span class="val">${p?.location ?? '-'}</span>
  <span class="label">Koordinat:</span><span class="val">${(p?.latitude ?? 0) !== 0 ? `${fmt(p?.latitude ?? 0, 4)}° K, ${fmt(p?.longitude ?? 0, 4)}° D` : '-'}</span>
  <span class="label">Proje Ömrü:</span><span class="val">${projYears} yıl</span>
  <span class="label">Toplam Rezerv:</span><span class="val">${(p?.totalReserves ?? 0) > 0 ? fmt(p?.totalReserves, 1) + ' Mt' : '-'}</span>
  <span class="label">Yıllık Üretim:</span><span class="val">${fmt(p?.annualProduction ?? 0, 2)} Mt/yıl</span>
  <span class="label">Maks. Kapasite:</span><span class="val">${(p?.maxAnnualCapacity ?? 0) > 0 ? fmt(p?.maxAnnualCapacity, 2) + ' Mt/yıl' : '-'}</span>
  <span class="label">Cevher Tenörü:</span><span class="val">${(p?.oreGrade ?? 0) > 0 ? fmt(p?.oreGrade, 2) + ' ' + (p?.oreGradeUnit ?? '%') : '-'}</span>
  <span class="label">Birim Fiyat:</span><span class="val">${fmt(p?.unitPrice ?? 0)} ${currency}/ton</span>
  <span class="label">İskonto Oranı:</span><span class="val">%${fmt(p?.discountRate ?? 5.82)}</span>
  <span class="label">Vergi Oranı:</span><span class="val">%${fmt(p?.taxRate ?? 22)}</span>
  <span class="label">Devlet Hakkı:</span><span class="val">%${fmt(p?.royaltyRate ?? 4)}</span>
  <span class="label">Döviz Kuru:</span><span class="val">${(p?.exchangeRate ?? 1) !== 1 ? fmt(p?.exchangeRate) + ' TL/USD' : '-'}</span>
  <span class="label">Para Birimi:</span><span class="val">${currency}</span>
</div>

${(byProducts ?? []).length > 0 ? `
<h3>Yan Ürünler</h3>
<table>
  <thead><tr><th>Ürün</th><th class="text-right">Yıllık Üretim</th><th class="text-right">Birim Fiyat</th><th class="text-right">Yıllık Gelir</th></tr></thead>
  <tbody>
    ${(byProducts ?? []).map((bp: any) => `<tr><td>${bp?.name ?? '-'}</td><td class="text-right mono">${fmt(bp?.annualProduction ?? 0)} ${bp?.productionUnit ?? 'ton'}</td><td class="text-right mono">${fmt(bp?.unitPrice ?? 0)} ${bp?.priceUnit ?? 'USD/ton'}</td><td class="text-right mono">${fmt(bp?.totalRevenue ?? 0)} USD</td></tr>`).join('')}
  </tbody>
</table>
` : ''}

<!-- ===== 2. FİNANSAL GÖSTERGELER ===== -->
<h2>2. Temel Finansal Göstergeler</h2>
<div class="kpi-grid">
  <div class="kpi-box"><div class="kpi-label">Net Bugünkü Değer (NPV)</div><div class="kpi-value ${isPositive ? 'text-green' : 'text-red'}">${fmt(p?.npv ?? 0)}</div><div class="kpi-unit">MUSD</div></div>
  <div class="kpi-box"><div class="kpi-label">İç Verim Oranı (IRR)</div><div class="kpi-value">${fmt(p?.irr ?? 0)}</div><div class="kpi-unit">%</div></div>
  <div class="kpi-box"><div class="kpi-label">Geri Ödeme Süresi</div><div class="kpi-value">${fmt(p?.paybackPeriod ?? 0, 1)}</div><div class="kpi-unit">Yıl</div></div>
</div>
<div class="kpi-grid">
  <div class="kpi-box"><div class="kpi-label">Başa Baş Fiyatı</div><div class="kpi-value">${fmt(p?.breakevenPrice ?? 0)}</div><div class="kpi-unit">${currency}/ton</div></div>
  <div class="kpi-box"><div class="kpi-label">Birim Üretim Maliyeti</div><div class="kpi-value">${fmt(metrics?.unitProductionCost ?? 0)}</div><div class="kpi-unit">${currency}/ton</div></div>
  <div class="kpi-box"><div class="kpi-label">Birim Maliyet (CAPEX dahil)</div><div class="kpi-value">${fmt(metrics?.costPerTonIncCapex ?? 0)}</div><div class="kpi-unit">${currency}/ton</div></div>
</div>

<div class="highlight-box">
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: center;">
    <div><div style="font-size: 8px; color: #64748b;">TOPLAM GELİR</div><div style="font-weight: 700; font-size: 13px;">${fmt(p?.totalRevenue ?? 0)} MUSD</div></div>
    <div><div style="font-size: 8px; color: #64748b;">TOPLAM MALİYET</div><div style="font-weight: 700; font-size: 13px;">${fmt(p?.totalCost ?? 0)} MUSD</div></div>
    <div><div style="font-size: 8px; color: #64748b;">YILLIK KÂR</div><div style="font-weight: 700; font-size: 13px; color: ${(metrics?.annualProfit ?? 0) >= 0 ? '#10b981' : '#ef4444'};">${fmt(metrics?.annualProfit ?? 0)} MUSD</div></div>
  </div>
</div>

<!-- ===== 3. CAPEX ===== -->
<h2>3. Yatırım Maliyetleri (CAPEX)</h2>
<table>
  <thead><tr><th>Kalem</th><th class="text-right">Tutar (MUSD)</th><th class="text-right">Oran (%)</th></tr></thead>
  <tbody>
    ${capexItems.map(i => `<tr><td>${i.name}</td><td class="text-right mono">${fmt(i.value)}</td><td class="text-right mono">${fmt((i.value / (p?.totalCapex ?? 1)) * 100, 1)}</td></tr>`).join('')}
    ${contingencyAmt > 0.01 ? `<tr><td>Beklenmeyen Giderler (%${fmt(p?.contingencyRate ?? 10, 0)})</td><td class="text-right mono">${fmt(contingencyAmt)}</td><td class="text-right mono">${fmt((contingencyAmt / (p?.totalCapex ?? 1)) * 100, 1)}</td></tr>` : ''}
    <tr style="font-weight: 700; background: #f1f5f9;"><td>TOPLAM CAPEX</td><td class="text-right mono">${fmt(p?.totalCapex ?? 0)}</td><td class="text-right mono">100.0</td></tr>
  </tbody>
</table>

<!-- ===== 4. OPEX ===== -->
<h2>4. İşletme Maliyetleri (OPEX)</h2>
<table>
  <thead><tr><th>Kalem</th><th class="text-right">Yıllık (MUSD)</th><th class="text-right">Oran (%)</th></tr></thead>
  <tbody>
    ${opexItems.map(i => `<tr><td>${i.name}</td><td class="text-right mono">${fmt(i.value)}</td><td class="text-right mono">${fmt((i.value / (p?.totalOpex || 1)) * 100, 1)}</td></tr>`).join('')}
    ${(p?.contractorStrippingCost ?? 0) > 0 ? `<tr><td>Yüklenici Dekapaj</td><td class="text-right mono">${fmt(p?.contractorStrippingCost ?? 0)}</td><td class="text-right mono">-</td></tr>` : ''}
    <tr style="font-weight: 700; background: #f1f5f9;"><td>TOPLAM OPEX</td><td class="text-right mono">${fmt(p?.totalOpex ?? 0)}</td><td class="text-right mono">100.0</td></tr>
    <tr style="color: #64748b;"><td>${projYears} Yıllık Toplam</td><td class="text-right mono">${fmt((p?.totalOpex ?? 0) * projYears)}</td><td></td></tr>
  </tbody>
</table>

<!-- ===== 5. EKİPMAN ===== -->
${(equipments ?? []).length > 0 ? `
<div class="page-break"></div>
<h2>5. Ekipman Listesi</h2>
<table>
  <thead><tr><th>Ekipman</th><th class="text-center">Adet</th><th class="text-right">Birim Fiyat (${currency})</th><th class="text-right">Toplam (${currency})</th><th class="text-right">Yakıt (L/sa)</th><th class="text-right">Bakım/Yıl</th></tr></thead>
  <tbody>
    ${(equipments ?? []).map((eq: any) => `<tr><td>${eq?.name ?? '-'}</td><td class="text-center mono">${eq?.quantity ?? 1}</td><td class="text-right mono">${fmt(eq?.unitPrice ?? 0, 0)}</td><td class="text-right mono">${fmt((eq?.unitPrice ?? 0) * (eq?.quantity ?? 1), 0)}</td><td class="text-right mono">${eq?.hourlyFuelConsumption ?? 0}</td><td class="text-right mono">${fmt(eq?.maintenanceCost ?? 0, 0)}</td></tr>`).join('')}
    <tr style="font-weight: 700; background: #f1f5f9;"><td>TOPLAM</td><td class="text-center mono">${(equipments ?? []).reduce((s: number, eq: any) => s + (eq?.quantity ?? 1), 0)}</td><td></td><td class="text-right mono">${fmt((equipments ?? []).reduce((s: number, eq: any) => s + (eq?.unitPrice ?? 0) * (eq?.quantity ?? 1), 0), 0)}</td><td></td><td class="text-right mono">${fmt((equipments ?? []).reduce((s: number, eq: any) => s + (eq?.maintenanceCost ?? 0) * (eq?.quantity ?? 1), 0), 0)}</td></tr>
  </tbody>
</table>
` : '<h2>5. Ekipman Listesi</h2><p style="color: #94a3b8; font-style: italic;">Ekipman bilgisi girilmemiş.</p>'}

<!-- ===== 6. PERSONEL ===== -->
${(personnels ?? []).length > 0 ? `
<h2>6. Personel Yapısı</h2>
<table>
  <thead><tr><th>Pozisyon</th><th class="text-center">Kişi Sayısı</th><th class="text-right">Aylık Maaş</th><th class="text-right">Yıllık Maliyet</th></tr></thead>
  <tbody>
    ${(personnels ?? []).map((pr: any) => `<tr><td>${pr?.role ?? '-'}</td><td class="text-center mono">${pr?.count ?? 1}</td><td class="text-right mono">${fmt(pr?.monthlySalary ?? 0, 0)} ${currency}</td><td class="text-right mono">${fmt(pr?.annualCost ?? 0, 0)} ${currency}</td></tr>`).join('')}
    <tr style="font-weight: 700; background: #f1f5f9;"><td>TOPLAM</td><td class="text-center mono">${(personnels ?? []).reduce((s: number, pr: any) => s + (pr?.count ?? 1), 0)}</td><td></td><td class="text-right mono">${fmt((personnels ?? []).reduce((s: number, pr: any) => s + (pr?.annualCost ?? 0), 0), 0)} ${currency}</td></tr>
  </tbody>
</table>
<p class="small-note">Kişi başı üretkenlik: ${fmt(metrics?.personnelProductivity ?? 0, 0)} ton/kişi/yıl</p>
` : '<h2>6. Personel Yapısı</h2><p style="color: #94a3b8; font-style: italic;">Personel bilgisi girilmemiş.</p>'}

<!-- ===== 7. ÜRETİM VE GELİR ===== -->
<h2>7. Üretim ve Gelir</h2>
<div class="kpi-grid-4">
  <div class="kpi-box"><div class="kpi-label">Yıllık Üretim</div><div class="kpi-value">${fmt(p?.annualProduction ?? 0, 2)}</div><div class="kpi-unit">Mt/yıl</div></div>
  <div class="kpi-box"><div class="kpi-label">Günlük Üretim</div><div class="kpi-value">${fmt(metrics?.productionPerDay ?? 0, 0)}</div><div class="kpi-unit">ton/gün</div></div>
  <div class="kpi-box"><div class="kpi-label">Kapasite Kullanım</div><div class="kpi-value">${fmt(metrics?.capacityUtilization ?? 0, 1)}</div><div class="kpi-unit">%</div></div>
  <div class="kpi-box"><div class="kpi-label">Rezerv Ömrü</div><div class="kpi-value">${(metrics?.reserveLife ?? 0) > 0 ? fmt(metrics?.reserveLife ?? 0, 1) : '-'}</div><div class="kpi-unit">yıl</div></div>
</div>
<div class="kpi-grid">
  <div class="kpi-box"><div class="kpi-label">Yıllık Gelir</div><div class="kpi-value">${fmt(metrics?.monthlyRevenue * 12 ?? 0)}</div><div class="kpi-unit">MUSD</div></div>
  <div class="kpi-box"><div class="kpi-label">Aylık Gelir</div><div class="kpi-value">${fmt(metrics?.monthlyRevenue ?? 0)}</div><div class="kpi-unit">MUSD</div></div>
  <div class="kpi-box"><div class="kpi-label">Aylık Kâr</div><div class="kpi-value ${(metrics?.monthlyProfit ?? 0) >= 0 ? 'text-green' : 'text-red'}">${fmt(metrics?.monthlyProfit ?? 0)}</div><div class="kpi-unit">MUSD</div></div>
</div>

<!-- ===== 8. FİNANSMAN ===== -->
<div class="page-break"></div>
<h2>8. Finansman Yapısı ve Kredi Geri Ödeme Planı</h2>
<div class="kpi-grid">
  <div class="kpi-box"><div class="kpi-label">Toplam Yatırım</div><div class="kpi-value">${fmt(financing?.totalInvestment ?? 0)}</div><div class="kpi-unit">MUSD</div></div>
  <div class="kpi-box"><div class="kpi-label">Özsermaye</div><div class="kpi-value">${fmt(financing?.equityAmount ?? 0)}</div><div class="kpi-unit">MUSD (%${fmt(financing?.equityRatio ?? 100, 0)})</div></div>
  <div class="kpi-box"><div class="kpi-label">Kredi Tutarı</div><div class="kpi-value">${fmt(financing?.loanAmount ?? 0)}</div><div class="kpi-unit">MUSD (%${fmt(financing?.debtRatio ?? 0, 0)})</div></div>
</div>
<div class="kpi-grid-4">
  <div class="kpi-box"><div class="kpi-label">Kredi Faiz Oranı</div><div class="kpi-value">%${fmt(p?.loanInterestRate ?? p?.creditRate ?? 0)}</div><div class="kpi-unit"></div></div>
  <div class="kpi-box"><div class="kpi-label">Kredi Vadesi</div><div class="kpi-value">${p?.loanTermYears ?? p?.creditYears ?? 0}</div><div class="kpi-unit">yıl</div></div>
  <div class="kpi-box"><div class="kpi-label">Yıllık Taksit</div><div class="kpi-value">${fmt(financing?.annualPayment ?? 0)}</div><div class="kpi-unit">MUSD</div></div>
  <div class="kpi-box"><div class="kpi-label">DSCR</div><div class="kpi-value ${(financing?.dscr ?? 0) >= 1.2 ? 'text-green' : 'text-red'}">${fmt(financing?.dscr ?? 0)}</div><div class="kpi-unit">x</div></div>
</div>

${(financing?.schedule ?? []).length > 0 ? `
<h3>Kredi Geri Ödeme Planı</h3>
<table>
  <thead><tr><th>Yıl</th><th class="text-right">Başlangıç Bakiye</th><th class="text-right">Taksit</th><th class="text-right">Faiz</th><th class="text-right">Anapara</th><th class="text-right">Bitiş Bakiye</th></tr></thead>
  <tbody>
    ${(financing?.schedule ?? []).map((r: any) => `<tr><td class="mono">${r.year}</td><td class="text-right mono">${fmt(r.beginningBalance)}</td><td class="text-right mono">${fmt(r.payment)}</td><td class="text-right mono text-red">${fmt(r.interest)}</td><td class="text-right mono">${fmt(r.principal)}</td><td class="text-right mono">${fmt(r.endingBalance)}</td></tr>`).join('')}
    <tr style="font-weight: 700; background: #f1f5f9;"><td>TOPLAM</td><td></td><td class="text-right mono">${fmt(financing?.totalPayment ?? 0)}</td><td class="text-right mono text-red">${fmt(financing?.totalInterest ?? 0)}</td><td class="text-right mono">${fmt(financing?.loanAmount ?? 0)}</td><td></td></tr>
  </tbody>
</table>
` : ''}

${(financing?.dscr ?? 0) < 1.2 ? '<div class="warn-box">⚠️ <b>Uyarı:</b> DSCR değeri 1.2x altında — yeterli borç servis kapasitesi olmayabilir.</div>' : ''}

<!-- ===== 9. AMORTİSMAN ===== -->
<h2>9. Amortisman Tablosu</h2>
<p style="font-size: 9.5px; color: #64748b; margin-bottom: 6px;">Yöntem: ${(p?.depreciationMethod ?? 'linear') === 'linear' ? 'Doğrusal' : 'Azalan Bakiyeler'} • Ekipman Ömrü: ${p?.equipmentDepLife ?? 6} yıl • Tesis Ömrü: ${p?.facilityDepLife ?? 15} yıl${(p?.equipmentRenewalEnabled ?? true) ? ` • Makina Yenileme: ${p?.equipmentRenewalCycleYears ?? 10} yıl periyot` : ' • Makina Yenileme: Kapalı'}</p>
<table>
  <thead><tr><th>Yıl</th><th class="text-right">Ekipman Amort.</th><th class="text-right">Tesis Amort.</th><th class="text-right">Toplam</th><th class="text-right">Ekipman Defter D.</th><th class="text-right">Tesis Defter D.</th></tr></thead>
  <tbody>
    ${(depreciation ?? []).map((d: any) => `<tr><td class="mono">${d.year}</td><td class="text-right mono">${fmt(d.equipmentDep)}</td><td class="text-right mono">${fmt(d.facilityDep)}</td><td class="text-right mono" style="font-weight:600">${fmt(d.totalDep)}</td><td class="text-right mono">${fmt(d.equipmentBookValue)}</td><td class="text-right mono">${fmt(d.facilityBookValue)}</td></tr>`).join('')}
  </tbody>
</table>

<!-- ===== 10. NAKİT AKIŞ ===== -->
<div class="page-break"></div>
<h2>10. Nakit Akış Tablosu</h2>
<p class="small-note">Tüm değerler MUSD cinsindendir.</p>
<table>
  <thead><tr><th>Yıl</th><th class="text-right">Gelir</th><th class="text-right">OPEX</th><th class="text-right">Amort.</th><th class="text-right">Vergi</th><th class="text-right">D.Hakkı</th><th class="text-right">Kredi Ödm.</th><th class="text-right">Net Nakit</th><th class="text-right">Kümülatif</th><th class="text-right">İsk. N.A.</th></tr></thead>
  <tbody>
    ${(analysis?.cashFlows ?? []).map((cf: any) => {
      const isNeg = (cf.netCashFlow ?? 0) < 0;
      const cumNeg = (cf.cumulativeCashFlow ?? 0) < 0;
      return `<tr><td class="mono">${cf.year}</td><td class="text-right mono">${fmt(cf.revenue)}</td><td class="text-right mono">${fmt(cf.opex)}</td><td class="text-right mono">${fmt(cf.depreciation)}</td><td class="text-right mono">${fmt(cf.taxPayment)}</td><td class="text-right mono">${fmt(cf.royalty)}</td><td class="text-right mono">${fmt(cf.creditPayment)}</td><td class="text-right mono ${isNeg ? 'text-red' : 'text-green'}" style="font-weight:600">${fmt(cf.netCashFlow)}</td><td class="text-right mono ${cumNeg ? 'text-red' : 'text-green'}">${fmt(cf.cumulativeCashFlow)}</td><td class="text-right mono">${fmt(cf.discountedCashFlow)}</td></tr>`;
    }).join('')}
  </tbody>
</table>

<!-- ===== 11. SENARYO ANALİZİ ===== -->
<div class="page-break"></div>
<h2>11. Senaryo Analizi</h2>
<p style="font-size: 9.5px; color: #64748b; margin-bottom: 8px;">Kötümser: Fiyat %80, Maliyet %120, Üretim %85 • İyimser: Fiyat %120, Maliyet %85, Üretim %110</p>
<table>
  <thead><tr><th>Metrik</th>${(scenarios ?? []).map((s: any) => `<th class="text-right">${s.label}</th>`).join('')}</tr></thead>
  <tbody>
    <tr><td>NPV (MUSD)</td>${(scenarios ?? []).map((s: any) => `<td class="text-right mono ${(s.npv ?? 0) >= 0 ? 'text-green' : 'text-red'}" style="font-weight:600">${fmt(s.npv)}</td>`).join('')}</tr>
    <tr><td>IRR (%)</td>${(scenarios ?? []).map((s: any) => `<td class="text-right mono">${fmt(s.irr)}</td>`).join('')}</tr>
    <tr><td>Geri Ödeme (yıl)</td>${(scenarios ?? []).map((s: any) => `<td class="text-right mono">${fmt(s.paybackPeriod, 1)}</td>`).join('')}</tr>
    <tr><td>Yıllık Gelir (MUSD)</td>${(scenarios ?? []).map((s: any) => `<td class="text-right mono">${fmt(s.annualRevenue)}</td>`).join('')}</tr>
    <tr><td>Yıllık Maliyet (MUSD)</td>${(scenarios ?? []).map((s: any) => `<td class="text-right mono">${fmt(s.annualCost)}</td>`).join('')}</tr>
    <tr style="font-weight: 700;"><td>Yıllık Kâr (MUSD)</td>${(scenarios ?? []).map((s: any) => `<td class="text-right mono ${(s.annualProfit ?? 0) >= 0 ? 'text-green' : 'text-red'}">${fmt(s.annualProfit)}</td>`).join('')}</tr>
  </tbody>
</table>

<!-- ===== 12. DUYARLILIK ANALİZİ ===== -->
<h2>12. Duyarlılık Analizi</h2>
<p style="font-size: 9.5px; color: #64748b; margin-bottom: 8px;">Her parametre bağımsız olarak %±30 aralığında değiştirildiğinde NPV ve IRR değerlerinin değişimi</p>
${sensParams.map(param => {
  const data = sensitivity?.[param] ?? [];
  if (data.length === 0) return '';
  return `
<h3>${sensLabels[param]}</h3>
<table>
  <thead><tr><th>Değişim (%)</th>${(data as any[]).map((d: any) => `<th class="text-right">${d.changePercent > 0 ? '+' : ''}${d.changePercent}%</th>`).join('')}</tr></thead>
  <tbody>
    <tr><td>NPV (MUSD)</td>${(data as any[]).map((d: any) => `<td class="text-right mono ${(d.npv ?? 0) >= 0 ? 'text-green' : 'text-red'}">${fmt(d.npv)}</td>`).join('')}</tr>
    <tr><td>IRR (%)</td>${(data as any[]).map((d: any) => `<td class="text-right mono">${fmt(d.irr)}</td>`).join('')}</tr>
  </tbody>
</table>`;
}).join('')}

<!-- ===== 13. YAKIT ANALİZİ ===== -->
${(fuel ?? []).length > 0 ? `
<h2>13. Yakıt Analizi</h2>
<p style="font-size: 9.5px; color: #64748b; margin-bottom: 6px;">Birim Yakıt Fiyatı: ${fmt(p?.fuelPricePerLiter ?? 0)} ${currency}/L</p>
<table>
  <thead><tr><th>Ekipman</th><th class="text-right">Saatlik (L/sa)</th><th class="text-right">Günlük (L)</th><th class="text-right">Yıllık (L)</th><th class="text-right">Yıllık Maliyet</th></tr></thead>
  <tbody>
    ${(fuel ?? []).map((f: any) => `<tr><td>${f.equipmentName}</td><td class="text-right mono">${fmt(f.hourlyConsumption, 1)}</td><td class="text-right mono">${fmt(f.dailyConsumption, 0)}</td><td class="text-right mono">${fmt(f.annualConsumption, 0)}</td><td class="text-right mono">${fmt(f.annualCost, 0)} ${currency}</td></tr>`).join('')}
    <tr style="font-weight: 700; background: #f1f5f9;"><td>TOPLAM</td><td></td><td></td><td class="text-right mono">${fmt((fuel ?? []).reduce((s: number, f: any) => s + (f.annualConsumption ?? 0), 0), 0)}</td><td class="text-right mono">${fmt((fuel ?? []).reduce((s: number, f: any) => s + (f.annualCost ?? 0), 0), 0)} ${currency}</td></tr>
  </tbody>
</table>
` : '<h2>13. Yakıt Analizi</h2><p style="color: #94a3b8; font-style: italic;">Yakıt verisi mevcut değil.</p>'}

<!-- ===== 14. ÇEVRE ===== -->
<h2>14. Çevresel Etki Analizi</h2>
<div class="kpi-grid">
  <div class="kpi-box"><div class="kpi-label">Yıllık CO₂ Emisyonu</div><div class="kpi-value">${fmt(carbon?.totalAnnualCO2 ?? 0, 1)}</div><div class="kpi-unit">ton CO₂/yıl</div></div>
  <div class="kpi-box"><div class="kpi-label">CO₂/Üretim</div><div class="kpi-value">${fmt(carbon?.co2PerTonProduced ?? 0, 3)}</div><div class="kpi-unit">kg CO₂/ton</div></div>
  <div class="kpi-box"><div class="kpi-label">Günlük Su Tüketimi</div><div class="kpi-value">${fmt(water?.dailyConsumption ?? 0, 0)}</div><div class="kpi-unit">m³/gün</div></div>
</div>
${(rehab?.totalCost ?? 0) > 0 ? `
<h3>Rehabilitasyon</h3>
<div class="info-grid">
  <span class="label">Toplam Alan:</span><span class="val">${fmt(rehab?.totalArea ?? 0, 0)} ha</span>
  <span class="label">Birim Maliyet:</span><span class="val">${fmt(p?.rehabilitationCostPerHa ?? 0, 0)} ${currency}/ha</span>
  <span class="label">Toplam Maliyet:</span><span class="val">${fmt(rehab?.totalCost ?? 0, 0)} ${currency}</span>
</div>
` : ''}

<!-- ===== 15. RİSK ===== -->
<div class="page-break"></div>
<h2>15. Risk Matrisi</h2>
<table>
  <thead><tr><th>Kategori</th><th>Risk</th><th class="text-center">Olasılık</th><th class="text-center">Etki</th><th class="text-center">Skor</th><th class="text-center">Seviye</th><th>Önleme Stratejisi</th></tr></thead>
  <tbody>
    ${(risks ?? []).map((r: any) => `<tr><td>${r.category}</td><td>${r.name}</td><td class="text-center mono">${r.probability}</td><td class="text-center mono">${r.impact}</td><td class="text-center mono" style="font-weight:700">${r.score}</td><td class="text-center"><span class="risk-badge" style="background:${riskColor(r.level)}">${riskLabel(r.level)}</span></td><td style="font-size:9px">${r.mitigation}</td></tr>`).join('')}
  </tbody>
</table>

<!-- ===== 16. PROJE ZAMAN ÇİZELGESİ ===== -->
<h2>16. Proje Zaman Çizelgesi</h2>
<table>
  <thead><tr><th>Aşama</th><th class="text-center">Başlangıç (Yıl)</th><th class="text-center">Bitiş (Yıl)</th><th class="text-center">Süre</th><th></th></tr></thead>
  <tbody>
    ${(phases ?? []).map((ph: any) => `<tr><td>${ph.name}</td><td class="text-center mono">${ph.startYear}</td><td class="text-center mono">${ph.endYear}</td><td class="text-center mono">${ph.endYear - ph.startYear} yıl</td><td><div class="phase-bar" style="background:${ph.color}; width:${Math.max(20, (ph.endYear - ph.startYear) * 12)}px;"></div></td></tr>`).join('')}
  </tbody>
</table>

<div class="footer">
  <p style="font-weight: 600;">Bu rapor MadenEkonomik platformu tarafından otomatik olarak oluşturulmuştur.</p>
  <p>Rapor Tarihi: ${dateStr} • Para Birimi: ${currency} • Tüm finansal değerler MUSD cinsindendir (aksi belirtilmedikçe)</p>
  <p>İskonto oranı: %${fmt(p?.discountRate ?? 5.82)} • Vergi oranı: %${fmt(p?.taxRate ?? 22)} • Devlet hakkı: %${fmt(p?.royaltyRate ?? 4)}</p>
</div>
</body></html>`;
}

export async function GET(
  request: NextRequest,
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
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const p: ProjectParams = { ...(project as any) };
    p.totalCapex = project?.totalCapex ?? 0;
    p.totalOpex = project?.totalOpex ?? 0;
    p.byProductRevenue = project?.byProductRevenue ?? 0;

    const analysis = performFullAnalysis(p);
    const metrics = calculateOperationalMetrics(p, project?.equipments ?? [], project?.personnels ?? []);
    const fuel = calculateFuelAnalysis(project?.equipments ?? [], project?.fuelPricePerLiter ?? 0);
    const scenarios = calculateScenarioAnalysis(p);
    const carbon = calculateCarbonFootprint(project?.equipments ?? [], p);
    const water = calculateWaterAnalysis(p);
    const rehab = calculateRehabilitation(p);
    const risks = generateRiskMatrix(p);
    const financing = calculateFinancing(p);
    const depreciation = calculateDepreciationTable(p);
    const phases = generateProjectPhases(p);

    // Sensitivity analysis for 4 key params
    const sensData: Record<string, any[]> = {};
    const sensParams: ('price' | 'capex' | 'opex' | 'discountRate')[] = ['price', 'capex', 'opex', 'discountRate'];
    for (const param of sensParams) {
      sensData[param] = sensitivityAnalysis(p, param);
    }

    const html = buildHTML(
      project, analysis, metrics, fuel, scenarios, carbon, water, rehab,
      risks, financing, depreciation, phases,
      project?.equipments ?? [], project?.personnels ?? [], project?.byProducts ?? [],
      sensData, p
    );

    // Step 1: Create PDF request
    const createRes = await fetch('https://apps.abacus.ai/api/createConvertHtmlToPdfRequest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        html_content: html,
        pdf_options: { format: 'A4', margin: { top: '18mm', bottom: '18mm', left: '14mm', right: '14mm' }, print_background: true },
      }),
    });

    if (!createRes.ok) {
      return NextResponse.json({ error: 'PDF oluşturulamadı' }, { status: 500 });
    }

    const { request_id } = await createRes.json();
    if (!request_id) return NextResponse.json({ error: 'No request_id' }, { status: 500 });

    // Step 2: Poll
    for (let i = 0; i < 120; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const statusRes = await fetch('https://apps.abacus.ai/api/getConvertHtmlToPdfStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id, deployment_token: process.env.ABACUSAI_API_KEY }),
      });
      const statusResult = await statusRes.json();
      if (statusResult?.status === 'SUCCESS' && statusResult?.result?.result) {
        const pdfBuffer = Buffer.from(statusResult.result.result, 'base64');
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent((project?.name ?? 'rapor') + '_fizibilite.pdf')}; filename="fizibilite_rapor.pdf"`,
          },
        });
      }
      if (statusResult?.status === 'FAILED') {
        return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
      }
    }
    return NextResponse.json({ error: 'Timeout' }, { status: 500 });
  } catch (error: any) {
    console.error('PDF error:', error);
    return NextResponse.json({ error: error?.message ?? 'Server error' }, { status: 500 });
  }
}
