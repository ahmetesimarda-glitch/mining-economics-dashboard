import type { DemoAccent } from './types';
import type { DemoProjectId } from './constants';

/** Client-safe card metadata (no calculation engine imports). */
export interface DemoCardMeta {
  id: DemoProjectId;
  name: string;
  mineType: string;
  miningMethod: string;
  country: string;
  productionLabel: string;
  accent: DemoAccent;
  projectLifeYears: number;
}

/**
 * Display metadata for the demo portfolio gallery.
 * Keep in sync with `lib/demo/projects/*` definitions.
 */
export const DEMO_CARD_META: readonly DemoCardMeta[] = [
  {
    id: 'demo-copper-mine',
    name: 'Atacama Copper Project',
    mineType: 'copper',
    miningMethod: 'openPit',
    country: 'Chile',
    productionLabel: '4.8 Mtpa ore (~27 ktpa Cu)',
    accent: 'copper',
    projectLifeYears: 25,
  },
  {
    id: 'demo-gold-turkiye',
    name: 'Anatolia Gold Project',
    mineType: 'gold',
    miningMethod: 'underground',
    country: 'Türkiye',
    productionLabel: '2.4 tpa Au',
    accent: 'gold',
    projectLifeYears: 15,
  },
  {
    id: 'demo-iron-brazil',
    name: 'Carajás Iron Project',
    mineType: 'iron',
    miningMethod: 'openPit',
    country: 'Brazil',
    productionLabel: '12 Mtpa Fe ore',
    accent: 'iron',
    projectLifeYears: 22,
  },
  {
    id: 'demo-lithium-argentina',
    name: 'Puna Lithium Project',
    mineType: 'lithium',
    miningMethod: 'openPit',
    country: 'Argentina',
    productionLabel: '220 ktpa SC6',
    accent: 'lithium',
    projectLifeYears: 20,
  },
  {
    id: 'demo-nickel-canada',
    name: 'Sudbury Nickel Project',
    mineType: 'nickel',
    miningMethod: 'underground',
    country: 'Canada',
    productionLabel: '35 ktpa Ni',
    accent: 'nickel',
    projectLifeYears: 18,
  },
  {
    id: 'demo-coal-australia',
    name: 'Hunter Valley Coal Project',
    mineType: 'coal',
    miningMethod: 'underground',
    country: 'Australia',
    productionLabel: '4.2 Mtpa coal',
    accent: 'coal',
    projectLifeYears: 20,
  },
  {
    id: 'demo-zinc-peru',
    name: 'Andes Zinc Project',
    mineType: 'zinc',
    miningMethod: 'underground',
    country: 'Peru',
    productionLabel: '95 ktpa Zn',
    accent: 'zinc',
    projectLifeYears: 16,
  },
  {
    id: 'demo-rare-earth-sweden',
    name: 'Kiruna Rare Earth Project',
    mineType: 'rareEarth',
    miningMethod: 'openPit',
    country: 'Sweden',
    productionLabel: '12 ktpa TREO',
    accent: 'rareEarth',
    projectLifeYears: 18,
  },
] as const;

export const DEMO_ACCENT_STYLES: Record<
  DemoAccent,
  { gradient: string; iconBg: string; iconText: string; ring: string }
> = {
  copper: {
    gradient: 'from-orange-700/40 via-amber-900/20 to-transparent',
    iconBg: 'bg-orange-500/15',
    iconText: 'text-orange-400',
    ring: 'hover:border-orange-500/40',
  },
  gold: {
    gradient: 'from-yellow-600/35 via-amber-800/15 to-transparent',
    iconBg: 'bg-yellow-500/15',
    iconText: 'text-yellow-400',
    ring: 'hover:border-yellow-500/40',
  },
  iron: {
    gradient: 'from-red-800/40 via-stone-800/20 to-transparent',
    iconBg: 'bg-red-500/15',
    iconText: 'text-red-400',
    ring: 'hover:border-red-500/40',
  },
  lithium: {
    gradient: 'from-sky-600/35 via-cyan-900/20 to-transparent',
    iconBg: 'bg-sky-500/15',
    iconText: 'text-sky-400',
    ring: 'hover:border-sky-500/40',
  },
  nickel: {
    gradient: 'from-emerald-700/35 via-teal-900/20 to-transparent',
    iconBg: 'bg-emerald-500/15',
    iconText: 'text-emerald-400',
    ring: 'hover:border-emerald-500/40',
  },
  coal: {
    gradient: 'from-zinc-600/40 via-neutral-800/25 to-transparent',
    iconBg: 'bg-zinc-400/15',
    iconText: 'text-zinc-300',
    ring: 'hover:border-zinc-400/40',
  },
  zinc: {
    gradient: 'from-blue-700/35 via-indigo-900/20 to-transparent',
    iconBg: 'bg-blue-500/15',
    iconText: 'text-blue-400',
    ring: 'hover:border-blue-500/40',
  },
  rareEarth: {
    gradient: 'from-violet-700/35 via-fuchsia-900/15 to-transparent',
    iconBg: 'bg-violet-500/15',
    iconText: 'text-violet-400',
    ring: 'hover:border-violet-500/40',
  },
};
