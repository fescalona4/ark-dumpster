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
import { CountingNumber } from '@/components/ui/counting-number';

interface QuoteStats {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
}

interface OrderStats {
  total: number;
  pending: number;
  scheduled: number;
  in_progress: number;
  completed: number;
}

interface AdminSectionCardsProps {
  stats: QuoteStats;
  orderStats: OrderStats;
}

export function AdminSectionCards({ stats, orderStats }: AdminSectionCardsProps) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pending Quotes</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            <CountingNumber
              number={stats.pending}
              transition={{ stiffness: 90, damping: 50 }}
              inView={true}
            />
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
          <CardDescription>Scheduled Orders</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            <CountingNumber
              number={orderStats.scheduled}
              transition={{ stiffness: 90, damping: 50 }}
              inView={true}
            />
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {orderStats.scheduled > 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              Ready
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Upcoming deliveries <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Orders scheduled for delivery</div>
        </CardFooter>
      </Card>
    </div>
  );
}
