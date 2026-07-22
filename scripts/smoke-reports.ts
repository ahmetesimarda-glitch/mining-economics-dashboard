import fs from 'fs';
import {
  performFullAnalysis,
  runMonteCarloSimulation,
  sensitivityAnalysis,
  calculateDepreciationTable,
  calculateFuelAnalysis,
  generateRiskMatrix,
  type ProjectParams,
} from '../lib/calculations';
import { buildConsultingPdfHtml, renderHtmlToPdf } from '../lib/reports/pdf';
import { buildTornadoBars } from '../lib/reports/shared/tornado';
import { buildProfessionalWorkbook, workbookToBuffer } from '../lib/reports/excel';

async function main() {
  const params: ProjectParams = {
    projectLifeYears: 10,
    discountRate: 5.82,
    taxRate: 22,
    royaltyRate: 4,
    creditRate: 4,
    creditYears: 10,
    unitPrice: 75,
    annualProduction: 2,
    plantProcessingRate: 35,
    equipmentCost: 50,
    facilityCost: 100,
    infrastructureCost: 20,
    contingencyRate: 10,
    totalCapex: 187,
    fuelCost: 5,
    personnelCost: 8,
    maintenanceCost: 3,
    explosivesCost: 2,
    tireCost: 1,
    strippingCost: 4,
    otherOpex: 1,
    totalOpex: 28,
    forestCost: 2,
    landCost: 3,
    rehabilitationCost: 1,
    annualStrippingVolume: 10,
    strippingUnitCost: 1.05,
    contractorStrippingCost: 0,
    plantOperatingCost: 4,
    equipmentDepLife: 6,
    facilityDepLife: 15,
    byProductRevenue: 0.5,
    fuelPricePerLiter: 1.2,
    equipmentRenewalEnabled: true,
    equipmentRenewalCycleYears: 10,
  };

  const project: Record<string, unknown> = {
    ...params,
    name: 'Smoke Test Mine',
    mineType: 'coal',
    miningMethod: 'openPit',
    location: 'Ankara, Turkey',
    currency: 'USD',
    productionUnit: 'Mt',
    oreGrade: 1.2,
    oreGradeUnit: '%',
    totalReserves: 50,
    status: 'active',
  };

  const analysis = performFullAnalysis(params);
  project.npv = analysis.npv;
  project.irr = analysis.irr;
  project.paybackPeriod = analysis.paybackPeriod;
  project.breakevenPrice = analysis.breakevenPrice;
  project.totalRevenue = analysis.totalRevenue;
  project.totalCost = analysis.totalCost;

  const sensitivity = {
    price: sensitivityAnalysis(params, 'price'),
    capex: sensitivityAnalysis(params, 'capex'),
    opex: sensitivityAnalysis(params, 'opex'),
    discountRate: sensitivityAnalysis(params, 'discountRate'),
  };
  const monteCarlo = runMonteCarloSimulation(params, 2000);
  const tornado = buildTornadoBars(params, analysis.npv);
  const risks = generateRiskMatrix(params);

  const equipments = [
    {
      machineType: 'Truck',
      model: '777',
      tonnageCapacity: '100t',
      quantity: 5,
      spareQuantity: 1,
      unitCost: 1_100_000,
      totalCost: 6_600_000,
      hourlyFuelConsumption: 32,
      fuelConsumption: 32,
      maintenanceCost: 50000,
      powerType: 'diesel',
      dailyWorkHours: 8,
    },
  ];

  const html = buildConsultingPdfHtml({
    project,
    analysis,
    params,
    equipments,
    sensitivity,
    monteCarlo,
    tornado,
    risks,
    version: '1.0',
  });
  console.log('HTML length', html.length);
  console.log('Abacus refs?', /abacus|createConvertHtmlToPdf/i.test(html));

  const pdf = await renderHtmlToPdf(html);
  fs.writeFileSync('/tmp/smoke-report.pdf', pdf);
  console.log('PDF bytes', pdf.length, 'magic', pdf.slice(0, 5).toString());

  const wb = await buildProfessionalWorkbook({
    project,
    cashFlows: analysis.cashFlows as unknown as Record<string, unknown>[],
    equipments,
    personnels: [{ role: 'Operator', count: 10, monthlySalary: 1500, annualCost: 180000 }],
    byProducts: [],
    capexItems: [],
    opexItems: [],
    sensitivity,
    monteCarlo,
    tornado,
    depreciation: calculateDepreciationTable(params),
    fuelAnalysis: calculateFuelAnalysis(equipments, 1.2),
  });
  const xbuf = await workbookToBuffer(wb);
  fs.writeFileSync('/tmp/smoke-report.xlsx', xbuf);
  console.log(
    'XLSX bytes',
    xbuf.length,
    'sheets',
    wb.worksheets.map((w) => w.name).join(' | ')
  );
  console.log('OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
