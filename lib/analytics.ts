import { supabase } from './supabase';

// Interface for geolocation data
interface GeolocationData {
  country?: string;
  city?: string;
  ip?: string;
}

// Get geolocation data from IP address
async function getGeolocation(): Promise<GeolocationData> {
  try {
    // Primary: Using ipapi.co for free IP geolocation (1000 requests/day free)
    try {
      const response = await fetch('https://ipapi.co/json/', {
        method: 'GET',
        headers: {
          'User-Agent': 'ARK-Dumpster-Analytics/1.0',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          country: data.country_name || data.country,
          city: data.city,
          ip: data.ip,
        };
      }
    } catch (error) {
      console.warn('Primary geolocation service failed:', error);
    }

    // Fallback: Using ip-api.com (1000 requests/month free)
    try {
      const response = await fetch('http://ip-api.com/json/', {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        return {
          country: data.country,
          city: data.city,
          ip: data.query,
        };
      }
    } catch (error) {
      console.warn('Fallback geolocation service failed:', error);
    }

    // If both services fail, return empty data
    console.warn('All geolocation services unavailable');
    return {};
  } catch (error) {
    console.warn('Failed to get geolocation:', error);
    return {};
  }
}

// Generate a unique session ID for tracking user sessions
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get or create session ID from localStorage
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = localStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

// Detect device type
function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';

  const userAgent = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|phone/.test(userAgent)) {
    return 'mobile';
  } else if (/tablet|ipad/.test(userAgent)) {
    return 'tablet';
  }
  return 'desktop';
}

// Extract browser name
function getBrowser(): string {
  if (typeof window === 'undefined') return 'unknown';

  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('chrome')) return 'chrome';
  if (userAgent.includes('firefox')) return 'firefox';
  if (userAgent.includes('safari')) return 'safari';
  if (userAgent.includes('edge')) return 'edge';
  return 'other';
}

// Track a page visit
export async function trackPageVisit(pagePath: string) {
  try {
    if (typeof window === 'undefined') return; // Don't track server-side renders

    // Get geolocation data
    const geoData = await getGeolocation();

    const visitData = {
      page_path: pagePath,
      user_agent: navigator.userAgent,
      ip_address: geoData.ip || null,
      referrer: document.referrer || null,
      session_id: getSessionId(),
      device_type: getDeviceType(),
      browser: getBrowser(),
      country: geoData.country || null,
      city: geoData.city || null,
    };

    const { error } = await supabase
      .from('website_visits')
      .insert(visitData);

    if (error) {
      console.error('Analytics tracking error:', error);
    }
  } catch (err) {
    console.error('Failed to track page visit:', err);
  }
}

// Get analytics data for admin dashboard
export async function getAnalytics(days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('website_visits')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching analytics:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Failed to fetch analytics:', err);
    return null;
  }
}

// Get page view counts
export async function getPageViews(days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('website_visits')
      .select('page_path')
      .gte('created_at', startDate.toISOString());

    if (error) {
      console.error('Error fetching page views:', error);
      return {};
    }

    // Count page views
    const pageViews: Record<string, number> = {};
    data?.forEach(visit => {
      pageViews[visit.page_path] = (pageViews[visit.page_path] || 0) + 1;
    });

    return pageViews;
  } catch (err) {
    console.error('Failed to fetch page views:', err);
    return {};
  }
}

// Get daily visit counts
export async function getDailyVisits(days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('website_visits')
      .select('created_at')
      .gte('created_at', startDate.toISOString());

    if (error) {
      console.error('Error fetching daily visits:', error);
      return {};
    }

    // Group by date
    const dailyVisits: Record<string, number> = {};
    data?.forEach(visit => {
      const date = new Date(visit.created_at).toDateString();
      dailyVisits[date] = (dailyVisits[date] || 0) + 1;
    });

    return dailyVisits;
  } catch (err) {
    console.error('Failed to fetch daily visits:', err);
    return {};
  }
}

// Get country statistics
export async function getCountryStats(days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('website_visits')
      .select('country')
      .gte('created_at', startDate.toISOString())
      .not('country', 'is', null);

    if (error) {
      console.error('Error fetching country stats:', error);
      return {};
    }

    // Count visits by country
    const countryStats: Record<string, number> = {};
    data?.forEach(visit => {
      if (visit.country) {
        countryStats[visit.country] = (countryStats[visit.country] || 0) + 1;
      }
    });

    return countryStats;
  } catch (err) {
    console.error('Failed to fetch country stats:', err);
    return {};
  }
}

// Get city statistics
export async function getCityStats(days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('website_visits')
      .select('city, country')
      .gte('created_at', startDate.toISOString())
      .not('city', 'is', null);

    if (error) {
      console.error('Error fetching city stats:', error);
      return {};
    }

    // Count visits by city (with country for context)
    const cityStats: Record<string, number> = {};
    data?.forEach(visit => {
      if (visit.city) {
        const cityKey = visit.country ? `${visit.city}, ${visit.country}` : visit.city;
        cityStats[cityKey] = (cityStats[cityKey] || 0) + 1;
      }
    });

    return cityStats;
  } catch (err) {
    console.error('Failed to fetch city stats:', err);
    return {};
  }
}
