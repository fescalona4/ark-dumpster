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

interface QuoteStats {
  total: number;
  pending: number;
  quoted: number;
  accepted: number;
  completed: number;
}

interface AdminSectionCardsProps {
  stats: QuoteStats;
}

export function AdminSectionCards({ stats }: AdminSectionCardsProps) {
  const acceptanceRate =
    stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0;
  // TODO: Add completion rate display in future update
  // const completionRate =
  //   stats.accepted > 0
  //     ? Math.round((stats.completed / stats.accepted) * 100)
  //     : 0;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Quotes</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.total}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              All requests
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Customer requests <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Total quote requests received
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pending Quotes</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.pending}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.pending > 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              Awaiting
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Need attention <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Quotes awaiting response</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Acceptance Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {acceptanceRate}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {acceptanceRate >= 50 ? <IconTrendingUp /> : <IconTrendingDown />}
              Success
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Quote conversions <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Quotes that became accepted jobs
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Completed Jobs</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.completed}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Done
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Finished rentals <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Successfully completed dumpster rentals
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
