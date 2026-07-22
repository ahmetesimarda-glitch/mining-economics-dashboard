import ExcelJS from 'exceljs';
import {
  XL,
  applyPrintDefaults,
  autoWidth,
  styleDataCell,
  styleHeaderRow,
  stylePlaceholder,
  styleSection,
  styleTitle,
  thinBorder,
} from './styles';
import { num, sheetName, str, type ExcelWorkbookInput } from './types';

function writeKv(
  ws: ExcelJS.Worksheet,
  startRow: number,
  pairs: [string, string | number | null][],
  placeholderNote?: string
): number {
  let r = startRow;
  for (const [label, value] of pairs) {
    const row = ws.getRow(r);
    row.getCell(1).value = label;
    row.getCell(2).value = value;
    styleDataCell(row.getCell(1), r % 2 === 0);
    styleDataCell(row.getCell(2), r % 2 === 0);
    if (typeof value === 'number') {
      row.getCell(2).numFmt = Number.isInteger(value) ? '#,##0' : '#,##0.00';
    }
    r += 1;
  }
  if (placeholderNote) {
    const row = ws.getRow(r);
    row.getCell(1).value = placeholderNote;
    ws.mergeCells(r, 1, r, 4);
    stylePlaceholder(row.getCell(1));
    r += 1;
  }
  return r;
}

function addNav(wb: ExcelJS.Workbook, names: string[]): void {
  const ws = wb.addWorksheet(sheetName('00 Navigation'), {
    properties: { tabColor: { argb: XL.teal } },
  });
  ws.mergeCells(1, 1, 1, 3);
  ws.getCell(1, 1).value = 'Mining Economics Dashboard — Workbook Navigation';
  styleTitle(ws.getRow(1), 3);
  ws.getRow(2).values = ['#', 'Worksheet', 'Contents'];
  styleHeaderRow(ws.getRow(2), 3);
  names.forEach((name, i) => {
    const row = ws.getRow(i + 3);
    row.getCell(1).value = i + 1;
    row.getCell(2).value = { text: name, hyperlink: `#'${name}'!A1` };
    row.getCell(2).font = { color: { argb: XL.teal }, underline: true, name: 'Calibri', size: 10 };
    row.getCell(3).value = 'Project data / engine results';
    styleDataCell(row.getCell(1), i % 2 === 0);
    styleDataCell(row.getCell(3), i % 2 === 0);
    row.getCell(2).border = thinBorder;
  });
  applyPrintDefaults(ws, 'Navigation');
  autoWidth(ws);
}

/**
 * Professional multi-sheet engineering workbook.
 * Values from stored project data + engine outputs; formulas for totals/links where useful.
 * Never invents missing engineering detail — placeholders are marked explicitly.
 */
export async function buildProfessionalWorkbook(
  input: ExcelWorkbookInput
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Mining Economics Dashboard';
  wb.created = new Date();
  wb.modified = new Date();
  wb.company = 'Mining Economics Dashboard';
  wb.description = 'Consulting-grade economic analysis workbook generated from project data';

  const p = input.project;
  const life = Math.max(1, Math.floor(num(p.projectLifeYears, 1)));
  const sheetNames = [
    '01 Project Summary',
    '02 Economic Inputs',
    '03 Discount Rate',
    '04 Commodity Prices',
    '05 Equipment Investment',
    '06 Initial Investment',
    '07 Depreciation',
    '08 Tire Cost',
    '09 Fuel Cost',
    '10 Personnel Cost',
    '11 Gov Forestry Fees',
    '12 Production Schedule',
    '13 Operating Costs',
    '14 Revenue',
    '15 Cash Flow',
    '16 NPV',
    '17 IRR',
    '18 Break-even',
    '19 Sensitivity',
    '20 Monte Carlo',
    '21 Tornado',
  ].map(sheetName);

  addNav(wb, sheetNames);

  // —— Project Summary ——
  {
    const name = sheetNames[0];
    const ws = wb.addWorksheet(name, { properties: { tabColor: { argb: XL.slate } } });
    ws.mergeCells(1, 1, 1, 4);
    ws.getCell(1, 1).value = `${str(p.name, 'Project')} — Project Summary`;
    styleTitle(ws.getRow(1), 4);
    styleSection(ws.getCell(3, 1));
    ws.getCell(3, 1).value = 'Project Identity';
    let r = writeKv(ws, 4, [
      ['Project Name', str(p.name)],
      ['Commodity / Mine Type', str(p.mineType)],
      ['Mining Method', str(p.miningMethod)],
      ['Location', str(p.location)],
      ['Currency', str(p.currency, 'USD')],
      ['Mine Life (years)', life],
      ['Status', str(p.status)],
    ]);
    r += 1;
    styleSection(ws.getCell(r, 1));
    ws.getCell(r, 1).value = 'Headline Results (MUSD unless noted)';
    r += 1;
    r = writeKv(ws, r, [
      ['NPV (MUSD)', num(p.npv)],
      ['IRR (%)', num(p.irr)],
      ['Payback (years)', num(p.paybackPeriod)],
      ['Break-even Price', num(p.breakevenPrice)],
      ['Total Revenue (MUSD)', num(p.totalRevenue)],
      ['Total Cost (MUSD)', num(p.totalCost)],
      ['Total CAPEX (MUSD)', num(p.totalCapex)],
      ['Total OPEX (MUSD/yr)', num(p.totalOpex)],
    ]);
    ws.getCell(r + 1, 1).value = 'See Navigation sheet for all worksheets.';
    applyPrintDefaults(ws, 'Project Summary');
    autoWidth(ws);
  }

  // —— Economic Inputs ——
  {
    const name = sheetNames[1];
    const ws = wb.addWorksheet(name);
    ws.mergeCells(1, 1, 1, 4);
    ws.getCell(1, 1).value = 'Economic Inputs';
    styleTitle(ws.getRow(1), 4);
    ws.getRow(2).values = ['Category', 'Item', 'Value', 'Unit'];
    styleHeaderRow(ws.getRow(2), 4);
    const rows: [string, string, number, string][] = [
      ['Fiscal', 'Discount Rate', num(p.discountRate), '%'],
      ['Fiscal', 'Tax Rate', num(p.taxRate), '%'],
      ['Fiscal', 'Royalty Rate', num(p.royaltyRate), '%'],
      ['Fiscal', 'Credit Rate', num(p.creditRate), '%'],
      ['Fiscal', 'Credit Years', num(p.creditYears), 'years'],
      ['Revenue', 'Unit Price', num(p.unitPrice), 'USD/t'],
      ['Revenue', 'Annual Production', num(p.annualProduction), str(p.productionUnit, 'Mt')],
      ['Revenue', 'By-product Revenue', num(p.byProductRevenue), 'MUSD/yr'],
      ['CAPEX', 'Equipment', num(p.equipmentCost), 'MUSD'],
      ['CAPEX', 'Facility', num(p.facilityCost), 'MUSD'],
      ['CAPEX', 'Infrastructure', num(p.infrastructureCost), 'MUSD'],
      ['CAPEX', 'Contingency Rate', num(p.contingencyRate), '%'],
      ['CAPEX', 'Total CAPEX', num(p.totalCapex), 'MUSD'],
      ['OPEX', 'Fuel', num(p.fuelCost), 'MUSD/yr'],
      ['OPEX', 'Personnel', num(p.personnelCost), 'MUSD/yr'],
      ['OPEX', 'Maintenance', num(p.maintenanceCost), 'MUSD/yr'],
      ['OPEX', 'Explosives', num(p.explosivesCost), 'MUSD/yr'],
      ['OPEX', 'Tires', num(p.tireCost), 'MUSD/yr'],
      ['OPEX', 'Stripping', num(p.strippingCost), 'MUSD/yr'],
      ['OPEX', 'Plant Operating', num(p.plantOperatingCost), 'MUSD/yr'],
      ['OPEX', 'Other', num(p.otherOpex), 'MUSD/yr'],
      ['OPEX', 'Total OPEX', num(p.totalOpex), 'MUSD/yr'],
      ['Other', 'Forest Cost', num(p.forestCost), 'MUSD'],
      ['Other', 'Land Cost', num(p.landCost), 'MUSD'],
      ['Other', 'Rehabilitation Cost', num(p.rehabilitationCost), 'MUSD'],
    ];
    rows.forEach((row, i) => {
      const excelRow = ws.getRow(i + 3);
      excelRow.values = row;
      for (let c = 1; c <= 4; c++) styleDataCell(excelRow.getCell(c), i % 2 === 0);
      excelRow.getCell(3).numFmt = '#,##0.00';
    });
    applyPrintDefaults(ws, 'Economic Inputs');
    autoWidth(ws);
  }

  // —— Discount Rate ——
  {
    const name = sheetNames[2];
    const ws = wb.addWorksheet(name);
    ws.mergeCells(1, 1, 1, 3);
    ws.getCell(1, 1).value = 'Discount Rate';
    styleTitle(ws.getRow(1), 3);
    ws.getRow(2).values = ['Parameter', 'Value', 'Notes'];
    styleHeaderRow(ws.getRow(2), 3);
    ws.getRow(3).values = ['Project Discount Rate (%)', num(p.discountRate), 'Applied to discounted cash flows / NPV'];
    for (let c = 1; c <= 3; c++) styleDataCell(ws.getRow(3).getCell(c));
    ws.getRow(3).getCell(2).numFmt = '0.00';
    ws.getCell(5, 1).value =
      'PLACEHOLDER: Student-specific discount-rate ladders from the reference workbook are not part of the application model.';
    ws.mergeCells(5, 1, 5, 3);
    stylePlaceholder(ws.getCell(5, 1));
    applyPrintDefaults(ws, 'Discount Rate');
    autoWidth(ws);
  }

  // —— Commodity Prices ——
  {
    const name = sheetNames[3];
    const ws = wb.addWorksheet(name);
    ws.mergeCells(1, 1, 1, 4);
    ws.getCell(1, 1).value = 'Commodity Prices';
    styleTitle(ws.getRow(1), 4);
    ws.getRow(2).values = ['Item', 'Unit', 'Price', 'Source'];
    styleHeaderRow(ws.getRow(2), 4);
    ws.getRow(3).values = [
      str(p.mineType, 'Primary commodity'),
      `USD / ${str(p.productionUnit, 't')}`,
      num(p.unitPrice),
      'Project assumption',
    ];
    for (let c = 1; c <= 4; c++) styleDataCell(ws.getRow(3).getCell(c));
    ws.getRow(3).getCell(3).numFmt = '#,##0.00';
    let r = 4;
    input.byProducts.forEach((bp, i) => {
      const row = ws.getRow(r);
      row.values = [
        str(bp.name, `By-product ${i + 1}`),
        str(bp.priceUnit, 'USD/t'),
        num(bp.unitPrice),
        'By-product record',
      ];
      for (let c = 1; c <= 4; c++) styleDataCell(row.getCell(c), i % 2 === 0);
      row.getCell(3).numFmt = '#,##0.00';
      r += 1;
    });
    if (!input.byProducts.length) {
      ws.getCell(r, 1).value =
        'No by-product price records. Equipment unit prices appear on Equipment Investment.';
      ws.mergeCells(r, 1, r, 4);
      stylePlaceholder(ws.getCell(r, 1));
    }
    applyPrintDefaults(ws, 'Commodity Prices');
    autoWidth(ws);
  }

  // —— Equipment Investment ——
  {
    const name = sheetNames[4];
    const ws = wb.addWorksheet(name);
    ws.mergeCells(1, 1, 1, 8);
    ws.getCell(1, 1).value = 'Equipment Investment';
    styleTitle(ws.getRow(1), 8);
    ws.getRow(2).values = [
      'Machine',
      'Model / Size',
      'Qty',
      'Spare',
      'Unit Cost (USD)',
      'Total Cost (USD)',
      'Fuel L/h',
      'Power',
    ];
    styleHeaderRow(ws.getRow(2), 8);
    const start = 3;
    input.equipments.forEach((eq, i) => {
      const row = ws.getRow(start + i);
      const qty = num(eq.quantity, 1);
      const spare = num(eq.spareQuantity);
      const unit = num(eq.unitCost);
      row.getCell(1).value = str(eq.machineType);
      row.getCell(2).value = str(eq.tonnageCapacity) || str(eq.model);
      row.getCell(3).value = qty;
      row.getCell(4).value = spare;
      row.getCell(5).value = unit;
      // Formula mirrors engineering workbook: (qty + spare) * unit
      row.getCell(6).value = {
        formula: `(C${start + i}+D${start + i})*E${start + i}`,
        result: num(eq.totalCost, (qty + spare) * unit),
      };
      row.getCell(7).value = num(eq.hourlyFuelConsumption ?? eq.fuelConsumption);
      row.getCell(8).value = str(eq.powerType, 'diesel');
      for (let c = 1; c <= 8; c++) styleDataCell(row.getCell(c), i % 2 === 0);
      row.getCell(5).numFmt = '#,##0.00';
      row.getCell(6).numFmt = '#,##0.00';
    });
    const end = start + Math.max(input.equipments.length, 1) - 1;
    const totalRow = start + input.equipments.length;
    if (input.equipments.length) {
      ws.getRow(totalRow).getCell(1).value = 'Total';
      ws.getRow(totalRow).getCell(6).value = {
        formula: `SUM(F${start}:F${end})`,
        result: input.equipments.reduce((s, eq) => s + num(eq.totalCost), 0),
      };
      for (let c = 1; c <= 8; c++) {
        const cell = ws.getRow(totalRow).getCell(c);
        styleDataCell(cell);
        cell.font = { bold: true, name: 'Calibri', size: 10 };
      }
      ws.getRow(totalRow).getCell(6).numFmt = '#,##0.00';
    } else {
      ws.getCell(3, 1).value = 'No equipment records for this project.';
      stylePlaceholder(ws.getCell(3, 1));
    }
    applyPrintDefaults(ws, 'Equipment Investment');
    ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: 8 } };
    autoWidth(ws);
  }

  // —— Initial Investment ——
  {
    const name = sheetNames[5];
    const ws = wb.addWorksheet(name);
    ws.mergeCells(1, 1, 1, 3);
    ws.getCell(1, 1).value = 'Initial Investment (CAPEX)';
    styleTitle(ws.getRow(1), 3);
    ws.getRow(2).values = ['Cost Item', 'Amount (MUSD)', 'Notes'];
    styleHeaderRow(ws.getRow(2), 3);
    const items: [string, number, string][] = [
      ['Equipment', num(p.equipmentCost), 'Fleet capital'],
      ['Facilities / Plant', num(p.facilityCost), 'Process plant & buildings'],
      ['Infrastructure', num(p.infrastructureCost), 'Roads, power, water'],
      ['Land', num(p.landCost), 'Acquisition / expropriation'],
      ['Forest / Permitting', num(p.forestCost), 'Forestry & government fees'],
      ['Rehabilitation', num(p.rehabilitationCost), 'Closure provision (Year 0)'],
    ];
    items.forEach((item, i) => {
      const row = ws.getRow(3 + i);
      row.values = item;
      for (let c = 1; c <= 3; c++) styleDataCell(row.getCell(c), i % 2 === 0);
      row.getCell(2).numFmt = '#,##0.000';
    });
    const subEnd = 2 + items.length;
    const contRow = subEnd + 1;
    const totalRow = contRow + 1;
    ws.getRow(contRow).values = ['Contingency Rate (%)', num(p.contingencyRate), 'Applied in stored Total CAPEX'];
    ws.getRow(totalRow).getCell(1).value = 'Total CAPEX (stored)';
    // Contingency is already embedded in engine totalCapex — export the stored total.
    ws.getRow(totalRow).getCell(2).value = num(p.totalCapex);
    for (let c = 1; c <= 3; c++) {
      styleDataCell(ws.getRow(contRow).getCell(c));
      styleDataCell(ws.getRow(totalRow).getCell(c));
      ws.getRow(totalRow).getCell(c).font = { bold: true, name: 'Calibri', size: 10 };
    }
    ws.getRow(totalRow).getCell(2).numFmt = '#,##0.000';
    if (input.capexItems.length) {
      const base = totalRow + 2;
      ws.getCell(base, 1).value = 'Detailed CAPEX Items';
      styleSection(ws.getCell(base, 1));
      ws.getRow(base + 1).values = ['Name', 'Category', 'Qty', 'Spare', 'Unit Cost', 'Total'];
      styleHeaderRow(ws.getRow(base + 1), 6);
      input.capexItems.forEach((it, i) => {
        const row = ws.getRow(base + 2 + i);
        row.values = [
          str(it.name),
          str(it.category),
          num(it.quantity),
          num(it.spareQuantity),
          num(it.unitCost),
          num(it.totalCost),
        ];
        for (let c = 1; c <= 6; c++) styleDataCell(row.getCell(c), i % 2 === 0);
      });
    }
    applyPrintDefaults(ws, 'Initial Investment');
    autoWidth(ws);
  }

  // —— Depreciation ——
  {
    const name = sheetNames[6];
    const ws = wb.addWorksheet(name);
    ws.mergeCells(1, 1, 1, 6);
    ws.getCell(1, 1).value = 'Depreciation Schedule (MUSD)';
    styleTitle(ws.getRow(1), 6);
    ws.getRow(2).values = [
      'Year',
      'Equipment Dep.',
      'Facility Dep.',
      'Total Dep.',
      'Equip. Book Value',
      'Facility Book Value',
    ];
    styleHeaderRow(ws.getRow(2), 6);
    if (input.depreciation.length) {
      input.depreciation.forEach((d, i) => {
        const row = ws.getRow(3 + i);
        row.values = [
          d.year,
          d.equipmentDep,
          d.facilityDep,
          { formula: `B${3 + i}+C${3 + i}`, result: d.totalDep },
          d.equipmentBookValue,
          d.facilityBookValue,
        ];
        for (let c = 1; c <= 6; c++) styleDataCell(row.getCell(c), i % 2 === 0);
        for (let c = 2; c <= 6; c++) row.getCell(c).numFmt = '#,##0.000';
      });
    } else {
      ws.getCell(3, 1).value = 'Depreciation table unavailable for current parameters.';
      stylePlaceholder(ws.getCell(3, 1));
    }
    applyPrintDefaults(ws, 'Depreciation');
    autoWidth(ws);
  }

  // —— Tire Cost ——
  {
    const name = sheetNames[7];
    const ws = wb.addWorksheet(name);
    ws.mergeCells(1, 1, 1, 5);
    ws.getCell(1, 1).value = 'Tire Cost';
    styleTitle(ws.getRow(1), 5);
    ws.getRow(2).values = ['Item', 'Value', 'Unit', 'Status', 'Notes'];
    styleHeaderRow(ws.getRow(2), 5);
    ws.getRow(3).values = [
      'Annual Tire Cost (aggregate)',
      num(p.tireCost),
      'MUSD/yr',
      'From project',
      'Stored OPEX component',
    ];
    for (let c = 1; c <= 5; c++) styleDataCell(ws.getRow(3).getCell(c));
    ws.getRow(3).getCell(2).numFmt = '#,##0.000';
    ws.getCell(5, 1).value =
      'PLACEHOLDER: Per-equipment tire sets, consumption rates, and unit tire prices are not modelled in the application. Only the aggregate tireCost field is available.';
    ws.mergeCells(5, 1, 5, 5);
    stylePlaceholder(ws.getCell(5, 1));
    applyPrintDefaults(ws, 'Tire Cost');
    autoWidth(ws);
  }

  // —— Fuel Cost ——
  {
    const name = sheetNames[8];
    const ws = wb.addWorksheet(name);
    ws.mergeCells(1, 1, 1, 7);
    ws.getCell(1, 1).value = 'Fuel Cost';
    styleTitle(ws.getRow(1), 7);
    ws.getRow(2).values = [
      'Equipment',
      'Qty',
      'L/h',
      'Daily Hours',
      'Annual Litres',
      'Fuel Price',
      'Annual Cost (USD)',
    ];
    styleHeaderRow(ws.getRow(2), 7);
    const fuelPrice = num(p.fuelPricePerLiter);
    if (input.fuelAnalysis.length) {
      input.fuelAnalysis.forEach((f, i) => {
        const row = ws.getRow(3 + i);
        const r = 3 + i;
        row.getCell(1).value = f.equipmentName;
        row.getCell(2).value = f.quantity;
        row.getCell(3).value = f.hourlyConsumption;
        row.getCell(4).value = f.dailyHours;
        row.getCell(5).value = {
          formula: `C${r}*D${r}*365*B${r}`,
          result: f.annualConsumption,
        };
        row.getCell(6).value = fuelPrice;
        row.getCell(7).value = {
          formula: `E${r}*F${r}`,
          result: f.annualCost,
        };
        for (let c = 1; c <= 7; c++) styleDataCell(row.getCell(c), i % 2 === 0);
        row.getCell(5).numFmt = '#,##0';
        row.getCell(6).numFmt = '0.000';
        row.getCell(7).numFmt = '#,##0.00';
      });
      const totalR = 3 + input.fuelAnalysis.length;
      ws.getRow(totalR).getCell(1).value = 'Total';
      ws.getRow(totalR).getCell(7).value = {
        formula: `SUM(G3:G${totalR - 1})`,
        result: input.fuelAnalysis.reduce((s, f) => s + f.annualCost, 0),
      };
      for (let c = 1; c <= 7; c++) {
        styleDataCell(ws.getRow(totalR).getCell(c));
        ws.getRow(totalR).getCell(c).font = { bold: true, name: 'Calibri', size: 10 };
      }
      ws.getRow(totalR).getCell(7).numFmt = '#,##0.00';
    } else {
      ws.getRow(3).values = [
        'Project fuel OPEX (aggregate)',
        '',
        '',
        '',
        '',
        fuelPrice,
        num(p.fuelCost) * 1_000_000,
      ];
      for (let c = 1; c <= 7; c++) styleDataCell(ws.getRow(3).getCell(c));
      ws.getCell(5, 1).value =
        'PLACEHOLDER: No equipment hourly fuel rates available — showing aggregate fuelCost only.';
      ws.mergeCells(5, 1, 5, 7);
      stylePlaceholder(ws.getCell(5, 1));
    }
    applyPrintDefaults(ws, 'Fuel Cost');
    autoWidth(ws);
  }

  // —— Personnel Cost ——
  {
    const name = sheetNames[9];
    const ws = wb.addWorksheet(name);
    ws.mergeCells(1, 1, 1, 5);
    ws.getCell(1, 1).value = 'Personnel Cost';
    styleTitle(ws.getRow(1), 5);
    ws.getRow(2).values = ['Role', 'Count', 'Monthly Salary (USD)', 'Annual Cost (USD)', 'Notes'];
    styleHeaderRow(ws.getRow(2), 5);
    if (input.personnels.length) {
      input.personnels.forEach((pe, i) => {
        const r = 3 + i;
        const row = ws.getRow(r);
        const count = num(pe.count, 1);
        const monthly = num(pe.monthlySalary);
        row.getCell(1).value = str(pe.role);
        row.getCell(2).value = count;
        row.getCell(3).value = monthly;
        row.getCell(4).value = {
          formula: `B${r}*C${r}*12`,
          result: num(pe.annualCost, count * monthly * 12),
        };
        row.getCell(5).value = pe.isCustom ? 'Custom' : 'Standard';
        for (let c = 1; c <= 5; c++) styleDataCell(row.getCell(c), i % 2 === 0);
        row.getCell(3).numFmt = '#,##0.00';
        row.getCell(4).numFmt = '#,##0.00';
      });
      const totalR = 3 + input.personnels.length;
      ws.getRow(totalR).getCell(1).value = 'Total';
      ws.getRow(totalR).getCell(4).value = {
        formula: `SUM(D3:D${totalR - 1})`,
        result: input.personnels.reduce(
          (s, pe) => s + num(pe.annualCost, num(pe.count) * num(pe.monthlySalary) * 12),
          0
        ),
      };
      for (let c = 1; c <= 5; c++) {
        styleDataCell(ws.getRow(totalR).getCell(c));
        ws.getRow(totalR).getCell(c).font = { bold: true, name: 'Calibri', size: 10 };
      }
      ws.getRow(totalR).getCell(4).numFmt = '#,##0.00';
    } else {
      ws.getRow(3).values = [
        'Aggregate personnel OPEX',
        '',
        '',
        num(p.personnelCost) * 1_000_000,
        'From project.personnelCost (MUSD→USD)',
      ];
      for (let c = 1; c <= 5; c++) styleDataCell(ws.getRow(3).getCell(c));
      ws.getCell(5, 1).value = 'No detailed personnel roster — aggregate only.';
      stylePlaceholder(ws.getCell(5, 1));
    }
    applyPrintDefaults(ws, 'Personnel Cost');
    autoWidth(ws);
  }

  // —— Government & Forestry ——
  {
    const name = sheetNames[10];
    const ws = wb.addWorksheet(name);
    ws.mergeCells(1, 1, 1, 4);
    ws.getCell(1, 1).value = 'Government & Forestry Fees';
    styleTitle(ws.getRow(1), 4);
    ws.getRow(2).values = ['Item', 'Amount (MUSD)', 'Unit Detail', 'Notes'];
    styleHeaderRow(ws.getRow(2), 4);
    const rows: [string, number, string, string][] = [
      ['Forest / Permitting Cost', num(p.forestCost), 'MUSD (Year 0)', 'Stored project field'],
      ['Land / Expropriation', num(p.landCost), 'MUSD (Year 0)', 'Stored project field'],
      ['Rehabilitation Provision', num(p.rehabilitationCost), 'MUSD (Year 0)', 'Stored project field'],
      [
        'Rehabilitation Area',
        num(p.rehabilitationAreaHa),
        'ha',
        num(p.rehabilitationAreaHa) ? 'From project' : 'Not set',
      ],
      [
        'Rehab Cost per ha',
        num(p.rehabilitationCostPerHa),
        'USD/ha',
        num(p.rehabilitationCostPerHa) ? 'From project' : 'Not set',
      ],
      ['Royalty Rate', num(p.royaltyRate), '% of revenue', 'Applied in cash-flow engine'],
      ['Tax Rate', num(p.taxRate), '% of taxable income', 'Tax gated when income > 0'],
    ];
    rows.forEach((row, i) => {
      const excelRow = ws.getRow(3 + i);
      excelRow.values = row;
      for (let c = 1; c <= 4; c++) styleDataCell(excelRow.getCell(c), i % 2 === 0);
      excelRow.getCell(2).numFmt = '#,##0.000';
    });
    const sumRow = 3 + rows.length;
    ws.getRow(sumRow).getCell(1).value = 'Total Year-0 Land/Forest/Rehab';
    ws.getRow(sumRow).getCell(2).value = {
      formula: 'B3+B4+B5',
      result: num(p.forestCost) + num(p.landCost) + num(p.rehabilitationCost),
    };
    for (let c = 1; c <= 4; c++) {
      styleDataCell(ws.getRow(sumRow).getCell(c));
      ws.getRow(sumRow).getCell(c).font = { bold: true, name: 'Calibri', size: 10 };
    }
    ws.getRow(sumRow).getCell(2).numFmt = '#,##0.000';
    ws.getCell(sumRow + 2, 1).value =
      'PLACEHOLDER: Area-based Mm² unit rates from the reference engineering workbook are not captured as separate fields; only aggregate MUSD costs are exported.';
    ws.mergeCells(sumRow + 2, 1, sumRow + 2, 4);
    stylePlaceholder(ws.getCell(sumRow + 2, 1));
    applyPrintDefaults(ws, 'Government & Forestry');
    autoWidth(ws);
  }

  // —— Production Schedule ——
  {
    const name = sheetNames[11];
    const ws = wb.addWorksheet(name);
    ws.mergeCells(1, 1, 1, life + 3);
    ws.getCell(1, 1).value = 'Production Schedule';
    styleTitle(ws.getRow(1), Math.min(life + 3, 20));
    ws.getCell(2, 1).value = 'Stream';
    ws.getCell(2, 2).value = 'Unit';
    ws.getCell(2, 3).value = 'Total';
    for (let y = 0; y <= life; y++) {
      ws.getCell(2, 4 + y).value = y;
    }
    styleHeaderRow(ws.getRow(2), life + 3);
    // Steady-state production from Year 1 (Year 0 = 0) — matches engine constant production
    ws.getCell(3, 1).value = 'Ore / Product';
    ws.getCell(3, 2).value = str(p.productionUnit, 'Mt');
    const prod = num(p.annualProduction);
    for (let y = 0; y <= life; y++) {
      ws.getCell(3, 4 + y).value = y === 0 ? 0 : prod;
      ws.getCell(3, 4 + y).numFmt = '0.000';
      styleDataCell(ws.getCell(3, 4 + y));
    }
    ws.getCell(3, 3).value = {
      formula: `SUM(D3:${excelCol(4 + life)}3)`,
      result: prod * life,
    };
    ws.getCell(3, 3).numFmt = '0.000';
    styleDataCell(ws.getCell(3, 1));
    styleDataCell(ws.getCell(3, 2));
    styleDataCell(ws.getCell(3, 3));

    ws.getCell(4, 1).value = 'Stripping (owner)';
    ws.getCell(4, 2).value = 'Mm3';
    const strip = num(p.annualStrippingVolume);
    for (let y = 0; y <= life; y++) {
      ws.getCell(4, 4 + y).value = y === 0 ? 0 : strip;
      styleDataCell(ws.getCell(4, 4 + y));
    }
    ws.getCell(4, 3).value = {
      formula: `SUM(D4:${excelCol(4 + life)}4)`,
      result: strip * life,
    };
    styleDataCell(ws.getCell(4, 1));
    styleDataCell(ws.getCell(4, 2));
    styleDataCell(ws.getCell(4, 3));

    ws.getCell(6, 1).value =
      'PLACEHOLDER: Year-by-year contractor stripping and variable production profiles from the reference workbook are not stored; constant annual rates are shown.';
    ws.mergeCells(6, 1, 6, 8);
    stylePlaceholder(ws.getCell(6, 1));
    applyPrintDefaults(ws, 'Production Schedule');
    ws.views = [{ state: 'frozen', xSplit: 3, ySplit: 2, showGridLines: false }];
    autoWidth(ws, 8, 14);
  }

  // —— Operating Costs ——
  {
    const name = sheetNames[12];
    const ws = wb.addWorksheet(name);
    ws.mergeCells(1, 1, 1, 3);
    ws.getCell(1, 1).value = 'Operating Costs (Annual)';
    styleTitle(ws.getRow(1), 3);
    ws.getRow(2).values = ['Cost Item', 'Amount (MUSD/yr)', 'Notes'];
    styleHeaderRow(ws.getRow(2), 3);
    const opexRows: [string, number, string][] = [
      ['Fuel', num(p.fuelCost), 'See Fuel Cost sheet'],
      ['Personnel', num(p.personnelCost), 'See Personnel Cost sheet'],
      ['Maintenance / Spares', num(p.maintenanceCost), 'Aggregate'],
      ['Explosives', num(p.explosivesCost), 'Aggregate'],
      ['Tires', num(p.tireCost), 'Aggregate'],
      ['Stripping', num(p.strippingCost), 'Owner stripping'],
      ['Contractor Stripping', num(p.contractorStrippingCost), 'If used'],
      ['Plant Operating', num(p.plantOperatingCost), 'Process plant'],
      ['Other', num(p.otherOpex), 'Miscellaneous'],
    ];
    opexRows.forEach((row, i) => {
      const excelRow = ws.getRow(3 + i);
      excelRow.values = row;
      for (let c = 1; c <= 3; c++) styleDataCell(excelRow.getCell(c), i % 2 === 0);
      excelRow.getCell(2).numFmt = '#,##0.000';
    });
    const totalR = 3 + opexRows.length;
    ws.getRow(totalR).getCell(1).value = 'Total OPEX (stored)';
    ws.getRow(totalR).getCell(2).value = num(p.totalOpex);
    for (let c = 1; c <= 3; c++) {
      styleDataCell(ws.getRow(totalR).getCell(c));
      ws.getRow(totalR).getCell(c).font = { bold: true, name: 'Calibri', size: 10 };
    }
    ws.getRow(totalR).getCell(2).numFmt = '#,##0.000';
    if (input.opexItems.length) {
      const base = totalR + 2;
      ws.getCell(base, 1).value = 'Detailed OPEX Items';
      styleSection(ws.getCell(base, 1));
      ws.getRow(base + 1).values = ['Name', 'Category', 'Annual Cost', 'Unit'];
      styleHeaderRow(ws.getRow(base + 1), 4);
      input.opexItems.forEach((it, i) => {
        const row = ws.getRow(base + 2 + i);
        row.values = [str(it.name), str(it.category), num(it.annualCost), str(it.unit)];
        for (let c = 1; c <= 4; c++) styleDataCell(row.getCell(c), i % 2 === 0);
      });
    }
    applyPrintDefaults(ws, 'Operating Costs');
    autoWidth(ws);
  }

  // —— Revenue ——
  {
    const name = sheetNames[13];
    const ws = wb.addWorksheet(name);
    ws.mergeCells(1, 1, 1, 4);
    ws.getCell(1, 1).value = 'Revenue Projection';
    styleTitle(ws.getRow(1), 4);
    ws.getRow(2).values = ['Stream', 'Annual Volume', 'Unit Price', 'Annual Revenue (MUSD)'];
    styleHeaderRow(ws.getRow(2), 4);
    ws.getRow(3).getCell(1).value = 'Primary product';
    ws.getRow(3).getCell(2).value = num(p.annualProduction);
    ws.getRow(3).getCell(3).value = num(p.unitPrice);
    // Engine stores revenue in MUSD; unitPrice * annualProduction depends on production unit scale
    const primaryRev =
      input.cashFlows.find((cf) => num(cf.year) === 1)?.revenue !== undefined
        ? num(input.cashFlows.find((cf) => num(cf.year) === 1)?.revenue) -
          num(p.byProductRevenue)
        : num(p.unitPrice) * num(p.annualProduction);
    ws.getRow(3).getCell(4).value = primaryRev;
    for (let c = 1; c <= 4; c++) styleDataCell(ws.getRow(3).getCell(c));
    ws.getRow(3).getCell(4).numFmt = '#,##0.000';
    ws.getRow(4).values = ['By-products', '', '', num(p.byProductRevenue)];
    for (let c = 1; c <= 4; c++) styleDataCell(ws.getRow(4).getCell(c), true);
    ws.getRow(4).getCell(4).numFmt = '#,##0.000';
    ws.getRow(5).getCell(1).value = 'Total annual (typical)';
    ws.getRow(5).getCell(4).value = { formula: 'D3+D4', result: primaryRev + num(p.byProductRevenue) };
    for (let c = 1; c <= 4; c++) {
      styleDataCell(ws.getRow(5).getCell(c));
      ws.getRow(5).getCell(c).font = { bold: true, name: 'Calibri', size: 10 };
    }
    ws.getRow(5).getCell(4).numFmt = '#,##0.000';
    ws.getRow(7).getCell(1).value = 'Life-of-mine total revenue (stored)';
    ws.getRow(7).getCell(2).value = num(p.totalRevenue);
    styleDataCell(ws.getRow(7).getCell(1));
    styleDataCell(ws.getRow(7).getCell(2));
    ws.getRow(7).getCell(2).numFmt = '#,##0.000';
    applyPrintDefaults(ws, 'Revenue');
    autoWidth(ws);
  }

  // —— Cash Flow ——
  {
    const name = sheetNames[14];
    const ws = wb.addWorksheet(name);
    ws.mergeCells(1, 1, 1, 11);
    ws.getCell(1, 1).value = 'Cash Flow Statement (MUSD)';
    styleTitle(ws.getRow(1), 11);
    ws.getRow(2).values = [
      'Year',
      'Revenue',
      'OPEX',
      'Depreciation',
      'Royalty',
      'Tax',
      'Credit Payment',
      'Credit Interest',
      'Net Cash Flow',
      'Cumulative',
      'Discounted',
    ];
    styleHeaderRow(ws.getRow(2), 11);
    input.cashFlows.forEach((cf, i) => {
      const r = 3 + i;
      const row = ws.getRow(r);
      row.values = [
        num(cf.year),
        num(cf.revenue),
        num(cf.opex),
        num(cf.depreciation),
        num(cf.royalty),
        num(cf.taxPayment),
        num(cf.creditPayment),
        num(cf.creditInterest),
        num(cf.netCashFlow),
        num(cf.cumulativeCashFlow),
        num(cf.discountedCashFlow),
      ];
      for (let c = 1; c <= 11; c++) styleDataCell(row.getCell(c), i % 2 === 0);
      for (let c = 2; c <= 11; c++) row.getCell(c).numFmt = '#,##0.000';
      // Conditional-style font for negative net CF
      if (num(cf.netCashFlow) < 0) {
        row.getCell(9).font = { color: { argb: XL.neg }, name: 'Calibri', size: 10 };
      } else {
        row.getCell(9).font = { color: { argb: XL.pos }, name: 'Calibri', size: 10 };
      }
    });
    if (input.cashFlows.length) {
      const start = 3;
      const end = 2 + input.cashFlows.length;
      const totalR = end + 1;
      ws.getRow(totalR).getCell(1).value = 'Sum';
      for (const col of [2, 3, 5, 6, 7, 8, 9, 11]) {
        const letter = excelCol(col);
        ws.getRow(totalR).getCell(col).value = {
          formula: `SUM(${letter}${start}:${letter}${end})`,
        };
        ws.getRow(totalR).getCell(col).numFmt = '#,##0.000';
      }
      for (let c = 1; c <= 11; c++) {
        styleDataCell(ws.getRow(totalR).getCell(c));
        ws.getRow(totalR).getCell(c).font = { bold: true, name: 'Calibri', size: 10 };
      }
    }
    applyPrintDefaults(ws, 'Cash Flow');
    ws.autoFilter = { from: 'A2', to: 'K2' };
    autoWidth(ws, 10, 14);
  }

  // —— NPV ——
  {
    const name = sheetNames[15];
    const ws = wb.addWorksheet(name);
    ws.mergeCells(1, 1, 1, 3);
    ws.getCell(1, 1).value = 'Net Present Value';
    styleTitle(ws.getRow(1), 3);
    ws.getRow(2).values = ['Metric', 'Value', 'Unit'];
    styleHeaderRow(ws.getRow(2), 3);
    ws.getRow(3).values = ['Discount Rate', num(p.discountRate), '%'];
    ws.getRow(4).values = ['NPV (stored / analysis)', num(p.npv), 'MUSD'];
    const discSum = input.cashFlows.reduce((s, cf) => s + num(cf.discountedCashFlow), 0);
    ws.getRow(5).values = ['Sum of Discounted CF (check)', discSum, 'MUSD'];
    for (let r = 3; r <= 5; r++) {
      for (let c = 1; c <= 3; c++) styleDataCell(ws.getRow(r).getCell(c), r % 2 === 0);
      ws.getRow(r).getCell(2).numFmt = '#,##0.00';
    }
    if (num(p.npv) >= 0) {
      ws.getRow(4).getCell(2).font = { bold: true, color: { argb: XL.pos }, name: 'Calibri' };
    } else {
      ws.getRow(4).getCell(2).font = { bold: true, color: { argb: XL.neg }, name: 'Calibri' };
    }
    applyPrintDefaults(ws, 'NPV');
    autoWidth(ws);
  }

  // —— IRR ——
  {
    const name = sheetNames[16];
    const ws = wb.addWorksheet(name);
    ws.mergeCells(1, 1, 1, 3);
    ws.getCell(1, 1).value = 'Internal Rate of Return';
    styleTitle(ws.getRow(1), 3);
    ws.getRow(2).values = ['Metric', 'Value', 'Unit'];
    styleHeaderRow(ws.getRow(2), 3);
    ws.getRow(3).values = ['IRR (engine)', num(p.irr), '%'];
    for (let c = 1; c <= 3; c++) styleDataCell(ws.getRow(3).getCell(c));
    ws.getRow(3).getCell(2).numFmt = '0.00';
    if (input.cashFlows.length >= 2) {
      // Excel IRR on net cash flows (presentation cross-check; engine remains source of truth)
      ws.getCell(5, 1).value = 'Net CF series (for Excel IRR cross-check)';
      styleSection(ws.getCell(5, 1));
      input.cashFlows.forEach((cf, i) => {
        ws.getCell(6 + i, 1).value = num(cf.year);
        ws.getCell(6 + i, 2).value = num(cf.netCashFlow);
        styleDataCell(ws.getCell(6 + i, 1), i % 2 === 0);
        styleDataCell(ws.getCell(6 + i, 2), i % 2 === 0);
        ws.getCell(6 + i, 2).numFmt = '#,##0.000';
      });
      const end = 5 + input.cashFlows.length;
      ws.getCell(end + 2, 1).value = 'Excel IRR (decimal)';
      ws.getCell(end + 2, 2).value = {
        formula: `IRR(B6:B${end})`,
        result: num(p.irr) / 100,
      };
      styleDataCell(ws.getCell(end + 2, 1));
      styleDataCell(ws.getCell(end + 2, 2));
      ws.getCell(end + 2, 2).numFmt = '0.00%';
    }
    applyPrintDefaults(ws, 'IRR');
    autoWidth(ws);
  }

  // —— Break-even ——
  {
    const name = sheetNames[17];
    const ws = wb.addWorksheet(name);
    ws.mergeCells(1, 1, 1, 3);
    ws.getCell(1, 1).value = 'Break-even Analysis';
    styleTitle(ws.getRow(1), 3);
    ws.getRow(2).values = ['Metric', 'Value', 'Unit'];
    styleHeaderRow(ws.getRow(2), 3);
    ws.getRow(3).values = ['Assumed Unit Price', num(p.unitPrice), 'USD/t'];
    ws.getRow(4).values = ['Break-even Price (engine)', num(p.breakevenPrice), 'USD/t'];
    ws.getRow(5).values = [
      'Price Headroom',
      num(p.unitPrice) - num(p.breakevenPrice),
      'USD/t',
    ];
    for (let r = 3; r <= 5; r++) {
      for (let c = 1; c <= 3; c++) styleDataCell(ws.getRow(r).getCell(c), r % 2 === 0);
      ws.getRow(r).getCell(2).numFmt = '#,##0.00';
    }
    applyPrintDefaults(ws, 'Break-even');
    autoWidth(ws);
  }

  // —— Sensitivity ——
  {
    const name = sheetNames[18];
    const ws = wb.addWorksheet(name);
    ws.mergeCells(1, 1, 1, 4);
    ws.getCell(1, 1).value = 'Sensitivity Analysis';
    styleTitle(ws.getRow(1), 4);
    ws.getRow(2).values = ['Driver', 'Change (%)', 'NPV (MUSD)', 'IRR (%)'];
    styleHeaderRow(ws.getRow(2), 4);
    let r = 3;
    for (const [driver, series] of Object.entries(input.sensitivity)) {
      for (const point of series) {
        const row = ws.getRow(r);
        row.values = [driver, point.changePercent, point.npv, point.irr];
        for (let c = 1; c <= 4; c++) styleDataCell(row.getCell(c), r % 2 === 0);
        row.getCell(2).numFmt = '0';
        row.getCell(3).numFmt = '#,##0.00';
        row.getCell(4).numFmt = '0.00';
        r += 1;
      }
    }
    if (r === 3) {
      ws.getCell(3, 1).value = 'No sensitivity series available.';
      stylePlaceholder(ws.getCell(3, 1));
    }
    applyPrintDefaults(ws, 'Sensitivity');
    autoWidth(ws);
  }

  // —— Monte Carlo ——
  {
    const name = sheetNames[19];
    const ws = wb.addWorksheet(name);
    ws.mergeCells(1, 1, 1, 3);
    ws.getCell(1, 1).value = 'Monte Carlo Risk Analysis (2,000 iterations)';
    styleTitle(ws.getRow(1), 3);
    ws.getRow(2).values = ['Metric', 'Value', 'Unit'];
    styleHeaderRow(ws.getRow(2), 3);
    if (input.monteCarlo) {
      const mc = input.monteCarlo;
      const stats: [string, number, string][] = [
        ['NPV Mean', mc.stats.npvMean, 'MUSD'],
        ['NPV Median', mc.stats.npvMedian, 'MUSD'],
        ['NPV Std Dev', mc.stats.npvStdDev, 'MUSD'],
        ['NPV Min', mc.stats.npvMin, 'MUSD'],
        ['NPV Max', mc.stats.npvMax, 'MUSD'],
        ['P(NPV > 0)', mc.stats.npvPositiveProb * 100, '%'],
        ['IRR Mean', mc.stats.irrMean, '%'],
        ['IRR Median', mc.stats.irrMedian, '%'],
      ];
      stats.forEach((s, i) => {
        const row = ws.getRow(3 + i);
        row.values = s;
        for (let c = 1; c <= 3; c++) styleDataCell(row.getCell(c), i % 2 === 0);
        row.getCell(2).numFmt = '#,##0.00';
      });
      const histStart = 3 + stats.length + 2;
      ws.getCell(histStart, 1).value = 'Histogram';
      styleSection(ws.getCell(histStart, 1));
      ws.getRow(histStart + 1).values = ['Bin', 'Count', 'Cumulative'];
      styleHeaderRow(ws.getRow(histStart + 1), 3);
      mc.histogram.forEach((h, i) => {
        const row = ws.getRow(histStart + 2 + i);
        row.values = [h.bin, h.count, h.cumulative];
        for (let c = 1; c <= 3; c++) styleDataCell(row.getCell(c), i % 2 === 0);
        row.getCell(3).numFmt = '0.000';
      });
    } else {
      ws.getCell(3, 1).value = 'Monte Carlo results not available.';
      stylePlaceholder(ws.getCell(3, 1));
    }
    applyPrintDefaults(ws, 'Monte Carlo');
    autoWidth(ws);
  }

  // —— Tornado ——
  {
    const name = sheetNames[20];
    const ws = wb.addWorksheet(name);
    ws.mergeCells(1, 1, 1, 5);
    ws.getCell(1, 1).value = 'Tornado Analysis (±20% single-factor)';
    styleTitle(ws.getRow(1), 5);
    ws.getRow(2).values = ['Parameter', 'Low NPV', 'High NPV', 'Base NPV', 'Impact'];
    styleHeaderRow(ws.getRow(2), 5);
    if (input.tornado.length) {
      input.tornado.forEach((t, i) => {
        const row = ws.getRow(3 + i);
        row.values = [t.label, t.lowNpv, t.highNpv, t.baseNpv, t.impact];
        for (let c = 1; c <= 5; c++) styleDataCell(row.getCell(c), i % 2 === 0);
        for (let c = 2; c <= 5; c++) row.getCell(c).numFmt = '#,##0.00';
      });
    } else {
      ws.getCell(3, 1).value = 'No tornado impacts (zero base parameters).';
      stylePlaceholder(ws.getCell(3, 1));
    }
    applyPrintDefaults(ws, 'Tornado');
    autoWidth(ws);
  }

  return wb;
}

export async function workbookToBuffer(wb: ExcelJS.Workbook): Promise<Buffer> {
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

/** 1-based column index → Excel letters */
function excelCol(col: number): string {
  let n = col;
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
