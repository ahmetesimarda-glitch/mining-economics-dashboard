/**
 * Gate for internal demo-analytics surfaces.
 * Summary UI/API require INTERNAL_ANALYTICS_ENABLED=true.
 * Event ingestion stays available so product telemetry continues to work.
 */
export function isInternalAnalyticsEnabled(): boolean {
  const flag = process.env.INTERNAL_ANALYTICS_ENABLED;
  if (flag === 'true' || flag === '1') return true;
  // Allow in local development for operators
  if (process.env.NODE_ENV !== 'production') return true;
  return false;
}
