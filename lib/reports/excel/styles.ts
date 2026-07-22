import type ExcelJS from 'exceljs';

/** Consulting / engineering workbook palette (minimal, print-friendly). */
export const XL = {
  teal: 'FF0D9488',
  slate: 'FF0F172A',
  muted: 'FF64748B',
  border: 'FFCBD5E1',
  zebra: 'FFF8FAFC',
  headerBg: 'FF0F172A',
  headerFg: 'FFF8FAFC',
  titleBg: 'FFE2E8F0',
  warnBg: 'FFFEF3C7',
  warnFg: 'FF92400E',
  pos: 'FF059669',
  neg: 'FFDC2626',
  white: 'FFFFFFFF',
};

export const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: XL.border } },
  left: { style: 'thin', color: { argb: XL.border } },
  bottom: { style: 'thin', color: { argb: XL.border } },
  right: { style: 'thin', color: { argb: XL.border } },
};

export function styleTitle(row: ExcelJS.Row, cols: number): void {
  row.font = { bold: true, size: 14, color: { argb: XL.slate }, name: 'Calibri' };
  row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.titleBg } };
  for (let c = 1; c <= cols; c++) {
    row.getCell(c).border = thinBorder;
  }
  row.height = 22;
}

export function styleSection(cell: ExcelJS.Cell): void {
  cell.font = { bold: true, size: 11, color: { argb: XL.teal }, name: 'Calibri' };
}

export function styleHeaderRow(row: ExcelJS.Row, colCount: number): void {
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.font = { bold: true, size: 9, color: { argb: XL.headerFg }, name: 'Calibri' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.headerBg } };
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = thinBorder;
  }
  row.height = 18;
}

export function styleDataCell(cell: ExcelJS.Cell, zebra = false): void {
  cell.font = { size: 10, name: 'Calibri', color: { argb: XL.slate } };
  cell.border = thinBorder;
  if (zebra) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.zebra } };
  }
}

export function stylePlaceholder(cell: ExcelJS.Cell): void {
  cell.font = { italic: true, size: 9, color: { argb: XL.warnFg }, name: 'Calibri' };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.warnBg } };
  cell.border = thinBorder;
}

export function applyPrintDefaults(ws: ExcelJS.Worksheet, title: string): void {
  ws.pageSetup = {
    paperSize: 9, // A4
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printTitlesRow: '1:2',
    margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
  };
  ws.headerFooter = {
    oddHeader: `&LMining Economics Dashboard&C${title}&RConfidential`,
    oddFooter: '&LEconomic Analysis Workbook&C&P / &N&RGenerated from project data',
  };
  ws.views = [{ state: 'frozen', ySplit: 2, showGridLines: false }];
}

export function autoWidth(ws: ExcelJS.Worksheet, min = 10, max = 36): void {
  const colCount = ws.columnCount || 12;
  for (let c = 1; c <= colCount; c++) {
    let width = min;
    ws.eachRow({ includeEmpty: false }, (row) => {
      const v = row.getCell(c).value;
      const len = v === null || v === undefined ? 0 : String(typeof v === 'object' && v && 'formula' in (v as object) ? (v as { result?: unknown }).result ?? '' : v).length;
      width = Math.max(width, Math.min(len + 2, max));
    });
    ws.getColumn(c).width = width;
  }
}
