export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildAnalyticsSummary } from '@/lib/analytics';

export async function GET() {
  try {
    const summary = await buildAnalyticsSummary(prisma);
    return NextResponse.json(summary);
  } catch (error: unknown) {
    console.error('Analytics summary error:', error);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
