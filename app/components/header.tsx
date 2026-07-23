'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mountain, LayoutDashboard, PlusCircle, BarChart3, Menu, X, TrendingUp, Truck, Gem, Globe2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from './language-toggle';
import { useLanguage } from '@/lib/i18n/context';

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { href: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { href: '/projects/new', label: t('nav.newProject'), icon: PlusCircle },
    { href: '/compare', label: t('nav.compare'), icon: BarChart3 },
    { href: '/market', label: t('nav.market'), icon: TrendingUp },
    { href: '/master-data/equipment', label: t('nav.equipmentCatalog'), icon: Truck },
    { href: '/master-data/commodity', label: t('nav.commodityCatalog'), icon: Gem },
    { href: '/master-data/country', label: t('nav.countryCatalog'), icon: Globe2 },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Mountain className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">{t('nav.brand')}</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item: any) => {
            const Icon = item?.icon;
            const isActive = pathname === item?.href ||
              (item?.href !== '/' && pathname?.startsWith?.(item?.href ?? ''));
            return (
              <Link
                key={item?.href}
                href={item?.href ?? '/'}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs xl:text-sm font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden />}
                {item?.label}
              </Link>
            );
          })}
          <LanguageToggle />
          <ThemeToggle />
        </nav>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-accent"
          aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
        >
          {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
      </div>

      {mobileOpen && (
        <div id="mobile-nav" className="lg:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl">
          <nav className="flex flex-col p-4 gap-1" aria-label={t('nav.brand')}>
            {NAV_ITEMS.map((item: any) => {
              const Icon = item?.icon;
              const isActive = pathname === item?.href ||
                (item?.href !== '/' && pathname?.startsWith?.(item?.href ?? ''));
              return (
                <Link
                  key={item?.href}
                  href={item?.href ?? '/'}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent'
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item?.label}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-border/40 flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
