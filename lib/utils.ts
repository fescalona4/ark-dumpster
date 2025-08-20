import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

export function parseGpsCoordinates(gpsString: string): Coordinates | null {
  if (!gpsString) return null;
  
  try {
    const [lat, lng] = gpsString.split(',').map(coord => parseFloat(coord.trim()));
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

export const ARK_HOME_COORDINATES: Coordinates = {
  lat: 27.7987,
  lng: -82.7074
};
