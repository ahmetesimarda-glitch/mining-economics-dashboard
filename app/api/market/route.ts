export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';

// ---- Basit bellek içi önbellek (5 dk) ----
let cache: { data: any; ts: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

const METALS = [
  { symbol: 'XAU', key: 'gold' },
  { symbol: 'XAG', key: 'silver' },
  { symbol: 'HG', key: 'copper' },
  { symbol: 'XPT', key: 'platinum' },
  { symbol: 'XPD', key: 'palladium' },
];

async function fetchJson(url: string, timeoutMs = 8000): Promise<any | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
    clearTimeout(t);
    if (!res?.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
      return NextResponse.json({ ...cache.data, cached: true });
    }

    const [metalResults, fx] = await Promise.all([
      Promise.all(METALS.map((m) => fetchJson(`https://api.gold-api.com/price/${m.symbol}`))),
      fetchJson('https://open.er-api.com/v6/latest/USD'),
    ]);

    const OZ_TO_GRAM = 31.1035;
    const LB_TO_TON = 2204.62;

    const metals: any = {};
    METALS.forEach((m, i) => {
      const r = metalResults?.[i];
      if (r?.price) {
        metals[m.key] = {
          name: r?.name ?? m.key,
          symbol: m.symbol,
          priceUsd: r.price,
          // Altın/gümüş/platin/paladyum: USD/ons → USD/gram; bakır (HG): USD/lb → USD/ton
          unit: m.symbol === 'HG' ? 'USD/lb' : 'USD/oz',
          altPrice: m.symbol === 'HG' ? r.price * LB_TO_TON : r.price / OZ_TO_GRAM,
          altUnit: m.symbol === 'HG' ? 'USD/ton' : 'USD/gram',
          updatedAt: r?.updatedAt ?? null,
        };
      }
    });

    const rates = fx?.rates ?? null;
    const currency = rates
      ? {
          usdTry: rates?.TRY ?? null,
          eurTry: rates?.TRY && rates?.EUR ? rates.TRY / rates.EUR : null,
          usdEur: rates?.EUR ?? null,
          updatedAt: fx?.time_last_update_utc ?? null,
        }
      : null;

    const data = {
      metals,
      currency,
      fetchedAt: new Date().toISOString(),
      sources: {
        metals: 'gold-api.com (canlı)',
        currency: 'open.er-api.com (günlük)',
      },
    };

    if (Object.keys(metals).length > 0 || currency) {
      cache = { data, ts: Date.now() };
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Piyasa verisi hatası:', error);
    return NextResponse.json({ error: 'Market data could not be loaded' }, { status: 500 });
  }
}
