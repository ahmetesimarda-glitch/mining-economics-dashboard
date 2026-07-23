export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildAnalyticsSummary } from '@/lib/analytics';
import { isInternalAnalyticsEnabled } from '@/lib/analytics/gate';

export async function GET() {
  if (!isInternalAnalyticsEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  try {
    const summary = await buildAnalyticsSummary(prisma);
    return NextResponse.json(summary);
  } catch (error: unknown) {
    console.error('Analytics summary error:', error);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
