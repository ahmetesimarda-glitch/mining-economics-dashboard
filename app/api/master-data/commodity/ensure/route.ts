export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { seedCommodityCatalogIdempotent } from '@/lib/master-data';

/**
 * GET /api/master-data/commodity/ensure
 * Production self-heal for Commodity Master Data (idempotent upsert).
 */
export async function GET() {
  try {
    const result = await seedCommodityCatalogIdempotent(prisma);
    const totalInDb = await prisma.commodityCatalogItem.count();
    return NextResponse.json({ ...result, totalInDb });
  } catch (error: unknown) {
    console.error('Commodity catalog ensure error:', error);
    const message = 'Commodity catalog could not be prepared';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
