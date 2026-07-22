import { performFullAnalysis, type ProjectParams } from '@/lib/calculations';

export interface TornadoBar {
  parameter: string;
  label: string;
  lowNpv: number;
  highNpv: number;
  baseNpv: number;
  impact: number;
}

/**
 * ±20% tornado bars — same orchestration as `/api/projects/[id]/tornado`.
 * Presentation only; reuses `performFullAnalysis` (no formula changes).
 */
export function buildTornadoBars(params: ProjectParams, baseNpv?: number): TornadoBar[] {
  const base = baseNpv ?? performFullAnalysis(params).npv;
  const parameters: { key: string; label: string; field: keyof ProjectParams }[] = [
    { key: 'unitPrice', label: 'Unit Price', field: 'unitPrice' },
    { key: 'totalCapex', label: 'CAPEX', field: 'totalCapex' },
    { key: 'totalOpex', label: 'OPEX', field: 'totalOpex' },
    { key: 'discountRate', label: 'Discount Rate', field: 'discountRate' },
    { key: 'annualProduction', label: 'Annual Production', field: 'annualProduction' },
    { key: 'taxRate', label: 'Tax Rate', field: 'taxRate' },
    { key: 'royaltyRate', label: 'Royalty Rate', field: 'royaltyRate' },
  ];

  return parameters
    .map((param) => {
      const baseVal = Number(params[param.field] ?? 0);
      if (!baseVal) {
        return {
          parameter: param.key,
          label: param.label,
          lowNpv: base,
          highNpv: base,
          baseNpv: base,
          impact: 0,
        };
      }
      const lowAnalysis = performFullAnalysis({ ...params, [param.field]: baseVal * 0.8 });
      const highAnalysis = performFullAnalysis({ ...params, [param.field]: baseVal * 1.2 });
      const lowNpv = Math.min(lowAnalysis.npv, highAnalysis.npv);
      const highNpv = Math.max(lowAnalysis.npv, highAnalysis.npv);
      return {
        parameter: param.key,
        label: param.label,
        lowNpv,
        highNpv,
        baseNpv: base,
        impact: Math.abs(highNpv - lowNpv),
      };
    })
    .filter((item) => item.impact > 0)
    .sort((a, b) => b.impact - a.impact);
}
