export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureCopperMineDemo, DEMO_PROJECT_ID } from '@/lib/demo';

/**
 * GET /api/demo/ensure
 * Ensures the Copper Mine Demo project exists (idempotent, no deletes).
 */
export async function GET() {
  try {
    const result = await ensureCopperMineDemo(prisma);
    const project = await prisma.miningProject.findUnique({
      where: { id: DEMO_PROJECT_ID },
      include: {
        cashFlows: { orderBy: { year: 'asc' } },
        equipments: true,
        personnels: true,
        byProducts: true,
        methodCosts: true,
      },
    });

    return NextResponse.json({
      id: result.id,
      created: result.created,
      project,
    });
  } catch (error: unknown) {
    console.error('Demo ensure error:', error);
    const message = error instanceof Error ? error.message : 'Demo project could not be prepared';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
