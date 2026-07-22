'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/app/components/header';
import { KPICard } from '@/app/components/kpi-card';
import { CashFlowChart } from '@/app/components/charts/cash-flow-chart';
import { SensitivityChart } from '@/app/components/charts/sensitivity-chart';
import { CostPieChart } from '@/app/components/charts/cost-pie-chart';
import { RevenueCostChart } from '@/app/components/charts/revenue-cost-chart';
import { ProjectMap } from '@/app/components/charts/project-map';
import { TornadoChart } from '@/app/components/charts/tornado-chart';
import { CostWaterfallChart } from '@/app/components/charts/cost-waterfall-chart';
import { NpvBuildupChart } from '@/app/components/charts/npv-buildup-chart';
import { ProductionProfileChart } from '@/app/components/charts/production-profile-chart';
import { BreakevenChart } from '@/app/components/charts/breakeven-chart';
import { SpiderSensitivityChart } from '@/app/components/charts/spider-sensitivity-chart';
import { TwoWayHeatmap } from '@/app/components/charts/two-way-heatmap';
import { ElasticityBarChart } from '@/app/components/charts/elasticity-bar-chart';
import { AIAnalysisPanel } from '@/app/components/ai-analysis-panel';
import { formatMUSD, formatPercent, formatYear, formatNumber } from '@/lib/format';
import { useLanguage } from '@/lib/i18n/context';
import { DemoBadge } from '@/components/demo/DemoBadge';
import { isDemoProjectId, setLastOpenedProjectId } from '@/lib/demo';
import { trackAnalyticsEvent } from '@/lib/analytics';
import {
  DollarSign, TrendingUp, Clock, Target, Loader2, Edit, ArrowLeft,
  Mountain, BarChart3, PieChart, LineChart, Table as TableIcon, FileDown,
  Truck, Users, Gem, Pickaxe, Fuel, Wrench, Activity, Layers, Gauge,
  Calendar, Database, Leaf, ShieldAlert, CreditCard, MapPin, Dice5, Droplets,
  TreePine, AlertTriangle, FileText, ArrowDown, BarChart2, Crosshair, Brain, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart as RLineChart, Line, Legend, Cell,
} from 'recharts';

export function ProjectDetailClient({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<any>(null);
  const [sensitivity, setSensitivity] = useState<any>(null);
  const [operational, setOperational] = useState<any>(null);
  const [envData, setEnvData] = useState<any>(null);
  const [finData, setFinData] = useState<any>(null);
  const [mcData, setMcData] = useState<any>(null);
  const [tornadoData, setTornadoData] = useState<any>(null);
  const [econSens, setEconSens] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [sensParam, setSensParam] = useState('price');
  const [mcLoading, setMcLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showLoanInflow, setShowLoanInflow] = useState(false);
  const [editingContractor, setEditingContractor] = useState(false);
  const [contractorValue, setContractorValue] = useState('');
  const [contractorSaving, setContractorSaving] = useState(false);
  const [equipRenewalEnabled, setEquipRenewalEnabled] = useState(true);
  const [equipRenewalCycle, setEquipRenewalCycle] = useState(10);
  const [renewalSaving, setRenewalSaving] = useState(false);

  useEffect(() => {
    if (projectId) setLastOpenedProjectId(projectId);
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    void trackAnalyticsEvent('project_opened', { projectId });
    void trackAnalyticsEvent('report_viewed', { projectId });
    if (isDemoProjectId(projectId)) {
      void trackAnalyticsEvent('demo_project_opened', { projectId });
    }
  }, [projectId]);

  useEffect(() => {
    if (sensitivity) {
      void trackAnalyticsEvent('sensitivity_executed', { projectId });
    }
  }, [sensitivity, projectId]);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      // 1) Önce projeyi yükle → sayfa hemen görüntülenir
      try {
        const pRes = await fetch(`/api/projects/${projectId}`);
        if (!cancelled && pRes?.ok) setProject(await pRes?.json());
      } catch (err: any) { console.error(err); }
      finally { if (!cancelled) setLoading(false); }

      // 2) Analizleri arka planda aşamalı olarak yükle (her biri hazır olduğunda görünür)
      const load = (path: string, setter: (d: any) => void) =>
        fetch(`/api/projects/${projectId}/${path}`)
          .then((r) => (r?.ok ? r.json() : null))
          .then((d) => { if (d && !cancelled) setter(d); })
          .catch((err) => console.error(err));
      load('sensitivity', setSensitivity);
      load('operational', setOperational);
      load('environmental', setEnvData);
      load('financing', setFinData);
      load('tornado', setTornadoData);
      load('economic-sensitivity', setEconSens);
    };
    if (projectId) fetchData();
    return () => { cancelled = true; };
  }, [projectId]);

  useEffect(() => {
    if (project) {
      setEquipRenewalEnabled(project?.equipmentRenewalEnabled ?? true);
      setEquipRenewalCycle(project?.equipmentRenewalCycleYears ?? 10);
    }
  }, [project]);

  const saveRenewalSettings = async (enabled: boolean, cycle: number) => {
    setRenewalSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...project, equipmentRenewalEnabled: enabled, equipmentRenewalCycleYears: cycle }),
      });
      if (res?.ok) {
        const updated = await res?.json();
        setProject(updated);
      }
    } catch (err: any) { console.error(err); }
    finally { setRenewalSaving(false); }
  };

  const runMonteCarlo = async () => {
    setMcLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/montecarlo`);
      if (res?.ok) {
        setMcData(await res?.json());
        void trackAnalyticsEvent('monte_carlo_executed', { projectId });
      }
    } catch (err: any) { console.error(err); }
    finally { setMcLoading(false); }
  };

  const saveContractorCost = async () => {
    const newVal = parseFloat(contractorValue);
    if (isNaN(newVal) || newVal < 0) return;
    setContractorSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...project, contractorStrippingCost: newVal }),
      });
      if (res?.ok) {
        const updated = await res?.json();
        setProject(updated);
        setEditingContractor(false);
      }
    } catch (err: any) { console.error(err); }
    finally { setContractorSaving(false); }
  };

  const { t } = useLanguage();
  const getMineTypeLabel = (v: string) => t(`mine.${v}`) !== `mine.${v}` ? t(`mine.${v}`) : (v ?? t('fmt.unknown'));
  const getMiningMethodLabel = (v: string) => t(`method.${v}`) !== `method.${v}` ? t(`method.${v}`) : (v ?? t('fmt.unknown'));
  const getCategoryLabel = (v: string) => t(`eqcat.${v}`) !== `eqcat.${v}` ? t(`eqcat.${v}`) : (v ?? t('eqcat.general'));

  if (loading) return (
    <div className="min-h-screen bg-background"><Header />
      <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </div>
  );
  if (!project) return (
    <div className="min-h-screen bg-background"><Header />
      <div className="flex flex-col items-center justify-center py-32">
        <Mountain className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="font-display text-lg font-semibold">{t('detail.notFound')}</h2>
        <Link href="/" className="mt-4 text-sm text-primary hover:underline">{t('detail.backToDash')}</Link>
      </div>
    </div>
  );

  const p = project ?? {};
  const cfs = p?.cashFlows ?? [];
  const isPositive = (p?.npv ?? 0) >= 0;

  // Apply loan inflow toggle to cash flows
  const loanAmount = p?.loanAmount ?? 0;
  const adjustedCfs = (showLoanInflow && loanAmount > 0)
    ? (cfs ?? []).map((cf: any, i: number) => {
        if (i === 0) {
          const newNet = (cf?.netCashFlow ?? 0) + loanAmount;
          return { ...cf, netCashFlow: newNet, cumulativeCashFlow: newNet };
        }
        let cumSum = 0;
        for (let j = 0; j <= i; j++) {
          if (j === 0) cumSum = ((cfs[0]?.netCashFlow ?? 0) + loanAmount);
          else cumSum += (cfs[j]?.netCashFlow ?? 0);
        }
        return { ...cf, cumulativeCashFlow: cumSum };
      })
    : cfs;
  const m = operational?.metrics ?? {};
  const fuelData = operational?.fuelAnalysis ?? [];
  const maintData = operational?.maintenanceAnalysis ?? [];
  const persData = operational?.personnelProductivity ?? [];
  const scenarios = operational?.scenarios ?? [];
  const carbon = envData?.carbon ?? {};
  const water = envData?.water ?? {};
  const rehab = envData?.rehabilitation ?? {};
  const risks = envData?.risks ?? [];
  const fin = finData?.financing ?? {};
  const depTable = finData?.depreciation ?? [];
  const phases = finData?.phases ?? [];
  const mc = mcData;

  const capexData = [
    { name: t('form.step.equipment'), value: p?.equipmentCost ?? 0 },
    { name: t('form.processingCapex').split(' (')[0], value: p?.facilityCost ?? 0 },
    { name: t('form.infrastructureCapex').split(' (')[0], value: p?.infrastructureCost ?? 0 },
    { name: 'Orman/Arazi', value: (p?.forestCost ?? 0) + (p?.landCost ?? 0) },
    { name: t('env.totalRehab').split(' ')[0], value: p?.rehabilitationCost ?? 0 },
  ];
  const opexData = [
    { name: t('fuel.title').split(' ')[0], value: p?.fuelCost ?? 0 },
    { name: t('equip.personnelTitle'), value: p?.personnelCost ?? 0 },
    { name: t('fuel.mainTitle').split(' ')[0], value: p?.maintenanceCost ?? 0 },
    { name: t('form.explosiveCost').split(' (')[0], value: p?.explosivesCost ?? 0 },
    { name: 'Lastik', value: p?.tireCost ?? 0 },
    { name: t('mine.other'), value: p?.otherOpex ?? 0 },
  ];

  const TABS = [
    { id: 'overview', label: t('tab.overview'), icon: BarChart3 },
    { id: 'operational', label: t('tab.operational'), icon: Activity },
    { id: 'fuel', label: t('tab.fuel'), icon: Fuel },
    { id: 'scenarios', label: t('tab.scenarios'), icon: Layers },
    { id: 'environmental', label: t('tab.environmental'), icon: Leaf },
    { id: 'risk', label: t('tab.risk'), icon: ShieldAlert },
    { id: 'financing', label: t('tab.financing'), icon: CreditCard },
    { id: 'planning', label: t('tab.planning'), icon: MapPin },
    { id: 'cashflow', label: t('tab.cashflow'), icon: LineChart },
    { id: 'costs', label: t('tab.costs'), icon: PieChart },
    { id: 'details', label: t('tab.details'), icon: Truck },
    { id: 'advanced', label: t('tab.advanced'), icon: BarChart2 },
    { id: 'sensitivity', label: t('tab.sensitivity'), icon: TrendingUp },
    { id: 'ai', label: t('tab.ai'), icon: Brain },
    { id: 'table', label: t('tab.table'), icon: TableIcon },
  ];

  const SENS_PARAMS = [
    { key: 'price', label: t('sens.price') }, { key: 'capex', label: t('sens.capex') },
    { key: 'opex', label: t('sens.opex') }, { key: 'discountRate', label: t('sens.discountRate') },
    { key: 'oreGrade', label: t('sens.oreGrade') }, { key: 'exchangeRate', label: t('sens.exchangeRate') },
    { key: 'fuelPrice', label: t('sens.fuelPrice') },
  ];

  const RISK_COLORS: Record<string, string> = {
    critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-green-500',
  };
  const RISK_LABELS: Record<string, string> = {
    critical: t('risk.veryHigh'), high: t('risk.high'), medium: t('risk.medium'), low: t('risk.low'),
  };

  const handleExportCSV = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/export`);
      if (res?.ok) {
        const blob = await res?.blob();
        const url = window?.URL?.createObjectURL?.(blob);
        const a = document?.createElement?.('a');
        if (a) { a.href = url ?? ''; a.download = `${p?.name ?? 'proje'}_analiz.csv`; a.click?.(); window?.URL?.revokeObjectURL?.(url ?? ''); }
      }
    } catch (err: any) { console.error(err); }
  };

  const handleExportXLSX = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/xlsx`);
      if (res?.ok) {
        const blob = await res?.blob();
        const url = window?.URL?.createObjectURL?.(blob);
        const a = document?.createElement?.('a');
        if (a) { a.href = url ?? ''; a.download = `${p?.name ?? 'proje'}_analiz.xlsx`; a.click?.(); window?.URL?.revokeObjectURL?.(url ?? ''); }
        void trackAnalyticsEvent('excel_exported', { projectId });
      }
    } catch (err: any) { console.error(err); }
  };

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/pdf`);
      if (res?.ok) {
        const blob = await res?.blob();
        const url = window?.URL?.createObjectURL?.(blob);
        const a = document?.createElement?.('a');
        if (a) { a.href = url ?? ''; a.download = `${p?.name ?? 'proje'}_fizibilite_raporu.pdf`; a.click?.(); window?.URL?.revokeObjectURL?.(url ?? ''); }
        void trackAnalyticsEvent('pdf_generated', { projectId });
      }
    } catch (err: any) { console.error(err); }
    finally { setPdfLoading(false); }
  };

  const MetricCard = ({ icon: Icon, label, value, suffix, color }: any) => (
    <div className="rounded-lg bg-card border border-border/50 p-4" style={{ boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn('h-4 w-4', color ?? 'text-primary')} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-bold font-mono">{value}{suffix && <span className="text-xs text-muted-foreground ml-1">{suffix}</span>}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1200px] px-4 py-8">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="h-3 w-3" /> Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500')}>
                <Mountain className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-2xl font-bold tracking-tight">{p?.name ?? t('card.project')}</h1>
                  {isDemoProjectId(projectId) ? <DemoBadge /> : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {getMineTypeLabel(p?.mineType)} • {getMiningMethodLabel(p?.miningMethod)} {p?.location ? `• ${p.location}` : ''} • {p?.projectLifeYears ?? 30} {t('fmt.years')}
                  {(p?.oreGrade ?? 0) > 0 && ` • Tenör: ${p.oreGrade}${p?.oreGradeUnit ?? '%'}`}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleExportCSV} className="flex items-center gap-2 rounded-lg bg-card border border-border/50 px-3 py-2 text-xs font-medium hover:bg-accent transition-colors">
              <FileDown className="h-3.5 w-3.5" /> {t('detail.csvExport')}
            </button>
            <button onClick={handleExportXLSX} className="flex items-center gap-2 rounded-lg bg-card border border-border/50 px-3 py-2 text-xs font-medium hover:bg-accent transition-colors">
              <FileDown className="h-3.5 w-3.5" /> {t('detail.xlsxExport')}
            </button>
            <button onClick={handleExportPDF} disabled={pdfLoading} className="flex items-center gap-2 rounded-lg bg-card border border-border/50 px-3 py-2 text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50">
              {pdfLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />} {t('detail.pdfReport')}
            </button>
            <Link href={`/projects/${projectId}/edit`} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              <Edit className="h-3.5 w-3.5" /> {t('detail.edit')}
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <KPICard title="NPV" value={p?.npv ?? 0} format={(v: number) => formatMUSD(v)} icon={DollarSign} color={isPositive ? 'text-emerald-500' : 'text-red-500'} description={t('kpi.npv')} />
          <KPICard title="IRR" value={p?.irr ?? 0} format={(v: number) => formatPercent(v)} icon={TrendingUp} color="text-amber-500" description={t('kpi.irr')} />
          <KPICard title={t('kpi.payback')} value={p?.paybackPeriod ?? 0} format={(v: number) => formatYear(v)} icon={Clock} color="text-blue-500" description={t('kpi.payback')} />
          <KPICard title={t('kpi.breakeven')} value={p?.breakevenPrice ?? 0} format={(v: number) => `${v?.toFixed?.(2) ?? '0'} USD/t`} icon={Target} color="text-purple-500" description={t('kpi.breakeven')} />
          <KPICard title={t('op.unitCost')} value={m?.unitProductionCost ?? 0} format={(v: number) => `${v?.toFixed?.(2) ?? '0'} USD/t`} icon={Gauge} color="text-cyan-500" description="OPEX/ton" />
          <KPICard title={t('op.reserveLife')} value={m?.reserveLife ?? 0} format={(v: number) => v > 0 ? formatYear(v) : 'N/A'} icon={Database} color="text-orange-500" description={t('op.reserveLife')} />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1 mb-6 p-1 rounded-lg bg-muted/50 overflow-x-auto">
          {TABS.map((tab: any) => {
            const Icon = tab?.icon;
            return (
              <button key={tab?.id} onClick={() => setActiveTab(tab?.id ?? 'overview')}
                className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap',
                  activeTab === tab?.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}>
                {Icon && <Icon className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{tab?.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                <h3 className="font-display text-sm font-semibold mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Nakit Akış Grafiği</h3>
                <CashFlowChart data={cfs} />
              </div>
              <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                <h3 className="font-display text-sm font-semibold mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Gelir vs Maliyet</h3>
                <RevenueCostChart data={cfs} />
              </div>
              <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                <CostPieChart data={capexData} title="CAPEX Dağılımı" />
              </div>
              <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                <CostPieChart data={opexData} title="OPEX Dağılımı" />
              </div>
            </div>
          )}

          {activeTab === 'operational' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <MetricCard icon={Gauge} label={t('op.unitCost')} value={formatNumber(m?.unitProductionCost ?? 0)} suffix="USD/ton" color="text-cyan-500" />
                <MetricCard icon={DollarSign} label="Ton Başına Maliyet (CAPEX dahil)" value={formatNumber(m?.costPerTonIncCapex ?? 0)} suffix="USD/ton" color="text-purple-500" />
                <MetricCard icon={Database} label={t('op.reserveLife')} value={(m?.reserveLife ?? 0) > 0 ? formatNumber(m.reserveLife, 1) : 'N/A'} suffix={(m?.reserveLife ?? 0) > 0 ? 'yıl' : ''} color="text-orange-500" />
                <MetricCard icon={Gauge} label={t('op.capacityUtil')} value={(m?.capacityUtilization ?? 0) > 0 ? formatNumber(m.capacityUtilization, 1) : 'N/A'} suffix={(m?.capacityUtilization ?? 0) > 0 ? '%' : ''} color="text-emerald-500" />
                <MetricCard icon={Users} label={t('op.personnelProductivity')} value={formatNumber(m?.personnelProductivity ?? 0, 0)} suffix="ton/kişi/yıl" color="text-blue-500" />
                <MetricCard icon={Activity} label={t('op.dailyProduction')} value={formatNumber(m?.productionPerDay ?? 0, 0)} suffix="ton/gün" color="text-amber-500" />
                <MetricCard icon={TrendingUp} label={t('op.annualProfit')} value={formatNumber(m?.annualProfit ?? 0)} suffix="MUSD" color={(m?.annualProfit ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'} />
                <MetricCard icon={Calendar} label={t('op.monthlyProfit')} value={formatNumber(m?.monthlyProfit ?? 0, 3)} suffix="MUSD" color={(m?.monthlyProfit ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'} />
              </div>
              <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                <h3 className="font-display text-sm font-semibold mb-4 flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Aylık Kâr-Zarar Özeti</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <p className="text-xs text-muted-foreground mb-1">{t('op.monthlyRevenue')}</p>
                    <p className="text-lg font-bold font-mono text-emerald-500">{formatNumber(m?.monthlyRevenue ?? 0, 3)} MUSD</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                    <p className="text-xs text-muted-foreground mb-1">{t('op.annualCost')}</p>
                    <p className="text-lg font-bold font-mono text-red-500">{formatNumber(m?.monthlyCost ?? 0, 3)} MUSD</p>
                  </div>
                  <div className={cn('text-center p-4 rounded-lg border', (m?.monthlyProfit ?? 0) >= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20')}>
                    <p className="text-xs text-muted-foreground mb-1">Aylık Kâr</p>
                    <p className={cn('text-lg font-bold font-mono', (m?.monthlyProfit ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500')}>{formatNumber(m?.monthlyProfit ?? 0, 3)} MUSD</p>
                  </div>
                </div>
              </div>
              {persData.length > 0 && (
                <div className="rounded-xl bg-card border border-border/50 overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
                  <div className="p-5"><h3 className="font-display text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Personel Verimlilik Analizi</h3></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">{t('op.role')}</th>
                        <th className="px-3 py-2 text-right font-medium">{t('op.count')}</th>
                        <th className="px-3 py-2 text-right font-medium">{t('op.annualCostCol')}</th>
                        <th className="px-3 py-2 text-right font-medium">Verimlilik (ton/kişi)</th>
                        <th className="px-3 py-2 text-right font-medium">Maliyet/Ton</th>
                      </tr></thead>
                      <tbody>{persData.map((pp: any, i: number) => (
                        <tr key={i} className={cn('border-t border-border/20', i % 2 === 0 ? '' : 'bg-muted/20')}>
                          <td className="px-3 py-1.5 font-medium">{pp?.role}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{pp?.count}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{(pp?.annualCost ?? 0).toLocaleString('tr-TR')} USD</td>
                          <td className="px-3 py-1.5 text-right font-mono">{formatNumber(pp?.productivityTonsPerPerson ?? 0, 0)}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{formatNumber(pp?.costPerTonProduced ?? 0, 4)} USD</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'fuel' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard icon={Fuel} label="Toplam Yıllık Yakıt Maliyeti" value={(m?.totalFuelCostAnnual ?? 0) > 0 ? formatNumber(m.totalFuelCostAnnual, 0) : 'N/A'} suffix="USD" color="text-amber-500" />
                <MetricCard icon={Wrench} label="Toplam Bakım Maliyeti" value={formatNumber(m?.totalMaintenanceCostAnnual ?? 0, 0)} suffix="USD/yıl" color="text-red-500" />
                <MetricCard icon={Fuel} label="Yakıt Birim Fiyatı" value={(p?.fuelPricePerLiter ?? 0) > 0 ? formatNumber(p.fuelPricePerLiter) : 'Girilmedi'} suffix={(p?.fuelPricePerLiter ?? 0) > 0 ? 'USD/lt' : ''} color="text-orange-500" />
                <MetricCard icon={Gauge} label="Elektrik Birim Fiyatı" value={(p?.electricityUnitPrice ?? 0) > 0 ? formatNumber(p.electricityUnitPrice, 4) : 'Girilmedi'} suffix={(p?.electricityUnitPrice ?? 0) > 0 ? 'USD/kWh' : ''} color="text-blue-500" />
              </div>
              {fuelData.length > 0 ? (
                <div className="rounded-xl bg-card border border-border/50 overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
                  <div className="p-5"><h3 className="font-display text-sm font-semibold flex items-center gap-2"><Fuel className="h-4 w-4 text-primary" /> Ekipman Bazlı Yakıt Tüketim Analizi</h3></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">{t('fuel.equipment')}</th><th className="px-3 py-2 text-right font-medium">{t('equip.qty')}</th>
                        <th className="px-3 py-2 text-right font-medium">lt/saat</th><th className="px-3 py-2 text-right font-medium">Saat/Gün</th>
                        <th className="px-3 py-2 text-right font-medium">Günlük (lt)</th><th className="px-3 py-2 text-right font-medium">Yıllık (lt)</th>
                        <th className="px-3 py-2 text-right font-medium">{t('op.annualCostCol')}</th>
                      </tr></thead>
                      <tbody>
                        {fuelData.map((f: any, i: number) => (
                          <tr key={i} className={cn('border-t border-border/20', i % 2 === 0 ? '' : 'bg-muted/20')}>
                            <td className="px-3 py-1.5 font-medium">{f?.equipmentName}</td>
                            <td className="px-3 py-1.5 text-right font-mono">{f?.quantity}</td>
                            <td className="px-3 py-1.5 text-right font-mono">{formatNumber(f?.hourlyConsumption ?? 0, 1)}</td>
                            <td className="px-3 py-1.5 text-right font-mono">{formatNumber(f?.dailyHours ?? 0, 1)}</td>
                            <td className="px-3 py-1.5 text-right font-mono">{formatNumber(f?.dailyConsumption ?? 0, 0)}</td>
                            <td className="px-3 py-1.5 text-right font-mono">{formatNumber(f?.annualConsumption ?? 0, 0)}</td>
                            <td className="px-3 py-1.5 text-right font-mono font-medium">{(f?.annualCost ?? 0).toLocaleString('tr-TR', {maximumFractionDigits: 0})} USD</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 rounded-xl bg-card border border-border/50">
                  <Fuel className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Ekipman yakıt tüketimi verisi bulunamadı.</p>
                </div>
              )}
              {maintData.length > 0 && (
                <div className="rounded-xl bg-card border border-border/50 overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
                  <div className="p-5"><h3 className="font-display text-sm font-semibold flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" /> Bakım-Onarım Maliyet Analizi</h3></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">{t('equip.name')}</th><th className="px-3 py-2 text-right font-medium">{t('equip.qty')}</th>
                        <th className="px-3 py-2 text-right font-medium">Bakım Periyodu (sa)</th>
                        <th className="px-3 py-2 text-right font-medium">{t('op.annualCostCol')}</th><th className="px-3 py-2 text-right font-medium">Maliyet/Saat</th>
                      </tr></thead>
                      <tbody>{maintData.map((mt: any, i: number) => (
                        <tr key={i} className={cn('border-t border-border/20', i % 2 === 0 ? '' : 'bg-muted/20')}>
                          <td className="px-3 py-1.5 font-medium">{mt?.equipmentName}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{mt?.quantity}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{mt?.maintenancePeriodHours}</td>
                          <td className="px-3 py-1.5 text-right font-mono font-medium">{(mt?.annualMaintenanceCost ?? 0).toLocaleString('tr-TR')} USD</td>
                          <td className="px-3 py-1.5 text-right font-mono">{formatNumber(mt?.maintenanceCostPerHour ?? 0)} USD</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'scenarios' && scenarios.length > 0 && (
            <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
              <h3 className="font-display text-sm font-semibold mb-4 flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /> Senaryo Analizi (İyimser / Normal / Kötümser)</h3>
              <p className="text-xs text-muted-foreground mb-4">İyimser: Fiyat +%20, Maliyet -%15, Üretim +%10 | Kötümser: Fiyat -%20, Maliyet +%20, Üretim -%15</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">{t('compare.indicator')}</th>
                    {scenarios.map((sc: any) => (
                      <th key={sc.scenario} className="px-4 py-3 text-right font-medium">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                          sc.scenario === 'optimistic' ? 'bg-emerald-500/10 text-emerald-500' :
                          sc.scenario === 'pessimistic' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                        )}>{sc.label}</span>
                      </th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[
                      { label: 'NPV (MUSD)', key: 'npv', fmt: (v: number) => formatMUSD(v) },
                      { label: 'IRR (%)', key: 'irr', fmt: (v: number) => formatPercent(v) },
                      { label: 'Geri Ödeme (yıl)', key: 'paybackPeriod', fmt: (v: number) => formatYear(v) },
                      { label: 'Yıllık Gelir (MUSD)', key: 'annualRevenue', fmt: (v: number) => formatNumber(v) },
                      { label: 'Yıllık Maliyet (MUSD)', key: 'annualCost', fmt: (v: number) => formatNumber(v) },
                      { label: 'Yıllık Kâr (MUSD)', key: 'annualProfit', fmt: (v: number) => formatNumber(v) },
                    ].map((row: any) => (
                      <tr key={row.key} className="border-t border-border/20">
                        <td className="px-4 py-2.5 font-medium text-xs">{row.label}</td>
                        {scenarios.map((sc: any) => (
                          <td key={sc.scenario} className={cn('px-4 py-2.5 text-right font-mono text-sm',
                            row.key === 'npv' || row.key === 'annualProfit'
                              ? ((sc?.[row.key] ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500') : ''
                          )}>{row.fmt(sc?.[row.key] ?? 0)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === ENVIRONMENTAL TAB === */}
          {activeTab === 'environmental' && (
            <div className="space-y-6">
              {/* Carbon Footprint */}
              <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                <h3 className="font-display text-sm font-semibold mb-4 flex items-center gap-2"><Leaf className="h-4 w-4 text-emerald-500" /> Karbon Ayak İzi Analizi</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <MetricCard icon={Leaf} label="Yıllık CO₂ Emisyonu" value={formatNumber(carbon?.totalAnnualCO2 ?? 0, 1)} suffix="ton" color="text-emerald-500" />
                  <MetricCard icon={Leaf} label="Ömür Boyu CO₂" value={formatNumber(carbon?.totalLifetimeCO2 ?? 0, 0)} suffix="ton" color="text-red-500" />
                  <MetricCard icon={Leaf} label="CO₂ / Üretim" value={formatNumber(carbon?.co2PerTonProduced ?? 0, 3)} suffix="kg/ton" color="text-amber-500" />
                  <MetricCard icon={Leaf} label="CO₂ / Gelir" value={formatNumber(carbon?.co2PerRevenueUnit ?? 0, 4)} suffix="ton/MUSD" color="text-purple-500" />
                </div>
                {(carbon?.equipmentEmissions?.length ?? 0) > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">{t('equip.name')}</th>
                        <th className="px-3 py-2 text-right font-medium">Yıllık Yakıt (lt)</th>
                        <th className="px-3 py-2 text-right font-medium">{t('env.annualCo2')}</th>
                      </tr></thead>
                      <tbody>{(carbon?.equipmentEmissions ?? []).map((e: any, i: number) => (
                        <tr key={i} className={cn('border-t border-border/20', i % 2 === 0 ? '' : 'bg-muted/20')}>
                          <td className="px-3 py-1.5 font-medium">{e?.name}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{formatNumber(e?.annualFuelLiters ?? 0, 0)}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{formatNumber(e?.annualCO2Tons ?? 0, 1)}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Water Consumption */}
              <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                <h3 className="font-display text-sm font-semibold mb-4 flex items-center gap-2"><Droplets className="h-4 w-4 text-blue-500" /> Su Tüketim Analizi</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard icon={Droplets} label="Günlük Tüketim" value={formatNumber(water?.dailyConsumption ?? 0, 0)} suffix="m³" color="text-blue-500" />
                  <MetricCard icon={Droplets} label="Aylık Tüketim" value={formatNumber(water?.monthlyConsumption ?? 0, 0)} suffix="m³" color="text-blue-400" />
                  <MetricCard icon={Droplets} label="Yıllık Tüketim" value={formatNumber(water?.annualConsumption ?? 0, 0)} suffix="m³" color="text-cyan-500" />
                  <MetricCard icon={Droplets} label="Ömür Boyu" value={formatNumber(water?.lifetimeConsumption ?? 0, 0)} suffix="m³" color="text-cyan-600" />
                </div>
              </div>

              {/* Rehabilitation */}
              <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                <h3 className="font-display text-sm font-semibold mb-4 flex items-center gap-2"><TreePine className="h-4 w-4 text-green-500" /> Rehabilitasyon Maliyet Tahmini</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <MetricCard icon={TreePine} label="Toplam Alan" value={formatNumber(rehab?.totalArea ?? 0, 0)} suffix="ha" color="text-green-500" />
                  <MetricCard icon={DollarSign} label="Birim Maliyet" value={formatNumber(rehab?.costPerHa ?? 0, 0)} suffix="USD/ha" color="text-green-600" />
                  <MetricCard icon={DollarSign} label="Toplam Maliyet" value={formatNumber(rehab?.totalCost ?? 0, 0)} suffix="USD" color="text-green-700" />
                  <MetricCard icon={Calendar} label="Yıllık Karşılık" value={formatNumber(rehab?.annualProvision ?? 0, 0)} suffix="USD" color="text-amber-500" />
                </div>
                {(rehab?.phases?.length ?? 0) > 0 && (rehab?.totalCost ?? 0) > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">{t('env.phase')}</th>
                        <th className="px-3 py-2 text-right font-medium">Pay (%)</th>
                        <th className="px-3 py-2 text-right font-medium">{t('fuel.cost')}</th>
                      </tr></thead>
                      <tbody>{(rehab?.phases ?? []).map((ph: any, i: number) => (
                        <tr key={i} className={cn('border-t border-border/20', i % 2 === 0 ? '' : 'bg-muted/20')}>
                          <td className="px-3 py-1.5 font-medium">{ph?.phase}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{ph?.percentage}%</td>
                          <td className="px-3 py-1.5 text-right font-mono">{formatNumber(ph?.cost ?? 0, 0)} USD</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === RISK & MONTE CARLO TAB === */}
          {activeTab === 'risk' && (
            <div className="space-y-6">
              {/* Risk Matrix */}
              <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                <h3 className="font-display text-sm font-semibold mb-4 flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-red-500" /> Risk Matrisi (Olasılık × Etki)</h3>
                {/* 5x5 Grid Matrix */}
                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <div className="w-16 text-[10px] text-muted-foreground text-right pr-1 flex flex-col gap-1">
                      {[5,4,3,2,1].map(prob => (
                        <div key={prob} className="h-10 flex items-center justify-end">{prob}</div>
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="grid grid-rows-5 gap-1">
                        {[5,4,3,2,1].map(prob => (
                          <div key={prob} className="grid grid-cols-5 gap-1">
                            {[1,2,3,4,5].map(impact => {
                              const score = prob * impact;
                              const cellRisks = risks.filter((r: any) => r.probability === prob && r.impact === impact);
                              let bg = 'bg-green-500/20';
                              if (score >= 16) bg = 'bg-red-500/30';
                              else if (score >= 10) bg = 'bg-orange-500/25';
                              else if (score >= 5) bg = 'bg-yellow-500/20';
                              return (
                                <div key={impact} className={cn('h-10 rounded flex items-center justify-center text-[9px] font-mono relative', bg)}>
                                  {cellRisks.length > 0 && (
                                    <span className="bg-foreground text-background rounded-full w-5 h-5 flex items-center justify-center font-bold">{cellRisks.length}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-5 gap-1 mt-1">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="text-center text-[10px] text-muted-foreground">{i}</div>
                        ))}
                      </div>
                      <p className="text-center text-[10px] text-muted-foreground mt-1">Etki →</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 ml-16">↑ Olasılık</p>
                </div>
                {/* Risk Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium">{t('risk.category')}</th>
                      <th className="px-3 py-2 text-left font-medium">{t('risk.riskName')}</th>
                      <th className="px-3 py-2 text-center font-medium">O</th>
                      <th className="px-3 py-2 text-center font-medium">E</th>
                      <th className="px-3 py-2 text-center font-medium">{t('risk.score')}</th>
                      <th className="px-3 py-2 text-center font-medium">{t('risk.level')}</th>
                      <th className="px-3 py-2 text-left font-medium">{t('risk.level')}</th>
                    </tr></thead>
                    <tbody>{risks.map((r: any, i: number) => (
                      <tr key={r.id} className={cn('border-t border-border/20', i % 2 === 0 ? '' : 'bg-muted/20')}>
                        <td className="px-3 py-1.5"><span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{r.category}</span></td>
                        <td className="px-3 py-1.5 font-medium">{r.name}</td>
                        <td className="px-3 py-1.5 text-center font-mono">{r.probability}</td>
                        <td className="px-3 py-1.5 text-center font-mono">{r.impact}</td>
                        <td className="px-3 py-1.5 text-center font-mono font-bold">{r.score}</td>
                        <td className="px-3 py-1.5 text-center">
                          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium text-white', RISK_COLORS[r.level])}>{RISK_LABELS[r.level]}</span>
                        </td>
                        <td className="px-3 py-1.5 text-muted-foreground text-[11px]">{r.mitigation}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>

              {/* Monte Carlo */}
              <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-sm font-semibold flex items-center gap-2"><Dice5 className="h-4 w-4 text-purple-500" /> Monte Carlo Simülasyonu (2.000 İterasyon)</h3>
                  {!mc && <button onClick={runMonteCarlo} disabled={mcLoading}
                    className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {mcLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Dice5 className="h-3.5 w-3.5" />}
                    Simülasyonu Çalıştır
                  </button>}
                </div>
                {mc ? (
                  <div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <MetricCard icon={DollarSign} label="Ortalama NPV" value={formatNumber(mc.stats?.npvMean ?? 0)} suffix="MUSD" color="text-blue-500" />
                      <MetricCard icon={DollarSign} label="Medyan NPV" value={formatNumber(mc.stats?.npvMedian ?? 0)} suffix="MUSD" color="text-purple-500" />
                      <MetricCard icon={TrendingUp} label="NPV > 0 Olasılığı" value={formatNumber(mc.stats?.npvPositiveProb ?? 0, 1)} suffix="%" color={(mc.stats?.npvPositiveProb ?? 0) > 50 ? 'text-emerald-500' : 'text-red-500'} />
                      <MetricCard icon={Activity} label="Standart Sapma" value={formatNumber(mc.stats?.npvStdDev ?? 0)} suffix="MUSD" color="text-amber-500" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      <MetricCard icon={ArrowDown} label="Minimum NPV" value={formatNumber(mc.stats?.npvMin ?? 0)} suffix="MUSD" color="text-red-500" />
                      <MetricCard icon={TrendingUp} label="Maksimum NPV" value={formatNumber(mc.stats?.npvMax ?? 0)} suffix="MUSD" color="text-emerald-500" />
                      <MetricCard icon={TrendingUp} label="Ortalama IRR" value={formatNumber(mc.stats?.irrMean ?? 0)} suffix="%" color="text-amber-500" />
                    </div>
                    {/* Histogram */}
                    <h4 className="text-xs font-medium mb-3">{t('risk.mcHistogram')}</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={mc.histogram ?? []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="bin" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: any) => [v, 'Frekans']} labelFormatter={(l: any) => `NPV: ${l} MUSD`} />
                        <Bar dataKey="count" name="Frekans">
                          {(mc.histogram ?? []).map((entry: any, idx: number) => (
                            <Cell key={idx} fill={parseFloat(entry.bin) >= 0 ? '#10b981' : '#ef4444'} opacity={0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    {/* Cumulative line */}
                    <h4 className="text-xs font-medium mt-4 mb-3">{t('risk.mcCumulative')}</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <RLineChart data={mc.histogram ?? []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="bin" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
                        <Tooltip formatter={(v: any) => [`${Number(v).toFixed(1)}%`, 'Kümülatif']} />
                        <Line type="monotone" dataKey="cumulative" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                      </RLineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Dice5 className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Simülasyonu başlatmak için yukardaki butona tıklayın.</p>
                    <p className="text-xs text-muted-foreground mt-1">Fiyat, maliyet ve üretim değişkenlerine normal dağılım uygulanır.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === FINANCING TAB === */}
          {activeTab === 'financing' && (
            <div className="space-y-6">
              {/* Financing Overview */}
              <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                <h3 className="font-display text-sm font-semibold mb-4 flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> Finansman Yapısı</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <MetricCard icon={DollarSign} label="Toplam Yatırım" value={formatNumber(fin?.totalInvestment ?? 0)} suffix="MUSD" color="text-blue-500" />
                  <MetricCard icon={DollarSign} label="Öz Sermaye" value={formatNumber(fin?.equityAmount ?? 0)} suffix="MUSD" color="text-emerald-500" />
                  <MetricCard icon={CreditCard} label="Kredi Tutarı" value={formatNumber(fin?.loanAmount ?? 0)} suffix="MUSD" color="text-red-500" />
                  <MetricCard icon={Gauge} label="DSCR" value={formatNumber(fin?.dscr ?? 0, 2)} suffix="x" color={(fin?.dscr ?? 0) >= 1.2 ? 'text-emerald-500' : 'text-red-500'} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard icon={DollarSign} label="Yıllık Taksit" value={formatNumber(fin?.annualPayment ?? 0)} suffix="MUSD" color="text-amber-500" />
                  <MetricCard icon={DollarSign} label="Toplam Faiz" value={formatNumber(fin?.totalInterest ?? 0)} suffix="MUSD" color="text-orange-500" />
                  <MetricCard icon={DollarSign} label="Toplam Geri Ödeme" value={formatNumber(fin?.totalPayment ?? 0)} suffix="MUSD" color="text-purple-500" />
                  <MetricCard icon={Gauge} label="Borç/Özsermaye" value={`${formatNumber(fin?.debtRatio ?? 0, 0)}/${formatNumber(fin?.equityRatio ?? 100, 0)}`} suffix="%" color="text-cyan-500" />
                </div>
              </div>

              {/* Loan Schedule */}
              {(fin?.schedule?.length ?? 0) > 0 && (
                <div className="rounded-xl bg-card border border-border/50 overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
                  <div className="p-5"><h3 className="font-display text-sm font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> Kredi Geri Ödeme Tablosu</h3></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">{t('fin.year')}</th>
                        <th className="px-3 py-2 text-right font-medium">{t('fin.balance')}</th>
                        <th className="px-3 py-2 text-right font-medium">{t('fin.payment')}</th>
                        <th className="px-3 py-2 text-right font-medium">{t('fin.interest')}</th>
                        <th className="px-3 py-2 text-right font-medium">{t('fin.principal')}</th>
                        <th className="px-3 py-2 text-right font-medium">{t('fin.balance')}</th>
                      </tr></thead>
                      <tbody>{(fin?.schedule ?? []).map((row: any, i: number) => (
                        <tr key={i} className={cn('border-t border-border/20', i % 2 === 0 ? '' : 'bg-muted/20')}>
                          <td className="px-3 py-1.5 font-mono font-medium">{row?.year}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{formatNumber(row?.beginningBalance ?? 0)}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{formatNumber(row?.payment ?? 0)}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-red-500">{formatNumber(row?.interest ?? 0)}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-emerald-500">{formatNumber(row?.principal ?? 0)}</td>
                          <td className="px-3 py-1.5 text-right font-mono font-medium">{formatNumber(row?.endingBalance ?? 0)}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Depreciation Table */}
              {depTable.length > 0 && (
                <div className="rounded-xl bg-card border border-border/50 overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
                  <div className="p-5"><h3 className="font-display text-sm font-semibold flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" /> Amortisman Tablosu ({p?.depreciationMethod === 'declining' ? 'Azalan Bakiye' : 'Doğrusal'})</h3></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">{t('fin.year')}</th>
                        <th className="px-3 py-2 text-right font-medium">Ekipman Amort.</th>
                        <th className="px-3 py-2 text-right font-medium">Tesis Amort.</th>
                        <th className="px-3 py-2 text-right font-medium">{t('fuel.total')}</th>
                        <th className="px-3 py-2 text-right font-medium">{t('fin.bookValue')} (Eq.)</th>
                        <th className="px-3 py-2 text-right font-medium">{t('fin.bookValue')} (Fac.)</th>
                      </tr></thead>
                      <tbody>{depTable.map((row: any, i: number) => (
                        <tr key={i} className={cn('border-t border-border/20', i % 2 === 0 ? '' : 'bg-muted/20')}>
                          <td className="px-3 py-1.5 font-mono font-medium">{row?.year}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{formatNumber(row?.equipmentDep ?? 0)}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{formatNumber(row?.facilityDep ?? 0)}</td>
                          <td className="px-3 py-1.5 text-right font-mono font-medium">{formatNumber(row?.totalDep ?? 0)}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{formatNumber(row?.equipmentBookValue ?? 0)}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{formatNumber(row?.facilityBookValue ?? 0)}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === PLANNING TAB === */}
          {activeTab === 'planning' && (
            <div className="space-y-6">
              {/* Project Timeline / Gantt */}
              <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                <h3 className="font-display text-sm font-semibold mb-4 flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Maden Ömrü Zaman Çizelgesi</h3>
                <div className="space-y-2">
                  {phases.map((phase: any, i: number) => {
                    const totalSpan = (p?.projectLifeYears ?? 30) + 5;
                    const leftPct = ((phase.startYear + 2) / totalSpan) * 100;
                    const widthPct = ((phase.endYear - phase.startYear) / totalSpan) * 100;
                    return (
                      <div key={i} className="relative">
                        <div className="flex items-center gap-3">
                          <span className="text-xs w-44 text-right text-muted-foreground truncate">{phase.name}</span>
                          <div className="flex-1 relative h-8 bg-muted/30 rounded">
                            <div
                              className="absolute top-0 h-full rounded flex items-center justify-center text-[10px] font-medium text-white"
                              style={{ left: `${Math.max(0, leftPct)}%`, width: `${Math.max(2, widthPct)}%`, backgroundColor: phase.color }}
                            >
                              {(phase.endYear - phase.startYear) > 2 && `${phase.startYear < 0 ? phase.startYear : 'Y' + phase.startYear}-Y${phase.endYear}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* Year markers */}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="w-44" />
                    <div className="flex-1 flex justify-between text-[10px] text-muted-foreground">
                      <span>-2</span><span>0</span><span>{Math.floor((p?.projectLifeYears ?? 30) / 3)}</span>
                      <span>{Math.floor((p?.projectLifeYears ?? 30) * 2 / 3)}</span><span>{p?.projectLifeYears ?? 30}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Production Plan */}
              <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                <h3 className="font-display text-sm font-semibold mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Üretim Planı Projeksiyonu</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={cfs.filter((cf: any) => cf.year > 0).map((cf: any) => ({
                    year: `Y${cf.year}`,
                    production: (p?.annualProduction ?? 0) * (cf.year <= 2 ? 0.6 + cf.year * 0.2 : cf.year >= (p?.projectLifeYears ?? 30) - 2 ? Math.max(0.5, 1 - (cf.year - (p?.projectLifeYears ?? 30) + 3) * 0.15) : 1),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: any) => [`${Number(v).toFixed(2)} Mt`, 'Üretim']} />
                    <Bar dataKey="production" fill="#10b981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Map */}
              <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                <h3 className="font-display text-sm font-semibold mb-4 flex items-center gap-2"><MapPin className="h-4 w-4 text-red-500" /> Maden Lokasyonu</h3>
                <ProjectMap latitude={p?.latitude ?? 0} longitude={p?.longitude ?? 0} name={p?.name ?? ''} />
              </div>
            </div>
          )}

          {activeTab === 'cashflow' && (
            <div className="space-y-4">
              {/* Loan Toggle + Contractor Editor */}
              <div className="rounded-xl bg-card border border-border/50 p-4 flex flex-wrap items-center gap-6" style={{ boxShadow: 'var(--shadow-md)' }}>
                {/* Loan toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={showLoanInflow} onChange={() => setShowLoanInflow(!showLoanInflow)} />
                    <div className={cn('w-10 h-5 rounded-full transition-colors', showLoanInflow ? 'bg-primary' : 'bg-muted-foreground/30')} />
                    <div className={cn('absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm', showLoanInflow ? 'translate-x-5' : '')} />
                  </div>
                  <span className="text-xs font-medium">Yıl 0'da Kredi Girişi (+{formatNumber(loanAmount)} MUSD)</span>
                </label>

                <div className="h-6 w-px bg-border/50" />

                {/* Contractor cost editor */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Yüklenici Dekapaj:</span>
                  {editingContractor ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={contractorValue}
                        onChange={(e) => setContractorValue(e.target.value)}
                        className="w-24 h-7 px-2 text-xs font-mono rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                      />
                      <span className="text-xs text-muted-foreground">MUSD</span>
                      <button onClick={saveContractorCost} disabled={contractorSaving} className="h-7 px-2.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                        {contractorSaving ? '...' : 'Kaydet'}
                      </button>
                      <button onClick={() => setEditingContractor(false)} className="h-7 px-2 text-xs rounded-md border border-border hover:bg-muted">İptal</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setContractorValue(String(p?.contractorStrippingCost ?? 0)); setEditingContractor(true); }}
                      className="flex items-center gap-1 h-7 px-2.5 text-xs font-mono font-medium rounded-md border border-border hover:bg-muted transition-colors"
                    >
                      {formatNumber(p?.contractorStrippingCost ?? 0)} MUSD
                      <Edit className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                </div>

                <div className="h-6 w-px bg-border/50" />

                {/* Equipment renewal toggle */}
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={equipRenewalEnabled} onChange={() => {
                        const newVal = !equipRenewalEnabled;
                        setEquipRenewalEnabled(newVal);
                        saveRenewalSettings(newVal, equipRenewalCycle);
                      }} />
                      <div className={cn('w-10 h-5 rounded-full transition-colors', equipRenewalEnabled ? 'bg-amber-500' : 'bg-muted-foreground/30')} />
                      <div className={cn('absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm', equipRenewalEnabled ? 'translate-x-5' : '')} />
                    </div>
                    <span className="text-xs font-medium">Makina Yenileme</span>
                  </label>
                  {equipRenewalEnabled && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Periyot:</span>
                      <select
                        value={equipRenewalCycle}
                        onChange={(e) => {
                          const newCycle = parseInt(e.target.value);
                          setEquipRenewalCycle(newCycle);
                          saveRenewalSettings(equipRenewalEnabled, newCycle);
                        }}
                        className="h-7 px-2 text-xs font-mono rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {[5, 6, 7, 8, 9, 10, 12, 15, 20].map(v => (
                          <option key={v} value={v}>{v} yıl</option>
                        ))}
                      </select>
                      {renewalSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                <h3 className="font-display text-sm font-semibold mb-4 flex items-center gap-2"><LineChart className="h-4 w-4 text-primary" /> Nakit Akış Analizi</h3>
                <CashFlowChart data={adjustedCfs} />
              </div>
            </div>
          )}

          {activeTab === 'costs' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                <h3 className="font-display text-sm font-semibold mb-4">{t('cost.capexDist')}</h3>
                <CostPieChart data={capexData} />
                <div className="mt-4 space-y-2">
                  {capexData.filter((d: any) => (d?.value ?? 0) > 0).map((d: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs"><span className="text-muted-foreground">{d?.name}</span><span className="font-mono font-medium">{formatMUSD(d?.value)}</span></div>
                  ))}
                  <div className="flex justify-between text-xs font-bold pt-2 border-t border-border/30"><span>{t('dash.totalCapex')}</span><span className="font-mono">{formatMUSD(p?.totalCapex)}</span></div>
                </div>
              </div>
              <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                <h3 className="font-display text-sm font-semibold mb-4">OPEX Dağılımı (Yıllık)</h3>
                <CostPieChart data={opexData} />
                <div className="mt-4 space-y-2">
                  {opexData.filter((d: any) => (d?.value ?? 0) > 0).map((d: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs"><span className="text-muted-foreground">{d?.name}</span><span className="font-mono font-medium">{formatMUSD(d?.value)}</span></div>
                  ))}
                  <div className="flex justify-between text-xs font-bold pt-2 border-t border-border/30"><span>OPEX</span><span className="font-mono">{formatMUSD(p?.totalOpex)}</span></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6">
              {(p?.equipments?.length ?? 0) > 0 && (
                <div className="rounded-xl bg-card border border-border/50 overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
                  <div className="p-5"><h3 className="font-display text-sm font-semibold flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Makine ve Ekipmanlar</h3></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">{t('equip.category')}</th><th className="px-3 py-2 text-left font-medium">{t('equip.name')}</th>
                        <th className="px-3 py-2 text-right font-medium">{t('equip.qty')}</th><th className="px-3 py-2 text-right font-medium">{t('equip.power')}</th>
                        <th className="px-3 py-2 text-right font-medium">lt/saat</th><th className="px-3 py-2 text-right font-medium">{t('fuel.total')}</th>
                      </tr></thead>
                      <tbody>{(p?.equipments ?? []).map((eq: any, i: number) => (
                        <tr key={eq?.id ?? i} className={cn('border-t border-border/20', i % 2 === 0 ? '' : 'bg-muted/20')}>
                          <td className="px-3 py-1.5"><span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{getCategoryLabel(eq?.equipmentCategory)}</span></td>
                          <td className="px-3 py-1.5 font-medium">{eq?.machineType}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{eq?.quantity}{(eq?.spareQuantity ?? 0) > 0 && `+${eq.spareQuantity}`}</td>
                          <td className="px-3 py-1.5 text-right text-muted-foreground">{eq?.powerType === 'electric' ? 'Elektrik' : eq?.powerType === 'hybrid' ? 'Hibrit' : 'Dizel'}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{(eq?.hourlyFuelConsumption ?? 0) > 0 ? formatNumber(eq.hourlyFuelConsumption, 1) : '-'}</td>
                          <td className="px-3 py-1.5 text-right font-mono font-medium">{(eq?.totalCost ?? 0).toLocaleString('tr-TR')} USD</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              )}
              {(p?.personnels?.length ?? 0) > 0 && (
                <div className="rounded-xl bg-card border border-border/50 overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
                  <div className="p-5"><h3 className="font-display text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Personel</h3></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">Görev</th><th className="px-3 py-2 text-right font-medium">Kişi</th>
                        <th className="px-3 py-2 text-right font-medium">Aylık Maaş</th><th className="px-3 py-2 text-right font-medium">{t('fuel.annual')}</th>
                      </tr></thead>
                      <tbody>{(p?.personnels ?? []).map((per: any, i: number) => (
                        <tr key={per?.id ?? i} className={cn('border-t border-border/20', i % 2 === 0 ? '' : 'bg-muted/20')}>
                          <td className="px-3 py-1.5 font-medium">{per?.role}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{per?.count}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{(per?.monthlySalary ?? 0).toLocaleString('tr-TR')} USD</td>
                          <td className="px-3 py-1.5 text-right font-mono font-medium">{(per?.annualCost ?? 0).toLocaleString('tr-TR')} USD</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-8">
              {/* Tornado Chart */}
              {tornadoData?.tornado && tornadoData.tornado.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-display text-lg font-semibold mb-1">🌪️ Tornado Diyagramı</h3>
                  <p className="text-sm text-muted-foreground mb-4">Parametrelerin NPV üzerindeki etkisi (±%20 değişim)</p>
                  <TornadoChart data={tornadoData.tornado} />
                </div>
              )}

              {/* Cost Waterfall */}
              {tornadoData?.waterfall && (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-display text-lg font-semibold mb-1">📊 Maliyet Şelale Grafiği</h3>
                  <p className="text-sm text-muted-foreground mb-4">Ortalama yıllık gelir-gider dağılımı (MUSD)</p>
                  <CostWaterfallChart
                    revenue={tornadoData.waterfall.revenue}
                    opex={tornadoData.waterfall.opex}
                    royalty={tornadoData.waterfall.royalty}
                    tax={tornadoData.waterfall.tax}
                    creditPayment={tornadoData.waterfall.creditPayment}
                    creditInterest={tornadoData.waterfall.creditInterest}
                    netCashFlow={tornadoData.waterfall.netCashFlow}
                  />
                </div>
              )}

              {/* NPV Buildup */}
              {cfs.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-display text-lg font-semibold mb-1">📈 Kümülatif NPV Gelişimi</h3>
                  <p className="text-sm text-muted-foreground mb-4">İndirgenmiş nakit akışlarının yıl bazında birikimi</p>
                  <NpvBuildupChart cashFlows={cfs} />
                </div>
              )}

              {/* Production Profile */}
              {cfs.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-display text-lg font-semibold mb-1">📋 Üretim Profili</h3>
                  <p className="text-sm text-muted-foreground mb-4">Yıllık gelir, gider ve net nakit akışı değişimi</p>
                  <ProductionProfileChart cashFlows={cfs} />
                </div>
              )}

              {/* Break-even Analysis */}
              {cfs.length > 0 && (p?.unitPrice ?? 0) > 0 && (p?.breakevenPrice ?? 0) > 0 && (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-display text-lg font-semibold mb-1">🎯 Başabaş Fiyat Analizi</h3>
                  <p className="text-sm text-muted-foreground mb-4">Farklı satış fiyatlarında projenin NPV değeri</p>
                  <BreakevenChart
                    basePrice={p?.unitPrice ?? 75}
                    breakevenPrice={p?.breakevenPrice ?? 0}
                    cashFlows={cfs}
                    discountRate={p?.discountRate ?? 5.82}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'sensitivity' && (
            <div className="space-y-8">
              {/* 1. Spider Diagram - All parameters on one chart */}
              {econSens?.spiderData && (
                <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                  <h3 className="font-display text-sm font-semibold mb-1 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" /> {t('econ.spiderTitle')}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">{t('econ.spiderDesc')}</p>
                  <SpiderSensitivityChart data={econSens.spiderData} baseNpv={econSens.baseNpv ?? 0} />
                </div>
              )}

              {/* 2. Elasticity + Switchover side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Elasticity */}
                {econSens?.elasticity && (
                  <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                    <h3 className="font-display text-sm font-semibold mb-1 flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-primary" /> {t('econ.elasticityTitle')}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">{t('econ.elasticityDesc')}</p>
                    <ElasticityBarChart data={econSens.elasticity} />
                  </div>
                )}

                {/* Switchover / Critical Values */}
                {econSens?.switchoverValues && (
                  <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                    <h3 className="font-display text-sm font-semibold mb-1 flex items-center gap-2">
                      <Crosshair className="h-4 w-4 text-primary" /> {t('econ.switchoverTitle')}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">{t('econ.switchoverDesc')}</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="px-3 py-2 text-left font-medium">{t('econ.parameter')}</th>
                            <th className="px-3 py-2 text-right font-medium">{t('econ.baseValue')}</th>
                            <th className="px-3 py-2 text-right font-medium">{t('econ.switchPct')}</th>
                            <th className="px-3 py-2 text-right font-medium">{t('econ.switchValue')}</th>
                            <th className="px-3 py-2 text-right font-medium">{t('econ.safetyMargin')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {econSens.switchoverValues.map((sv: any, i: number) => (
                            <tr key={sv.parameter} className={cn('border-t border-border/20', i % 2 !== 0 && 'bg-muted/20')}>
                              <td className="px-3 py-2 font-medium">{sv.label}</td>
                              <td className="px-3 py-2 text-right font-mono">{sv.baseValue} {sv.unit}</td>
                              <td className="px-3 py-2 text-right font-mono">
                                {sv.switchoverPercent !== null ? (
                                  <span className={sv.switchoverPercent > 0 ? 'text-red-400' : 'text-emerald-400'}>
                                    {sv.switchoverPercent > 0 ? '+' : ''}{sv.switchoverPercent}%
                                  </span>
                                ) : (
                                  <span className="text-emerald-400">∞</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right font-mono">
                                {sv.switchoverValue !== null ? `${sv.switchoverValue} ${sv.unit}` : '—'}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {sv.safetyMargin !== null ? (
                                  <span className={cn(
                                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                    sv.safetyMargin > 30 ? 'bg-emerald-500/15 text-emerald-400' :
                                    sv.safetyMargin > 15 ? 'bg-yellow-500/15 text-yellow-400' :
                                    'bg-red-500/15 text-red-400'
                                  )}>
                                    %{sv.safetyMargin.toFixed(1)}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400">Güvenli</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Two-way Sensitivity Heatmap */}
              {econSens?.twoWayData && (
                <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                  <h3 className="font-display text-sm font-semibold mb-1 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" /> {t('econ.twoWayTitle')}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">{t('econ.twoWayDesc')}</p>
                  <TwoWayHeatmap
                    data={econSens.twoWayData}
                    priceRange={econSens.priceRange ?? [-30, -20, -10, 0, 10, 20, 30]}
                    opexRange={econSens.opexRange ?? [-30, -20, -10, 0, 10, 20, 30]}
                    baseNpv={econSens.baseNpv ?? 0}
                  />
                </div>
              )}

              {/* 4. Comprehensive Summary Table */}
              {econSens?.summaryTable && (
                <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                  <h3 className="font-display text-sm font-semibold mb-1 flex items-center gap-2">
                    <TableIcon className="h-4 w-4 text-primary" /> {t('econ.summaryTitle')}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">{t('econ.summaryDesc')}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-3 py-2 text-left font-medium border border-border/30">{t('econ.parameter')}</th>
                          <th className="px-3 py-2 text-center font-medium border border-border/30" colSpan={2}>-30%</th>
                          <th className="px-3 py-2 text-center font-medium border border-border/30" colSpan={2}>-20%</th>
                          <th className="px-3 py-2 text-center font-medium border border-border/30" colSpan={2}>-10%</th>
                          <th className="px-3 py-2 text-center font-medium border border-border/30 bg-primary/10" colSpan={2}>{t('econ.base')}</th>
                          <th className="px-3 py-2 text-center font-medium border border-border/30" colSpan={2}>+10%</th>
                          <th className="px-3 py-2 text-center font-medium border border-border/30" colSpan={2}>+20%</th>
                          <th className="px-3 py-2 text-center font-medium border border-border/30" colSpan={2}>+30%</th>
                        </tr>
                        <tr className="bg-muted/30">
                          <th className="px-3 py-1 border border-border/30" />
                          {[-30, -20, -10, 0, 10, 20, 30].flatMap((pct) => [
                              <th key={`npv-${pct}`} className={cn('px-2 py-1 text-center font-medium border border-border/30 text-[10px]', pct === 0 && 'bg-primary/10')}>NPV</th>,
                              <th key={`irr-${pct}`} className={cn('px-2 py-1 text-center font-medium border border-border/30 text-[10px]', pct === 0 && 'bg-primary/10')}>IRR</th>,
                          ])}
                        </tr>
                      </thead>
                      <tbody>
                        {econSens.summaryTable.map((row: any, ri: number) => (
                          <tr key={row.parameter} className={cn(ri % 2 !== 0 && 'bg-muted/20')}>
                            <td className="px-3 py-1.5 font-medium border border-border/30 whitespace-nowrap">{row.label}</td>
                            {(row.data ?? []).flatMap((d: any, di: number) => [
                                <td key={`npv-${ri}-${di}`} className={cn(
                                  'px-2 py-1.5 text-center font-mono border border-border/20',
                                  d.changePercent === 0 && 'bg-primary/10 font-bold',
                                  d.npv < 0 ? 'text-red-400' : 'text-foreground'
                                )}>
                                  {d.npv.toFixed(0)}
                                </td>,
                                <td key={`irr-${ri}-${di}`} className={cn(
                                  'px-2 py-1.5 text-center font-mono border border-border/20',
                                  d.changePercent === 0 && 'bg-primary/10 font-bold',
                                  d.irr < 0 ? 'text-red-400' : 'text-foreground'
                                )}>
                                  {d.irr.toFixed(1)}%
                                </td>,
                            ])}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 5. Single-parameter NPV/IRR charts (existing, kept as detail view) */}
              {sensitivity && (
                <div className="space-y-4">
                  <h3 className="font-display text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> {t('econ.singleParamTitle')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {SENS_PARAMS.map((sp: any) => (
                      <button key={sp.key} onClick={() => setSensParam(sp.key)}
                        className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          sensParam === sp.key ? 'bg-primary text-primary-foreground' : 'bg-card border border-border/50 text-muted-foreground hover:bg-accent'
                        )}>{sp.label}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                      <h4 className="font-display text-xs font-semibold mb-3 text-muted-foreground">NPV {t('econ.change')}</h4>
                      <SensitivityChart data={{ [sensParam]: sensitivity?.[sensParam] ?? [] }} metric="npv" />
                    </div>
                    <div className="rounded-xl bg-card border border-border/50 p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
                      <h4 className="font-display text-xs font-semibold mb-3 text-muted-foreground">IRR {t('econ.change')}</h4>
                      <SensitivityChart data={{ [sensParam]: sensitivity?.[sensParam] ?? [] }} metric="irr" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <AIAnalysisPanel projectId={projectId} />
          )}

          {activeTab === 'table' && (
            <div className="space-y-4">
              {/* Loan Toggle + Contractor Editor */}
              <div className="rounded-xl bg-card border border-border/50 p-4 flex flex-wrap items-center gap-6" style={{ boxShadow: 'var(--shadow-md)' }}>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={showLoanInflow} onChange={() => setShowLoanInflow(!showLoanInflow)} />
                    <div className={cn('w-10 h-5 rounded-full transition-colors', showLoanInflow ? 'bg-primary' : 'bg-muted-foreground/30')} />
                    <div className={cn('absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm', showLoanInflow ? 'translate-x-5' : '')} />
                  </div>
                  <span className="text-xs font-medium">Yıl 0'da Kredi Girişi (+{formatNumber(loanAmount)} MUSD)</span>
                </label>
                <div className="h-6 w-px bg-border/50" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Yüklenici Dekapaj:</span>
                  {editingContractor ? (
                    <div className="flex items-center gap-1.5">
                      <input type="number" step="0.01" min="0" value={contractorValue} onChange={(e) => setContractorValue(e.target.value)}
                        className="w-24 h-7 px-2 text-xs font-mono rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary" autoFocus />
                      <span className="text-xs text-muted-foreground">MUSD</span>
                      <button onClick={saveContractorCost} disabled={contractorSaving} className="h-7 px-2.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{contractorSaving ? '...' : 'Kaydet'}</button>
                      <button onClick={() => setEditingContractor(false)} className="h-7 px-2 text-xs rounded-md border border-border hover:bg-muted">İptal</button>
                    </div>
                  ) : (
                    <button onClick={() => { setContractorValue(String(p?.contractorStrippingCost ?? 0)); setEditingContractor(true); }}
                      className="flex items-center gap-1 h-7 px-2.5 text-xs font-mono font-medium rounded-md border border-border hover:bg-muted transition-colors">
                      {formatNumber(p?.contractorStrippingCost ?? 0)} MUSD
                      <Edit className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                </div>

                <div className="h-6 w-px bg-border/50" />

                {/* Equipment renewal toggle */}
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={equipRenewalEnabled} onChange={() => {
                        const newVal = !equipRenewalEnabled;
                        setEquipRenewalEnabled(newVal);
                        saveRenewalSettings(newVal, equipRenewalCycle);
                      }} />
                      <div className={cn('w-10 h-5 rounded-full transition-colors', equipRenewalEnabled ? 'bg-amber-500' : 'bg-muted-foreground/30')} />
                      <div className={cn('absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm', equipRenewalEnabled ? 'translate-x-5' : '')} />
                    </div>
                    <span className="text-xs font-medium">Makina Yenileme</span>
                  </label>
                  {equipRenewalEnabled && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Periyot:</span>
                      <select
                        value={equipRenewalCycle}
                        onChange={(e) => {
                          const newCycle = parseInt(e.target.value);
                          setEquipRenewalCycle(newCycle);
                          saveRenewalSettings(equipRenewalEnabled, newCycle);
                        }}
                        className="h-7 px-2 text-xs font-mono rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {[5, 6, 7, 8, 9, 10, 12, 15, 20].map(v => (
                          <option key={v} value={v}>{v} yıl</option>
                        ))}
                      </select>
                      {renewalSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-card border border-border/50 overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
                <div className="p-5"><h3 className="font-display text-sm font-semibold flex items-center gap-2"><TableIcon className="h-4 w-4 text-primary" /> Yıllık Nakit Akış Tablosu</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium">{t('fin.year')}</th>
                      <th className="px-3 py-2 text-right font-medium">Gelir</th>
                      <th className="px-3 py-2 text-right font-medium">OPEX</th>
                      <th className="px-3 py-2 text-right font-medium">Amort.</th>
                      <th className="px-3 py-2 text-right font-medium">Vergi</th>
                      <th className="px-3 py-2 text-right font-medium">D. Hakkı</th>
                      <th className="px-3 py-2 text-right font-medium">Kredi</th>
                      {showLoanInflow && <th className="px-3 py-2 text-right font-medium text-blue-500">Kredi Girişi</th>}
                      <th className="px-3 py-2 text-right font-medium">Net</th>
                      <th className="px-3 py-2 text-right font-medium">Kümülatif</th>
                    </tr></thead>
                    <tbody>{(adjustedCfs ?? []).map((cf: any, i: number) => (
                      <tr key={cf?.year ?? i} className={cn('border-t border-border/20', i % 2 === 0 ? '' : 'bg-muted/20')}>
                        <td className="px-3 py-1.5 font-mono font-medium">{cf?.year ?? 0}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{formatNumber(cf?.revenue)}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{formatNumber(cf?.opex)}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{formatNumber(cf?.depreciation)}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{formatNumber(cf?.taxPayment)}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{formatNumber(cf?.royalty)}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{formatNumber(cf?.creditPayment)}</td>
                        {showLoanInflow && <td className="px-3 py-1.5 text-right font-mono text-blue-500 font-medium">{i === 0 ? `+${formatNumber(loanAmount)}` : '-'}</td>}
                        <td className={cn('px-3 py-1.5 text-right font-mono font-medium', (cf?.netCashFlow ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500')}>{formatNumber(cf?.netCashFlow)}</td>
                        <td className={cn('px-3 py-1.5 text-right font-mono', (cf?.cumulativeCashFlow ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500')}>{formatNumber(cf?.cumulativeCashFlow)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}