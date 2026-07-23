'use client';

import { Loader2 } from 'lucide-react';

/** Route-level loading fallback for App Router navigations. */
export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <span className="sr-only">Loading</span>
    </div>
  );
}
