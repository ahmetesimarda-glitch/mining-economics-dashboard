import { calculateTotalCapex, calculateTotalOpex, type ProjectParams } from '@/lib/calculations';

/** Build ProjectParams with CAPEX/OPEX totals derived from components (engine helpers only). */
export function buildParams(
  partial: Omit<ProjectParams, 'totalCapex' | 'totalOpex'> &
    Partial<Pick<ProjectParams, 'totalCapex' | 'totalOpex'>>
): ProjectParams {
  const totalCapex = partial.totalCapex ?? calculateTotalCapex(partial);
  const totalOpex = partial.totalOpex ?? calculateTotalOpex(partial);
  return { ...partial, totalCapex, totalOpex };
}

export function equipmentRow(
  row: Record<string, unknown> & {
    machineType: string;
    equipmentCategory: string;
    quantity: number;
    unitCost: number;
  }
): Record<string, unknown> {
  const quantity = Number(row.quantity ?? 1);
  const spareQuantity = Number(row.spareQuantity ?? 0);
  const unitCost = Number(row.unitCost ?? 0);
  return {
    model: '',
    tonnageCapacity: '',
    spareQuantity,
    dailyWorkHours: 16,
    maintenancePeriodHours: 500,
    operatorCount: 1,
    powerType: 'diesel',
    hourlyFuelConsumption: 0,
    maintenanceCost: 0,
    fuelConsumption: 0,
    productionImpact: 0,
    ...row,
    totalCost: row.totalCost ?? (quantity + spareQuantity) * unitCost,
  };
}

export function standardMineStaff(scale: 'small' | 'medium' | 'large'): Record<string, unknown>[] {
  const mult = scale === 'large' ? 1.4 : scale === 'small' ? 0.7 : 1;
  const n = (base: number) => Math.max(1, Math.round(base * mult));
  return [
    { role: 'Mine Manager', count: 1, monthlySalary: 12_000 },
    { role: 'Mining Engineer', count: n(4), monthlySalary: 6_500 },
    { role: 'Geologist', count: n(3), monthlySalary: 5_800 },
    { role: 'Metallurgist', count: n(2), monthlySalary: 6_200 },
    { role: 'Environmental Engineer', count: n(2), monthlySalary: 5_500 },
    { role: 'Shift Supervisor', count: n(6), monthlySalary: 4_200 },
    { role: 'Equipment Operator', count: n(24), monthlySalary: 3_400 },
    { role: 'Maintenance Technician', count: n(14), monthlySalary: 3_800 },
    { role: 'Plant Operator', count: n(10), monthlySalary: 3_200 },
    { role: 'Electrician', count: n(5), monthlySalary: 3_600 },
    { role: 'Safety / Rescue', count: n(8), monthlySalary: 3_000 },
    { role: 'Admin / HR', count: n(5), monthlySalary: 2_800 },
  ];
}
