export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEMO_PROJECT_IDS, ensureAllDemoProjects } from '@/lib/demo';

/**
 * GET /api/demo/ensure
 * Ensures every registered demo project exists (idempotent, no deletes).
 */
export async function GET() {
  try {
    const results = await ensureAllDemoProjects(prisma);
    const projects = await prisma.miningProject.findMany({
      where: { id: { in: [...DEMO_PROJECT_IDS] } },
      include: {
        cashFlows: { orderBy: { year: 'asc' } },
        equipments: true,
        personnels: true,
        byProducts: true,
        methodCosts: true,
      },
    });

    const order = new Map(
      (DEMO_PROJECT_IDS as readonly string[]).map((id, index) => [id, index])
    );
    projects.sort(
      (a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999)
    );

    return NextResponse.json({
      results,
      count: results.length,
      created: results.filter((r) => r.created).length,
      projects,
    });
  } catch (error: unknown) {
    console.error('Demo ensure error:', error);
    const message = error instanceof Error ? error.message : 'Demo projects could not be prepared';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
