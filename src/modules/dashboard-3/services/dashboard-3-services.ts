import { getFirestoreCollection } from "@/lib/firebase/firestore-query"

import {
  activityFeed,
  audienceChartConfig,
  audienceData,
  campaigns,
  channelChartConfig,
  channelData,
  contentPipeline,
  metrics,
  socialMixConfig,
  socialMixData,
  topPosts,
} from "./dashboard-3-mock-data"
import type { ContentPipelineItem, MarketingMetric } from "./types/dashboard-3-types"

const metricIconByTitle = new Map(metrics.map((metric) => [metric.title, metric.icon]))
const pipelineIconByStage = new Map(contentPipeline.map((item) => [item.stage, item.icon]))

export const marketingDashboardFallbackData = {
  activityFeed,
  audienceChartConfig,
  audienceData,
  campaigns,
  channelChartConfig,
  channelData,
  contentPipeline,
  metrics,
  socialMixConfig,
  socialMixData,
  topPosts,
}

function withMetricIcons(items: MarketingMetric[]) {
  return items.map((item) => ({
    ...item,
    icon: item.icon ?? metricIconByTitle.get(item.title)!,
  }))
}

function withPipelineIcons(items: ContentPipelineItem[]) {
  return items.map((item) => ({
    ...item,
    icon: item.icon ?? pipelineIconByStage.get(item.stage)!,
  }))
}

export async function getMarketingDashboardData() {
  const [
    firestoreMetrics,
    firestoreAudienceData,
    firestoreChannelData,
    firestoreSocialMixData,
    firestoreCampaigns,
    firestoreContentPipeline,
    firestoreTopPosts,
    firestoreActivityFeed,
  ] = await Promise.all([
    getFirestoreCollection("marketingMetrics", metrics),
    getFirestoreCollection("audiencePoints", audienceData),
    getFirestoreCollection("channelPerformances", channelData),
    getFirestoreCollection("socialMixes", socialMixData),
    getFirestoreCollection("campaigns", campaigns),
    getFirestoreCollection("contentPipelines", contentPipeline),
    getFirestoreCollection("topPosts", topPosts),
    getFirestoreCollection("activityFeeds", activityFeed),
  ])

  return {
    activityFeed: firestoreActivityFeed,
    audienceChartConfig,
    audienceData: firestoreAudienceData,
    campaigns: firestoreCampaigns,
    channelChartConfig,
    channelData: firestoreChannelData,
    contentPipeline: withPipelineIcons(firestoreContentPipeline),
    metrics: withMetricIcons(firestoreMetrics),
    socialMixConfig,
    socialMixData: firestoreSocialMixData,
    topPosts: firestoreTopPosts,
  }
}

export type MarketingDashboardData = Awaited<ReturnType<typeof getMarketingDashboardData>>
