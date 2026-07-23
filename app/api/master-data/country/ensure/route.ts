export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { seedCountryCatalogIdempotent } from '@/lib/master-data';

/**
 * GET /api/master-data/country/ensure
 * Production self-heal for Country Master Data (idempotent upsert).
 */
export async function GET() {
  try {
    const result = await seedCountryCatalogIdempotent(prisma);
    const totalInDb = await prisma.countryCatalogItem.count();
    return NextResponse.json({ ...result, totalInDb });
  } catch (error: unknown) {
    console.error('Country catalog ensure error:', error);
    const message =
      error instanceof Error ? error.message : 'Country catalog could not be prepared';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
