-- CreateTable
CREATE TABLE "DemoAnalyticsEvent" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "projectId" TEXT,
    "path" TEXT NOT NULL DEFAULT '',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DemoAnalyticsEvent_visitorId_idx" ON "DemoAnalyticsEvent"("visitorId");

-- CreateIndex
CREATE INDEX "DemoAnalyticsEvent_eventType_idx" ON "DemoAnalyticsEvent"("eventType");

-- CreateIndex
CREATE INDEX "DemoAnalyticsEvent_createdAt_idx" ON "DemoAnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "DemoAnalyticsEvent_visitorId_createdAt_idx" ON "DemoAnalyticsEvent"("visitorId", "createdAt");
