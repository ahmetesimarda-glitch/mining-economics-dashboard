export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAnalyticsEventType } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const visitorId = String(body.visitorId ?? '').trim();
    const eventType = String(body.eventType ?? '').trim();
    if (!visitorId || !isAnalyticsEventType(eventType)) {
      return NextResponse.json({ error: 'Invalid analytics payload' }, { status: 400 });
    }

    const event = await prisma.demoAnalyticsEvent.create({
      data: {
        visitorId,
        eventType,
        projectId:
          typeof body.projectId === 'string' && body.projectId.trim()
            ? body.projectId.trim()
            : null,
        path: typeof body.path === 'string' ? body.path.slice(0, 300) : '',
        metadata:
          body.metadata && typeof body.metadata === 'object'
            ? (body.metadata as object)
            : undefined,
      },
    });

    return NextResponse.json({ id: event.id }, { status: 201 });
  } catch (error: unknown) {
    console.error('Analytics event error:', error);
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }
}
