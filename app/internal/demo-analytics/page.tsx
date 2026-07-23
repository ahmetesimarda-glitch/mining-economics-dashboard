import { DemoAnalyticsClient } from './demo-analytics-client';
import { isInternalAnalyticsEnabled } from '@/lib/analytics/gate';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function DemoAnalyticsPage() {
  if (!isInternalAnalyticsEnabled()) {
    notFound();
  }
  return <DemoAnalyticsClient />;
}
