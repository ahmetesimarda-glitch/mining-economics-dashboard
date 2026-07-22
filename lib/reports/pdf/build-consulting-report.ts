import type {
  AnalysisResult,
  MonteCarloResult,
  ProjectParams,
  SensitivityPoint,
} from '@/lib/calculations';
import { getMineTypeLabel, getMiningMethodLabel } from '@/lib/format';
import { CONSULTING_PDF_CSS } from './css';
import { parseCountryFromLocation, pdfDate, pdfFmt, riskLevelFromNpvProb } from './helpers';

export interface ConsultingReportInput {
  project: Record<string, unknown>;
  analysis: AnalysisResult;
  params: ProjectParams;
  equipments: Record<string, unknown>[];
  sensitivity: Record<string, SensitivityPoint[]>;
  monteCarlo: MonteCarloResult;
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

function dataTable(headers: string[], bodyRows: string[][]): string {
  const th = headers.map((h) => `<th>${h}</th>`).join('');
  const tr = bodyRows
    .map(
      (r) =>
        `<tr>${r
          .map((c, i) => `<td class="${i === 0 ? '' : 'text-right mono'}">${c}</td>`)
          .join('')}</tr>`
    )
    .join('');
  return `<table class="data"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}

/**
 * Build consulting-grade HTML for Abacus HTML→PDF conversion.
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
    pdfFmt(Number(eq.unitCost ?? eq.unitPrice ?? 0) / 1_000_000, 3),
    pdfFmt(Number(eq.totalCost ?? 0) / 1_000_000, 3),
    String(eq.powerType ?? '—'),
  ]);

  const cfPreview = cfs.slice(0, Math.min(cfs.length, 16)).map((cf) => [
    String(cf.year),
    pdfFmt(cf.revenue),
    pdfFmt(cf.opex),
    pdfFmt(cf.netCashFlow),
    pdfFmt(cf.cumulativeCashFlow),
    pdfFmt(cf.discountedCashFlow),
  ]);

  const conclusion = isPositive
    ? `Based on the stated assumptions, the project returns a positive NPV of ${pdfFmt(npv)} MUSD and an IRR of ${pdfFmt(irr)}%, with an estimated payback of ${pdfFmt(payback, 1)} years. Monte Carlo results indicate a ${(
        (mc?.stats?.npvPositiveProb ?? 0) * 100
      ).toFixed(0)}% probability of positive NPV, suggesting a ${risk.toLowerCase()} risk profile under the modelled uncertainty ranges.`
    : `Based on the stated assumptions, the project returns a negative NPV of ${pdfFmt(npv)} MUSD. Further optimisation of CAPEX, operating costs, or commodity price assumptions may be required before advancing the opportunity.`;

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
    <tr><td>1. Executive Summary</td><td>3</td></tr>
    <tr><td>2. Project Information</td><td>3</td></tr>
    <tr><td>3. Economic Inputs</td><td>4</td></tr>
    <tr><td>4. Equipment Summary</td><td>4</td></tr>
    <tr><td>5. Financial Analysis</td><td>5</td></tr>
    <tr><td>6. Sensitivity Analysis</td><td>6</td></tr>
    <tr><td>7. Monte Carlo Risk Analysis</td><td>7</td></tr>
    <tr><td>8. Conclusion</td><td>8</td></tr>
    <tr><td>9. Disclaimer</td><td>8</td></tr>
  </table>
</section>

<section class="section page-break">
  <h2>1. Executive Summary</h2>
  <p><strong>${name}</strong> is a ${commodity.toLowerCase()} ${method.toLowerCase()} project located in <strong>${location || country}</strong>, evaluated over a ${life}-year mine life at ${production}.</p>
  <div class="kpi-grid">
    <div class="kpi-box"><div class="kpi-label">Initial CAPEX</div><div class="kpi-value">${pdfFmt(Number(p.totalCapex ?? 0))}</div><div class="kpi-unit">MUSD</div></div>
    <div class="kpi-box"><div class="kpi-label">Total OPEX</div><div class="kpi-value">${pdfFmt(Number(p.totalOpex ?? 0))}</div><div class="kpi-unit">MUSD / yr</div></div>
    <div class="kpi-box"><div class="kpi-label">NPV</div><div class="kpi-value ${isPositive ? 'text-green' : 'text-red'}">${pdfFmt(npv)}</div><div class="kpi-unit">MUSD</div></div>
    <div class="kpi-box"><div class="kpi-label">IRR</div><div class="kpi-value text-amber">${pdfFmt(irr)}%</div><div class="kpi-unit"> </div></div>
  </div>
  <div class="kpi-grid">
    <div class="kpi-box"><div class="kpi-label">Payback</div><div class="kpi-value">${pdfFmt(payback, 1)}</div><div class="kpi-unit">years</div></div>
    <div class="kpi-box"><div class="kpi-label">Mine Life</div><div class="kpi-value">${life}</div><div class="kpi-unit">years</div></div>
    <div class="kpi-box"><div class="kpi-label">Production Rate</div><div class="kpi-value" style="font-size:12px">${production}</div><div class="kpi-unit"> </div></div>
    <div class="kpi-box"><div class="kpi-label">Risk Level</div><div class="kpi-value" style="font-size:13px">${risk}</div><div class="kpi-unit">Monte Carlo</div></div>
  </div>
</section>

<section class="section">
  <h2>2. Project Information</h2>
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
        ['Discount Rate', `${pdfFmt(Number(p.discountRate ?? 0), 2)}%`],
        ['Tax Rate', `${pdfFmt(Number(p.taxRate ?? 0), 1)}%`],
        ['Royalty Rate', `${pdfFmt(Number(p.royaltyRate ?? 0), 1)}%`],
      ])}
    </tbody>
  </table>
</section>

<section class="section page-break">
  <h2>3. Economic Inputs</h2>
  <h3>Capital Expenditure (CAPEX)</h3>
  ${dataTable(
    ['Item', 'Value (MUSD)'],
    [
      ['Equipment', pdfFmt(Number(p.equipmentCost ?? 0))],
      ['Process Plant / Facilities', pdfFmt(Number(p.facilityCost ?? 0))],
      ['Infrastructure', pdfFmt(Number(p.infrastructureCost ?? 0))],
      ['Land / Forest / Rehabilitation', pdfFmt(Number(p.landCost ?? 0) + Number(p.forestCost ?? 0) + Number(p.rehabilitationCost ?? 0))],
      ['Contingency rate', `${pdfFmt(Number(p.contingencyRate ?? 0), 1)}%`],
      ['Total CAPEX', pdfFmt(Number(p.totalCapex ?? 0))],
    ]
  )}
  <h3>Operating Expenditure (OPEX, annual)</h3>
  ${dataTable(
    ['Item', 'Value (MUSD/yr)'],
    [
      ['Fuel', pdfFmt(Number(p.fuelCost ?? 0))],
      ['Personnel', pdfFmt(Number(p.personnelCost ?? 0))],
      ['Maintenance', pdfFmt(Number(p.maintenanceCost ?? 0))],
      ['Explosives', pdfFmt(Number(p.explosivesCost ?? 0))],
      ['Stripping', pdfFmt(Number(p.strippingCost ?? 0))],
      ['Plant operating', pdfFmt(Number(p.plantOperatingCost ?? 0))],
      ['Other', pdfFmt(Number(p.otherOpex ?? 0))],
      ['Total OPEX', pdfFmt(Number(p.totalOpex ?? 0))],
    ]
  )}
  <h3>Revenue Assumptions</h3>
  ${dataTable(
    ['Parameter', 'Value'],
    [
      ['Unit price', `${pdfFmt(Number(p.unitPrice ?? 0), 0)} ${currency}/t`],
      ['Annual production', production],
      ['By-product revenue', `${pdfFmt(Number(p.byProductRevenue ?? 0))} MUSD/yr`],
    ]
  )}
</section>

<section class="section">
  <h2>4. Equipment Summary</h2>
  ${
    equipRows.length
      ? dataTable(
          ['Machine', 'Model', 'Qty', 'Unit (MUSD)', 'Total (MUSD)', 'Power'],
          equipRows
        )
      : '<p>No equipment fleet records were provided for this project.</p>'
  }
</section>

<section class="section page-break">
  <h2>5. Financial Analysis</h2>
  <div class="kpi-grid-3">
    <div class="kpi-box"><div class="kpi-label">NPV</div><div class="kpi-value ${isPositive ? 'text-green' : 'text-red'}">${pdfFmt(npv)} MUSD</div></div>
    <div class="kpi-box"><div class="kpi-label">IRR</div><div class="kpi-value text-amber">${pdfFmt(irr)}%</div></div>
    <div class="kpi-box"><div class="kpi-label">Breakeven Price</div><div class="kpi-value">${pdfFmt(a?.breakevenPrice ?? Number(p.breakevenPrice ?? 0))} ${currency}/t</div></div>
  </div>
  <h3>Cash Flow Summary</h3>
  ${dataTable(
    ['Year', 'Revenue', 'OPEX', 'Net CF', 'Cumulative', 'Discounted'],
    cfPreview
  )}
  ${
    cfs.length > 16
      ? `<p style="font-size:9px;color:#64748b">Showing first 16 of ${cfs.length} modelled years. Full series is available in the Excel export.</p>`
      : ''
  }
</section>

<section class="section page-break">
  <h2>6. Sensitivity Analysis</h2>
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
  <h2>7. Monte Carlo Risk Analysis</h2>
  <p>2,000-iteration probabilistic NPV distribution using the platform’s standard uncertainty model (price / cost / production).</p>
  <div class="kpi-grid">
    <div class="kpi-box"><div class="kpi-label">Mean NPV</div><div class="kpi-value">${pdfFmt(mc.stats.npvMean)}</div><div class="kpi-unit">MUSD</div></div>
    <div class="kpi-box"><div class="kpi-label">Median NPV</div><div class="kpi-value">${pdfFmt(mc.stats.npvMedian)}</div><div class="kpi-unit">MUSD</div></div>
    <div class="kpi-box"><div class="kpi-label">Std. Dev.</div><div class="kpi-value">${pdfFmt(mc.stats.npvStdDev)}</div><div class="kpi-unit">MUSD</div></div>
    <div class="kpi-box"><div class="kpi-label">P(NPV &gt; 0)</div><div class="kpi-value">${pdfFmt(mc.stats.npvPositiveProb * 100, 1)}%</div><div class="kpi-unit"> </div></div>
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
  <h2>8. Conclusion</h2>
  <p>${conclusion}</p>
  <p>This evaluation should be read together with the Excel workbook for detailed cash-flow schedules and fleet economics.</p>

  <h2>9. Disclaimer</h2>
  <div class="disclaimer">
    This report was automatically generated by Mining Economics Dashboard based on user-provided assumptions.
    It is intended to support engineering decision-making and should not replace professional engineering judgment.
  </div>

  <div class="footer-line">
    <span>Mining Economics Dashboard · ${name}</span>
    <span>${dateStr} · v${version}</span>
  </div>
</section>

</body></html>`;
}
