import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

interface Coordinates {
  lat: number;
  lng: number;
}

export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates,
  unit: 'miles' | 'km' = 'miles'
): number {
  const R = unit === 'miles' ? 3959 : 6371; // Earth's radius in miles or kilometers
  
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function parseGpsCoordinates(gpsData: string | { x: number; y: number } | any): Coordinates | null {
  if (!gpsData) return null;
  
  try {
    // Handle PostgreSQL point type object format {x: lng, y: lat}
    if (typeof gpsData === 'object' && 'x' in gpsData && 'y' in gpsData) {
      const lng = parseFloat(gpsData.x);
      const lat = parseFloat(gpsData.y);
      if (isNaN(lat) || isNaN(lng)) return null;
      return { lat, lng };
    }
    
    // Handle PostgreSQL point type string format "(lng,lat)"
    if (typeof gpsData === 'string' && gpsData.startsWith('(') && gpsData.endsWith(')')) {
      const cleanString = gpsData.slice(1, -1); // Remove parentheses
      const [lng, lat] = cleanString.split(',').map(coord => parseFloat(coord.trim()));
      if (isNaN(lat) || isNaN(lng)) return null;
      return { lat, lng };
    }
    
    // Handle standard "lat,lng" string format
    if (typeof gpsData === 'string') {
      const [lat, lng] = gpsData.split(',').map(coord => parseFloat(coord.trim()));
      if (isNaN(lat) || isNaN(lng)) return null;
      return { lat, lng };
    }
    
    return null;
  } catch {
    return null;
  }
}

export const ARK_HOME_COORDINATES: Coordinates = {
  lat: 27.7987,
  lng: -82.7074
};

export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    // Check if we're in the browser and Google Maps is loaded
    if (typeof window !== 'undefined' && window.google?.maps) {
      return new Promise((resolve) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;
            resolve({
              lat: location.lat(),
              lng: location.lng()
            });
          } else {
            console.warn('Geocoding failed for address:', address, status);
            resolve(null);
          }
        });
      });
    } else {
      // Fallback to fetch API if Google Maps isn't loaded
      const encodedAddress = encodeURIComponent(address);
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.error('Google Maps API key not configured');
        return null;
      }
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`
      );
      
      if (!response.ok) {
        console.error('Geocoding API error:', response.statusText);
        return null;
      }
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng
        };
      }
      
      console.warn('No geocoding results for address:', address);
      return null;
    }
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}
