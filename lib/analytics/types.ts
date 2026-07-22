export const ANALYTICS_EVENT_TYPES = [
  'first_visit',
  'returning_visit',
  'session_started',
  'session_ended',
  'demo_project_opened',
  'new_project_created',
  'project_opened',
  'equipment_viewed',
  'monte_carlo_executed',
  'sensitivity_executed',
  'pdf_generated',
  'excel_exported',
  'report_viewed',
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

export const VISITOR_STORAGE_KEY = 'med.visitorId';
export const VISITOR_FIRST_SEEN_KEY = 'med.visitorFirstSeen';
export const SESSION_STARTED_AT_KEY = 'med.sessionStartedAt';

export function isAnalyticsEventType(value: string): value is AnalyticsEventType {
  return (ANALYTICS_EVENT_TYPES as readonly string[]).includes(value);
}
