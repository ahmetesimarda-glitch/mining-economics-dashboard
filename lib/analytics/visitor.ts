import {
  SESSION_STARTED_AT_KEY,
  VISITOR_FIRST_SEEN_KEY,
  VISITOR_STORAGE_KEY,
} from './types';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function createVisitorId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Stable visitor UUID stored locally and reused across sessions. */
export function getOrCreateVisitorId(): string {
  if (!canUseStorage()) return 'server';
  const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);
  if (existing) return existing;
  const id = createVisitorId();
  window.localStorage.setItem(VISITOR_STORAGE_KEY, id);
  window.localStorage.setItem(VISITOR_FIRST_SEEN_KEY, new Date().toISOString());
  return id;
}

/** True when no visitor UUID exists yet (call before getOrCreateVisitorId). */
export function isFirstVisitBrowser(): boolean {
  if (!canUseStorage()) return false;
  return !window.localStorage.getItem(VISITOR_STORAGE_KEY);
}

export function markSessionStarted(): string {
  const started = new Date().toISOString();
  if (canUseStorage()) {
    window.localStorage.setItem(SESSION_STARTED_AT_KEY, started);
  }
  return started;
}

export function getSessionStartedAt(): string | null {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(SESSION_STARTED_AT_KEY);
}
