import {
  CalendarDays,
  Eye,
  Heart,
  Megaphone,
  MessageCircle,
  MousePointerClick,
  Sparkles,
  Users,
} from "lucide-react"

import type { ChartConfig } from "@/components/ui/chart"
import type {
  ActivityItem,
  AudiencePoint,
  Campaign,
  ChannelPerformance,
  ContentPipelineItem,
  MarketingMetric,
  SocialMixItem,
  TopPost,
} from "./types/dashboard-3-types"

export const metrics: MarketingMetric[] = [
  {
    title: "Total Reach",
    value: "8.7M",
    description: "Across paid and organic channels",
    change: "+18.4%",
    trend: "up",
    icon: Eye,
    footer: "Audience expansion is accelerating",
    subfooter: "Best lift from short-form video",
  },
  {
    title: "Engagement Rate",
    value: "6.82%",
    description: "Weighted by impressions",
    change: "+2.1%",
    trend: "up",
    icon: Heart,
    footer: "Above quarterly benchmark",
    subfooter: "Comments and shares are leading",
  },
  {
    title: "New Followers",
    value: "124.8K",
    description: "Net growth this month",
    change: "+11.6%",
    trend: "up",
    icon: Users,
    footer: "Community growth remains healthy",
    subfooter: "Creator collaborations outperforming",
  },
  {
    title: "Cost Per Lead",
    value: "$18.42",
    description: "Blended acquisition cost",
    change: "-7.3%",
    trend: "down",
    icon: MousePointerClick,
    footer: "Efficiency improved this week",
    subfooter: "Retargeting audiences lowered CPL",
  },
]

export const audienceData: AudiencePoint[] = [
  { date: "Apr 01", followers: 842, impressions: 2100, engagement: 118 },
  { date: "Apr 04", followers: 891, impressions: 2380, engagement: 146 },
  { date: "Apr 07", followers: 944, impressions: 2610, engagement: 173 },
  { date: "Apr 10", followers: 1012, impressions: 3120, engagement: 209 },
  { date: "Apr 13", followers: 1075, impressions: 3350, engagement: 241 },
  { date: "Apr 16", followers: 1168, impressions: 3980, engagement: 298 },
  { date: "Apr 19", followers: 1215, impressions: 4260, engagement: 322 },
  { date: "Apr 22", followers: 1318, impressions: 4890, engagement: 386 },
]

export const audienceChartConfig = {
  followers: {
    label: "Followers",
    color: "var(--chart-1)",
  },
  impressions: {
    label: "Impressions",
    color: "var(--chart-2)",
  },
  engagement: {
    label: "Engagement",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

export const channelData: ChannelPerformance[] = [
  { channel: "Instagram", reach: 3200, engagement: 2480 },
  { channel: "TikTok", reach: 4100, engagement: 3180 },
  { channel: "LinkedIn", reach: 1900, engagement: 980 },
  { channel: "YouTube", reach: 2600, engagement: 1420 },
  { channel: "X", reach: 1500, engagement: 760 },
]

export const channelChartConfig = {
  reach: {
    label: "Reach",
    color: "var(--chart-1)",
  },
  engagement: {
    label: "Engagement",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

export const socialMixData: SocialMixItem[] = [
  { name: "Paid Social", value: 38, color: "var(--chart-1)" },
  { name: "Organic", value: 27, color: "var(--chart-2)" },
  { name: "Creators", value: 22, color: "var(--chart-3)" },
  { name: "Community", value: 13, color: "var(--chart-4)" },
]

export const socialMixConfig = {
  paid: {
    label: "Paid Social",
    color: "var(--chart-1)",
  },
  organic: {
    label: "Organic",
    color: "var(--chart-2)",
  },
  creators: {
    label: "Creators",
    color: "var(--chart-3)",
  },
  community: {
    label: "Community",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

export const campaigns: Campaign[] = [
  {
    name: "Spring Product Launch",
    channel: "TikTok + Instagram",
    owner: "Lena",
    budget: "$42,000",
    roi: "4.8x",
    status: "Live",
  },
  {
    name: "Founder Thought Leadership",
    channel: "LinkedIn",
    owner: "Marcus",
    budget: "$8,500",
    roi: "3.1x",
    status: "Optimizing",
  },
  {
    name: "Creator Spark Program",
    channel: "Creators",
    owner: "Nora",
    budget: "$28,400",
    roi: "5.6x",
    status: "Live",
  },
  {
    name: "Retargeting Warm Leads",
    channel: "Paid Social",
    owner: "Quinn",
    budget: "$18,200",
    roi: "6.2x",
    status: "Review",
  },
]

export const contentPipeline: ContentPipelineItem[] = [
  { stage: "Ideas", value: 28, total: 40, icon: Sparkles },
  { stage: "Scripting", value: 17, total: 24, icon: MessageCircle },
  { stage: "Production", value: 12, total: 18, icon: Megaphone },
  { stage: "Scheduled", value: 31, total: 36, icon: CalendarDays },
]

export const topPosts: TopPost[] = [
  {
    title: "Behind the launch week workflow",
    network: "TikTok",
    metric: "1.8M views",
    delta: "+24%",
  },
  {
    title: "Customer story carousel",
    network: "Instagram",
    metric: "84K saves",
    delta: "+17%",
  },
  {
    title: "Market insight thread",
    network: "LinkedIn",
    metric: "19K clicks",
    delta: "+9%",
  },
]

export const activityFeed: ActivityItem[] = [
  {
    user: "LN",
    title: "Lena approved three creator drafts",
    description: "Ready for publishing on Friday",
    time: "12 min ago",
  },
  {
    user: "MQ",
    title: "Marcus paused a low-CTR ad set",
    description: "Budget shifted to retargeting",
    time: "34 min ago",
  },
  {
    user: "NS",
    title: "Nora added 14 UGC clips",
    description: "Queued for product launch edits",
    time: "1 hr ago",
  },
]
