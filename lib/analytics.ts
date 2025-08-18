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

// Get or create session ID from localStorage with expiration
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  const sessionIdKey = 'analytics_session_id';
  const sessionTimeKey = 'analytics_session_time';
  const sessionDuration = 30 * 60 * 1000; // 30 minutes in milliseconds

  let sessionId = localStorage.getItem(sessionIdKey);
  let sessionTime = localStorage.getItem(sessionTimeKey);

  const now = Date.now();

  // Check if session exists and is still valid
  if (sessionId && sessionTime && (now - parseInt(sessionTime)) < sessionDuration) {
    // Update session time to extend the session
    localStorage.setItem(sessionTimeKey, now.toString());
    return sessionId;
  }

  // Create new session if none exists or if expired
  sessionId = generateSessionId();
  localStorage.setItem(sessionIdKey, sessionId);
  localStorage.setItem(sessionTimeKey, now.toString());

  // Clean up any old visit tracking data when starting a new session
  const oldVisitKeys = Object.keys(localStorage).filter(key =>
    key.startsWith('last_visit_') && !key.includes(sessionId)
  );
  oldVisitKeys.forEach(key => localStorage.removeItem(key));

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

    const sessionId = getSessionId();

    // Check if we've already tracked this page in this session recently
    const lastVisitKey = `last_visit_${sessionId}_${pagePath}`;
    const lastVisitTime = localStorage.getItem(lastVisitKey);
    const now = Date.now();

    // If we visited this exact page in the last 30 seconds, don't track it again
    // This prevents refresh spamming while still allowing legitimate re-visits
    if (lastVisitTime && (now - parseInt(lastVisitTime)) < 30000) {
      return;
    }

    // Update the last visit time for this page
    localStorage.setItem(lastVisitKey, now.toString());

    // Clean up old visit tracking entries (older than 1 hour)
    const sessionKeys = Object.keys(localStorage).filter(key =>
      key.startsWith(`last_visit_${sessionId}_`)
    );
    sessionKeys.forEach(key => {
      const timestamp = localStorage.getItem(key);
      if (timestamp && (now - parseInt(timestamp)) > 3600000) { // 1 hour
        localStorage.removeItem(key);
      }
    });

    // Get geolocation data
    const geoData = await getGeolocation();

    const visitData = {
      page_path: pagePath,
      user_agent: navigator.userAgent,
      ip_address: geoData.ip || null,
      referrer: document.referrer || null,
      session_id: sessionId,
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

// Get unique session statistics
export async function getUniqueSessionStats(days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('website_visits')
      .select('session_id, created_at')
      .gte('created_at', startDate.toISOString());

    if (error) {
      console.error('Error fetching session stats:', error);
      return { uniqueSessions: 0, dailyUniqueSessions: {} };
    }

    // Count unique sessions
    const uniqueSessions = new Set(data?.map(visit => visit.session_id) || []).size;

    // Group unique sessions by date
    const sessionsByDate: Record<string, Set<string>> = {};
    data?.forEach(visit => {
      const date = new Date(visit.created_at).toDateString();
      if (!sessionsByDate[date]) {
        sessionsByDate[date] = new Set();
      }
      sessionsByDate[date].add(visit.session_id);
    });

    // Convert sets to counts
    const dailyUniqueSessions: Record<string, number> = {};
    Object.keys(sessionsByDate).forEach(date => {
      dailyUniqueSessions[date] = sessionsByDate[date].size;
    });

    return { uniqueSessions, dailyUniqueSessions };
  } catch (err) {
    console.error('Failed to fetch unique session stats:', err);
    return { uniqueSessions: 0, dailyUniqueSessions: {} };
  }
}

// Get bounce rate statistics (sessions with only one page view)
export async function getBounceRate(days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('website_visits')
      .select('session_id')
      .gte('created_at', startDate.toISOString());

    if (error) {
      console.error('Error fetching bounce rate data:', error);
      return 0;
    }

    // Count page views per session
    const sessionPageViews: Record<string, number> = {};
    data?.forEach(visit => {
      sessionPageViews[visit.session_id] = (sessionPageViews[visit.session_id] || 0) + 1;
    });

    const totalSessions = Object.keys(sessionPageViews).length;
    const bouncedSessions = Object.values(sessionPageViews).filter(count => count === 1).length;

    return totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;
  } catch (err) {
    console.error('Failed to calculate bounce rate:', err);
    return 0;
  }
}
