import { trackAnalyticsEvent } from './track';
import { getOrCreateVisitorId, markSessionStarted } from './visitor';
import { VISITOR_STORAGE_KEY } from './types';

/**
 * Bootstrap visitor identity + session events once per page-load lifecycle.
 * Returns a cleanup that records session_ended on beforeunload.
 */
export function bootstrapAnalyticsSession(): (() => void) | undefined {
  if (typeof window === 'undefined') return undefined;

  const hadVisitor = Boolean(window.localStorage.getItem(VISITOR_STORAGE_KEY));
  getOrCreateVisitorId();
  markSessionStarted();

  void trackAnalyticsEvent(hadVisitor ? 'returning_visit' : 'first_visit');
  void trackAnalyticsEvent('session_started');

  const onEnd = () => {
    void trackAnalyticsEvent('session_ended');
  };
  window.addEventListener('beforeunload', onEnd);
  return () => {
    window.removeEventListener('beforeunload', onEnd);
  };
}
