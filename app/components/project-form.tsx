'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { formatEquipmentUsd, formatSpecNumber } from '@/lib/master-data';
import { Header } from './header';
import {
  MINE_TYPES, MINING_METHODS, CURRENCIES, POWER_TYPES, EQUIPMENT_CATEGORIES,
  DEFAULT_EQUIPMENT_OPEN_PIT, DEFAULT_EQUIPMENT_UNDERGROUND,
  DEFAULT_PERSONNEL, OPEN_PIT_COSTS, UNDERGROUND_COSTS,
  getCategoryFields, getCategoryLabel,
} from '@/lib/format';
import { toast } from 'sonner';
import {
  Mountain, DollarSign, Settings, Factory, Fuel, Users, Wrench,
  Bomb, CircleDot, TreePine, CreditCard, Calculator, Loader2,
  ChevronRight, ChevronLeft, Save, Plus, Trash2, Truck, HardHat,
  Pickaxe, Gem, ChevronDown, ChevronUp, Zap, Droplets, BarChart3, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/context';
import {
  parseNumericInput,
  parseIntegerInput,
  toNumber,
  coerceNumericFields,
} from '@/lib/number-input';
import { snapshotCatalogToProjectEquipment } from '@/lib/master-data';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ProjectFormProps {
  initialData?: any;
  isEditing?: boolean;
}

interface CatalogPickItem {
  id: string;
  manufacturer: string;
  model: string;
  category: string;
  capacityLabel: string;
  purchasePriceUsd: number | null;
  fuelConsumptionLph: number | null;
  maintenanceCostUsdYear: number | null;
  powerType: string;
  payloadTons: number | null;
  bucketCapacityM3: number | null;
  description: string;
}

/** Scalar form fields that must be finite numbers in the API payload. */
const NUMERIC_FORM_KEYS = [
  'projectLifeYears', 'discountRate', 'taxRate', 'royaltyRate',
  'creditRate', 'creditYears', 'exchangeRate',
  'fuelPricePerLiter', 'electricityUnitPrice', 'explosiveUnitPrice',
  'totalReserves', 'maxAnnualCapacity', 'oreGrade',
  'unitPrice', 'annualProduction', 'plantProcessingRate',
  'equipmentCost', 'facilityCost', 'infrastructureCost', 'contingencyRate',
  'fuelCost', 'personnelCost', 'maintenanceCost', 'explosivesCost',
  'tireCost', 'strippingCost', 'otherOpex',
  'forestCost', 'landCost', 'rehabilitationCost',
  'annualStrippingVolume', 'strippingUnitCost',
  'contractorStrippingCost', 'plantOperatingCost',
  'equipmentDepLife', 'facilityDepLife',
  'waterConsumptionDaily', 'rehabilitationAreaHa', 'rehabilitationCostPerHa',
  'loanAmount', 'loanInterestRate', 'loanTermYears', 'equityRatio',
  'latitude', 'longitude',
] as const;

function FormField({ label, name, value, onChange, type = 'number', suffix, icon: Icon, placeholder, className: fieldClassName }: any) {
  return (
    <div className={cn('space-y-1.5', fieldClassName)}>
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder ?? ''}
          step="any"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>
        )}
      </div>
    </div>
  );
}

export function ProjectForm({ initialData, isEditing }: ProjectFormProps) {
  const { t } = useLanguage();

  const STEPS = [
    { id: 'general', label: t('form.step.general'), icon: Mountain },
    { id: 'equipment', label: t('form.step.equipment'), icon: Truck },
    { id: 'personnel', label: t('form.step.personnel'), icon: Users },
    { id: 'capex', label: t('form.step.capex'), icon: Factory },
    { id: 'opex', label: t('form.step.opex'), icon: Settings },
    { id: 'method', label: t('form.step.method'), icon: Pickaxe },
    { id: 'revenue', label: t('form.step.revenue'), icon: DollarSign },
    { id: 'financial', label: t('form.step.financial'), icon: CreditCard },
  ];
  const router = useRouter();
  const catalogImportDone = useRef(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [expandedEquip, setExpandedEquip] = useState<number | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogItems, setCatalogItems] = useState<CatalogPickItem[]>([]);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);

  const defaults = {
    name: '', mineType: 'lignite', miningMethod: 'openPit', location: '',
    projectLifeYears: 30, discountRate: 5.82, taxRate: 22, royaltyRate: 4,
    creditRate: 4, creditYears: 10, currency: 'USD',
    exchangeRate: 1, manualExchangeRate: false,
    fuelPricePerLiter: 0, electricityUnitPrice: 0, explosiveUnitPrice: 0,
    totalReserves: 0, maxAnnualCapacity: 0, oreGrade: 0, oreGradeUnit: '%',
    unitPrice: 75, annualProduction: 2, productionUnit: 'Mt', plantProcessingRate: 35,
    equipmentCost: 0, facilityCost: 0, infrastructureCost: 0, contingencyRate: 10,
    fuelCost: 0, personnelCost: 0, maintenanceCost: 0, explosivesCost: 0,
    tireCost: 0, strippingCost: 0, otherOpex: 0,
    forestCost: 0, landCost: 0, rehabilitationCost: 0,
    annualStrippingVolume: 0, strippingUnitCost: 1.05,
    contractorStrippingCost: 0, plantOperatingCost: 0,
    equipmentDepLife: 6, facilityDepLife: 15, depreciationMethod: 'linear',
    waterConsumptionDaily: 0, rehabilitationAreaHa: 0, rehabilitationCostPerHa: 0,
    loanAmount: 0, loanInterestRate: 0, loanTermYears: 0, equityRatio: 100,
    latitude: 0, longitude: 0,
  };

  const [form, setForm] = useState({ ...defaults, ...(initialData ?? {}) });

  const [equipments, setEquipments] = useState<any[]>(() => {
    if (initialData?.equipments?.length > 0) return initialData.equipments;
    return DEFAULT_EQUIPMENT_OPEN_PIT.map((e: any) => ({ ...e, isCustom: false }));
  });
  const [personnels, setPersonnels] = useState<any[]>(() => {
    if (initialData?.personnels?.length > 0) return initialData.personnels;
    return DEFAULT_PERSONNEL.map((p: any) => ({ ...p, isCustom: false }));
  });
  const [byProducts, setByProducts] = useState<any[]>(() => {
    if (initialData?.byProducts?.length > 0) return initialData.byProducts;
    return [];
  });
  const [methodCosts, setMethodCosts] = useState<any[]>(() => {
    if (initialData?.methodCosts?.length > 0) return initialData.methodCosts;
    return OPEN_PIT_COSTS.map((c: any) => ({ ...c, value: 0 }));
  });

  useEffect(() => {
    if (isEditing) return;
    const method = form?.miningMethod;
    if (method === 'openPit') {
      setEquipments(DEFAULT_EQUIPMENT_OPEN_PIT.map((e: any) => ({ ...e, isCustom: false })));
      setMethodCosts(OPEN_PIT_COSTS.map((c: any) => ({ ...c, value: 0 })));
    } else {
      setEquipments(DEFAULT_EQUIPMENT_UNDERGROUND.map((e: any) => ({ ...e, isCustom: false })));
      setMethodCosts(UNDERGROUND_COSTS.map((c: any) => ({ ...c, value: 0 })));
    }
  }, [form?.miningMethod, isEditing]);

  const handleChange = (e: any) => {
    const { name, value, type } = e?.target ?? {};
    setForm((prev: any) => ({
      ...(prev ?? {}),
      // Keep empty while editing; coerce to 0 only on submit (see handleSubmit).
      [name ?? '']: type === 'number' ? parseNumericInput(String(value ?? '')) : value,
    }));
  };

  // Equipment handlers
  const updateEquipment = (index: number, field: string, value: any) => {
    setEquipments((prev: any[]) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (['quantity', 'unitCost', 'spareQuantity'].includes(field)) {
        const q = toNumber(field === 'quantity' ? value : next[index]?.quantity, 1);
        const sq = toNumber(field === 'spareQuantity' ? value : next[index]?.spareQuantity, 0);
        const uc = toNumber(field === 'unitCost' ? value : next[index]?.unitCost, 0);
        next[index].totalCost = (q + sq) * uc;
      }
      return next;
    });
  };
  const addEquipment = () => {
    const base = {
      machineType: '', model: '', tonnageCapacity: '', quantity: 1, spareQuantity: 0,
      fuelConsumption: 0, maintenanceCost: 0, unitCost: 0, totalCost: 0, isCustom: true,
      equipmentCategory: 'general', dailyWorkHours: 8, maintenancePeriodHours: 500,
      operatorCount: 1, powerType: 'diesel', hourlyFuelConsumption: 0, productionImpact: 0,
      drillCapacity: 0, holeDiameter: 0, maxDrillDepth: 0, bucketVolume: 0,
      transportCapacity: 0, loadingCapacity: 0, crushingCapacity: 0, gallerySuitability: '',
    };
    setEquipments((prev: any[]) => [...prev, base]);
  };

  const openCatalogPicker = async () => {
    setCatalogOpen(true);
    setSelectedCatalogId(null);
    setCatalogLoading(true);
    try {
      const params = new URLSearchParams({
        isActive: 'true',
        pageSize: '100',
        sort: 'sortOrder',
        order: 'asc',
      });
      if (catalogQuery.trim()) params.set('q', catalogQuery.trim());
      const res = await fetch(`/api/master-data/equipment?${params.toString()}`);
      if (!res.ok) {
        toast.error(t('equipCat.loadError'));
        return;
      }
      const data = (await res.json()) as { items?: CatalogPickItem[] };
      setCatalogItems(data.items ?? []);
    } catch {
      toast.error(t('equipCat.loadError'));
    } finally {
      setCatalogLoading(false);
    }
  };

  const addEquipmentFromCatalog = () => {
    const item = catalogItems.find((c) => c.id === selectedCatalogId);
    if (!item) return;
    const snapshot = snapshotCatalogToProjectEquipment(item);
    setEquipments((prev: any[]) => [...prev, snapshot]);
    setCatalogOpen(false);
    setSelectedCatalogId(null);
    toast.success(`${item.manufacturer} ${item.model}`.trim());
  };

  // Snapshot import from Equipment Catalog detail → Add to Project.
  useEffect(() => {
    if (!isEditing || !initialData?.id || catalogImportDone.current) return;
    if (typeof window === 'undefined') return;
    const catalogId = new URLSearchParams(window.location.search).get('addFromCatalog');
    if (!catalogId) return;
    catalogImportDone.current = true;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/master-data/equipment/${catalogId}`);
        if (!res.ok) {
          toast.error(t('equipCat.loadError'));
          return;
        }
        const item = (await res.json()) as CatalogPickItem;
        if (cancelled) return;
        const snapshot = snapshotCatalogToProjectEquipment(item);
        setEquipments((prev: any[]) => [...prev, snapshot]);
        setStep(1);
        toast.success(`${item.manufacturer} ${item.model}`.trim());
        router.replace(`/projects/${initialData.id}/edit`);
      } catch {
        toast.error(t('equipCat.loadError'));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEditing, initialData?.id, t, router]);

  const removeEquipment = (i: number) => setEquipments((prev: any[]) => prev.filter((_: any, idx: number) => idx !== i));

  // Personnel handlers
  const updatePersonnel = (index: number, field: string, value: any) => {
    setPersonnels((prev: any[]) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (['count', 'monthlySalary'].includes(field)) {
        const c = toNumber(field === 'count' ? value : next[index]?.count, 1);
        const ms = toNumber(field === 'monthlySalary' ? value : next[index]?.monthlySalary, 0);
        next[index].annualCost = c * ms * 12;
      }
      return next;
    });
  };
  const addPersonnel = () => setPersonnels((prev: any[]) => [...prev, { role: '', count: 1, monthlySalary: 0, annualCost: 0, isCustom: true }]);
  const removePersonnel = (i: number) => setPersonnels((prev: any[]) => prev.filter((_: any, idx: number) => idx !== i));

  // By-product handlers
  const updateByProduct = (index: number, field: string, value: any) => {
    setByProducts((prev: any[]) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (['annualProduction', 'unitPrice'].includes(field)) {
        const ap = toNumber(field === 'annualProduction' ? value : next[index]?.annualProduction, 0);
        const up = toNumber(field === 'unitPrice' ? value : next[index]?.unitPrice, 0);
        next[index].totalRevenue = ap * up;
      }
      return next;
    });
  };
  const addByProduct = () => setByProducts((prev: any[]) => [...prev, { name: '', annualProduction: 0, productionUnit: 'ton', unitPrice: 0, priceUnit: 'USD/ton', totalRevenue: 0 }]);
  const removeByProduct = (i: number) => setByProducts((prev: any[]) => prev.filter((_: any, idx: number) => idx !== i));

  // Method cost handlers
  const updateMethodCost = (index: number, value: number | '') => {
    setMethodCosts((prev: any[]) => {
      const next = [...prev];
      next[index] = { ...next[index], value };
      return next;
    });
  };
  const addMethodCost = () => setMethodCosts((prev: any[]) => [...prev, { name: '', category: form?.miningMethod === 'openPit' ? 'openPit' : 'underground', value: 0, unit: 'MUSD' }]);
  const removeMethodCost = (i: number) => setMethodCosts((prev: any[]) => prev.filter((_: any, idx: number) => idx !== i));

  // Calculate summaries (empty drafts count as 0 / field defaults)
  const totalEquipmentCost = equipments.reduce(
    (s: number, e: any) => s + (toNumber(e?.quantity, 1) + toNumber(e?.spareQuantity, 0)) * toNumber(e?.unitCost, 0),
    0
  );
  const totalPersonnelCost = personnels.reduce(
    (s: number, p: any) => s + toNumber(p?.count, 1) * toNumber(p?.monthlySalary, 0) * 12,
    0
  );
  const totalByProductRevenue = byProducts.reduce(
    (s: number, b: any) => s + toNumber(b?.annualProduction, 0) * toNumber(b?.unitPrice, 0),
    0
  );
  const totalMethodCost = methodCosts.reduce((s: number, c: any) => s + toNumber(c?.value, 0), 0);
  const totalFuelFromEquip = equipments.reduce((s: number, e: any) => {
    const hourly = toNumber(e?.hourlyFuelConsumption, 0);
    const daily = toNumber(e?.dailyWorkHours, 8);
    const qty = toNumber(e?.quantity, 1);
    const fuelPrice = toNumber(form?.fuelPricePerLiter, 0);
    return s + (hourly * daily * 365 * qty * fuelPrice);
  }, 0);
  const totalMaintFromEquip = equipments.reduce(
    (s: number, e: any) => s + toNumber(e?.quantity, 1) * toNumber(e?.maintenanceCost, 0),
    0
  );

  const handleSubmit = async () => {
    if (!(form?.name ?? '').trim()) {
      toast.error('Proje adı zorunludur');
      setStep(0);
      return;
    }
    setSaving(true);
    try {
      // Coerce empty drafts → numbers only at submit so the API/engine stay unchanged.
      const coercedForm = coerceNumericFields({ ...form }, NUMERIC_FORM_KEYS);
      const payload = {
        ...coercedForm,
        equipmentCost: totalEquipmentCost / 1_000_000,
        personnelCost: totalPersonnelCost / 1_000_000,
        fuelCost: toNumber(form?.fuelCost, 0) + totalFuelFromEquip / 1_000_000,
        maintenanceCost: toNumber(form?.maintenanceCost, 0) + totalMaintFromEquip / 1_000_000,
        byProductRevenue: totalByProductRevenue / 1_000_000,
        equipments: equipments.map((e: any) => ({
          ...e,
          quantity: toNumber(e?.quantity, 1),
          spareQuantity: toNumber(e?.spareQuantity, 0),
          unitCost: toNumber(e?.unitCost, 0),
          totalCost: toNumber(e?.totalCost, 0),
          fuelConsumption: toNumber(e?.fuelConsumption, 0),
          maintenanceCost: toNumber(e?.maintenanceCost, 0),
          dailyWorkHours: toNumber(e?.dailyWorkHours, 8),
          maintenancePeriodHours: toNumber(e?.maintenancePeriodHours, 500),
          operatorCount: toNumber(e?.operatorCount, 1),
          hourlyFuelConsumption: toNumber(e?.hourlyFuelConsumption, 0),
          productionImpact: toNumber(e?.productionImpact, 0),
          drillCapacity: toNumber(e?.drillCapacity, 0),
          holeDiameter: toNumber(e?.holeDiameter, 0),
          maxDrillDepth: toNumber(e?.maxDrillDepth, 0),
          bucketVolume: toNumber(e?.bucketVolume, 0),
          transportCapacity: toNumber(e?.transportCapacity, 0),
          loadingCapacity: toNumber(e?.loadingCapacity, 0),
          crushingCapacity: toNumber(e?.crushingCapacity, 0),
        })),
        personnels: personnels.map((p: any) => ({
          ...p,
          count: toNumber(p?.count, 1),
          monthlySalary: toNumber(p?.monthlySalary, 0),
          annualCost: toNumber(p?.annualCost, 0),
        })),
        byProducts: byProducts.map((b: any) => ({
          ...b,
          annualProduction: toNumber(b?.annualProduction, 0),
          unitPrice: toNumber(b?.unitPrice, 0),
          totalRevenue: toNumber(b?.totalRevenue, 0),
        })),
        methodCosts: methodCosts.map((c: any) => ({
          ...c,
          value: toNumber(c?.value, 0),
        })),
      };
      const url = isEditing ? `/api/projects/${initialData?.id}` : '/api/projects';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res?.ok) {
        const data = await res?.json();
        toast.success(isEditing ? 'Proje güncellendi' : 'Proje oluşturuldu');
        router.push(`/projects/${data?.id ?? ''}`);
      } else {
        toast.error('Bir hata oluştu');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Sunucu hatası');
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0: // General
        return (
          <div className="space-y-6">
            {/* Mining Method Selection */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Pickaxe className="h-4 w-4 text-primary" /> Madencilik Yöntemi Seçimi
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MINING_METHODS.map((m: any) => (
                  <button key={m.value} type="button"
                    onClick={() => setForm((prev: any) => ({ ...prev, miningMethod: m.value }))}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border-2 p-4 transition-all text-left',
                      form?.miningMethod === m.value
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border/50 hover:border-primary/30 hover:bg-accent/50'
                    )}>
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg',
                      form?.miningMethod === m.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                      {m.value === 'openPit' ? <Mountain className="h-5 w-5" /> : <Pickaxe className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{m.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.value === 'openPit' ? 'Dekapaj, pasa döküm, şev yönetimi' : 'Galeri, tahkimat, havalandırma'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={t('form.projectName')} name="name" value={form?.name} onChange={handleChange} type="text" icon={Mountain} placeholder="Örn: Linyit Madeni Açık Ocak" />
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Mountain className="h-3.5 w-3.5" /> Maden Tipi
                </label>
                <select name="mineType" value={form?.mineType ?? 'lignite'} onChange={handleChange}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                  {(MINE_TYPES ?? []).map((t: any) => (<option key={t?.value} value={t?.value}>{t?.label}</option>))}
                </select>
              </div>
              <FormField label="Lokasyon" name="location" value={form?.location} onChange={handleChange} type="text" placeholder="Örn: Muğla, Türkiye" />
              <FormField label="Proje Ömrü" name="projectLifeYears" value={form?.projectLifeYears} onChange={handleChange} suffix="yıl" />
            </div>
            {/* Reserves & Capacity */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" /> Rezerv & Kapasite
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Toplam Rezerv" name="totalReserves" value={form?.totalReserves} onChange={handleChange} suffix="Mt" icon={Database} />
                <FormField label="Maks. Yıllık Kapasite" name="maxAnnualCapacity" value={form?.maxAnnualCapacity} onChange={handleChange} suffix="Mt/yıl" />
                <div className="grid grid-cols-2 gap-2">
                  <FormField label={t('form.oreGrade')} name="oreGrade" value={form?.oreGrade} onChange={handleChange} suffix={form?.oreGradeUnit ?? '%'} />
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Tenör Birimi</label>
                    <select name="oreGradeUnit" value={form?.oreGradeUnit ?? '%'} onChange={handleChange}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="%">%</option>
                      <option value="g/ton">g/ton</option>
                      <option value="ppm">ppm</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            {/* Currency & Energy Costs */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" /> Döviz & Enerji Birim Fiyatları
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5" /> Para Birimi
                  </label>
                  <select name="currency" value={form?.currency ?? 'USD'} onChange={handleChange}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {CURRENCIES.map((c: any) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                  </select>
                </div>
                <FormField label="Döviz Kuru (1 USD =)" name="exchangeRate" value={form?.exchangeRate} onChange={handleChange} suffix={form?.currency !== 'USD' ? form?.currency : 'TRY'} icon={DollarSign} />
                <FormField label="Yakıt Fiyatı" name="fuelPricePerLiter" value={form?.fuelPricePerLiter} onChange={handleChange} suffix="USD/lt" icon={Fuel} />
                <FormField label="Elektrik Birim Fiyatı" name="electricityUnitPrice" value={form?.electricityUnitPrice} onChange={handleChange} suffix="USD/kWh" icon={Zap} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField label="Patlayıcı Birim Maliyeti" name="explosiveUnitPrice" value={form?.explosiveUnitPrice} onChange={handleChange} suffix="USD/kg" icon={Bomb} />
              </div>
            </div>
          </div>
        );

      case 1: // Equipment (Enhanced)
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" /> Makine ve Ekipmanlar
              </h4>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Toplam: <strong className="text-foreground font-mono">{(totalEquipmentCost / 1_000_000).toFixed(3)} MUSD</strong></span>
                <button
                  type="button"
                  onClick={() => void openCatalogPicker()}
                  className="flex items-center gap-1 text-xs bg-card border border-border/50 text-foreground px-3 py-1.5 rounded-lg hover:bg-accent"
                >
                  <Database className="h-3 w-3" /> {t('equipCat.addFromCatalog')}
                </button>
                <button type="button" onClick={addEquipment} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90">
                  <Plus className="h-3 w-3" /> Makine Ekle
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Her makine için teknik detayları genişlet butonuyla girebilirsiniz.</p>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {equipments.map((eq: any, i: number) => {
                const isExpanded = expandedEquip === i;
                const catFields = getCategoryFields(eq?.equipmentCategory ?? 'general');
                return (
                  <div key={i} className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
                    {/* Header row */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-primary flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            {getCategoryLabel(eq?.equipmentCategory)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => setExpandedEquip(isExpanded ? null : i)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent">
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            {isExpanded ? 'Kapat' : 'Detay'}
                          </button>
                          <button type="button" onClick={() => removeEquipment(i)} className="text-muted-foreground hover:text-destructive p-1">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      {/* Basic fields */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Kategori</label>
                          <select value={eq?.equipmentCategory ?? 'general'}
                            onChange={(e) => updateEquipment(i, 'equipmentCategory', e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                            {EQUIPMENT_CATEGORIES.map((c: any) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Makine Tipi</label>
                          <input type="text" value={eq?.machineType ?? ''} onChange={(e) => updateEquipment(i, 'machineType', e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Model</label>
                          <input type="text" value={eq?.model ?? ''} onChange={(e) => updateEquipment(i, 'model', e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Örn: CAT 390F" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Adet</label>
                          <input type="number" value={eq?.quantity ?? ''} onChange={(e) => updateEquipment(i, 'quantity', parseIntegerInput(e.target.value))}
                            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Birim Fiyat (USD)</label>
                          <input type="number" step="any" value={eq?.unitCost ?? ''} onChange={(e) => updateEquipment(i, 'unitCost', parseNumericInput(e.target.value))}
                            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                      </div>
                    </div>

                    {/* Expanded detailed fields */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="border-t border-border/30 bg-muted/20 px-4 py-3 space-y-3">
                          {/* Common detailed fields */}
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Teknik Parametreler</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Günlük Çalışma</label>
                              <div className="relative">
                                <input type="number" step="any" value={eq?.dailyWorkHours ?? ''} onChange={(e) => updateEquipment(i, 'dailyWorkHours', parseNumericInput(e.target.value))}
                                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">saat</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Operatör İhtiyacı</label>
                              <input type="number" value={eq?.operatorCount ?? ''} onChange={(e) => updateEquipment(i, 'operatorCount', parseIntegerInput(e.target.value))}
                                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Güç Tipi</label>
                              <select value={eq?.powerType ?? 'diesel'}
                                onChange={(e) => updateEquipment(i, 'powerType', e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                                {POWER_TYPES.map((p: any) => (<option key={p.value} value={p.value}>{p.label}</option>))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Bakım Periyodu</label>
                              <div className="relative">
                                <input type="number" value={eq?.maintenancePeriodHours ?? ''} onChange={(e) => updateEquipment(i, 'maintenancePeriodHours', parseIntegerInput(e.target.value))}
                                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">saat</span>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Saatlik Yakıt Tüketimi</label>
                              <div className="relative">
                                <input type="number" step="any" value={eq?.hourlyFuelConsumption ?? ''} onChange={(e) => updateEquipment(i, 'hourlyFuelConsumption', parseNumericInput(e.target.value))}
                                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">lt/sa</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Bakım Gideri (USD/yıl)</label>
                              <input type="number" step="any" value={eq?.maintenanceCost ?? ''} onChange={(e) => updateEquipment(i, 'maintenanceCost', parseNumericInput(e.target.value))}
                                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Yedek Adet</label>
                              <input type="number" value={eq?.spareQuantity ?? ''} onChange={(e) => updateEquipment(i, 'spareQuantity', parseIntegerInput(e.target.value))}
                                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Tonaj/Kapasite</label>
                              <input type="text" value={eq?.tonnageCapacity ?? ''} onChange={(e) => updateEquipment(i, 'tonnageCapacity', e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Örn: 90 ton" />
                            </div>
                          </div>
                          {/* Category-specific fields */}
                          {catFields.length > 0 && (
                            <>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mt-2">
                                {getCategoryLabel(eq?.equipmentCategory)} Özel Parametreler
                              </p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {catFields.map((f: any) => (
                                  <div key={f.key} className="space-y-1">
                                    <label className="text-xs text-muted-foreground">{f.label}</label>
                                    <div className="relative">
                                      {f.key === 'gallerySuitability' ? (
                                        <input type="text" value={eq?.[f.key] ?? ''} onChange={(e) => updateEquipment(i, f.key, e.target.value)}
                                          className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Örn: 4x4m" />
                                      ) : (
                                        <input type="number" step="any" value={eq?.[f.key] ?? ''} onChange={(e) => updateEquipment(i, f.key, parseNumericInput(e.target.value))}
                                          className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                      )}
                                      {f.suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{f.suffix}</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                          {/* Fuel calculation summary */}
                          {(toNumber(eq?.hourlyFuelConsumption, 0) > 0) && (toNumber(form?.fuelPricePerLiter, 0) > 0) && (
                            <div className="p-2 rounded bg-amber-500/5 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
                              <Fuel className="inline h-3 w-3 mr-1" />
                              Günlük: {(toNumber(eq?.hourlyFuelConsumption, 0) * toNumber(eq?.dailyWorkHours, 8) * toNumber(eq?.quantity, 1)).toFixed(0)} lt | 
                              Aylık: {(toNumber(eq?.hourlyFuelConsumption, 0) * toNumber(eq?.dailyWorkHours, 8) * toNumber(eq?.quantity, 1) * 30).toFixed(0)} lt | 
                              Yıllık Maliyet: {(toNumber(eq?.hourlyFuelConsumption, 0) * toNumber(eq?.dailyWorkHours, 8) * 365 * toNumber(eq?.quantity, 1) * toNumber(form?.fuelPricePerLiter, 0)).toLocaleString('tr-TR', {maximumFractionDigits: 0})} USD
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Footer summary */}
                    <div className="px-4 py-2 border-t border-border/20 flex justify-between items-center text-xs text-muted-foreground bg-card/30">
                      <span>{eq?.machineType || 'Tanımsız'} • {toNumber(eq?.quantity, 1)} adet</span>
                      <span className="font-mono font-medium text-foreground">{((toNumber(eq?.quantity, 1) + toNumber(eq?.spareQuantity, 0)) * toNumber(eq?.unitCost, 0)).toLocaleString('tr-TR')} USD</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 2: // Personnel
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Personel Yönetimi
              </h4>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Yıllık Toplam: <strong className="text-foreground font-mono">{(totalPersonnelCost / 1_000_000).toFixed(3)} MUSD</strong></span>
                <button type="button" onClick={addPersonnel} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90">
                  <Plus className="h-3 w-3" /> Pozisyon Ekle
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {personnels.map((p: any, i: number) => (
                <div key={i} className="rounded-lg border border-border/50 p-3 bg-card/50 flex flex-wrap items-end gap-3">
                  <div className="space-y-1 flex-1 min-w-[150px]">
                    <label className="text-xs text-muted-foreground">Görev / Pozisyon</label>
                    <input type="text" value={p?.role ?? ''} onChange={(e) => updatePersonnel(i, 'role', e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div className="space-y-1 w-20">
                    <label className="text-xs text-muted-foreground">Kişi</label>
                    <input type="number" value={p?.count ?? ''} onChange={(e) => updatePersonnel(i, 'count', parseIntegerInput(e.target.value))}
                      className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div className="space-y-1 w-36">
                    <label className="text-xs text-muted-foreground">Aylık Maaş (USD)</label>
                    <input type="number" step="any" value={p?.monthlySalary ?? ''} onChange={(e) => updatePersonnel(i, 'monthlySalary', parseNumericInput(e.target.value))}
                      className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div className="text-xs text-muted-foreground pb-1.5">
                    Yıllık: <strong className="text-foreground font-mono">{(toNumber(p?.count, 1) * toNumber(p?.monthlySalary, 0) * 12).toLocaleString('tr-TR')} USD</strong>
                  </div>
                  <button type="button" onClick={() => removePersonnel(i)} className="text-muted-foreground hover:text-destructive pb-1.5">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 3: // CAPEX
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><Factory className="h-4 w-4 text-primary" /> Sabit Yatırım Kalemleri (MUSD)</h4>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                <p className="text-xs text-muted-foreground">Makine-Ekipman maliyeti otomatik hesaplanır: <strong className="text-foreground">{(totalEquipmentCost / 1_000_000).toFixed(3)} MUSD</strong></p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Tesis" name="facilityCost" value={form?.facilityCost} onChange={handleChange} suffix="MUSD" />
                <FormField label="Altyapı" name="infrastructureCost" value={form?.infrastructureCost} onChange={handleChange} suffix="MUSD" />
                <FormField label="Öngörülemeyen Oranı" name="contingencyRate" value={form?.contingencyRate} onChange={handleChange} suffix="%" />
              </div>
            </div>
            {/* Amortisman ayarları Finansal sekmesine taşındı */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><TreePine className="h-4 w-4 text-primary" /> Diğer Yatırım Giderleri (MUSD)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Orman İzin" name="forestCost" value={form?.forestCost} onChange={handleChange} suffix="MUSD" icon={TreePine} />
                <FormField label="Kamulaştırma" name="landCost" value={form?.landCost} onChange={handleChange} suffix="MUSD" />
                <FormField label="Rehabilitasyon" name="rehabilitationCost" value={form?.rehabilitationCost} onChange={handleChange} suffix="MUSD" />
              </div>
            </div>
          </div>
        );

      case 4: // OPEX
        return (
          <div className="space-y-6">
            <h4 className="text-sm font-medium mb-1 flex items-center gap-2"><Settings className="h-4 w-4 text-primary" /> Yıllık İşletme Giderleri (MUSD/Yıl)</h4>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground">
                Personel: <strong className="text-foreground">{(totalPersonnelCost / 1_000_000).toFixed(3)} MUSD</strong> | 
                Ekipman yakıt: <strong className="text-foreground">{(totalFuelFromEquip / 1_000_000).toFixed(3)} MUSD</strong> | 
                Ekipman bakım: <strong className="text-foreground">{(totalMaintFromEquip / 1_000_000).toFixed(3)} MUSD</strong>
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField label="Ek Yakıt Giderleri" name="fuelCost" value={form?.fuelCost} onChange={handleChange} suffix="MUSD" icon={Fuel} />
              <FormField label="Ek Bakım-Onarım" name="maintenanceCost" value={form?.maintenanceCost} onChange={handleChange} suffix="MUSD" icon={Wrench} />
              <FormField label="Patlayıcı Madde" name="explosivesCost" value={form?.explosivesCost} onChange={handleChange} suffix="MUSD" icon={Bomb} />
              <FormField label="Lastik Giderleri" name="tireCost" value={form?.tireCost} onChange={handleChange} suffix="MUSD" icon={CircleDot} />
              <FormField label="Diğer OPEX" name="otherOpex" value={form?.otherOpex} onChange={handleChange} suffix="MUSD" />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">Dekapaj ve Tesis</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField label="Dekapaj Hacmi (Yıllık)" name="annualStrippingVolume" value={form?.annualStrippingVolume} onChange={handleChange} suffix="Mm³" />
                <FormField label="Dekapaj Birim Maliyet" name="strippingUnitCost" value={form?.strippingUnitCost} onChange={handleChange} suffix="USD/m³" />
                <FormField label="Yüklenici Dekapaj" name="contractorStrippingCost" value={form?.contractorStrippingCost} onChange={handleChange} suffix="MUSD" />
                <FormField label="Tesis İşletme" name="plantOperatingCost" value={form?.plantOperatingCost} onChange={handleChange} suffix="MUSD" />
              </div>
            </div>
          </div>
        );

      case 5: // Method Specific Costs
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Pickaxe className="h-4 w-4 text-primary" />
                {form?.miningMethod === 'openPit' ? 'Açık Ocak' : 'Yer Altı'} Özel Maliyetler
              </h4>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Toplam: <strong className="text-foreground font-mono">{totalMethodCost.toFixed(3)} MUSD</strong></span>
                <button type="button" onClick={addMethodCost} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90">
                  <Plus className="h-3 w-3" /> Maliyet Ekle
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {methodCosts.map((c: any, i: number) => (
                <div key={i} className="rounded-lg border border-border/50 p-3 bg-card/50 flex items-end gap-3">
                  <div className="space-y-1 flex-1 min-w-[150px]">
                    <label className="text-xs text-muted-foreground">Maliyet Kalemi</label>
                    <input type="text" value={c?.name ?? ''}
                      onChange={(e) => { const next = [...methodCosts]; next[i] = { ...next[i], name: e.target.value }; setMethodCosts(next); }}
                      className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div className="space-y-1 w-36">
                    <label className="text-xs text-muted-foreground">Tutar (MUSD)</label>
                    <input type="number" step="any" value={c?.value ?? ''}
                      onChange={(e) => updateMethodCost(i, parseNumericInput(e.target.value))}
                      className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <button type="button" onClick={() => removeMethodCost(i)} className="text-muted-foreground hover:text-destructive pb-1.5">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 6: // Revenue & Products
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" /> Ana Cevher Geliri
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Birim Satış Fiyatı" name="unitPrice" value={form?.unitPrice} onChange={handleChange} suffix="USD/ton" icon={DollarSign} />
                <FormField label="Yıllık Üretim" name="annualProduction" value={form?.annualProduction} onChange={handleChange} suffix="Mt" />
                <FormField label="Tesiste İşleme Oranı" name="plantProcessingRate" value={form?.plantProcessingRate} onChange={handleChange} suffix="%" />
              </div>
            </div>
            {/* By-products */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Gem className="h-4 w-4 text-primary" /> Yan Ürünler
                </h4>
                <div className="flex items-center gap-3">
                  {byProducts.length > 0 && (
                    <span className="text-xs text-muted-foreground">Yıllık: <strong className="text-foreground font-mono">{totalByProductRevenue.toLocaleString('tr-TR')} USD</strong></span>
                  )}
                  <button type="button" onClick={addByProduct} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90">
                    <Plus className="h-3 w-3" /> Yan Ürün Ekle
                  </button>
                </div>
              </div>
              {byProducts.length === 0 ? (
                <div className="text-center py-6 rounded-lg border border-dashed border-border/50">
                  <Gem className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Henüz yan ürün eklenmedi</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {byProducts.map((bp: any, i: number) => (
                    <div key={i} className="rounded-lg border border-border/50 p-3 bg-card/50 flex flex-wrap items-end gap-3">
                      <div className="space-y-1 flex-1 min-w-[120px]">
                        <label className="text-xs text-muted-foreground">Ürün Adı</label>
                        <input type="text" value={bp?.name ?? ''} onChange={(e) => updateByProduct(i, 'name', e.target.value)}
                          placeholder="Örn: Gümüş"
                          className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                      <div className="space-y-1 w-32">
                        <label className="text-xs text-muted-foreground">Üretim (ton/yıl)</label>
                        <input type="number" step="any" value={bp?.annualProduction ?? ''} onChange={(e) => updateByProduct(i, 'annualProduction', parseNumericInput(e.target.value))}
                          className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                      <div className="space-y-1 w-32">
                        <label className="text-xs text-muted-foreground">Fiyat (USD/ton)</label>
                        <input type="number" step="any" value={bp?.unitPrice ?? ''} onChange={(e) => updateByProduct(i, 'unitPrice', parseNumericInput(e.target.value))}
                          className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                      <div className="text-xs text-muted-foreground pb-1.5">
                        Gelir: <strong className="text-foreground font-mono">{(toNumber(bp?.annualProduction, 0) * toNumber(bp?.unitPrice, 0)).toLocaleString('tr-TR')} USD/yıl</strong>
                      </div>
                      <button type="button" onClick={() => removeByProduct(i)} className="text-muted-foreground hover:text-destructive pb-1.5">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 7: // Financial
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><Calculator className="h-4 w-4 text-primary" /> Vergi & İndirgenme</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="İndirgenme Oranı" name="discountRate" value={form?.discountRate} onChange={handleChange} suffix="%" icon={Calculator} />
                <FormField label="Kurumlar Vergisi" name="taxRate" value={form?.taxRate} onChange={handleChange} suffix="%" />
                <FormField label="Devlet Hakkı" name="royaltyRate" value={form?.royaltyRate} onChange={handleChange} suffix="%" />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> Finansman & Kredi</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Kredi Faiz Oranı" name="creditRate" value={form?.creditRate} onChange={handleChange} suffix="%" icon={CreditCard} />
                <FormField label="Kredi Geri Ödeme Süresi" name="creditYears" value={form?.creditYears} onChange={handleChange} suffix="yıl" />
                <FormField label="Kredi Tutarı" name="loanAmount" value={form?.loanAmount} onChange={handleChange} suffix="MUSD" />
                <FormField label="Kredi Faiz Oranı (Detay)" name="loanInterestRate" value={form?.loanInterestRate} onChange={handleChange} suffix="%" />
                <FormField label="Kredi Vadesi" name="loanTermYears" value={form?.loanTermYears} onChange={handleChange} suffix="yıl" />
                <FormField label="Öz Sermaye Oranı" name="equityRatio" value={form?.equityRatio} onChange={handleChange} suffix="%" />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" /> Amortisman</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{t('form.depMethod')}</label>
                  <select name="depreciationMethod" value={form?.depreciationMethod ?? 'linear'} onChange={handleChange}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="linear">Doğrusal (Eşit Paylar)</option>
                    <option value="declining">{t('form.depDeclining')}</option>
                  </select>
                </div>
                <FormField label="Ekipman Amort. Ömrü" name="equipmentDepLife" value={form?.equipmentDepLife} onChange={handleChange} suffix="yıl" />
                <FormField label="Tesis Amort. Ömrü" name="facilityDepLife" value={form?.facilityDepLife} onChange={handleChange} suffix="yıl" />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><Droplets className="h-4 w-4 text-primary" /> Çevresel Parametreler</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Günlük Su Tüketimi" name="waterConsumptionDaily" value={form?.waterConsumptionDaily} onChange={handleChange} suffix="m³/gün" icon={Droplets} />
                <FormField label="Rehabilitasyon Alanı" name="rehabilitationAreaHa" value={form?.rehabilitationAreaHa} onChange={handleChange} suffix="hektar" />
                <FormField label="Rehabilitasyon Maliyeti" name="rehabilitationCostPerHa" value={form?.rehabilitationCostPerHa} onChange={handleChange} suffix="USD/ha" />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><Mountain className="h-4 w-4 text-primary" /> Konum (Harita İçin)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Enlem (Latitude)" name="latitude" value={form?.latitude} onChange={handleChange} placeholder="39.9334" />
                <FormField label="Boylam (Longitude)" name="longitude" value={form?.longitude} onChange={handleChange} placeholder="32.8597" />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1200px] px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold tracking-tight mb-1">
            {isEditing ? t('form.title.edit') : t('form.title.new')}
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            {isEditing ? t('form.title.edit') : t('form.title.new')}
          </p>
        </motion.div>

        <div className="flex flex-wrap items-center gap-2 mb-8">
          {STEPS.map((s: any, i: number) => {
            const Icon = s?.icon;
            return (
              <button key={s?.id} onClick={() => setStep(i)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all',
                  i === step
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-card text-muted-foreground border border-border/50 hover:bg-accent'
                )}>
                {Icon && <Icon className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{s?.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl bg-card border border-border/50 p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between mt-6">
          <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
            className={cn('flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              step === 0 ? 'text-muted-foreground cursor-not-allowed' : 'bg-card border border-border/50 hover:bg-accent text-foreground'
            )}>
            <ChevronLeft className="h-4 w-4" /> Önceki
          </button>
          <div className="flex gap-2">
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                Sonraki <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isEditing ? 'Güncelle & Hesapla' : 'Oluştur & Hesapla'}
              </button>
            )}
          </div>
        </div>
      </main>

      <Dialog open={catalogOpen} onOpenChange={setCatalogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('equipCat.pickTitle')}</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mb-3">
            <input
              value={catalogQuery}
              onChange={(e) => setCatalogQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void openCatalogPicker();
              }}
              placeholder={t('equipCat.searchPlaceholder')}
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button type="button" variant="secondary" onClick={() => void openCatalogPicker()}>
              {t('equipCat.search')}
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 min-h-[200px] max-h-[50vh] pr-1">
            {catalogLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t('equipCat.loading')}
              </div>
            ) : catalogItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">{t('equipCat.pickEmpty')}</p>
            ) : (
              catalogItems.map((item) => {
                const selected = selectedCatalogId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedCatalogId(item.id)}
                    className={cn(
                      'w-full text-left rounded-lg border px-3 py-2.5 transition-colors',
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-border/50 hover:bg-accent/50'
                    )}
                  >
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">
                          {[item.manufacturer, item.model].filter(Boolean).join(' ')}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {getCategoryLabel(item.category)}
                          {item.capacityLabel ? ` · ${item.capacityLabel}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-mono">
                          {formatEquipmentUsd(item.purchasePriceUsd)} USD
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatSpecNumber(item.fuelConsumptionLph, { digits: 1, suffix: 'lt/sa' })}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setCatalogOpen(false)}>
              {t('equipCat.cancel')}
            </Button>
            <Button
              type="button"
              disabled={!selectedCatalogId}
              onClick={addEquipmentFromCatalog}
            >
              {t('equipCat.pickConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
