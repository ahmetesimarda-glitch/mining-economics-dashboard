export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { seedEquipmentCatalogIdempotent } from '@/lib/master-data';

/**
 * GET /api/master-data/equipment/ensure
 *
 * Production self-heal: upsert the commercial Equipment Catalog master
 * dataset (idempotent). Never deletes; preserves manually created rows.
 * Mirrors /api/demo/ensure so catalog data does not depend on a one-shot
 * `prisma db seed` during deploy.
 */
export async function GET() {
  try {
    const result = await seedEquipmentCatalogIdempotent(prisma);
    const totalInDb = await prisma.equipmentCatalogItem.count();
    return NextResponse.json({
      ...result,
      totalInDb,
    });
  } catch (error: unknown) {
    console.error('Equipment catalog ensure error:', error);
    const message =
      error instanceof Error ? error.message : 'Equipment catalog could not be prepared';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
