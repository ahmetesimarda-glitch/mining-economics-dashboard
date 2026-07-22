import type { PrismaClient } from '@prisma/client';
import type { AnalyticsEventType } from './types';

export interface AnalyticsSummary {
  visitors: number;
  returningVisitors: number;
  projectsCreated: number;
  reportsGenerated: number;
  pdfDownloads: number;
  excelDownloads: number;
  averageSessionDurationSec: number;
  mostUsedFeatures: { eventType: string; count: number }[];
  recentVisitors: { visitorId: string; lastSeen: string; events: number }[];
  recentActivity: {
    id: string;
    visitorId: string;
    eventType: string;
    projectId: string | null;
    createdAt: string;
  }[];
  funnel: { step: string; count: number }[];
  timeline: { visitorId: string; events: { eventType: string; createdAt: string }[] }[];
}

const FUNNEL_STEPS: AnalyticsEventType[] = [
  'first_visit',
  'demo_project_opened',
  'new_project_created',
  'monte_carlo_executed',
  'pdf_generated',
];

export async function buildAnalyticsSummary(
  prisma: PrismaClient
): Promise<AnalyticsSummary> {
  const events = await prisma.demoAnalyticsEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5000,
  });

  const byVisitor = new Map<string, typeof events>();
  for (const event of events) {
    const list = byVisitor.get(event.visitorId) ?? [];
    list.push(event);
    byVisitor.set(event.visitorId, list);
  }

  const visitors = byVisitor.size;
  let returningVisitors = 0;
  const sessionDurations: number[] = [];

  for (const [, list] of byVisitor) {
    const sorted = [...list].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
    if (sorted.length >= 2) {
      const spanDays =
        (sorted[sorted.length - 1].createdAt.getTime() - sorted[0].createdAt.getTime()) /
        (1000 * 60 * 60 * 24);
      if (spanDays >= 0.5 || list.some((e) => e.eventType === 'returning_visit')) {
        returningVisitors += 1;
      }
    }

    const starts = sorted.filter((e) => e.eventType === 'session_started');
    const ends = sorted.filter((e) => e.eventType === 'session_ended');
    for (let i = 0; i < Math.min(starts.length, ends.length); i++) {
      const ms = ends[i].createdAt.getTime() - starts[i].createdAt.getTime();
      if (ms > 0 && ms < 1000 * 60 * 60 * 8) sessionDurations.push(ms / 1000);
    }
  }

  const countType = (type: string) =>
    events.filter((e) => e.eventType === type).length;

  const featureCounts = new Map<string, number>();
  for (const event of events) {
    featureCounts.set(event.eventType, (featureCounts.get(event.eventType) ?? 0) + 1);
  }

  const mostUsedFeatures = Array.from(featureCounts.entries())
    .map(([eventType, count]) => ({ eventType, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const recentVisitors = Array.from(byVisitor.entries())
    .map(([visitorId, list]) => {
      const last = list.reduce((a, b) =>
        a.createdAt > b.createdAt ? a : b
      );
      return {
        visitorId,
        lastSeen: last.createdAt.toISOString(),
        events: list.length,
      };
    })
    .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))
    .slice(0, 20);

  const recentActivity = events.slice(0, 40).map((e) => ({
    id: e.id,
    visitorId: e.visitorId,
    eventType: e.eventType,
    projectId: e.projectId,
    createdAt: e.createdAt.toISOString(),
  }));

  const funnel = FUNNEL_STEPS.map((step) => ({
    step,
    count: new Set(
      events.filter((e) => e.eventType === step).map((e) => e.visitorId)
    ).size,
  }));

  const timeline = Array.from(byVisitor.entries())
    .slice(0, 12)
    .map(([visitorId, list]) => ({
      visitorId,
      events: [...list]
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .slice(-15)
        .map((e) => ({
          eventType: e.eventType,
          createdAt: e.createdAt.toISOString(),
        })),
    }));

  const averageSessionDurationSec =
    sessionDurations.length > 0
      ? sessionDurations.reduce((s, n) => s + n, 0) / sessionDurations.length
      : 0;

  return {
    visitors,
    returningVisitors,
    projectsCreated: countType('new_project_created'),
    reportsGenerated: countType('pdf_generated') + countType('excel_exported'),
    pdfDownloads: countType('pdf_generated'),
    excelDownloads: countType('excel_exported'),
    averageSessionDurationSec,
    mostUsedFeatures,
    recentVisitors,
    recentActivity,
    funnel,
    timeline,
  };
}
