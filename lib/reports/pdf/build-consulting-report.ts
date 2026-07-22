import type {
  AnalysisResult,
  CashFlowRow,
  MonteCarloResult,
  ProjectParams,
  RiskItem,
  SensitivityPoint,
} from '@/lib/calculations';
import { getMineTypeLabel, getMiningMethodLabel } from '@/lib/format';
import type { TornadoBar } from '@/lib/reports/shared/tornado';
import { CONSULTING_PDF_CSS } from './css';
import { parseCountryFromLocation, pdfDate, pdfFmt, riskLevelFromNpvProb } from './helpers';

export interface ConsultingReportInput {
  project: Record<string, unknown>;
  analysis: AnalysisResult;
  params: ProjectParams;
  equipments: Record<string, unknown>[];
  sensitivity: Record<string, SensitivityPoint[]>;
  monteCarlo: MonteCarloResult;
  tornado: TornadoBar[];
  risks: RiskItem[];
  preparedFor?: string;
  version?: string;
}

function rows(pairs: [string, string][]): string {
  return pairs
    .map(
      ([k, v]) =>
        `<tr><td style="width:42%;color:#64748b">${k}</td><td class="mono">${v}</td></tr>`
    )
    .join('');
}

function dataTable(headers: string[], bodyRows: string[][], totalLast = false): string {
  const th = headers.map((h) => `<th>${h}</th>`).join('');
  const tr = bodyRows
    .map((r, idx) => {
      const cls = totalLast && idx === bodyRows.length - 1 ? ' class="total"' : '';
      return `<tr${cls}>${r
        .map((c, i) => `<td class="${i === 0 ? '' : 'text-right mono'}">${c}</td>`)
        .join('')}</tr>`;
    })
    .join('');
  return `<table class="data"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}

function cashFlowSvg(cashFlows: CashFlowRow[]): string {
  if (!cashFlows.length) return '<p class="placeholder">No cash-flow series available.</p>';
  const w = 520;
  const h = 160;
  const pad = { t: 12, r: 12, b: 28, l: 44 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const vals = cashFlows.map((c) => c.netCashFlow);
  const min = Math.min(...vals, 0);
  const max = Math.max(...vals, 0);
  const span = max - min || 1;
  const n = cashFlows.length;
  const barW = Math.max(2, (innerW / n) * 0.72);
  const zeroY = pad.t + ((max - 0) / span) * innerH;

  const bars = cashFlows
    .map((cf, i) => {
      const x = pad.l + (i + 0.5) * (innerW / n) - barW / 2;
      const yVal = pad.t + ((max - cf.netCashFlow) / span) * innerH;
      const y = Math.min(yVal, zeroY);
      const bh = Math.abs(yVal - zeroY);
      const fill = cf.netCashFlow >= 0 ? '#0d9488' : '#dc2626';
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(
        bh,
        0.5
      ).toFixed(1)}" fill="${fill}"/>`;
    })
    .join('');

  const axis = `<line x1="${pad.l}" y1="${zeroY.toFixed(1)}" x2="${w - pad.r}" y2="${zeroY.toFixed(
    1
  )}" stroke="#94a3b8" stroke-width="1"/>`;
  const labels = [
    `<text x="${pad.l}" y="${h - 8}" font-size="8" fill="#64748b">Y${cashFlows[0]?.year ?? 0}</text>`,
    `<text x="${w - pad.r}" y="${h - 8}" font-size="8" fill="#64748b" text-anchor="end">Y${
      cashFlows[n - 1]?.year ?? ''
    }</text>`,
    `<text x="4" y="${pad.t + 4}" font-size="8" fill="#64748b">${pdfFmt(max, 0)}</text>`,
    `<text x="4" y="${h - pad.b}" font-size="8" fill="#64748b">${pdfFmt(min, 0)}</text>`,
  ].join('');

  return `<div class="chart-wrap"><div class="chart-title">Annual Net Cash Flow (MUSD)</div>
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${axis}${bars}${labels}</svg></div>`;
}

function cumulativeSvg(cashFlows: CashFlowRow[]): string {
  if (!cashFlows.length) return '';
  const w = 520;
  const h = 150;
  const pad = { t: 12, r: 12, b: 28, l: 44 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const vals = cashFlows.map((c) => c.cumulativeCashFlow);
  const min = Math.min(...vals, 0);
  const max = Math.max(...vals, 0);
  const span = max - min || 1;
  const n = cashFlows.length;
  const pts = cashFlows
    .map((cf, i) => {
      const x = pad.l + (i / Math.max(n - 1, 1)) * innerW;
      const y = pad.t + ((max - cf.cumulativeCashFlow) / span) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const zeroY = pad.t + ((max - 0) / span) * innerH;
  return `<div class="chart-wrap"><div class="chart-title">Cumulative Cash Flow (MUSD)</div>
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
      <line x1="${pad.l}" y1="${zeroY.toFixed(1)}" x2="${w - pad.r}" y2="${zeroY.toFixed(
    1
  )}" stroke="#cbd5e1" stroke-dasharray="3,2"/>
      <polyline fill="none" stroke="#0f172a" stroke-width="1.8" points="${pts}"/>
    </svg></div>`;
}

function tornadoSvg(tornado: TornadoBar[]): string {
  if (!tornado.length) return '<p class="placeholder">Insufficient parameter variation for tornado chart.</p>';
  const maxImpact = Math.max(...tornado.map((t) => t.impact), 1);
  return tornado
    .slice(0, 8)
    .map((t) => {
      const lowW = Math.round((Math.abs(t.baseNpv - t.lowNpv) / maxImpact) * 100);
      const highW = Math.round((Math.abs(t.highNpv - t.baseNpv) / maxImpact) * 100);
      return `<div class="bar-row">
        <div class="bar-label">${t.label}</div>
        <div class="bar-track" style="display:flex;background:#e2e8f0">
          <div class="bar-fill slate" style="width:${lowW}%;margin-left:auto"></div>
          <div class="bar-fill amber" style="width:${highW}%"></div>
        </div>
        <div class="bar-value">${pdfFmt(t.impact, 1)}</div>
      </div>`;
    })
    .join('');
}

/**
 * Build consulting-grade HTML for local headless PDF rendering.
 * Pure presentation — all numbers come from the existing analysis engine.
 */
export function buildConsultingPdfHtml(input: ConsultingReportInput): string {
  const p = input.project;
  const a = input.analysis;
  const mc = input.monteCarlo;
  const name = String(p.name ?? 'Mining Project');
  const location = String(p.location ?? '');
  const country = parseCountryFromLocation(location);
  const commodity = getMineTypeLabel(String(p.mineType ?? ''));
  const method = getMiningMethodLabel(String(p.miningMethod ?? ''));
  const currency = String(p.currency ?? 'USD');
  const npv = a?.npv ?? Number(p.npv ?? 0);
  const irr = a?.irr ?? Number(p.irr ?? 0);
  const payback = a?.paybackPeriod ?? Number(p.paybackPeriod ?? 0);
  const breakeven = a?.breakevenPrice ?? Number(p.breakevenPrice ?? 0);
  const life = Number(p.projectLifeYears ?? 0);
  const production = `${pdfFmt(Number(p.annualProduction ?? 0), 3)} ${String(p.productionUnit ?? 'Mt')}/yr`;
  const risk = riskLevelFromNpvProb(mc?.stats?.npvPositiveProb ?? 0.5);
  const dateStr = pdfDate();
  const version = input.version ?? '1.0';
  const preparedFor = input.preparedFor?.trim() || 'Internal review';
  const isPositive = npv >= 0;
  const cfs = a?.cashFlows ?? [];

  const sensLabels: Record<string, string> = {
    price: 'Commodity Price',
    capex: 'CAPEX',
    opex: 'OPEX',
    discountRate: 'Discount Rate',
  };

  const maxHist = Math.max(...(mc?.histogram ?? []).map((h) => h.count), 1);

  const equipRows = (input.equipments ?? []).map((eq) => [
    String(eq.machineType ?? eq.name ?? '—'),
    String(eq.model ?? '—'),
    String(eq.quantity ?? 1),
    String(eq.spareQuantity ?? 0),
    pdfFmt(Number(eq.unitCost ?? eq.unitPrice ?? 0) / 1_000_000, 3),
    pdfFmt(Number(eq.totalCost ?? 0) / 1_000_000, 3),
    String(eq.powerType ?? '—'),
  ]);

  const cfRows = cfs.map((cf) => [
    String(cf.year),
    pdfFmt(cf.revenue),
    pdfFmt(cf.opex),
    pdfFmt(cf.royalty),
    pdfFmt(cf.taxPayment),
    pdfFmt(cf.netCashFlow),
    pdfFmt(cf.cumulativeCashFlow),
    pdfFmt(cf.discountedCashFlow),
  ]);

  const conclusion = isPositive
    ? `Based on the stated assumptions, the project returns a positive NPV of ${pdfFmt(npv)} MUSD and an IRR of ${pdfFmt(
        irr
      )}%, with an estimated payback of ${pdfFmt(payback, 1)} years. Monte Carlo results indicate a ${(
        (mc?.stats?.npvPositiveProb ?? 0) * 100
      ).toFixed(0)}% probability of positive NPV, suggesting a ${risk.toLowerCase()} risk profile under the modelled uncertainty ranges.`
    : `Based on the stated assumptions, the project returns a negative NPV of ${pdfFmt(
        npv
      )} MUSD. Further optimisation of CAPEX, operating costs, or commodity price assumptions may be required before advancing the opportunity.`;

  const recommendations = isPositive
    ? [
        'Advance to the next engineering study stage with refined CAPEX and schedule estimates.',
        'Stress-test commodity price and production assumptions against contract / offtake scenarios.',
        'Confirm royalty, tax, and land/forestry cost assumptions with local counsel and permitting specialists.',
        'Maintain the Excel workbook as the working model for sensitivity updates during FEED.',
      ]
    : [
        'Revisit CAPEX phasing, fleet sizing, and contractor vs owner-operator trade-offs.',
        'Validate commodity price decks and offtake assumptions before further capital commitment.',
        'Identify OPEX levers (fuel, maintenance, stripping) with the largest NPV impact from the tornado results.',
        'Do not treat this screening-level result as a substitute for a full feasibility study.',
      ];

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${name} — Economic Evaluation Report</title>
<style>${CONSULTING_PDF_CSS}</style></head>
<body>

<section class="cover">
  <div class="watermark">CONFIDENTIAL</div>
  <div>
    <div class="cover-brand">Mining Economics Dashboard</div>
    <h1>Mining Project Economic Evaluation Report</h1>
    <div class="report-type">Techno-economic feasibility summary for engineering and investment review</div>
    <table class="meta-table">
      ${rows([
        ['Project Name', name],
        ['Commodity', commodity],
        ['Mining Method', method],
        ['Country / Location', location || country],
        ['Report Date', dateStr],
        ['Prepared by', 'Mining Economics Dashboard'],
        ['Prepared for', preparedFor],
        ['Version', version],
      ])}
    </table>
  </div>
  <div class="cover-footer">
    Confidential — for authorised recipients only. Generated automatically from project assumptions.
  </div>
</section>

<section class="section">
  <h2>Table of Contents</h2>
  <table class="toc" style="width:100%">
    <tr><td>1. Executive Summary</td><td>—</td></tr>
    <tr><td>2. Project Overview</td><td>—</td></tr>
    <tr><td>3. Key Assumptions</td><td>—</td></tr>
    <tr><td>4. Economic Parameters</td><td>—</td></tr>
    <tr><td>5. Equipment Summary</td><td>—</td></tr>
    <tr><td>6. Capital Cost Breakdown (CAPEX)</td><td>—</td></tr>
    <tr><td>7. Operating Cost Breakdown (OPEX)</td><td>—</td></tr>
    <tr><td>8. Production Schedule &amp; Revenue</td><td>—</td></tr>
    <tr><td>9. Cash Flow</td><td>—</td></tr>
    <tr><td>10. NPV, IRR, Payback &amp; Break-even</td><td>—</td></tr>
    <tr><td>11. Sensitivity Analysis</td><td>—</td></tr>
    <tr><td>12. Monte Carlo Risk Analysis</td><td>—</td></tr>
    <tr><td>13. Tornado Chart</td><td>—</td></tr>
    <tr><td>14. Financial Charts</td><td>—</td></tr>
    <tr><td>15. Risk Assessment</td><td>—</td></tr>
    <tr><td>16. Conclusions &amp; Recommendations</td><td>—</td></tr>
    <tr><td>17. Disclaimer</td><td>—</td></tr>
  </table>
</section>

<section class="section page-break">
  <h2>1. Executive Summary</h2>
  <p><strong>${name}</strong> is a ${commodity.toLowerCase()} ${method.toLowerCase()} project located in <strong>${
    location || country
  }</strong>, evaluated over a ${life}-year mine life at ${production}.</p>
  <div class="kpi-grid">
    <div class="kpi-box"><div class="kpi-label">Initial CAPEX</div><div class="kpi-value">${pdfFmt(
      Number(p.totalCapex ?? 0)
    )}</div><div class="kpi-unit">MUSD</div></div>
    <div class="kpi-box"><div class="kpi-label">Total OPEX</div><div class="kpi-value">${pdfFmt(
      Number(p.totalOpex ?? 0)
    )}</div><div class="kpi-unit">MUSD / yr</div></div>
    <div class="kpi-box"><div class="kpi-label">NPV</div><div class="kpi-value ${
      isPositive ? 'text-green' : 'text-red'
    }">${pdfFmt(npv)}</div><div class="kpi-unit">MUSD</div></div>
    <div class="kpi-box"><div class="kpi-label">IRR</div><div class="kpi-value text-amber">${pdfFmt(
      irr
    )}%</div><div class="kpi-unit"> </div></div>
  </div>
  <div class="kpi-grid">
    <div class="kpi-box"><div class="kpi-label">Payback</div><div class="kpi-value">${pdfFmt(
      payback,
      1
    )}</div><div class="kpi-unit">years</div></div>
    <div class="kpi-box"><div class="kpi-label">Break-even Price</div><div class="kpi-value">${pdfFmt(
      breakeven,
      1
    )}</div><div class="kpi-unit">${currency}/t</div></div>
    <div class="kpi-box"><div class="kpi-label">Production Rate</div><div class="kpi-value" style="font-size:12px">${production}</div><div class="kpi-unit"> </div></div>
    <div class="kpi-box"><div class="kpi-label">Risk Level</div><div class="kpi-value" style="font-size:13px">${risk}</div><div class="kpi-unit">Monte Carlo</div></div>
  </div>
</section>

<section class="section">
  <h2>2. Project Overview</h2>
  <table class="data">
    <tbody>
      ${rows([
        ['Project Name', name],
        ['Commodity', commodity],
        ['Mining Method', method],
        ['Location', location || '—'],
        ['Currency', currency],
        ['Ore Grade', `${pdfFmt(Number(p.oreGrade ?? 0), 2)} ${String(p.oreGradeUnit ?? '%')}`],
        ['Total Reserves', `${pdfFmt(Number(p.totalReserves ?? 0), 1)} Mt`],
        ['Mine Life', `${life} years`],
        ['Annual Production', production],
        ['Plant Processing Rate', `${pdfFmt(Number(p.plantProcessingRate ?? 0), 1)}%`],
      ])}
    </tbody>
  </table>
</section>

<section class="section page-break">
  <h2>3. Key Assumptions</h2>
  <ul class="bullets">
    <li>Year 0 cash flow equals −(total CAPEX + forest + land + rehabilitation costs).</li>
    <li>Royalty is applied on revenue; corporate tax is charged only when taxable income is positive.</li>
    <li>All headline results are expressed in millions of US dollars (MUSD) unless noted otherwise.</li>
    <li>Equipment depreciation life: ${Number(p.equipmentDepLife ?? 6)} years; facility depreciation life: ${Number(
    p.facilityDepLife ?? 15
  )} years (${String(p.depreciationMethod ?? 'linear')}).</li>
    <li>Discount rate ${pdfFmt(Number(p.discountRate ?? 0), 2)}%; tax ${pdfFmt(
    Number(p.taxRate ?? 0),
    1
  )}%; royalty ${pdfFmt(Number(p.royaltyRate ?? 0), 1)}%.</li>
    <li>Monte Carlo uses 2,000 iterations with standard platform uncertainty bands (price / cost / production).</li>
  </ul>
</section>

<section class="section">
  <h2>4. Economic Parameters</h2>
  ${dataTable(
    ['Parameter', 'Value', 'Unit'],
    [
      ['Discount Rate', pdfFmt(Number(p.discountRate ?? 0), 2), '%'],
      ['Tax Rate', pdfFmt(Number(p.taxRate ?? 0), 1), '%'],
      ['Royalty Rate', pdfFmt(Number(p.royaltyRate ?? 0), 1), '%'],
      ['Credit Rate', pdfFmt(Number(p.creditRate ?? 0), 1), '%'],
      ['Credit Years', String(Number(p.creditYears ?? 0)), 'years'],
      ['Unit Price', pdfFmt(Number(p.unitPrice ?? 0), 2), `${currency}/t`],
      ['Fuel Price', pdfFmt(Number(p.fuelPricePerLiter ?? 0), 3), `${currency}/L`],
      ['Exchange Rate', pdfFmt(Number(p.exchangeRate ?? 1), 4), 'FX'],
      ['Contingency Rate', pdfFmt(Number(p.contingencyRate ?? 0), 1), '%'],
    ]
  )}
</section>

<section class="section page-break">
  <h2>5. Equipment Summary</h2>
  ${
    equipRows.length
      ? dataTable(
          ['Machine', 'Model', 'Qty', 'Spare', 'Unit (MUSD)', 'Total (MUSD)', 'Power'],
          equipRows
        )
      : '<p>No equipment fleet records were provided for this project.</p>'
  }
</section>

<section class="section">
  <h2>6. Capital Cost Breakdown (CAPEX)</h2>
  ${dataTable(
    ['Item', 'Value (MUSD)'],
    [
      ['Equipment', pdfFmt(Number(p.equipmentCost ?? 0))],
      ['Process Plant / Facilities', pdfFmt(Number(p.facilityCost ?? 0))],
      ['Infrastructure', pdfFmt(Number(p.infrastructureCost ?? 0))],
      ['Land', pdfFmt(Number(p.landCost ?? 0))],
      ['Forest / Permitting', pdfFmt(Number(p.forestCost ?? 0))],
      ['Rehabilitation', pdfFmt(Number(p.rehabilitationCost ?? 0))],
      ['Contingency rate', `${pdfFmt(Number(p.contingencyRate ?? 0), 1)}%`],
      ['Total CAPEX', pdfFmt(Number(p.totalCapex ?? 0))],
    ],
    true
  )}
</section>

<section class="section page-break">
  <h2>7. Operating Cost Breakdown (OPEX)</h2>
  ${dataTable(
    ['Item', 'Value (MUSD/yr)'],
    [
      ['Fuel', pdfFmt(Number(p.fuelCost ?? 0))],
      ['Personnel', pdfFmt(Number(p.personnelCost ?? 0))],
      ['Maintenance', pdfFmt(Number(p.maintenanceCost ?? 0))],
      ['Explosives', pdfFmt(Number(p.explosivesCost ?? 0))],
      ['Tires', pdfFmt(Number(p.tireCost ?? 0))],
      ['Stripping', pdfFmt(Number(p.strippingCost ?? 0))],
      ['Plant operating', pdfFmt(Number(p.plantOperatingCost ?? 0))],
      ['Other', pdfFmt(Number(p.otherOpex ?? 0))],
      ['Total OPEX', pdfFmt(Number(p.totalOpex ?? 0))],
    ],
    true
  )}
</section>

<section class="section">
  <h2>8. Production Schedule &amp; Revenue Projection</h2>
  <p>Steady-state production is modelled at a constant annual rate unless custom cash flows are supplied.</p>
  ${dataTable(
    ['Parameter', 'Value'],
    [
      ['Annual production', production],
      ['Unit price', `${pdfFmt(Number(p.unitPrice ?? 0), 2)} ${currency}/t`],
      ['By-product revenue', `${pdfFmt(Number(p.byProductRevenue ?? 0))} MUSD/yr`],
      ['Total modelled revenue', `${pdfFmt(a?.totalRevenue ?? Number(p.totalRevenue ?? 0))} MUSD`],
      ['Total modelled cost', `${pdfFmt(a?.totalCost ?? Number(p.totalCost ?? 0))} MUSD`],
    ]
  )}
</section>

<section class="section page-break">
  <h2>9. Cash Flow</h2>
  ${dataTable(
    ['Year', 'Revenue', 'OPEX', 'Royalty', 'Tax', 'Net CF', 'Cumulative', 'Discounted'],
    cfRows.length > 24
      ? [
          ...cfRows.slice(0, 12),
          ['…', '…', '…', '…', '…', '…', '…', '…'],
          ...cfRows.slice(-8),
        ]
      : cfRows
  )}
  ${
    cfs.length > 24
      ? `<p style="font-size:9px;color:#64748b">Showing first 12 and last 8 of ${cfs.length} modelled years. Full series is available in the Excel export.</p>`
      : ''
  }
</section>

<section class="section">
  <h2>10. NPV · IRR · Payback · Break-even</h2>
  <div class="kpi-grid">
    <div class="kpi-box"><div class="kpi-label">NPV</div><div class="kpi-value ${
      isPositive ? 'text-green' : 'text-red'
    }">${pdfFmt(npv)}</div><div class="kpi-unit">MUSD</div></div>
    <div class="kpi-box"><div class="kpi-label">IRR</div><div class="kpi-value text-amber">${pdfFmt(
      irr
    )}%</div><div class="kpi-unit"> </div></div>
    <div class="kpi-box"><div class="kpi-label">Payback</div><div class="kpi-value">${pdfFmt(
      payback,
      1
    )}</div><div class="kpi-unit">years</div></div>
    <div class="kpi-box"><div class="kpi-label">Break-even</div><div class="kpi-value">${pdfFmt(
      breakeven,
      1
    )}</div><div class="kpi-unit">${currency}/t</div></div>
  </div>
  <div class="note">NPV is the sum of discounted free cash flows at the project discount rate. IRR is solved by bisection on the same cash-flow series. Break-even price is the unit price that drives NPV to approximately zero under otherwise unchanged assumptions.</div>
</section>

<section class="section page-break">
  <h2>11. Sensitivity Analysis</h2>
  <p>NPV response to ± changes in key drivers (existing engine outputs; no formula changes).</p>
  ${Object.entries(input.sensitivity)
    .map(([key, series]) => {
      const label = sensLabels[key] ?? key;
      const body = (series ?? []).map((s) => [
        `${s.changePercent > 0 ? '+' : ''}${s.changePercent}%`,
        pdfFmt(s.npv),
        pdfFmt(s.irr),
      ]);
      return `<h3>${label}</h3>${dataTable(['Change', 'NPV (MUSD)', 'IRR (%)'], body)}`;
    })
    .join('')}
</section>

<section class="section page-break">
  <h2>12. Monte Carlo Risk Analysis</h2>
  <p>2,000-iteration probabilistic NPV distribution using the platform’s standard uncertainty model (price / cost / production).</p>
  <div class="kpi-grid">
    <div class="kpi-box"><div class="kpi-label">Mean NPV</div><div class="kpi-value">${pdfFmt(
      mc.stats.npvMean
    )}</div><div class="kpi-unit">MUSD</div></div>
    <div class="kpi-box"><div class="kpi-label">Median NPV</div><div class="kpi-value">${pdfFmt(
      mc.stats.npvMedian
    )}</div><div class="kpi-unit">MUSD</div></div>
    <div class="kpi-box"><div class="kpi-label">Std. Dev.</div><div class="kpi-value">${pdfFmt(
      mc.stats.npvStdDev
    )}</div><div class="kpi-unit">MUSD</div></div>
    <div class="kpi-box"><div class="kpi-label">P(NPV &gt; 0)</div><div class="kpi-value">${pdfFmt(
      mc.stats.npvPositiveProb * 100,
      1
    )}%</div><div class="kpi-unit"> </div></div>
  </div>
  <h3>NPV Distribution (histogram)</h3>
  ${(mc.histogram ?? [])
    .map(
      (h) => `<div class="bar-row">
      <div class="bar-label">${h.bin}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round((h.count / maxHist) * 100)}%"></div></div>
      <div class="bar-value">${h.count}</div>
    </div>`
    )
    .join('')}
  <div class="note">
    <strong>Observation:</strong> NPV ranges from ${pdfFmt(mc.stats.npvMin)} to ${pdfFmt(mc.stats.npvMax)} MUSD.
    Mean IRR is ${pdfFmt(mc.stats.irrMean)}%. Overall modelled risk level: <strong>${risk}</strong>.
  </div>
</section>

<section class="section page-break">
  <h2>13. Tornado Chart</h2>
  <p>±20% single-factor swings ranked by absolute NPV impact (MUSD).</p>
  ${tornadoSvg(input.tornado)}
  ${
    input.tornado.length
      ? dataTable(
          ['Parameter', 'Low NPV', 'High NPV', 'Impact'],
          input.tornado.map((t) => [
            t.label,
            pdfFmt(t.lowNpv),
            pdfFmt(t.highNpv),
            pdfFmt(t.impact),
          ])
        )
      : ''
  }
</section>

<section class="section page-break">
  <h2>14. Financial Charts</h2>
  ${cashFlowSvg(cfs)}
  ${cumulativeSvg(cfs)}
</section>

<section class="section">
  <h2>15. Risk Assessment</h2>
  ${
    input.risks?.length
      ? dataTable(
          ['Category', 'Risk', 'Score', 'Level', 'Mitigation'],
          input.risks.slice(0, 10).map((r) => [
            r.category,
            r.name,
            String(r.score),
            r.level.toUpperCase(),
            r.mitigation,
          ])
        )
      : '<p class="placeholder">Risk matrix unavailable for this project.</p>'
  }
</section>

<section class="section page-break">
  <h2>16. Conclusions</h2>
  <p>${conclusion}</p>
  <h2>Recommendations</h2>
  <ul class="bullets">
    ${recommendations.map((r) => `<li>${r}</li>`).join('')}
  </ul>
  <p>This evaluation should be read together with the Excel workbook for detailed cash-flow schedules and fleet economics.</p>

  <h2>17. Disclaimer</h2>
  <div class="disclaimer">
    This report was automatically generated by Mining Economics Dashboard based on user-provided assumptions.
    It is intended to support engineering decision-making and should not replace professional engineering judgment,
    independent due diligence, or certified feasibility studies.
  </div>

  <div class="footer-line">
    <span>Mining Economics Dashboard · ${name}</span>
    <span>${dateStr} · v${version}</span>
  </div>
</section>

</body></html>`;
}
