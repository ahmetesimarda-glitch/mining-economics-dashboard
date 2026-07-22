import * as XLSX from 'xlsx';
import type { MonteCarloResult, SensitivityPoint } from '@/lib/calculations';

type AOA = (string | number | null)[][];

function freezeHeader(ws: XLSX.WorkSheet): void {
  ws['!views'] = [{ state: 'frozen', ySplit: 1, topLeftCell: 'A2', activeCell: 'A2' }];
}

function autoCols(rows: AOA): { wch: number }[] {
  if (!rows.length) return [];
  const width = rows[0].map((_, col) => {
    let max = 10;
    for (const row of rows) {
      const cell = row[col];
      const len = cell === null || cell === undefined ? 0 : String(cell).length;
      if (len > max) max = Math.min(len + 2, 42);
    }
    return { wch: max };
  });
  return width;
}

function sheetFromAoA(rows: AOA, freeze = true): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = autoCols(rows);
  if (freeze && rows.length > 1) freezeHeader(ws);
  return ws;
}

export interface ExcelWorkbookInput {
  project: Record<string, unknown>;
  cashFlows: Record<string, unknown>[];
  equipments: Record<string, unknown>[];
  sensitivity: Record<string, SensitivityPoint[]>;
  monteCarlo: MonteCarloResult | null;
}

/**
 * Professional multi-sheet workbook. Presentation only — numbers are precomputed.
 */
export function buildProfessionalWorkbook(input: ExcelWorkbookInput): XLSX.WorkBook {
  const p = input.project;
  const wb = XLSX.utils.book_new();

  const summary: AOA = [
    ['Mining Economics Dashboard — Project Summary'],
    [],
    ['Project Name', String(p.name ?? '')],
    ['Commodity', String(p.mineType ?? '')],
    ['Mining Method', String(p.miningMethod ?? '')],
    ['Location', String(p.location ?? '')],
    ['Mine Life (years)', Number(p.projectLifeYears ?? 0)],
    [],
    ['Financial Results'],
    ['NPV (MUSD)', Number(Number(p.npv ?? 0).toFixed(2))],
    ['IRR (%)', Number(Number(p.irr ?? 0).toFixed(2))],
    ['Payback (years)', Number(Number(p.paybackPeriod ?? 0).toFixed(1))],
    ['Breakeven Price', Number(Number(p.breakevenPrice ?? 0).toFixed(2))],
    ['Total Revenue (MUSD)', Number(Number(p.totalRevenue ?? 0).toFixed(2))],
    ['Total Cost (MUSD)', Number(Number(p.totalCost ?? 0).toFixed(2))],
    [],
    ['Costs'],
    ['Total CAPEX (MUSD)', Number(Number(p.totalCapex ?? 0).toFixed(2))],
    ['Total OPEX (MUSD/yr)', Number(Number(p.totalOpex ?? 0).toFixed(2))],
  ];
  XLSX.utils.book_append_sheet(wb, sheetFromAoA(summary, false), 'Summary');

  const info: AOA = [
    ['Field', 'Value'],
    ['Name', String(p.name ?? '')],
    ['Mine Type', String(p.mineType ?? '')],
    ['Method', String(p.miningMethod ?? '')],
    ['Location', String(p.location ?? '')],
    ['Latitude', Number(p.latitude ?? 0)],
    ['Longitude', Number(p.longitude ?? 0)],
    ['Currency', String(p.currency ?? 'USD')],
    ['Reserves (Mt)', Number(p.totalReserves ?? 0)],
    ['Ore Grade', `${p.oreGrade ?? 0} ${p.oreGradeUnit ?? '%'}`],
    ['Discount Rate (%)', Number(p.discountRate ?? 0)],
    ['Tax Rate (%)', Number(p.taxRate ?? 0)],
    ['Royalty Rate (%)', Number(p.royaltyRate ?? 0)],
  ];
  XLSX.utils.book_append_sheet(wb, sheetFromAoA(info), 'Project Information');

  const economics: AOA = [
    ['Category', 'Item', 'Value', 'Unit'],
    ['CAPEX', 'Equipment', Number(p.equipmentCost ?? 0), 'MUSD'],
    ['CAPEX', 'Facility', Number(p.facilityCost ?? 0), 'MUSD'],
    ['CAPEX', 'Infrastructure', Number(p.infrastructureCost ?? 0), 'MUSD'],
    ['CAPEX', 'Contingency Rate', Number(p.contingencyRate ?? 0), '%'],
    ['CAPEX', 'Total CAPEX', Number(p.totalCapex ?? 0), 'MUSD'],
    ['OPEX', 'Fuel', Number(p.fuelCost ?? 0), 'MUSD/yr'],
    ['OPEX', 'Personnel', Number(p.personnelCost ?? 0), 'MUSD/yr'],
    ['OPEX', 'Maintenance', Number(p.maintenanceCost ?? 0), 'MUSD/yr'],
    ['OPEX', 'Explosives', Number(p.explosivesCost ?? 0), 'MUSD/yr'],
    ['OPEX', 'Stripping', Number(p.strippingCost ?? 0), 'MUSD/yr'],
    ['OPEX', 'Plant Operating', Number(p.plantOperatingCost ?? 0), 'MUSD/yr'],
    ['OPEX', 'Other', Number(p.otherOpex ?? 0), 'MUSD/yr'],
    ['OPEX', 'Total OPEX', Number(p.totalOpex ?? 0), 'MUSD/yr'],
    ['Revenue', 'Unit Price', Number(p.unitPrice ?? 0), 'USD/t'],
    ['Revenue', 'Annual Production', Number(p.annualProduction ?? 0), String(p.productionUnit ?? 'Mt')],
    ['Revenue', 'By-product Revenue', Number(p.byProductRevenue ?? 0), 'MUSD/yr'],
  ];
  XLSX.utils.book_append_sheet(wb, sheetFromAoA(economics), 'Economics');

  const cf: AOA = [
    [
      'Year',
      'Revenue (MUSD)',
      'OPEX (MUSD)',
      'Depreciation',
      'Tax',
      'Royalty',
      'Credit Payment',
      'Net Cash Flow',
      'Cumulative',
      'Discounted',
    ],
    ...input.cashFlows.map((row) => [
      Number(row.year ?? 0),
      Number(Number(row.revenue ?? 0).toFixed(3)),
      Number(Number(row.opex ?? 0).toFixed(3)),
      Number(Number(row.depreciation ?? 0).toFixed(3)),
      Number(Number(row.taxPayment ?? 0).toFixed(3)),
      Number(Number(row.royalty ?? 0).toFixed(3)),
      Number(Number(row.creditPayment ?? 0).toFixed(3)),
      Number(Number(row.netCashFlow ?? 0).toFixed(3)),
      Number(Number(row.cumulativeCashFlow ?? 0).toFixed(3)),
      Number(Number(row.discountedCashFlow ?? 0).toFixed(3)),
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, sheetFromAoA(cf), 'Cash Flow');

  const equipment: AOA = [
    [
      'Machine Type',
      'Model',
      'Capacity',
      'Qty',
      'Spare',
      'Unit Cost',
      'Total Cost',
      'Fuel L/h',
      'Maintenance',
      'Power',
    ],
    ...input.equipments.map((eq) => [
      String(eq.machineType ?? ''),
      String(eq.model ?? ''),
      String(eq.tonnageCapacity ?? ''),
      Number(eq.quantity ?? 0),
      Number(eq.spareQuantity ?? 0),
      Number(Number(eq.unitCost ?? 0).toFixed(2)),
      Number(Number(eq.totalCost ?? 0).toFixed(2)),
      Number(eq.hourlyFuelConsumption ?? eq.fuelConsumption ?? 0),
      Number(Number(eq.maintenanceCost ?? 0).toFixed(2)),
      String(eq.powerType ?? ''),
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, sheetFromAoA(equipment), 'Equipment');

  const sens: AOA = [['Driver', 'Change (%)', 'NPV (MUSD)', 'IRR (%)']];
  for (const [driver, series] of Object.entries(input.sensitivity)) {
    for (const point of series) {
      sens.push([
        driver,
        point.changePercent,
        Number(point.npv.toFixed(2)),
        Number(point.irr.toFixed(2)),
      ]);
    }
  }
  XLSX.utils.book_append_sheet(wb, sheetFromAoA(sens), 'Sensitivity');

  if (input.monteCarlo) {
    const mc = input.monteCarlo;
    const mcSheet: AOA = [
      ['Metric', 'Value'],
      ['NPV Mean (MUSD)', Number(mc.stats.npvMean.toFixed(2))],
      ['NPV Median (MUSD)', Number(mc.stats.npvMedian.toFixed(2))],
      ['NPV Std Dev (MUSD)', Number(mc.stats.npvStdDev.toFixed(2))],
      ['NPV Min (MUSD)', Number(mc.stats.npvMin.toFixed(2))],
      ['NPV Max (MUSD)', Number(mc.stats.npvMax.toFixed(2))],
      ['P(NPV > 0)', Number((mc.stats.npvPositiveProb * 100).toFixed(1))],
      ['IRR Mean (%)', Number(mc.stats.irrMean.toFixed(2))],
      ['IRR Median (%)', Number(mc.stats.irrMedian.toFixed(2))],
      [],
      ['Histogram Bin', 'Count', 'Cumulative'],
      ...mc.histogram.map((h) => [h.bin, h.count, Number(h.cumulative.toFixed(3))]),
    ];
    XLSX.utils.book_append_sheet(wb, sheetFromAoA(mcSheet, false), 'Monte Carlo');
  }

  // Chart data sheet (values for external charting — SheetJS CE has no embedded charts).
  const chartData: AOA = [
    ['Year', 'Net Cash Flow (MUSD)', 'Cumulative (MUSD)'],
    ...input.cashFlows.map((row) => [
      Number(row.year ?? 0),
      Number(Number(row.netCashFlow ?? 0).toFixed(3)),
      Number(Number(row.cumulativeCashFlow ?? 0).toFixed(3)),
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, sheetFromAoA(chartData), 'Charts');

  return wb;
}

export function workbookToBuffer(wb: XLSX.WorkBook): Buffer {
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
