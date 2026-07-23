import { Suspense } from 'react';
import { DecisionInsightsClient } from './decision-insights-client';

export default function DecisionInsightsPage() {
  return (
    <Suspense fallback={null}>
      <DecisionInsightsClient />
    </Suspense>
  );
}
