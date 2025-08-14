'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import { useIsMobile } from '@/hooks/use-mobile';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { getDailyVisits, getAnalytics } from '@/lib/analytics';

export const description = 'An interactive area chart showing website visits by device type';

interface DeviceStat {
  device_type: string;
  visits: number;
}

const chartConfig = {
  visitors: {
    label: 'Visitors',
  },
  desktop: {
    label: 'Desktop',
    color: 'hsl(var(--chart-1))',
  },
  mobile: {
    label: 'Mobile',
    color: 'hsl(var(--chart-2))',
  },
  tablet: {
    label: 'Tablet',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState('30d');
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange('7d');
    }
  }, [isMobile]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get daily visits and device stats from analytics data
        const days = parseInt(timeRange.replace('d', ''));
        const [dailyVisits, analyticsData] = await Promise.all([
          getDailyVisits(days),
          getAnalytics(days)
        ]);

        // Calculate device stats from analytics data
        const deviceStats: Record<string, number> = {};
        if (analyticsData) {
          analyticsData.forEach((visit: any) => {
            const deviceType = visit.device_type || 'desktop';
            deviceStats[deviceType] = (deviceStats[deviceType] || 0) + 1;
          });
        }

        // Calculate device ratios
        const totalDeviceVisits = Object.values(deviceStats).reduce((sum: number, count: number) => sum + count, 0);
        const deviceRatios = {
          desktop: totalDeviceVisits > 0 ? (deviceStats.desktop || 0) / totalDeviceVisits : 0.6,
          mobile: totalDeviceVisits > 0 ? (deviceStats.mobile || 0) / totalDeviceVisits : 0.3,
          tablet: totalDeviceVisits > 0 ? (deviceStats.tablet || 0) / totalDeviceVisits : 0.1,
        };

        // Generate date range
        const today = new Date();
        const dates: string[] = [];

        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          dates.push(date.toDateString());
        }

        // Transform data for the chart
        const transformedData = dates.map(dateStr => {
          const totalVisits = dailyVisits[dateStr] || 0;

          // Distribute total visits across device types based on ratios
          const desktop = Math.round(totalVisits * deviceRatios.desktop);
          const mobile = Math.round(totalVisits * deviceRatios.mobile);
          const tablet = totalVisits - desktop - mobile; // Remaining visits

          return {
            date: new Date(dateStr).toISOString().split('T')[0], // Format as YYYY-MM-DD
            desktop: Math.max(0, desktop),
            mobile: Math.max(0, mobile),
            tablet: Math.max(0, tablet),
            total: totalVisits
          };
        });

        setChartData(transformedData);
      } catch (error) {
        console.error('Error fetching chart data:', error);
        // Fallback to empty data
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const filteredData = chartData;

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Website Visitors by Device</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">Total visits from different device types</span>
          <span className="@[540px]/card:hidden">Device breakdown</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <div className="flex h-[250px] items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-mobile)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-mobile)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillTablet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-tablet)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-tablet)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={value => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={value => {
                      return new Date(value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="tablet"
                type="natural"
                fill="url(#fillTablet)"
                stroke="var(--color-tablet)"
                stackId="a"
              />
              <Area
                dataKey="mobile"
                type="natural"
                fill="url(#fillMobile)"
                stroke="var(--color-mobile)"
                stackId="a"
              />
              <Area
                dataKey="desktop"
                type="natural"
                fill="url(#fillDesktop)"
                stroke="var(--color-desktop)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
