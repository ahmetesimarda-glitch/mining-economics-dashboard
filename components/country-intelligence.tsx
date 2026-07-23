'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Car,
  CloudSun,
  Coins,
  Factory,
  Globe2,
  Landmark,
  Languages,
  Loader2,
  MapPin,
  Pickaxe,
  Scale,
  Shield,
  Users,
  Wallet,
  Zap,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';
import type { CountryCatalogItemDto } from '@/lib/master-data/country-types';
import {
  getVisibleCountryIntelligenceFields,
  hasCountryCode,
  resolveCountryIntelligence,
  type CountryIntelligenceFieldKey,
  type CountryIntelligenceProfile,
} from '@/lib/country-intelligence';
import { cn } from '@/lib/utils';

const FIELD_ICONS: Partial<Record<CountryIntelligenceFieldKey, LucideIcon>> = {
  country: Globe2,
  capital: Landmark,
  officialLanguage: Languages,
  currency: Coins,
  governmentType: Building2,
  population: Users,
  timeZone: Clock,
  drivingSide: Car,
  voltage: Zap,
  climate: CloudSun,
  miningOverview: Pickaxe,
  majorCommodities: Factory,
  corporateTax: Scale,
  minimumWage: Wallet,
  politicalStability: Shield,
  miningFriendliness: MapPin,
};

const WIDE_FIELDS = new Set<CountryIntelligenceFieldKey>([
  'miningOverview',
  'majorCommodities',
  'climate',
]);

interface CountryIntelligencePanelProps {
  countryCode?: string | null;
  className?: string;
}

function displayValue(
  value: string | null | undefined,
  notAvailable: string
): string {
  if (value === null || value === undefined || value.trim() === '') {
    return notAvailable;
  }
  return value;
}

export function CountryIntelligencePanel({
  countryCode,
  className,
}: CountryIntelligencePanelProps) {
  const { t, locale } = useLanguage();
  const [catalog, setCatalog] = useState<CountryCatalogItemDto | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const code = (countryCode ?? '').trim().toUpperCase();
  const enabled = hasCountryCode(code);

  useEffect(() => {
    if (!enabled) {
      setCatalog(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoadingCatalog(true);
      try {
        const res = await fetch(
          `/api/master-data/country?q=${encodeURIComponent(code)}&pageSize=20&isActive=true`
        );
        if (!res.ok) {
          if (!cancelled) setCatalog(null);
          return;
        }
        const data = (await res.json()) as { items?: CountryCatalogItemDto[] };
        const match =
          (data.items ?? []).find(
            (item) => (item.code ?? '').toUpperCase() === code
          ) ?? null;
        if (!cancelled) setCatalog(match);
      } catch (err: unknown) {
        console.error('Country intelligence catalog:', err);
        if (!cancelled) setCatalog(null);
      } finally {
        if (!cancelled) setLoadingCatalog(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [code, enabled]);

  const profile: CountryIntelligenceProfile | null = useMemo(() => {
    if (!enabled) return null;
    return resolveCountryIntelligence({
      countryCode: code,
      locale,
      catalog,
    });
  }, [enabled, code, locale, catalog]);

  if (!enabled || !profile) return null;

  const fields = getVisibleCountryIntelligenceFields();
  const notAvailable = t('ci.notAvailable');
  const titleName = profile.country ?? code;

  return (
    <section
      className={cn(
        'rounded-xl border border-border/50 bg-card p-5',
        className
      )}
      style={{ boxShadow: 'var(--shadow-md)' }}
      aria-label={t('ci.title')}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-primary">
            <Globe2 className="h-4 w-4" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t('ci.eyebrow')}
            </span>
          </div>
          <h3 className="font-display text-sm font-semibold tracking-tight">
            {t('ci.title')}
            {titleName ? (
              <span className="text-muted-foreground font-normal">
                {' '}
                — {titleName}
              </span>
            ) : null}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-2xl">
            {t('ci.subtitle')}
          </p>
        </div>
        {loadingCatalog ? (
          <Loader2
            className="h-4 w-4 animate-spin text-muted-foreground shrink-0"
            aria-label={t('ci.loading')}
          />
        ) : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {fields.map((field) => {
          const Icon = FIELD_ICONS[field.key] ?? Globe2;
          const raw = profile[field.key];
          const value = displayValue(raw, notAvailable);
          const unavailable = raw === null || raw === undefined || raw.trim() === '';
          const wide = WIDE_FIELDS.has(field.key);

          return (
            <div
              key={field.key}
              className={cn(
                'rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5',
                wide && 'sm:col-span-2 lg:col-span-3'
              )}
            >
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {t(field.labelKey)}
              </div>
              <p
                className={cn(
                  'text-sm leading-snug',
                  unavailable
                    ? 'text-muted-foreground italic'
                    : 'text-foreground font-medium'
                )}
              >
                {value}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
