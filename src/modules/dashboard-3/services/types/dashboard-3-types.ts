import type { LucideIcon } from "lucide-react"

export interface MarketingMetric {
  title: string
  value: string
  description: string
  change: string
  trend: "up" | "down"
  icon: LucideIcon
  footer: string
  subfooter: string
}

export interface AudiencePoint {
  [key: string]: string | number
  date: string
  followers: number
  impressions: number
  engagement: number
}

export interface ChannelPerformance {
  [key: string]: string | number
  channel: string
  reach: number
  engagement: number
}

export interface SocialMixItem {
  [key: string]: string | number
  name: string
  value: number
  color: string
}

export interface Campaign {
  name: string
  channel: string
  owner: string
  budget: string
  roi: string
  status: "Live" | "Optimizing" | "Review"
}

export interface ContentPipelineItem {
  stage: string
  value: number
  total: number
  icon: LucideIcon
}

export interface TopPost {
  title: string
  network: string
  metric: string
  delta: string
}

export interface ActivityItem {
  user: string
  title: string
  description: string
  time: string
}
