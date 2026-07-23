/**
 * TEMPORARY pre-auth gate for internal demo-analytics summary surfaces.
 *
 * Summary UI (`/internal/demo-analytics`) and `GET /api/internal/analytics/summary`
 * require INTERNAL_ANALYTICS_ENABLED=true in production (local non-production stays open).
 * Event ingestion stays available so product telemetry continues to work.
 *
 * DO NOT replace this with a standalone RBAC patch.
 * When Authentication is fully implemented (see ai-docs/ROADMAP.md §5–§6):
 *   1. Remove INTERNAL_ANALYTICS_ENABLED and this helper.
 *   2. Protect all `/internal/*` routes with authenticated Administrator role checks.
 *   3. Unauthenticated → redirect to login.
 *   4. Authenticated non-admin → 403 (or authz redirect), never a masked 404.
 *   5. Only Administrator may access internal analytics and other internal pages.
 */
export function isInternalAnalyticsEnabled(): boolean {
  const flag = process.env.INTERNAL_ANALYTICS_ENABLED;
  if (flag === 'true' || flag === '1') return true;
  // Allow in local development for operators
  if (process.env.NODE_ENV !== 'production') return true;
  return false;
}
