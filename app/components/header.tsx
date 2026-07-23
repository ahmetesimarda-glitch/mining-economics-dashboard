'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Mountain,
  LayoutDashboard,
  PlusCircle,
  BarChart3,
  Menu,
  X,
  TrendingUp,
  Truck,
  Gem,
  Globe2,
  Lightbulb,
  ChevronDown,
  Library,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from './language-toggle';
import { useLanguage } from '@/lib/i18n/context';
import {
  isCatalogNavPath,
  NAV_IMPLEMENTED_CATALOGS,
  type NavCatalogItem,
} from '@/lib/master-data/nav-catalogs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PrimaryNavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

const PRIMARY_NAV: readonly PrimaryNavItem[] = [
  { href: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/projects/new', labelKey: 'nav.newProject', icon: PlusCircle },
  { href: '/compare', labelKey: 'nav.compare', icon: BarChart3 },
  { href: '/decision-insights', labelKey: 'nav.decisionInsights', icon: Lightbulb },
  { href: '/market', labelKey: 'nav.market', icon: TrendingUp },
];

const CATALOG_ICONS: Record<string, LucideIcon> = {
  equipment: Truck,
  commodity: Gem,
  country: Globe2,
};

function isNavActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function catalogIcon(item: NavCatalogItem): LucideIcon {
  return CATALOG_ICONS[item.kind] ?? Library;
}

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCatalogsOpen, setMobileCatalogsOpen] = useState(false);
  const { t } = useLanguage();

  const catalogsActive = isCatalogNavPath(pathname);

  const linkClass = (active: boolean) =>
    cn(
      'flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs xl:text-sm font-medium transition-colors whitespace-nowrap',
      active
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
    );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Mountain className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            {t('nav.brand')}
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1" aria-label={t('nav.brand')}>
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={linkClass(active)}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {t(item.labelKey)}
              </Link>
            );
          })}

          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                linkClass(catalogsActive),
                'outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent'
              )}
              aria-label={t('nav.catalogs')}
            >
              <Library className="h-4 w-4 shrink-0" aria-hidden />
              {t('nav.catalogs')}
              <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[12rem]">
              {NAV_IMPLEMENTED_CATALOGS.map((item) => {
                const Icon = catalogIcon(item);
                const active = isNavActive(pathname, item.href);
                return (
                  <DropdownMenuItem key={item.kind} asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex cursor-pointer items-center gap-2',
                        active && 'bg-primary/10 text-primary'
                      )}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      {t(item.labelKey)}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

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
          {mobileOpen ? (
            <X className="h-5 w-5" aria-hidden />
          ) : (
            <Menu className="h-5 w-5" aria-hidden />
          )}
        </button>
      </div>

      {mobileOpen ? (
        <div
          id="mobile-nav"
          className="lg:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl"
        >
          <nav className="flex flex-col p-4 gap-1" aria-label={t('nav.brand')}>
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {t(item.labelKey)}
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => setMobileCatalogsOpen((o) => !o)}
              className={cn(
                'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                catalogsActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent'
              )}
              aria-expanded={mobileCatalogsOpen}
              aria-controls="mobile-catalogs"
            >
              <span className="flex items-center gap-2">
                <Library className="h-4 w-4" aria-hidden />
                {t('nav.catalogs')}
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  mobileCatalogsOpen && 'rotate-180'
                )}
                aria-hidden
              />
            </button>
            {mobileCatalogsOpen ? (
              <div id="mobile-catalogs" className="ml-4 flex flex-col gap-1 border-l border-border/40 pl-2">
                {NAV_IMPLEMENTED_CATALOGS.map((item) => {
                  const Icon = catalogIcon(item);
                  const active = isNavActive(pathname, item.href);
                  return (
                    <Link
                      key={item.kind}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent'
                      )}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </div>
            ) : null}

            <div className="pt-2 border-t border-border/40 flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
