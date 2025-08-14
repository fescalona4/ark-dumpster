'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RiEyeLine,
  RiCalendarLine,
  RiDeviceLine,
  RiGlobalLine,
} from '@remixicon/react';
import { format } from 'date-fns';
import AuthGuard from '@/components/auth-guard';
import { DailyVisitsChart } from '@/components/daily-visits-chart';
import { getAnalytics, getPageViews, getDailyVisits, getCountryStats, getCityStats } from '@/lib/analytics';

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
  const [dailyVisits, setDailyVisits] = useState<Record<string, number>>({});
  const [countryStats, setCountryStats] = useState<Record<string, number>>({});
  const [cityStats, setCityStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const days = parseInt(timeRange);
      const [analyticsData, pageViewsData, dailyVisitsData, countryData, cityData] = await Promise.all([
        getAnalytics(days),
        getPageViews(days),
        getDailyVisits(days),
        getCountryStats(days),
        getCityStats(days),
      ]);

      if (analyticsData) setVisits(analyticsData);
      setPageViews(pageViewsData);
      setDailyVisits(dailyVisitsData);
      setCountryStats(countryData);
      setCityStats(cityData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  // Calculate stats
  const totalVisits = visits.length;
  const uniqueSessions = new Set(visits.map(v => v.session_id)).size;
  const topPages = Object.entries(pageViews)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
  const topCountries = Object.entries(countryStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
  const topCities = Object.entries(cityStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Device type stats
  const deviceStats = visits.reduce((acc, visit) => {
    acc[visit.device_type] = (acc[visit.device_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Browser stats
  const browserStats = visits.reduce((acc, visit) => {
    acc[visit.browser] = (acc[visit.browser] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Website Analytics</h1>
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
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <RiEyeLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVisits.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Sessions</CardTitle>
            <RiGlobalLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueSessions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pages Viewed</CardTitle>
            <RiCalendarLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(pageViews).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Daily Visits</CardTitle>
            <RiDeviceLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(totalVisits / parseInt(timeRange))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Visitors Chart */}
      <div className="mb-6">
        <DailyVisitsChart dailyVisits={dailyVisits} timeRange={timeRange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPages.map(([path, views]) => (
                <div key={path} className="flex items-center justify-between">
                  <div className="font-medium text-sm truncate flex-1 mr-4">
                    {path === '/' ? 'Home Page' : path}
                  </div>
                  <Badge variant="outline">{views} views</Badge>
                </div>
              ))}
              {topPages.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No page data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card>
          <CardHeader>
            <CardTitle>Top Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCountries.map(([country, count]) => (
                <div key={country} className="flex items-center justify-between">
                  <div className="font-medium text-sm">{country}</div>
                  <Badge variant="outline">{count} visits</Badge>
                </div>
              ))}
              {topCountries.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No country data available</p>
              )}
            </div>
          </CardContent>
        </Card>

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
                <p className="text-muted-foreground text-center py-4">No city data available</p>
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
                <p className="text-muted-foreground text-center py-4">No device data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Row for Browsers and Recent Visits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
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
                <p className="text-muted-foreground text-center py-4">No browser data available</p>
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
              {visits.slice(0, 10).map((visit) => (
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
  );
}
