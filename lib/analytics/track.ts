import type { AnalyticsEventType } from './types';
import { getOrCreateVisitorId } from './visitor';

export interface TrackEventOptions {
  projectId?: string;
  path?: string;
  metadata?: Record<string, unknown>;
}

/** Fire-and-forget analytics event (never throws to callers). */
export async function trackAnalyticsEvent(
  eventType: AnalyticsEventType,
  options: TrackEventOptions = {}
): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    const visitorId = getOrCreateVisitorId();
    await fetch('/api/internal/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        eventType,
        projectId: options.projectId,
        path: options.path ?? window.location.pathname,
        metadata: options.metadata ?? {},
      }),
      keepalive: true,
    });
  } catch {
    // Analytics must never break product UX.
  }
}
