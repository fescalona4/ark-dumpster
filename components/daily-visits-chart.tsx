'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DailyVisitsChartProps {
  dailyVisits: Record<string, number>;
  timeRange: string;
}

export function DailyVisitsChart({ dailyVisits, timeRange }: DailyVisitsChartProps) {
  // Convert daily visits to array and sort by date
  const chartData = Object.entries(dailyVisits)
    .map(([date, visits]) => ({
      date: new Date(date),
      visits,
      dateStr: date,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // Get max visits for scaling
  const maxVisits = Math.max(...chartData.map(d => d.visits), 1);

  // Generate date range for the selected period
  const generateDateRange = () => {
    const days = parseInt(timeRange);
    const dates: string[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toDateString());
    }

    return dates;
  };

  const allDates = generateDateRange();

  // Fill missing dates with 0 visits
  const completeData = allDates.map(dateStr => {
    const existing = chartData.find(d => d.dateStr === dateStr);
    return {
      date: new Date(dateStr),
      visits: existing?.visits || 0,
      dateStr,
    };
  });

  if (completeData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Visitors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No visitor data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Visitors</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          {/* Chart Container */}
          <div className="relative h-full w-full bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground py-4">
              <span>{maxVisits}</span>
              <span>{Math.floor(maxVisits * 0.75)}</span>
              <span>{Math.floor(maxVisits * 0.5)}</span>
              <span>{Math.floor(maxVisits * 0.25)}</span>
              <span>0</span>
            </div>

            {/* Chart Area */}
            <div className="ml-8 mr-4 h-full relative">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="w-full border-b border-gray-200 dark:border-gray-700" />
                ))}
              </div>

              {/* Bars */}
              <div className="relative h-full flex items-end justify-between px-1">
                {completeData.map((data, index) => {
                  const height = maxVisits > 0 ? (data.visits / maxVisits) * 100 : 0;
                  return (
                    <div key={index} className="flex flex-col items-center group">
                      {/* Bar */}
                      <div
                        className="bg-blue-500 hover:bg-blue-600 transition-colors duration-200 min-w-[8px] rounded-t-sm relative"
                        style={{
                          height: `${height}%`,
                          width: `${Math.max(100 / completeData.length - 2, 8)}%`,
                        }}
                      >
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                          {data.visits} visits
                          <br />
                          {data.date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between mt-2 ml-8 mr-4 text-xs text-muted-foreground">
              {completeData.map((data, index) => {
                // Show every few labels to avoid crowding
                const showLabel = completeData.length <= 7 || index % Math.ceil(completeData.length / 7) === 0;
                return (
                  <span key={index} className={showLabel ? '' : 'invisible'}>
                    {data.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart Summary */}
        <div className="mt-4 flex justify-between text-sm text-muted-foreground">
          <span>Total: {completeData.reduce((sum, d) => sum + d.visits, 0)} visits</span>
          <span>
            Avg: {Math.round(completeData.reduce((sum, d) => sum + d.visits, 0) / completeData.length)} per day
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
