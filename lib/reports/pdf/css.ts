/** Consulting-grade PDF stylesheet (A4). Print-focused; minimal decoration. */
export const CONSULTING_PDF_CSS = `
  @page { size: A4; margin: 18mm 14mm 20mm 14mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    color: #0f172a;
    font-size: 10.5px;
    line-height: 1.55;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cover {
    page-break-after: always;
    min-height: 245mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 24mm 6mm 16mm;
    border-top: 6px solid #0d9488;
    position: relative;
  }
  .cover-brand {
    font-size: 11px;
    letter-spacing: 2.2px;
    text-transform: uppercase;
    color: #0d9488;
    font-weight: 700;
  }
  .cover h1 {
    font-size: 26px;
    color: #0f172a;
    letter-spacing: -0.35px;
    margin: 16px 0 8px;
    line-height: 1.22;
    font-weight: 700;
  }
  .cover .report-type {
    font-size: 12.5px;
    color: #475569;
    margin-bottom: 24px;
  }
  .meta-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  .meta-table td { padding: 7px 0; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
  .meta-table td:first-child { color: #64748b; width: 38%; }
  .meta-table td:last-child { font-weight: 600; color: #0f172a; }
  .watermark {
    position: absolute;
    top: 44%;
    left: 8%;
    font-size: 40px;
    color: rgba(15, 23, 42, 0.035);
    transform: rotate(-28deg);
    letter-spacing: 8px;
    font-weight: 800;
    pointer-events: none;
  }
  .cover-footer { font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
  h2 {
    font-size: 12.5px;
    color: #0f172a;
    border-bottom: 2px solid #0d9488;
    padding-bottom: 4px;
    margin: 20px 0 10px;
    text-transform: uppercase;
    letter-spacing: 0.45px;
  }
  h3 { font-size: 11px; color: #334155; margin: 12px 0 6px; font-weight: 650; }
  p { margin: 0 0 8px; color: #334155; }
  .toc td { padding: 5px 0; border-bottom: 1px dotted #cbd5e1; font-size: 10.5px; }
  .toc td:last-child { text-align: right; color: #64748b; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 10px 0 14px; }
  .kpi-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 10px 0 14px; }
  .kpi-box {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 9px 10px;
    background: #f8fafc;
  }
  .kpi-label {
    font-size: 8px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.45px;
    font-weight: 700;
  }
  .kpi-value { font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 3px; }
  .kpi-unit { font-size: 8px; color: #94a3b8; }
  table.data { width: 100%; border-collapse: collapse; margin: 6px 0 12px; font-size: 9.5px; }
  table.data th {
    background: #0f172a;
    color: #f8fafc;
    padding: 6px 7px;
    text-align: left;
    font-weight: 650;
    font-size: 8.5px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  table.data td { padding: 5px 7px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  table.data tr:nth-child(even) td { background: #f8fafc; }
  table.data tr.total td { font-weight: 700; background: #f1f5f9; border-top: 1px solid #cbd5e1; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .mono { font-family: 'Courier New', Courier, monospace; }
  .text-green { color: #059669; }
  .text-red { color: #dc2626; }
  .text-amber { color: #d97706; }
  .section { page-break-inside: avoid; }
  .page-break { page-break-before: always; }
  .bar-row { display: flex; align-items: center; gap: 8px; margin: 3px 0; font-size: 9px; }
  .bar-label { width: 78px; color: #475569; flex-shrink: 0; }
  .bar-track { flex: 1; height: 11px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
  .bar-fill { height: 100%; background: #0d9488; }
  .bar-fill.amber { background: #d97706; }
  .bar-fill.slate { background: #475569; }
  .bar-value { width: 54px; text-align: right; font-family: 'Courier New', monospace; flex-shrink: 0; }
  .chart-wrap { margin: 10px 0 14px; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; background: #fff; }
  .chart-title { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 6px; font-weight: 700; }
  .note {
    background: #f1f5f9;
    border-left: 3px solid #0d9488;
    padding: 8px 10px;
    margin: 10px 0;
    font-size: 9.5px;
    color: #334155;
  }
  .disclaimer {
    margin-top: 16px;
    padding: 12px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 9px;
    color: #475569;
    background: #fafafa;
  }
  .footer-line {
    margin-top: 20px;
    padding-top: 8px;
    border-top: 1px solid #e2e8f0;
    font-size: 8px;
    color: #94a3b8;
    display: flex;
    justify-content: space-between;
  }
  .placeholder {
    font-style: italic;
    color: #94a3b8;
    font-size: 9.5px;
  }
  ul.bullets { margin: 4px 0 10px 16px; color: #334155; }
  ul.bullets li { margin: 3px 0; }
`;
