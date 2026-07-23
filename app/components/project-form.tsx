'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  composeProjectDefaultsFromMasterData,
  formatEquipmentUsd,
  formatSpecNumber,
  snapshotCatalogToProjectEquipment,
  type CommodityCatalogItemDto,
  type CountryCatalogItemDto,
} from '@/lib/master-data';
import { Header } from './header';
import {
  MINE_TYPES, MINING_METHODS, CURRENCIES, POWER_TYPES, EQUIPMENT_CATEGORIES,
  DEFAULT_EQUIPMENT_OPEN_PIT, DEFAULT_EQUIPMENT_UNDERGROUND,
  DEFAULT_PERSONNEL, OPEN_PIT_COSTS, UNDERGROUND_COSTS,
  getCategoryFields,
} from '@/lib/format';
import { toast } from 'sonner';
import {
  Mountain, DollarSign, Settings, Factory, Fuel, Users, Wrench,
  Bomb, CircleDot, TreePine, CreditCard, Calculator, Loader2,
  ChevronRight, ChevronLeft, Save, Plus, Trash2, Truck, HardHat,
  Pickaxe, Gem, ChevronDown, ChevronUp, Zap, Droplets, BarChart3, Database,
  Globe2, Info,
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LocationSearch } from '@/app/components/location/location-search';
import { formatNormalizedLocation } from '@/lib/location';
import { trackAnalyticsEvent } from '@/lib/analytics';

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
  const { t, locale } = useLanguage();
  const numberLocale = locale === 'en' ? 'en-US' : 'tr-TR';

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
  const masterDefaultsReady = useRef(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [expandedEquip, setExpandedEquip] = useState<number | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogItems, setCatalogItems] = useState<CatalogPickItem[]>([]);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);
  const [commodities, setCommodities] = useState<CommodityCatalogItemDto[]>([]);
  const [countries, setCountries] = useState<CountryCatalogItemDto[]>([]);
  const [masterDataReady, setMasterDataReady] = useState(false);
  const [defaultsBanner, setDefaultsBanner] = useState('');

  const defaults = {
    name: '', mineType: '', miningMethod: 'openPit', location: '',
    countryCode: '',
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

  // Ensure + load Commodity / Country master data for create workflow.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([
          fetch('/api/master-data/commodity/ensure').catch(() => null),
          fetch('/api/master-data/country/ensure').catch(() => null),
        ]);
        const [cRes, yRes] = await Promise.all([
          fetch('/api/master-data/commodity?pageSize=100&isActive=true'),
          fetch('/api/master-data/country?pageSize=100&isActive=true'),
        ]);
        if (cancelled) return;
        if (cRes.ok) {
          const data = (await cRes.json()) as { items?: CommodityCatalogItemDto[] };
          setCommodities(data.items ?? []);
        }
        if (yRes.ok) {
          const data = (await yRes.json()) as { items?: CountryCatalogItemDto[] };
          setCountries(data.items ?? []);
        }
      } catch {
        // Form still works with fallback MINE_TYPES if catalogs unavailable.
      } finally {
        if (!cancelled) setMasterDataReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Apply Commodity + Country defaults into project scalars (create mode only).
  // Tracks last applied codes so we only re-compose when selection changes.
  const lastAppliedMaster = useRef<{ commodity: string; country: string }>({
    commodity: '',
    country: '',
  });

  useEffect(() => {
    if (isEditing || !masterDataReady) return;
    const commodityCode = String(form?.mineType ?? '');
    const countryCode = String(form?.countryCode ?? '');
    if (!commodityCode && !countryCode) {
      setDefaultsBanner('');
      lastAppliedMaster.current = { commodity: '', country: '' };
      return;
    }

    if (
      lastAppliedMaster.current.commodity === commodityCode &&
      lastAppliedMaster.current.country === countryCode
    ) {
      return;
    }
    lastAppliedMaster.current = { commodity: commodityCode, country: countryCode };

    const commodity = commodities.find((c) => c.code === commodityCode) ?? null;
    const country = countries.find((c) => c.code === countryCode) ?? null;
    if (!commodity && !country) return;

    // Preserve explicit mining method once the user has chosen one after first apply.
    const preserveMethod = masterDefaultsReady.current
      ? form?.miningMethod === 'openPit' || form?.miningMethod === 'underground'
        ? String(form.miningMethod)
        : undefined
      : undefined;

    const composed = composeProjectDefaultsFromMasterData(commodity, country, {
      miningMethod: preserveMethod,
      locale: locale === 'en' ? 'en' : 'tr',
    });

    setForm((prev: Record<string, unknown>) => {
      const next: Record<string, unknown> = { ...prev };
      if (composed.mineType) next.mineType = composed.mineType;
      if (composed.countryCode !== undefined) next.countryCode = composed.countryCode;
      if (composed.unitPrice != null) next.unitPrice = composed.unitPrice;
      if (composed.oreGrade != null) next.oreGrade = composed.oreGrade;
      if (composed.oreGradeUnit) next.oreGradeUnit = composed.oreGradeUnit;
      if (composed.productionUnit) next.productionUnit = composed.productionUnit;
      if (composed.projectLifeYears != null) next.projectLifeYears = composed.projectLifeYears;
      if (composed.miningMethod && !preserveMethod) next.miningMethod = composed.miningMethod;
      if (composed.royaltyRate != null) next.royaltyRate = composed.royaltyRate;
      if (composed.taxRate != null) next.taxRate = composed.taxRate;
      if (composed.discountRate != null) next.discountRate = composed.discountRate;
      if (composed.fuelPricePerLiter != null) next.fuelPricePerLiter = composed.fuelPricePerLiter;
      if (composed.electricityUnitPrice != null) {
        next.electricityUnitPrice = composed.electricityUnitPrice;
      }
      if (composed.currency) next.currency = composed.currency;
      if (composed.exchangeRate != null) next.exchangeRate = composed.exchangeRate;
      if (composed.manualExchangeRate != null) {
        next.manualExchangeRate = composed.manualExchangeRate;
      }
      if (composed.rehabilitationCostPerHa != null) {
        next.rehabilitationCostPerHa = composed.rehabilitationCostPerHa;
      }
      if (
        composed.locationHint &&
        (!prev.location || String(prev.location).trim() === '')
      ) {
        next.location = composed.locationHint;
      }
      return next;
    });

    masterDefaultsReady.current = true;
    const parts: string[] = [];
    if (composed.appliedFrom.commodity) parts.push(t('form.defaultsFromCommodity'));
    if (composed.appliedFrom.country) parts.push(t('form.defaultsFromCountry'));
    setDefaultsBanner(parts.join(' · '));
  }, [
    form?.mineType,
    form?.countryCode,
    form?.miningMethod,
    commodities,
    countries,
    isEditing,
    masterDataReady,
    locale,
    t,
  ]);

  const handleChange = (e: any) => {
    const { name, value, type } = e?.target ?? {};
    setForm((prev: any) => ({
      ...(prev ?? {}),
      // Keep empty while editing; coerce to 0 only on submit (see handleSubmit).
      [name ?? '']: type === 'number' ? parseNumericInput(String(value ?? '')) : value,
    }));
  };

  const handleCommodityChange = (code: string) => {
    setForm((prev: Record<string, unknown>) => ({
      ...prev,
      mineType: code,
    }));
  };

  const handleCountryChange = (code: string) => {
    setForm((prev: Record<string, unknown>) => ({
      ...prev,
      countryCode: code,
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
      toast.error(t('form.projectNameRequired'));
      setStep(0);
      return;
    }
    if (!isEditing && !(form?.mineType ?? '').toString().trim()) {
      toast.error(t('form.commodityRequired'));
      setStep(0);
      return;
    }
    if (!isEditing && !(form?.countryCode ?? '').toString().trim()) {
      toast.error(t('form.countryRequired'));
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
        toast.success(isEditing ? t('form.updateSuccess') : t('form.createSuccess'));
        if (!isEditing && data?.id) {
          const { trackCreatedProjectId, setLastOpenedProjectId } = await import('@/lib/demo');
          trackCreatedProjectId(data.id);
          setLastOpenedProjectId(data.id);
          void trackAnalyticsEvent('new_project_created', { projectId: data.id });
        }
        router.push(`/projects/${data?.id ?? ''}`);
      } else {
        toast.error(t('form.saveFailed'));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(t('form.serverError'));
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0: // General — Name → Commodity → Country → Method → engineering defaults
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label={t('form.projectName')}
                name="name"
                value={form?.name}
                onChange={handleChange}
                type="text"
                icon={Mountain}
                placeholder={t('form.projectNamePlaceholder')}
              />
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Gem className="h-3.5 w-3.5" /> {t('form.commodity')}
                </label>
                <select
                  name="mineType"
                  value={form?.mineType ?? ''}
                  onChange={(e) => handleCommodityChange(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="">{t('form.selectCommodity')}</option>
                  {commodities.length > 0
                    ? (
                      <>
                        {form?.mineType &&
                        !commodities.some((c) => c.code === form.mineType) ? (
                          <option value={String(form.mineType)}>
                            {String(form.mineType)}
                          </option>
                        ) : null}
                        {commodities.map((c) => (
                          <option key={c.code} value={c.code}>
                            {locale === 'tr' && c.nameTr ? c.nameTr : c.name}
                            {c.symbol ? ` (${c.symbol})` : ''}
                          </option>
                        ))}
                      </>
                    )
                    : (MINE_TYPES ?? []).map((mt: { value: string; label: string }) => (
                        <option key={mt?.value} value={mt?.value}>{mt?.label}</option>
                      ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Globe2 className="h-3.5 w-3.5" /> {t('form.country')}
                </label>
                <select
                  name="countryCode"
                  value={form?.countryCode ?? ''}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="">{t('form.selectCountry')}</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {locale === 'tr' && c.nameTr ? c.nameTr : c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
              <FormField
                label={t('form.projectLife')}
                name="projectLifeYears"
                value={form?.projectLifeYears}
                onChange={handleChange}
                suffix={t('form.yearsSuffix')}
              />
            </div>

            {defaultsBanner && !isEditing ? (
              <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                <p>
                  <span className="font-medium text-foreground">{t('form.defaultsApplied')}</span>{' '}
                  {defaultsBanner}. {t('form.defaultsOverrideHint')}
                </p>
              </div>
            ) : null}

            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Pickaxe className="h-4 w-4 text-primary" /> {t('form.miningMethod')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MINING_METHODS.map((m: { value: string; label: string }) => (
                  <button key={m.value} type="button"
                    onClick={() => setForm((prev: Record<string, unknown>) => ({ ...prev, miningMethod: m.value }))}
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
                      <p className="font-semibold text-sm">{m.value === 'openPit' ? t('method.openPit') : t('method.underground')}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.value === 'openPit' ? t('form.methodOpenPitHint') : t('form.methodUndergroundHint')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label={t('form.location')}
                name="location"
                value={form?.location}
                onChange={handleChange}
                type="text"
                placeholder={t('form.locationPlaceholder')}
              />
            </div>
            <div className="mt-4">
              <LocationSearch
                onSelect={(result) => {
                  const normalized =
                    formatNormalizedLocation({
                      city: result.city,
                      state: result.state,
                      country: result.country,
                    }) || result.label;
                  setForm((prev: Record<string, unknown>) => ({
                    ...prev,
                    location: normalized,
                    latitude: result.latitude,
                    longitude: result.longitude,
                  }));
                }}
              />
            </div>
            {/* Reserves & Capacity */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" /> {t('form.reserveCapacityTitle')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label={t('form.totalReserve')} name="totalReserves" value={form?.totalReserves} onChange={handleChange} suffix="Mt" icon={Database} />
                <FormField label={t('form.maxAnnualCapacity')} name="maxAnnualCapacity" value={form?.maxAnnualCapacity} onChange={handleChange} suffix={t('fmt.mtPerYear')} />
                <div className="grid grid-cols-2 gap-2">
                  <FormField label={t('form.oreGrade')} name="oreGrade" value={form?.oreGrade} onChange={handleChange} suffix={form?.oreGradeUnit ?? '%'} />
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">{t('form.oreGradeUnit')}</label>
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
                <DollarSign className="h-4 w-4 text-primary" /> {t('form.currencyEnergyTitle')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5" /> {t('form.currency')}
                  </label>
                  <select name="currency" value={form?.currency ?? 'USD'} onChange={handleChange}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {CURRENCIES.map((c: any) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                  </select>
                </div>
                <FormField label={t('form.exchangeRatePerUsd')} name="exchangeRate" value={form?.exchangeRate} onChange={handleChange} suffix={form?.currency !== 'USD' ? form?.currency : 'TRY'} icon={DollarSign} />
                <FormField label={t('form.fuelPriceUsd')} name="fuelPricePerLiter" value={form?.fuelPricePerLiter} onChange={handleChange} suffix={t('fmt.usdPerLt')} icon={Fuel} />
                <FormField label={t('form.electricityPrice')} name="electricityUnitPrice" value={form?.electricityUnitPrice} onChange={handleChange} suffix={t('fmt.usdPerKwh')} icon={Zap} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField label={t('form.explosiveCost')} name="explosiveUnitPrice" value={form?.explosiveUnitPrice} onChange={handleChange} suffix={t('fmt.usdPerKg')} icon={Bomb} />
              </div>
            </div>
          </div>
        );

      case 1: // Equipment (Enhanced)
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" /> {t('form.equipListTitle')}
              </h4>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{t('form.total')}: <strong className="text-foreground font-mono">{(totalEquipmentCost / 1_000_000).toFixed(3)} {t('fmt.musd')}</strong></span>
                <button
                  type="button"
                  onClick={() => void openCatalogPicker()}
                  className="flex items-center gap-1 text-xs bg-card border border-border/50 text-foreground px-3 py-1.5 rounded-lg hover:bg-accent"
                >
                  <Database className="h-3 w-3" /> {t('equipCat.addFromCatalog')}
                </button>
                <button type="button" onClick={addEquipment} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90">
                  <Plus className="h-3 w-3" /> {t('form.addMachine')}
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t('form.equipHint')}</p>
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
                            {t(`eqcat.${eq?.equipmentCategory ?? 'general'}`)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => setExpandedEquip(isExpanded ? null : i)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent">
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            {isExpanded ? t('form.collapse') : t('form.detail')}
                          </button>
                          <button type="button" onClick={() => removeEquipment(i)} className="text-muted-foreground hover:text-destructive p-1">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      {/* Basic fields */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">{t('form.equipCategory')}</label>
                          <select value={eq?.equipmentCategory ?? 'general'}
                            onChange={(e) => updateEquipment(i, 'equipmentCategory', e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                            {EQUIPMENT_CATEGORIES.map((c: any) => (<option key={c.value} value={c.value}>{t(`eqcat.${c.value}`)}</option>))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">{t('form.machineType')}</label>
                          <input type="text" value={eq?.machineType ?? ''} onChange={(e) => updateEquipment(i, 'machineType', e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">{t('form.model')}</label>
                          <input type="text" value={eq?.model ?? ''} onChange={(e) => updateEquipment(i, 'model', e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder={t('form.modelPlaceholder')} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">{t('form.quantity')}</label>
                          <input type="number" value={eq?.quantity ?? ''} onChange={(e) => updateEquipment(i, 'quantity', parseIntegerInput(e.target.value))}
                            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">{t('form.unitCostUsd')}</label>
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
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{t('form.techParams')}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('form.dailyWorkShort')}</label>
                              <div className="relative">
                                <input type="number" step="any" value={eq?.dailyWorkHours ?? ''} onChange={(e) => updateEquipment(i, 'dailyWorkHours', parseNumericInput(e.target.value))}
                                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{t('form.hours')}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('form.operatorNeed')}</label>
                              <input type="number" value={eq?.operatorCount ?? ''} onChange={(e) => updateEquipment(i, 'operatorCount', parseIntegerInput(e.target.value))}
                                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('form.powerType')}</label>
                              <select value={eq?.powerType ?? 'diesel'}
                                onChange={(e) => updateEquipment(i, 'powerType', e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                                {POWER_TYPES.map((p: any) => (<option key={p.value} value={p.value}>{t(`power.${p.value}`)}</option>))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('form.maintPeriodShort')}</label>
                              <div className="relative">
                                <input type="number" value={eq?.maintenancePeriodHours ?? ''} onChange={(e) => updateEquipment(i, 'maintenancePeriodHours', parseIntegerInput(e.target.value))}
                                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{t('form.hours')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('form.hourlyFuelShort')}</label>
                              <div className="relative">
                                <input type="number" step="any" value={eq?.hourlyFuelConsumption ?? ''} onChange={(e) => updateEquipment(i, 'hourlyFuelConsumption', parseNumericInput(e.target.value))}
                                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{t('form.ltPerHour')}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('form.maintenanceCostYear')}</label>
                              <input type="number" step="any" value={eq?.maintenanceCost ?? ''} onChange={(e) => updateEquipment(i, 'maintenanceCost', parseNumericInput(e.target.value))}
                                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('form.spareQty')}</label>
                              <input type="number" value={eq?.spareQuantity ?? ''} onChange={(e) => updateEquipment(i, 'spareQuantity', parseIntegerInput(e.target.value))}
                                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">{t('form.tonnageCapacity')}</label>
                              <input type="text" value={eq?.tonnageCapacity ?? ''} onChange={(e) => updateEquipment(i, 'tonnageCapacity', e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder={t('form.tonnagePlaceholder')} />
                            </div>
                          </div>
                          {/* Category-specific fields */}
                          {catFields.length > 0 && (
                            <>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mt-2">
                                {t(`eqcat.${eq?.equipmentCategory ?? 'general'}`)} {t('form.categorySpecificParams')}
                              </p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {catFields.map((f: any) => (
                                  <div key={f.key} className="space-y-1">
                                    <label className="text-xs text-muted-foreground">{f.label}</label>
                                    <div className="relative">
                                      {f.key === 'gallerySuitability' ? (
                                        <input type="text" value={eq?.[f.key] ?? ''} onChange={(e) => updateEquipment(i, f.key, e.target.value)}
                                          className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder={t('form.galleryPlaceholder')} />
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
                              {t('form.fuelDaily')}: {(toNumber(eq?.hourlyFuelConsumption, 0) * toNumber(eq?.dailyWorkHours, 8) * toNumber(eq?.quantity, 1)).toFixed(0)} lt | 
                              {t('form.fuelMonthly')}: {(toNumber(eq?.hourlyFuelConsumption, 0) * toNumber(eq?.dailyWorkHours, 8) * toNumber(eq?.quantity, 1) * 30).toFixed(0)} lt | 
                              {t('form.fuelAnnualCost')}: {(toNumber(eq?.hourlyFuelConsumption, 0) * toNumber(eq?.dailyWorkHours, 8) * 365 * toNumber(eq?.quantity, 1) * toNumber(form?.fuelPricePerLiter, 0)).toLocaleString(numberLocale, {maximumFractionDigits: 0})} {t('fmt.usd')}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Footer summary */}
                    <div className="px-4 py-2 border-t border-border/20 flex justify-between items-center text-xs text-muted-foreground bg-card/30">
                      <span>{eq?.machineType || t('form.undefined')} • {toNumber(eq?.quantity, 1)} {t('form.units')}</span>
                      <span className="font-mono font-medium text-foreground">{((toNumber(eq?.quantity, 1) + toNumber(eq?.spareQuantity, 0)) * toNumber(eq?.unitCost, 0)).toLocaleString(numberLocale)} {t('fmt.usd')}</span>
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
                <Users className="h-4 w-4 text-primary" /> {t('form.personnelManageTitle')}
              </h4>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{t('form.annualTotal')}: <strong className="text-foreground font-mono">{(totalPersonnelCost / 1_000_000).toFixed(3)} {t('fmt.musd')}</strong></span>
                <button type="button" onClick={addPersonnel} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90">
                  <Plus className="h-3 w-3" /> {t('form.addPosition')}
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {personnels.map((p: any, i: number) => (
                <div key={i} className="rounded-lg border border-border/50 p-3 bg-card/50 flex flex-wrap items-end gap-3">
                  <div className="space-y-1 flex-1 min-w-[150px]">
                    <label className="text-xs text-muted-foreground">{t('form.personnelRoleShort')}</label>
                    <input type="text" value={p?.role ?? ''} onChange={(e) => updatePersonnel(i, 'role', e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div className="space-y-1 w-20">
                    <label className="text-xs text-muted-foreground">{t('form.personnelCountShort')}</label>
                    <input type="number" value={p?.count ?? ''} onChange={(e) => updatePersonnel(i, 'count', parseIntegerInput(e.target.value))}
                      className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div className="space-y-1 w-36">
                    <label className="text-xs text-muted-foreground">{t('form.monthlySalary')}</label>
                    <input type="number" step="any" value={p?.monthlySalary ?? ''} onChange={(e) => updatePersonnel(i, 'monthlySalary', parseNumericInput(e.target.value))}
                      className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div className="text-xs text-muted-foreground pb-1.5">
                    {t('form.annual')}: <strong className="text-foreground font-mono">{(toNumber(p?.count, 1) * toNumber(p?.monthlySalary, 0) * 12).toLocaleString(numberLocale)} {t('fmt.usd')}</strong>
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
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><Factory className="h-4 w-4 text-primary" /> {t('form.capexFixedTitle')}</h4>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                <p className="text-xs text-muted-foreground">{t('form.equipCostAuto')}: <strong className="text-foreground">{(totalEquipmentCost / 1_000_000).toFixed(3)} {t('fmt.musd')}</strong></p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label={t('form.facilityCost')} name="facilityCost" value={form?.facilityCost} onChange={handleChange} suffix={t('fmt.musd')} />
                <FormField label={t('form.infrastructureCapex')} name="infrastructureCost" value={form?.infrastructureCost} onChange={handleChange} suffix={t('fmt.musd')} />
                <FormField label={t('form.contingencyRate')} name="contingencyRate" value={form?.contingencyRate} onChange={handleChange} suffix="%" />
              </div>
            </div>
            {/* Amortisman ayarları Finansal sekmesine taşındı */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><TreePine className="h-4 w-4 text-primary" /> {t('form.otherInvestTitle')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label={t('form.forestCost')} name="forestCost" value={form?.forestCost} onChange={handleChange} suffix={t('fmt.musd')} icon={TreePine} />
                <FormField label={t('form.landCost')} name="landCost" value={form?.landCost} onChange={handleChange} suffix={t('fmt.musd')} />
                <FormField label={t('form.rehabCapex')} name="rehabilitationCost" value={form?.rehabilitationCost} onChange={handleChange} suffix={t('fmt.musd')} />
              </div>
            </div>
          </div>
        );

      case 4: // OPEX
        return (
          <div className="space-y-6">
            <h4 className="text-sm font-medium mb-1 flex items-center gap-2"><Settings className="h-4 w-4 text-primary" /> {t('form.opexAnnualTitle')}</h4>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground">
                {t('form.opexAutoPersonnel')}: <strong className="text-foreground">{(totalPersonnelCost / 1_000_000).toFixed(3)} {t('fmt.musd')}</strong> | 
                {t('form.opexAutoFuel')}: <strong className="text-foreground">{(totalFuelFromEquip / 1_000_000).toFixed(3)} {t('fmt.musd')}</strong> | 
                {t('form.opexAutoMaint')}: <strong className="text-foreground">{(totalMaintFromEquip / 1_000_000).toFixed(3)} {t('fmt.musd')}</strong>
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField label={t('form.fuelCost')} name="fuelCost" value={form?.fuelCost} onChange={handleChange} suffix={t('fmt.musd')} icon={Fuel} />
              <FormField label={t('form.maintenanceCost')} name="maintenanceCost" value={form?.maintenanceCost} onChange={handleChange} suffix={t('fmt.musd')} icon={Wrench} />
              <FormField label={t('form.explosivesCost')} name="explosivesCost" value={form?.explosivesCost} onChange={handleChange} suffix={t('fmt.musd')} icon={Bomb} />
              <FormField label={t('form.tireCost')} name="tireCost" value={form?.tireCost} onChange={handleChange} suffix={t('fmt.musd')} icon={CircleDot} />
              <FormField label={t('form.otherOpex')} name="otherOpex" value={form?.otherOpex} onChange={handleChange} suffix={t('fmt.musd')} />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">{t('form.strippingPlantTitle')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField label={t('form.annualStrippingVolume')} name="annualStrippingVolume" value={form?.annualStrippingVolume} onChange={handleChange} suffix={t('fmt.mm3')} />
                <FormField label={t('form.strippingUnitCost')} name="strippingUnitCost" value={form?.strippingUnitCost} onChange={handleChange} suffix={t('fmt.usdPerM3')} />
                <FormField label={t('form.contractorStrippingCost')} name="contractorStrippingCost" value={form?.contractorStrippingCost} onChange={handleChange} suffix={t('fmt.musd')} />
                <FormField label={t('form.plantOperatingCost')} name="plantOperatingCost" value={form?.plantOperatingCost} onChange={handleChange} suffix={t('fmt.musd')} />
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
                {form?.miningMethod === 'openPit' ? t('method.openPit') : t('method.underground')} {t('form.methodSpecificCosts')}
              </h4>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{t('form.total')}: <strong className="text-foreground font-mono">{totalMethodCost.toFixed(3)} {t('fmt.musd')}</strong></span>
                <button type="button" onClick={addMethodCost} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90">
                  <Plus className="h-3 w-3" /> {t('form.addMethodCost')}
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {methodCosts.map((c: any, i: number) => (
                <div key={i} className="rounded-lg border border-border/50 p-3 bg-card/50 flex items-end gap-3">
                  <div className="space-y-1 flex-1 min-w-[150px]">
                    <label className="text-xs text-muted-foreground">{t('form.costItemName')}</label>
                    <input type="text" value={c?.name ?? ''}
                      onChange={(e) => { const next = [...methodCosts]; next[i] = { ...next[i], name: e.target.value }; setMethodCosts(next); }}
                      className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div className="space-y-1 w-36">
                    <label className="text-xs text-muted-foreground">{t('form.amountMusd')}</label>
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
                <DollarSign className="h-4 w-4 text-primary" /> {t('form.mainOreRevenue')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label={t('form.unitSalePrice')} name="unitPrice" value={form?.unitPrice} onChange={handleChange} suffix={t('fmt.usdPerTon')} icon={DollarSign} />
                <FormField label={t('form.annualProduction')} name="annualProduction" value={form?.annualProduction} onChange={handleChange} suffix="Mt" />
                <FormField label={t('form.plantProcessingRate')} name="plantProcessingRate" value={form?.plantProcessingRate} onChange={handleChange} suffix="%" />
              </div>
            </div>
            {/* By-products */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Gem className="h-4 w-4 text-primary" /> {t('form.byProductsTitle')}
                </h4>
                <div className="flex items-center gap-3">
                  {byProducts.length > 0 && (
                    <span className="text-xs text-muted-foreground">{t('form.annual')}: <strong className="text-foreground font-mono">{totalByProductRevenue.toLocaleString(numberLocale)} {t('fmt.usd')}</strong></span>
                  )}
                  <button type="button" onClick={addByProduct} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90">
                    <Plus className="h-3 w-3" /> {t('form.addByProduct')}
                  </button>
                </div>
              </div>
              {byProducts.length === 0 ? (
                <div className="text-center py-6 rounded-lg border border-dashed border-border/50">
                  <Gem className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">{t('form.byProductEmpty')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {byProducts.map((bp: any, i: number) => (
                    <div key={i} className="rounded-lg border border-border/50 p-3 bg-card/50 flex flex-wrap items-end gap-3">
                      <div className="space-y-1 flex-1 min-w-[120px]">
                        <label className="text-xs text-muted-foreground">{t('form.byProductName')}</label>
                        <input type="text" value={bp?.name ?? ''} onChange={(e) => updateByProduct(i, 'name', e.target.value)}
                          placeholder={t('form.byProductNamePlaceholder')}
                          className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                      <div className="space-y-1 w-32">
                        <label className="text-xs text-muted-foreground">{t('form.byProductProduction')}</label>
                        <input type="number" step="any" value={bp?.annualProduction ?? ''} onChange={(e) => updateByProduct(i, 'annualProduction', parseNumericInput(e.target.value))}
                          className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                      <div className="space-y-1 w-32">
                        <label className="text-xs text-muted-foreground">{t('form.byProductPrice')}</label>
                        <input type="number" step="any" value={bp?.unitPrice ?? ''} onChange={(e) => updateByProduct(i, 'unitPrice', parseNumericInput(e.target.value))}
                          className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                      <div className="text-xs text-muted-foreground pb-1.5">
                        {t('form.revenue')}: <strong className="text-foreground font-mono">{(toNumber(bp?.annualProduction, 0) * toNumber(bp?.unitPrice, 0)).toLocaleString(numberLocale)} {t('fmt.usdPerYear')}</strong>
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
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><Calculator className="h-4 w-4 text-primary" /> {t('form.taxDiscountTitle')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label={t('form.discountRate')} name="discountRate" value={form?.discountRate} onChange={handleChange} suffix="%" icon={Calculator} />
                <FormField label={t('form.corporateTax')} name="taxRate" value={form?.taxRate} onChange={handleChange} suffix="%" />
                <FormField label={t('form.stateRoyalty')} name="royaltyRate" value={form?.royaltyRate} onChange={handleChange} suffix="%" />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> {t('form.financingTitle')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label={t('form.creditRate')} name="creditRate" value={form?.creditRate} onChange={handleChange} suffix="%" icon={CreditCard} />
                <FormField label={t('form.creditYears')} name="creditYears" value={form?.creditYears} onChange={handleChange} suffix={t('form.yearsSuffix')} />
                <FormField label={t('form.loanAmount')} name="loanAmount" value={form?.loanAmount} onChange={handleChange} suffix={t('fmt.musd')} />
                <FormField label={t('form.loanInterestDetail')} name="loanInterestRate" value={form?.loanInterestRate} onChange={handleChange} suffix="%" />
                <FormField label={t('form.loanTerm')} name="loanTermYears" value={form?.loanTermYears} onChange={handleChange} suffix={t('form.yearsSuffix')} />
                <FormField label={t('form.equityRatio')} name="equityRatio" value={form?.equityRatio} onChange={handleChange} suffix="%" />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" /> {t('form.depTitle')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{t('form.depMethod')}</label>
                  <select name="depreciationMethod" value={form?.depreciationMethod ?? 'linear'} onChange={handleChange}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="linear">{t('form.depLinearFull')}</option>
                    <option value="declining">{t('form.depDeclining')}</option>
                  </select>
                </div>
                <FormField label={t('form.equipDepLifeShort')} name="equipmentDepLife" value={form?.equipmentDepLife} onChange={handleChange} suffix={t('form.yearsSuffix')} />
                <FormField label={t('form.facilityDepLifeShort')} name="facilityDepLife" value={form?.facilityDepLife} onChange={handleChange} suffix={t('form.yearsSuffix')} />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><Droplets className="h-4 w-4 text-primary" /> {t('form.envTitle')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label={t('form.waterConsumption')} name="waterConsumptionDaily" value={form?.waterConsumptionDaily} onChange={handleChange} suffix={t('fmt.m3PerDay')} icon={Droplets} />
                <FormField label={t('form.rehabArea')} name="rehabilitationAreaHa" value={form?.rehabilitationAreaHa} onChange={handleChange} suffix={t('fmt.hectare')} />
                <FormField label={t('form.rehabCostPerHa')} name="rehabilitationCostPerHa" value={form?.rehabilitationCostPerHa} onChange={handleChange} suffix={t('fmt.usdPerHa')} />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><Mountain className="h-4 w-4 text-primary" /> {t('form.locationMapTitle')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField label={t('form.latitude')} name="latitude" value={form?.latitude} onChange={handleChange} placeholder="39.9334" />
                <FormField label={t('form.longitude')} name="longitude" value={form?.longitude} onChange={handleChange} placeholder="32.8597" />
              </div>
              <LocationSearch
                onSelect={(result) => {
                  const normalized =
                    formatNormalizedLocation({
                      city: result.city,
                      state: result.state,
                      country: result.country,
                    }) || result.label;
                  setForm((prev: Record<string, unknown>) => ({
                    ...prev,
                    location: normalized,
                    latitude: result.latitude,
                    longitude: result.longitude,
                  }));
                }}
              />
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
            <ChevronLeft className="h-4 w-4" /> {t('form.previous')}
          </button>
          <div className="flex gap-2">
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                {t('form.next')} <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isEditing ? t('form.submitUpdate') : t('form.submitCreate')}
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
                          {t(`eqcat.${item.category || 'general'}`)}
                          {item.capacityLabel ? ` · ${item.capacityLabel}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-mono">
                          {formatEquipmentUsd(item.purchasePriceUsd)} {t('fmt.usd')}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatSpecNumber(item.fuelConsumptionLph, { digits: 1, suffix: t('form.ltPerHour') })}
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
