// Script to insert sample visit data
// Run this in your browser console on any page of your site

async function insertSampleData() {
  const sampleVisits = [
    // Today's visits (August 14, 2025)
    { page: '/', country: 'United States', city: 'New York', device: 'desktop', browser: 'Chrome', date: '2025-08-14' },
    { page: '/', country: 'United States', city: 'Los Angeles', device: 'mobile', browser: 'Safari', date: '2025-08-14' },
    { page: '/', country: 'Canada', city: 'Toronto', device: 'desktop', browser: 'Chrome', date: '2025-08-14' },
    { page: '/', country: 'United Kingdom', city: 'London', device: 'desktop', browser: 'Safari', date: '2025-08-14' },
    { page: '/services', country: 'Australia', city: 'Sydney', device: 'tablet', browser: 'Safari', date: '2025-08-14' },
    { page: '/services', country: 'Germany', city: 'Berlin', device: 'mobile', browser: 'Firefox', date: '2025-08-14' },
    { page: '/contact', country: 'France', city: 'Paris', device: 'desktop', browser: 'Firefox', date: '2025-08-14' },
    { page: '/contact', country: 'Japan', city: 'Tokyo', device: 'desktop', browser: 'Chrome', date: '2025-08-14' },

    // Yesterday (August 13, 2025)
    { page: '/', country: 'United States', city: 'Chicago', device: 'mobile', browser: 'Safari', date: '2025-08-13' },
    { page: '/', country: 'United States', city: 'Miami', device: 'desktop', browser: 'Chrome', date: '2025-08-13' },
    { page: '/services', country: 'Canada', city: 'Vancouver', device: 'desktop', browser: 'Safari', date: '2025-08-13' },
    { page: '/contact', country: 'United Kingdom', city: 'Manchester', device: 'tablet', browser: 'Safari', date: '2025-08-13' },
    { page: '/', country: 'Australia', city: 'Melbourne', device: 'mobile', browser: 'Firefox', date: '2025-08-13' },
    { page: '/about', country: 'Germany', city: 'Munich', device: 'desktop', browser: 'Firefox', date: '2025-08-13' },

    // August 12, 2025
    { page: '/', country: 'Spain', city: 'Madrid', device: 'desktop', browser: 'Chrome', date: '2025-08-12' },
    { page: '/', country: 'Italy', city: 'Rome', device: 'mobile', browser: 'Safari', date: '2025-08-12' },
    { page: '/services', country: 'Netherlands', city: 'Amsterdam', device: 'desktop', browser: 'Chrome', date: '2025-08-12' },
    { page: '/pricing', country: 'Sweden', city: 'Stockholm', device: 'tablet', browser: 'Safari', date: '2025-08-12' },

    // August 11, 2025
    { page: '/', country: 'Brazil', city: 'São Paulo', device: 'mobile', browser: 'Firefox', date: '2025-08-11' },
    { page: '/', country: 'Mexico', city: 'Mexico City', device: 'desktop', browser: 'Firefox', date: '2025-08-11' },
    { page: '/services', country: 'India', city: 'Mumbai', device: 'desktop', browser: 'Safari', date: '2025-08-11' },
    { page: '/contact', country: 'South Korea', city: 'Seoul', device: 'mobile', browser: 'Safari', date: '2025-08-11' },

    // August 10, 2025 (Weekend - lower traffic)
    { page: '/', country: 'United States', city: 'Seattle', device: 'tablet', browser: 'Safari', date: '2025-08-10' },
    { page: '/', country: 'United States', city: 'Denver', device: 'desktop', browser: 'Chrome', date: '2025-08-10' },
    { page: '/about', country: 'Canada', city: 'Montreal', device: 'mobile', browser: 'Firefox', date: '2025-08-10' },

    // August 9, 2025
    { page: '/', country: 'Norway', city: 'Oslo', device: 'desktop', browser: 'Chrome', date: '2025-08-09' },
    { page: '/', country: 'Denmark', city: 'Copenhagen', device: 'mobile', browser: 'Safari', date: '2025-08-09' },

    // August 8, 2025
    { page: '/', country: 'Finland', city: 'Helsinki', device: 'desktop', browser: 'Firefox', date: '2025-08-08' },
    { page: '/services', country: 'Poland', city: 'Warsaw', device: 'tablet', browser: 'Safari', date: '2025-08-08' },
    { page: '/contact', country: 'Russia', city: 'Moscow', device: 'mobile', browser: 'Firefox', date: '2025-08-08' },

    // August 7, 2025
    { page: '/', country: 'China', city: 'Beijing', device: 'desktop', browser: 'Chrome', date: '2025-08-07' },
    { page: '/', country: 'Thailand', city: 'Bangkok', device: 'mobile', browser: 'Safari', date: '2025-08-07' },
    { page: '/services', country: 'Singapore', city: 'Singapore', device: 'desktop', browser: 'Chrome', date: '2025-08-07' },
    { page: '/pricing', country: 'Malaysia', city: 'Kuala Lumpur', device: 'tablet', browser: 'Safari', date: '2025-08-07' },

    // August 6, 2025
    { page: '/', country: 'Indonesia', city: 'Jakarta', device: 'mobile', browser: 'Firefox', date: '2025-08-06' },
    { page: '/', country: 'Philippines', city: 'Manila', device: 'desktop', browser: 'Firefox', date: '2025-08-06' },
    { page: '/contact', country: 'Vietnam', city: 'Ho Chi Minh City', device: 'desktop', browser: 'Safari', date: '2025-08-06' },

    // August 5, 2025
    { page: '/', country: 'New Zealand', city: 'Auckland', device: 'mobile', browser: 'Safari', date: '2025-08-05' },
    { page: '/services', country: 'South Africa', city: 'Cape Town', device: 'tablet', browser: 'Safari', date: '2025-08-05' },
    { page: '/about', country: 'Egypt', city: 'Cairo', device: 'desktop', browser: 'Chrome', date: '2025-08-05' }
  ];

  console.log('Inserting sample visit data...');

  try {
    // Import the analytics function
    const { trackPageVisit } = await import('/lib/analytics.js');

    for (const visit of sampleVisits) {
      // Create a mock session for each visit
      const sessionId = `sample_session_${Math.random().toString(36).substr(2, 9)}`;

      // Track the visit with custom data
      await trackPageVisit(visit.page, {
        country: visit.country,
        city: visit.city,
        device_type: visit.device,
        browser: visit.browser,
        session_id: sessionId,
        created_at: new Date(visit.date).toISOString()
      });

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Successfully inserted ${sampleVisits.length} sample visits!`);
  } catch (error) {
    console.error('Error inserting sample data:', error);
  }
}

// Run the function
insertSampleData();
