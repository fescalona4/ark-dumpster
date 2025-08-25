import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface AnalyticsStats {
  totalVisits: number;
  uniqueSessions: number;
  pagesViewed: number;
  avgDailyVisits: number;
  timeRange: string;
}

interface AnalyticsSectionCardsProps {
  stats: AnalyticsStats;
}

export function AnalyticsSectionCards({ stats }: AnalyticsSectionCardsProps) {
  const sessionRate = stats.totalVisits > 0 ? Math.round((stats.uniqueSessions / stats.totalVisits) * 100) : 0;
  const isGrowthPositive = stats.avgDailyVisits > 10; // Assuming positive if more than 10 daily visits

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Visits</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.totalVisits.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              All visitors
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Website traffic <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Total page visits received</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Unique Sessions</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.uniqueSessions.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {sessionRate >= 50 ? <IconTrendingUp /> : <IconTrendingDown />}
              {sessionRate}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            User engagement <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Unique visitor sessions</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pages Viewed</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.pagesViewed}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Diverse
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Content reach <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Different pages with visits</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Daily Average</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.avgDailyVisits}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {isGrowthPositive ? <IconTrendingUp /> : <IconTrendingDown />}
              Per day
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isGrowthPositive ? 'Steady traffic' : 'Growing audience'} <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Average visits in last {stats.timeRange} days</div>
        </CardFooter>
      </Card>
    </div>
  );
}
