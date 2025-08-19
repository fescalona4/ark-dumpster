'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useTheme } from 'next-themes';
import { Dumpster } from '@/types/dumpster';

interface DumpstersMapProps {
  dumpsters: Dumpster[];
  className?: string;
  height?: string;
}

interface MarkerInfo {
  dumpster: Dumpster;
  marker: google.maps.Marker;
  infoWindow: google.maps.InfoWindow;
}

export default function DumpstersMap({
  dumpsters,
  className = '',
  height = '400px'
}: DumpstersMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLocations, setHasLocations] = useState(true);
  const markersRef = useRef<MarkerInfo[]>([]);
  const { theme } = useTheme();

  // Base styles to hide POI (Points of Interest) like businesses
  const hidePOIStyles = [
    // Hide all POI business markers
    {
      featureType: "poi.business",
      stylers: [{ visibility: "off" }]
    },
    // Hide other POI categories
    {
      featureType: "poi.attraction",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "poi.government",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "poi.medical",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "poi.place_of_worship",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "poi.school",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "poi.sports_complex",
      stylers: [{ visibility: "off" }]
    },
    // Hide transit stations
    {
      featureType: "transit.station",
      stylers: [{ visibility: "off" }]
    },
    // Keep parks visible but hide their labels
    {
      featureType: "poi.park",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    }
  ];

  // Dark mode styles for Google Maps
  const darkModeStyles = [
    ...hidePOIStyles, // Include POI hiding styles
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#263c3f" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9ca5b3" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#746855" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1f2835" }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#f3d19c" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#2f3948" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#515c6d" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#17263c" }],
    },
  ];

  // Light mode styles (also hide POI)
  const lightModeStyles = hidePOIStyles;

  // Get status color for markers
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'available':
        return '#22c55e'; // green
      case 'assigned':
        return '#3b82f6'; // blue
      case 'in_transit':
        return '#f59e0b'; // orange
      case 'maintenance':
        return '#f97316'; // orange-500
      case 'out_of_service':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
          setError('Google Maps API key not found. Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.');
          return;
        }

        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['maps', 'places']
        });

        await loader.load();

        if (!mapRef.current) return;

        // Create map centered on ARK Dumpster business home address in St. Petersburg, FL
        const mapInstance = new google.maps.Map(mapRef.current, {
          zoom: 11,
          center: { lat: 27.7987, lng: -82.7074 }, // 3024 29th St N, St. Petersburg, FL 33713
          mapTypeControl: true,
          fullscreenControl: true,
          streetViewControl: true,
          zoomControl: true,
          styles: theme === 'dark' ? darkModeStyles : lightModeStyles,
        });

        setMap(mapInstance);
        setIsLoaded(true);
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setError('Failed to load Google Maps. Please check your API key and try again.');
      }
    };

    initMap();
  }, []);

  // Update map styles when theme changes
  useEffect(() => {
    if (map) {
      map.setOptions({
        styles: theme === 'dark' ? darkModeStyles : lightModeStyles,
      });
    }
  }, [theme, map, darkModeStyles, lightModeStyles]);

  // Geocode address to get coordinates
  const geocodeAddress = async (address: string): Promise<google.maps.LatLng | null> => {
    return new Promise((resolve) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        if (status === 'OK' && results && results[0]) {
          resolve(results[0].geometry.location);
        } else {
          console.warn(`Geocoding failed for address: ${address}`);
          resolve(null);
        }
      });
    });
  };

  // Update markers when dumpsters change
  useEffect(() => {
    if (!map || !isLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(({ marker, infoWindow }) => {
      marker.setMap(null);
      infoWindow.close();
    });
    markersRef.current = [];

    // Add markers for dumpsters with addresses
    const addMarkersSequentially = async () => {
      const bounds = new google.maps.LatLngBounds();
      let hasValidLocation = false;

      for (const dumpster of dumpsters) {
        const address = dumpster.address || dumpster.last_known_location;

        if (!address) continue;

        let position: google.maps.LatLng | null = null;

        // Try to use GPS coordinates first if available
        if (dumpster.gps_coordinates) {
          try {
            const [lat, lng] = dumpster.gps_coordinates.split(',').map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
              position = new google.maps.LatLng(lat, lng);
            }
          } catch (err) {
            console.warn(`Invalid GPS coordinates for dumpster ${dumpster.name}: ${dumpster.gps_coordinates}`);
          }
        }

        // Fallback to geocoding the address
        if (!position) {
          position = await geocodeAddress(address);
        }

        if (!position) continue;

        hasValidLocation = true;
        bounds.extend(position);

        // Create custom marker icon with status color
        const isBusinessHome = dumpster.name === 'ARK-HOME';

        const icon = isBusinessHome ? {
          // Clean home icon for business location
          path: 'M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z',
          scale: 1.0,
          fillColor: '#dc2626', // red-600
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 1.5,
          anchor: new google.maps.Point(12, 22), // Center bottom of icon
        } : {
          // Simple, clean truck icon for dumpsters
          path: 'M20 8h-3V4H3v10h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2V8zM8 15.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm12 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
          scale: 0.8,
          fillColor: getStatusColor(dumpster.status),
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 1.5,
          anchor: new google.maps.Point(12, 17), // Center bottom of icon
        };

        // Create marker
        const marker = new google.maps.Marker({
          position,
          map,
          title: dumpster.name,
          icon,
        });

        // Create info window (content will be set dynamically on click)
        const infoWindow = new google.maps.InfoWindow({
          disableAutoPan: false,
          maxWidth: 320,
        });

        // Add click listener to marker
        marker.addListener('click', () => {
          // Close all other info windows
          markersRef.current.forEach(({ infoWindow: iw }) => iw.close());

          // Generate theme-aware content dynamically
          const isDark = theme === 'dark';
          const bgColor = isDark ? '#1f2937' : '#ffffff';
          const textColor = isDark ? '#f9fafb' : '#111827';
          const mutedColor = isDark ? '#9ca3af' : '#6b7280';
          const borderColor = isDark ? '#374151' : '#e5e7eb';

          const infoWindowContent = isBusinessHome ? `
            <style>
              .gm-style .gm-style-iw-c {
                background-color: ${bgColor} !important;
                border-radius: 12px !important;
                padding: 0 !important;
                box-shadow: 0 10px 25px rgba(0, 0, 0, ${isDark ? '0.4' : '0.15'}) !important;
              }
              .gm-style .gm-style-iw-d {
                overflow: hidden !important;
                max-height: none !important;
              }
              .gm-style .gm-style-iw-t::after {
                background: ${bgColor} !important;
              }
            </style>
            <div style="background-color: ${bgColor}; color: ${textColor}; padding: 16px; min-width: 280px; border-radius: 12px; margin: 0;">
              <h3 style="font-weight: 600; font-size: 18px; margin: 0 0 12px 0; color: #dc2626;">🏢 ${dumpster.name}</h3>
              <div style="font-size: 14px; line-height: 1.5;">
                <div style="font-weight: 600; color: #2563eb; margin-bottom: 8px;">ARK Dumpster Business Home Office</div>
                <div style="margin-bottom: 6px; color: ${textColor};"><strong>Address:</strong> ${address}</div>
                <div style="margin-bottom: 6px; color: ${textColor};"><strong>Size:</strong> ${dumpster.size || 'Not specified'}</div>
                <div style="margin-bottom: 6px; color: ${textColor};"><strong>Status:</strong> <span style="text-transform: capitalize;">${dumpster.status.replace('_', ' ')}</span></div>
                ${dumpster.notes ? `<div style="color: ${textColor};"><strong>Notes:</strong> ${dumpster.notes}</div>` : ''}
              </div>
            </div>
          ` : `
            <style>
              .gm-style .gm-style-iw-c {
                background-color: ${bgColor} !important;
                border-radius: 12px !important;
                padding: 0 !important;
                box-shadow: 0 10px 25px rgba(0, 0, 0, ${isDark ? '0.4' : '0.15'}) !important;
              }
              .gm-style .gm-style-iw-d {
                overflow: hidden !important;
                max-height: none !important;
              }
              .gm-style .gm-style-iw-t::after {
                background: ${bgColor} !important;
              }
            </style>
            <div style="background-color: ${bgColor}; color: ${textColor}; padding: 16px; min-width: 280px; border-radius: 12px; margin: 0;">
              <h3 style="font-weight: 600; font-size: 18px; margin: 0 0 12px 0; color: ${textColor};">${dumpster.name}</h3>
              <div style="font-size: 14px; line-height: 1.5;">
                <div style="margin-bottom: 6px; color: ${textColor};"><strong>Status:</strong> <span style="text-transform: capitalize; color: ${getStatusColor(dumpster.status)}; font-weight: 600;">${dumpster.status.replace('_', ' ')}</span></div>
                <div style="margin-bottom: 6px; color: ${textColor};"><strong>Size:</strong> ${dumpster.size || 'Not specified'}</div>
                <div style="margin-bottom: 6px; color: ${textColor};"><strong>Condition:</strong> <span style="text-transform: capitalize;">${dumpster.condition}</span></div>
                <div style="margin-bottom: 6px; color: ${textColor};"><strong>Address:</strong> ${address}</div>
                ${dumpster.assigned_to ? `<div style="margin-bottom: 6px; color: ${textColor};"><strong>Assigned to:</strong> ${dumpster.assigned_to}</div>` : ''}
                ${dumpster.order_number ? `<div style="margin-bottom: 6px; color: ${textColor};"><strong>Order:</strong> ${dumpster.order_number}</div>` : ''}
                ${dumpster.notes ? `<div style="color: ${textColor};"><strong>Notes:</strong> ${dumpster.notes}</div>` : ''}
              </div>
            </div>
          `;

          infoWindow.setContent(infoWindowContent);
          infoWindow.open(map, marker);
        });

        markersRef.current.push({ dumpster, marker, infoWindow });
      }

      // Fit map to show all markers
      if (hasValidLocation) {
        map.fitBounds(bounds);

        // Ensure minimum zoom level
        const listener = google.maps.event.addListener(map, 'idle', () => {
          if (map.getZoom() && map.getZoom()! > 15) {
            map.setZoom(15);
          }
          google.maps.event.removeListener(listener);
        });
      } else {
        // No valid locations found, show a default view
        console.warn('No dumpsters with valid addresses found');
        setHasLocations(false);
      }

      setHasLocations(hasValidLocation);
    };

    addMarkersSequentially();
  }, [map, dumpsters, isLoaded, theme]);

  if (error) {
    return (
      <div className={`flex items-center justify-center border rounded-lg ${className}`} style={{ height }}>
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">⚠️ Map Error</div>
          <div className="text-sm text-muted-foreground">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative border rounded-lg overflow-hidden ${className}`} style={{ height }}>
      <div ref={mapRef} className="w-full h-full" />

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <div className="text-sm text-muted-foreground">Loading map...</div>
          </div>
        </div>
      )}

      {/* No locations message */}
      {isLoaded && !hasLocations && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="text-center p-4">
            <div className="text-muted-foreground mb-2">📍 No Location Data</div>
            <div className="text-sm text-muted-foreground">
              No dumpsters with valid addresses found.<br />
              Add addresses to dumpsters to see them on the map.
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      {isLoaded && (
        <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border">
          <div className="text-sm font-semibold mb-2 text-foreground">Map Legend</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-red-600"></div>
              <span className="text-foreground">Business Home</span>
            </div>
            <div className="border-t border-border my-2"></div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getStatusColor('available') }}></div>
              <span className="text-foreground">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getStatusColor('assigned') }}></div>
              <span className="text-foreground">Assigned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getStatusColor('in_transit') }}></div>
              <span className="text-foreground">In Transit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getStatusColor('maintenance') }}></div>
              <span className="text-foreground">Maintenance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getStatusColor('out_of_service') }}></div>
              <span className="text-foreground">Out of Service</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
