"use client"

import { useEffect, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  ArrowUpRight,
  CalendarDays,
  Eye,
  Heart,
  Megaphone,
  MessageCircle,
  MousePointerClick,
  Send,
  Share2,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getMarketingDashboardData,
  marketingDashboardFallbackData,
  type MarketingDashboardData,
} from "@/modules/dashboard-3/services/dashboard-3-services"

export function MarketingDashboard() {
  const [data, setData] = useState<MarketingDashboardData>(
    marketingDashboardFallbackData
  )

  useEffect(() => {
    getMarketingDashboardData().then(setData)
  }, [])

  return (
    <div className="flex-1 space-y-6 px-6 pt-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Marketing Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track social growth, campaign efficiency, and content performance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs defaultValue="30d">
            <TabsList>
              <TabsTrigger value="7d" className="cursor-pointer">
                7D
              </TabsTrigger>
              <TabsTrigger value="30d" className="cursor-pointer">
                30D
              </TabsTrigger>
              <TabsTrigger value="90d" className="cursor-pointer">
                90D
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" className="cursor-pointer">
            <Send className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="@container/main space-y-6">
        <MetricCards metrics={data.metrics} />

        <div className="grid grid-cols-1 gap-6 @5xl:grid-cols-3">
          <AudienceGrowthChart
            audienceData={data.audienceData}
            audienceChartConfig={data.audienceChartConfig}
          />
          <SocialMixCard
            socialMixData={data.socialMixData}
            socialMixConfig={data.socialMixConfig}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 @5xl:grid-cols-2">
          <ChannelPerformanceChart
            channelData={data.channelData}
            channelChartConfig={data.channelChartConfig}
          />
          <ContentPipelineCard contentPipeline={data.contentPipeline} />
        </div>

        <div className="grid grid-cols-1 gap-6 @5xl:grid-cols-3">
          <CampaignTable campaigns={data.campaigns} />
          <SocialActivityFeed
            activityFeed={data.activityFeed}
            topPosts={data.topPosts}
          />
        </div>
      </div>
    </div>
  )
}

function MetricCards({ metrics }: Pick<MarketingDashboardData, "metrics">) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 @5xl:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown

        return (
          <Card key={metric.title}>
            <CardHeader>
              <CardDescription>{metric.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {metric.value}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <TrendIcon className="h-4 w-4" />
                  {metric.change}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex items-center gap-2 font-medium">
                {metric.footer}
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <div className="text-muted-foreground">{metric.subfooter}</div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}

function AudienceGrowthChart({
  audienceData,
  audienceChartConfig,
}: Pick<MarketingDashboardData, "audienceData" | "audienceChartConfig">) {
  return (
    <Card className="@5xl:col-span-2">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Audience Growth</CardTitle>
          <CardDescription>
            Followers, impressions, and engagement over the month
          </CardDescription>
        </div>
        <Badge variant="secondary" className="w-fit">
          <ArrowUpRight className="h-4 w-4" />
          Strong momentum
        </Badge>
      </CardHeader>
      <CardContent>
        <ChartContainer config={audienceChartConfig} className="h-[340px] w-full">
          <AreaChart
            data={audienceData}
            margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="followersFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-followers)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-followers)"
                  stopOpacity={0.04}
                />
              </linearGradient>
              <linearGradient id="impressionsFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-impressions)"
                  stopOpacity={0.25}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-impressions)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} className="stroke-muted/30" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis axisLine={false} tickLine={false} tickMargin={10} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="impressions"
              type="monotone"
              stroke="var(--color-impressions)"
              fill="url(#impressionsFill)"
              strokeWidth={2}
            />
            <Area
              dataKey="followers"
              type="monotone"
              stroke="var(--color-followers)"
              fill="url(#followersFill)"
              strokeWidth={2}
            />
            <Area
              dataKey="engagement"
              type="monotone"
              stroke="var(--color-engagement)"
              fill="transparent"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function SocialMixCard({
  socialMixData,
  socialMixConfig,
}: Pick<MarketingDashboardData, "socialMixData" | "socialMixConfig">) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Mix</CardTitle>
        <CardDescription>Share of attributed campaign impact</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ChartContainer config={socialMixConfig} className="mx-auto h-[230px]">
          <PieChart>
            <Pie
              data={socialMixData}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={90}
              paddingAngle={3}
            >
              {socialMixData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="name" hideLabel />}
            />
          </PieChart>
        </ChartContainer>
        <div className="grid gap-3">
          {socialMixData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              <span className="text-sm text-muted-foreground">{item.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ChannelPerformanceChart({
  channelData,
  channelChartConfig,
}: Pick<MarketingDashboardData, "channelData" | "channelChartConfig">) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel Performance</CardTitle>
        <CardDescription>Reach and engagement by social network</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ChartContainer config={channelChartConfig} className="h-[320px] w-full">
          <BarChart data={channelData} margin={{ top: 12, right: 12, left: 0 }}>
            <CartesianGrid vertical={false} className="stroke-muted/30" />
            <XAxis
              dataKey="channel"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis axisLine={false} tickLine={false} tickMargin={10} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="reach"
              fill="var(--color-reach)"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="engagement"
              fill="var(--color-engagement)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-[var(--chart-1)]" />
            Reach
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-[var(--chart-4)]" />
            Engagement
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ContentPipelineCard({
  contentPipeline,
}: Pick<MarketingDashboardData, "contentPipeline">) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Pipeline</CardTitle>
        <CardDescription>Production capacity for the next two weeks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {contentPipeline.map((item) => {
          const Icon = item.icon
          const progress = Math.round((item.value / item.total) * 100)

          return (
            <div key={item.stage} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.stage}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.value} of {item.total} assets
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{progress}%</Badge>
              </div>
              <Progress value={progress} />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function CampaignTable({ campaigns }: Pick<MarketingDashboardData, "campaigns">) {
  return (
    <Card className="@5xl:col-span-2">
      <CardHeader>
        <CardTitle>Active Campaigns</CardTitle>
        <CardDescription>Budget, ownership, and current return</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>ROI</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign.name}>
                <TableCell className="font-medium">{campaign.name}</TableCell>
                <TableCell>{campaign.channel}</TableCell>
                <TableCell>{campaign.owner}</TableCell>
                <TableCell>{campaign.budget}</TableCell>
                <TableCell>{campaign.roi}</TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={
                      campaign.status === "Live"
                        ? "default"
                        : campaign.status === "Review"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {campaign.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function SocialActivityFeed({
  activityFeed,
  topPosts,
}: Pick<MarketingDashboardData, "activityFeed" | "topPosts">) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Desk</CardTitle>
        <CardDescription>Team updates and top-performing posts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-4">
          {activityFeed.map((item) => (
            <div key={item.title} className="flex gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback>{item.user}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium leading-none">{item.title}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {item.time}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Top Posts</h3>
            <Button variant="ghost" size="sm" className="h-8 cursor-pointer">
              View all
            </Button>
          </div>
          {topPosts.map((post) => (
            <div
              key={post.title}
              className="rounded-lg border bg-card p-3 text-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{post.title}</p>
                  <p className="text-muted-foreground">{post.network}</p>
                </div>
                <Badge variant="outline">
                  <Share2 className="h-3.5 w-3.5" />
                  {post.delta}
                </Badge>
              </div>
              <p className="mt-2 text-muted-foreground">{post.metric}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
