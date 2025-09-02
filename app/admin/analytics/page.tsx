'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { RiBarChartLine } from '@remixicon/react';
import AuthGuard from '@/components/providers/auth-guard';
import { AdvancedAreaChart } from '@/components/analytics/advanced-area-chart';
import { AnalyticsSectionCards } from '@/components/analytics/analytics-section-cards';
import {
  getAnalytics,
  getPageViews,
  getDailyVisits,
  getCountryStats,
  getCityStats,
} from '@/lib/analytics';
import { Spinner } from '@/components/ui/spinner';

interface Visit {
  id: string;
  page_path: string;
  user_agent: string;
  ip_address?: string;
  referrer?: string;
  session_id: string;
  device_type: string;
  browser: string;
  country?: string;
  city?: string;
  created_at: string;
}

/**
 * Main analytics page component
 */
export default function AnalyticsPage() {
  return (
    <AuthGuard>
      <AnalyticsPageContent />
    </AuthGuard>
  );
}

/**
 * Analytics page content
 */
function AnalyticsPageContent() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [pageViews, setPageViews] = useState<Record<string, number>>({});
  const [cityStats, setCityStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const days = parseInt(timeRange);
      const [analyticsData, pageViewsData, , , cityData] = await Promise.all([
        getAnalytics(days),
        getPageViews(days),
        getDailyVisits(days),
        getCountryStats(days),
        getCityStats(days),
      ]);

      if (analyticsData) setVisits(analyticsData);
      setPageViews(pageViewsData);
      setCityStats(cityData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Calculate stats
  const totalVisits = visits.length;
  const uniqueSessions = new Set(visits.map(v => v.session_id)).size;
  const topCities = Object.entries(cityStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Device type stats
  const deviceStats = visits.reduce(
    (acc, visit) => {
      acc[visit.device_type] = (acc[visit.device_type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Browser stats
  const browserStats = visits.reduce(
    (acc, visit) => {
      acc[visit.browser] = (acc[visit.browser] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner variant="circle-filled" size={32} className="mx-auto mb-4" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between px-4 lg:px-6">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="gap-2 ml-auto">
              <RiBarChartLine className="h-4 w-4" />
              {totalVisits} Total Visits
            </Badge>
          </div>

          {/* Analytics Stats Cards */}
          <AnalyticsSectionCards
            stats={{
              totalVisits,
              uniqueSessions,
              pagesViewed: Object.keys(pageViews).length,
              avgDailyVisits: Math.round(totalVisits / parseInt(timeRange)),
              timeRange,
            }}
          />

          {/* Advanced Analytics Chart */}
          <div className="px-4 lg:px-6">
            <div className="bg-card rounded-lg border">
              <AdvancedAreaChart timeRange={timeRange} onTimeRangeChange={setTimeRange} />
            </div>
          </div>

          {/* Additional Content Grid */}
          <div className="px-4 lg:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Cities */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Cities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topCities.map(([city, count]) => (
                      <div key={city} className="flex items-center justify-between">
                        <div className="font-medium text-sm">{city}</div>
                        <Badge variant="outline">{count} visits</Badge>
                      </div>
                    ))}
                    {topCities.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        No city data available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Device Types */}
              <Card>
                <CardHeader>
                  <CardTitle>Device Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(deviceStats).map(([device, count]) => (
                      <div key={device} className="flex items-center justify-between">
                        <div className="font-medium text-sm capitalize">{device}</div>
                        <Badge variant="outline">{count} visits</Badge>
                      </div>
                    ))}
                    {Object.keys(deviceStats).length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        No device data available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Browsers */}
              <Card>
                <CardHeader>
                  <CardTitle>Browsers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(browserStats).map(([browser, count]) => (
                      <div key={browser} className="flex items-center justify-between">
                        <div className="font-medium text-sm capitalize">{browser}</div>
                        <Badge variant="outline">{count} visits</Badge>
                      </div>
                    ))}
                    {Object.keys(browserStats).length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        No browser data available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Visits */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Visits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {visits.slice(0, 10).map(visit => (
                      <div key={visit.id} className="border-b pb-2 last:border-b-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-medium truncate flex-1">
                            {visit.page_path === '/' ? 'Home Page' : visit.page_path}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(visit.created_at), 'MMM dd, HH:mm')}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {visit.device_type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {visit.browser}
                          </Badge>
                          {visit.country && (
                            <Badge variant="outline" className="text-xs">
                              {visit.city ? `${visit.city}, ${visit.country}` : visit.country}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {visits.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">No recent visits</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
