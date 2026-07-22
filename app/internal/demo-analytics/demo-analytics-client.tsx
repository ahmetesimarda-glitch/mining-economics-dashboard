'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/app/components/header';
import type { AnalyticsSummary } from '@/lib/analytics';
import { Loader2 } from 'lucide-react';

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold">{value}</p>
    </div>
  );
}

export function DemoAnalyticsClient() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/internal/analytics/summary');
        if (!res.ok) {
          setError('Failed to load analytics');
          return;
        }
        setData((await res.json()) as AnalyticsSummary);
      } catch {
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1200px] px-4 py-8 space-y-8">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Internal</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Demo Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Auth-free visitor telemetry for public demos. This page will become the Admin
            Dashboard after authentication is introduced.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading…
          </div>
        ) : error || !data ? (
          <p className="text-sm text-destructive">{error ?? 'No data'}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Metric label="Visitors" value={data.visitors} />
              <Metric label="Returning Visitors" value={data.returningVisitors} />
              <Metric label="Projects Created" value={data.projectsCreated} />
              <Metric label="Reports Generated" value={data.reportsGenerated} />
              <Metric label="PDF Downloads" value={data.pdfDownloads} />
              <Metric label="Excel Downloads" value={data.excelDownloads} />
              <Metric
                label="Avg Session (sec)"
                value={Math.round(data.averageSessionDurationSec)}
              />
              <Metric
                label="Tracked Events"
                value={data.mostUsedFeatures.reduce((s, f) => s + f.count, 0)}
              />
            </div>

            <section className="rounded-xl border border-border/50 bg-card p-5">
              <h2 className="font-display text-lg font-semibold mb-3">Conversion Funnel</h2>
              <div className="space-y-2">
                {data.funnel.map((step) => (
                  <div key={step.step} className="flex items-center gap-3 text-sm">
                    <span className="w-44 text-muted-foreground font-mono text-xs">
                      {step.step}
                    </span>
                    <div className="flex-1 h-2 rounded bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary/80"
                        style={{
                          width: `${Math.max(
                            4,
                            data.visitors ? (step.count / data.visitors) * 100 : 0
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono">{step.count}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <section className="rounded-xl border border-border/50 bg-card p-5">
                <h2 className="font-display text-lg font-semibold mb-3">Most Used Features</h2>
                <ul className="space-y-1.5 text-sm">
                  {data.mostUsedFeatures.map((f) => (
                    <li key={f.eventType} className="flex justify-between gap-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        {f.eventType}
                      </span>
                      <span className="font-mono">{f.count}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-xl border border-border/50 bg-card p-5">
                <h2 className="font-display text-lg font-semibold mb-3">Recent Visitors</h2>
                <ul className="space-y-1.5 text-sm max-h-72 overflow-y-auto">
                  {data.recentVisitors.map((v) => (
                    <li key={v.visitorId} className="flex justify-between gap-3">
                      <span className="font-mono text-[11px] truncate">{v.visitorId}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {v.events} evt · {new Date(v.lastSeen).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <section className="rounded-xl border border-border/50 bg-card p-5">
              <h2 className="font-display text-lg font-semibold mb-3">Recent Activity</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b border-border/50">
                      <th className="py-2 pr-3">When</th>
                      <th className="py-2 pr-3">Visitor</th>
                      <th className="py-2 pr-3">Event</th>
                      <th className="py-2">Project</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentActivity.map((row) => (
                      <tr key={row.id} className="border-b border-border/30">
                        <td className="py-2 pr-3 font-mono text-xs">
                          {new Date(row.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 pr-3 font-mono text-[11px] truncate max-w-[140px]">
                          {row.visitorId}
                        </td>
                        <td className="py-2 pr-3 font-mono text-xs">{row.eventType}</td>
                        <td className="py-2 font-mono text-xs">{row.projectId ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-xl border border-border/50 bg-card p-5">
              <h2 className="font-display text-lg font-semibold mb-3">Visitor Timeline</h2>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {data.timeline.map((t) => (
                  <div key={t.visitorId}>
                    <p className="font-mono text-[11px] text-muted-foreground mb-1">
                      {t.visitorId}
                    </p>
                    <ol className="border-l border-border/60 pl-3 space-y-1">
                      {t.events.map((e, i) => (
                        <li key={`${t.visitorId}-${i}`} className="text-xs">
                          <span className="font-mono text-muted-foreground">
                            {new Date(e.createdAt).toLocaleString()}
                          </span>{' '}
                          · {e.eventType}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
