/** OEM master metadata for catalog seeds (websites, country, search aliases). */

export interface OemProfile {
  manufacturer: string;
  country: string;
  oemWebsite: string;
  searchAliases: string;
}

export const OEM_PROFILES: Record<string, OemProfile> = {
  Caterpillar: {
    manufacturer: 'Caterpillar',
    country: 'USA',
    oemWebsite: 'https://www.cat.com',
    searchAliases: 'CAT,Cat,Caterpillar',
  },
  Komatsu: {
    manufacturer: 'Komatsu',
    country: 'Japan',
    oemWebsite: 'https://www.komatsu.com',
    searchAliases: 'Komatsu',
  },
  Liebherr: {
    manufacturer: 'Liebherr',
    country: 'Germany',
    oemWebsite: 'https://www.liebherr.com',
    searchAliases: 'Liebherr',
  },
  Hitachi: {
    manufacturer: 'Hitachi',
    country: 'Japan',
    oemWebsite: 'https://www.hitachicm.com',
    searchAliases: 'Hitachi,HCM',
  },
  'Volvo CE': {
    manufacturer: 'Volvo CE',
    country: 'Sweden',
    oemWebsite: 'https://www.volvoce.com',
    searchAliases: 'Volvo,Volvo CE,Volvo Construction Equipment',
  },
  Epiroc: {
    manufacturer: 'Epiroc',
    country: 'Sweden',
    oemWebsite: 'https://www.epiroc.com',
    searchAliases: 'Epiroc',
  },
  Sandvik: {
    manufacturer: 'Sandvik',
    country: 'Sweden',
    oemWebsite: 'https://www.sandvik.com',
    searchAliases: 'Sandvik',
  },
  'Atlas Copco': {
    manufacturer: 'Atlas Copco',
    country: 'Sweden',
    oemWebsite: 'https://www.atlascopco.com',
    searchAliases: 'Atlas Copco,AtlasCopco',
  },
  Metso: {
    manufacturer: 'Metso',
    country: 'Finland',
    oemWebsite: 'https://www.metso.com',
    searchAliases: 'Metso,Metso Outotec',
  },
  FLSmidth: {
    manufacturer: 'FLSmidth',
    country: 'Denmark',
    oemWebsite: 'https://www.flsmidth.com',
    searchAliases: 'FLSmidth,FLS,FL Smidth',
  },
  Normet: {
    manufacturer: 'Normet',
    country: 'Finland',
    oemWebsite: 'https://www.normet.com',
    searchAliases: 'Normet',
  },
  MacLean: {
    manufacturer: 'MacLean',
    country: 'Canada',
    oemWebsite: 'https://www.macleanengineering.com',
    searchAliases: 'MacLean,Maclean',
  },
  Bell: {
    manufacturer: 'Bell',
    country: 'South Africa',
    oemWebsite: 'https://www.bellequipment.com',
    searchAliases: 'Bell,Bell Equipment',
  },
  XCMG: {
    manufacturer: 'XCMG',
    country: 'China',
    oemWebsite: 'https://www.xcmg.com',
    searchAliases: 'XCMG',
  },
  SANY: {
    manufacturer: 'SANY',
    country: 'China',
    oemWebsite: 'https://www.sanyglobal.com',
    searchAliases: 'SANY,Sany',
  },
};

export function getOemProfile(manufacturer: string): OemProfile {
  const profile = OEM_PROFILES[manufacturer];
  if (!profile) {
    throw new Error(`Unknown OEM profile: ${manufacturer}`);
  }
  return profile;
}
