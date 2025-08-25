'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
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
import { getDailyVisits, getAnalytics } from '@/lib/analytics';

export const description = 'An advanced interactive area chart with multiple data streams';

interface AdvancedAreaChartProps {
  data?: any[];
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  className?: string;
}

const chartConfig = {
  visitors: {
    label: 'Visitors',
  },
  desktop: {
    label: 'Desktop',
    color: 'var(--chart-1)',
  },
  mobile: {
    label: 'Mobile',
    color: 'var(--chart-2)',
  },
  tablet: {
    label: 'Tablet',
    color: 'var(--chart-3)',
  },
  quotes: {
    label: 'Quotes',
    color: 'var(--chart-4)',
  },
  orders: {
    label: 'Orders',
    color: 'var(--chart-5)',
  },
} satisfies ChartConfig;

export function AdvancedAreaChart({
  data: externalData,
  timeRange: externalTimeRange,
  onTimeRangeChange: externalOnTimeRangeChange,
  className,
}: AdvancedAreaChartProps) {
  const [timeRange, setTimeRange] = React.useState(externalTimeRange || '7d');
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange);
    if (externalOnTimeRangeChange) {
      externalOnTimeRangeChange(newRange);
    }
  };

  React.useEffect(() => {
    if (externalData) {
      setChartData(externalData);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

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

        // Transform data for the chart with additional business metrics
        const transformedData = dates.map(dateStr => {
          const totalVisits = dailyVisits[dateStr] || 0;

          // Distribute total visits across device types based on ratios
          const desktop = Math.round(totalVisits * deviceRatios.desktop);
          const mobile = Math.round(totalVisits * deviceRatios.mobile);
          const tablet = totalVisits - desktop - mobile;

          // Simulate business metrics (quotes and orders)
          // In a real implementation, you'd fetch this from your database
          const quotes = Math.floor(Math.random() * (totalVisits * 0.15)) + Math.floor(totalVisits * 0.05);
          const orders = Math.floor(Math.random() * (quotes * 0.3)) + Math.floor(quotes * 0.1);

          return {
            date: new Date(dateStr).toISOString().split('T')[0],
            desktop: Math.max(0, desktop),
            mobile: Math.max(0, mobile),
            tablet: Math.max(0, tablet),
            quotes: Math.max(0, quotes),
            orders: Math.max(0, orders),
            total: totalVisits
          };
        });

        setChartData(transformedData);
      } catch (error) {
        console.error('Error fetching advanced chart data:', error);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, externalData]);

  const filteredData = React.useMemo(() => {
    if (externalData) return externalData;
    
    return chartData.filter((item) => {
      const date = new Date(item.date);
      const referenceDate = new Date();
      let daysToSubtract = 30;
      if (timeRange === '90d') {
        daysToSubtract = 90;
      } else if (timeRange === '7d') {
        daysToSubtract = 7;
      }
      const startDate = new Date(referenceDate);
      startDate.setDate(startDate.getDate() - daysToSubtract);
      return date >= startDate;
    });
  }, [chartData, timeRange, externalData]);

  return (
    <div className={`w-full h-full flex flex-col p-4 ${className || ''}`}>
      <div className="flex items-center gap-2 border-b pb-4 mb-4 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <h3 className="text-lg font-semibold">Advanced Analytics Overview</h3>
          <p className="text-sm text-muted-foreground">
            Comprehensive view of visitors, quotes, and orders over time
          </p>
        </div>
        {!externalTimeRange && (
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger
              className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
              aria-label="Select time range"
            >
              <SelectValue placeholder="Last 7 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="flex-1 flex items-center justify-center min-h-0">
        {loading ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="h-[300px] w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="advanced-fillDesktop" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-desktop)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-desktop)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="advanced-fillMobile" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-mobile)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-mobile)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="advanced-fillTablet" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-tablet)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-tablet)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="advanced-fillQuotes" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-quotes)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-quotes)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="advanced-fillOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-orders)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-orders)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
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
                    labelFormatter={(value) => {
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
                dataKey="orders"
                type="natural"
                fill="url(#advanced-fillOrders)"
                stroke="var(--color-orders)"
                stackId="business"
              />
              <Area
                dataKey="quotes"
                type="natural"
                fill="url(#advanced-fillQuotes)"
                stroke="var(--color-quotes)"
                stackId="business"
              />
              <Area
                dataKey="tablet"
                type="natural"
                fill="url(#advanced-fillTablet)"
                stroke="var(--color-tablet)"
                stackId="traffic"
              />
              <Area
                dataKey="mobile"
                type="natural"
                fill="url(#advanced-fillMobile)"
                stroke="var(--color-mobile)"
                stackId="traffic"
              />
              <Area
                dataKey="desktop"
                type="natural"
                fill="url(#advanced-fillDesktop)"
                stroke="var(--color-desktop)"
                stackId="traffic"
              />
              <ChartLegend content={(props) => <ChartLegendContent payload={props.payload} verticalAlign={props.verticalAlign} />} />
            </AreaChart>
          </ChartContainer>
        )}
      </div>
    </div>
  );
}