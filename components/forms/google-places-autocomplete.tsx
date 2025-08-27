'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { Input } from '@/components/ui/input';

// Google Places API types
interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GooglePlaceGeometry {
  location: {
    lat(): number;
    lng(): number;
  };
  viewport: {
    getNorthEast(): { lat(): number; lng(): number };
    getSouthWest(): { lat(): number; lng(): number };
  };
}

interface GooglePlace {
  address_components?: GoogleAddressComponent[];
  formatted_address?: string;
  geometry?: GooglePlaceGeometry;
  name?: string;
}

interface GoogleMapsAPI {
  maps: {
    places: {
      Autocomplete: new (
        input: HTMLInputElement,
        options?: unknown
      ) => {
        addListener: (event: string, callback: () => void) => void;
        getPlace: () => GooglePlace;
      };
    };
    event: {
      clearInstanceListeners: (instance: unknown) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleMapsAPI;
    initGooglePlaces?: () => void;
  }
}

interface GooglePlacesAutocompleteProps {
  id: string;
  placeholder: string;
  value: string;
  onPlaceSelect: (place: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    fullAddress: string;
    geometry: GooglePlaceGeometry | null;
  }) => void;
  className?: string;
  required?: boolean;
}

export default function GooglePlacesAutocomplete({
  id,
  placeholder,
  value,
  onPlaceSelect,
  className,
  required,
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<GoogleMapsAPI['maps']['places']['Autocomplete'] | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [inputValue, setInputValue] = useState(value);
  const { theme } = useTheme();

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    // Inject theme-aware styles for Google Places autocomplete dropdown
    const injectThemeStyles = () => {
      // Remove existing styles
      const existingStyle = document.getElementById('google-places-theme-styles');
      if (existingStyle) {
        existingStyle.remove();
      }

      const style = document.createElement('style');
      style.id = 'google-places-theme-styles';

      if (theme === 'dark') {
        // Dark theme styles
        style.textContent = `
          /* Google Places Autocomplete Dark Mode */
          .pac-container {
            background-color: #1f1f1f !important;
            border: 1px solid #404040 !important;
            border-radius: calc(var(--radius) - 2px) !important;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3) !important;
            backdrop-filter: none !important;
          }

          .pac-item {
            background-color: #1f1f1f !important;
            color: #ffffff !important;
            border-bottom: 1px solid #404040 !important;
            padding: 8px 12px !important;
            transition: background-color 0.2s !important;
          }

          .pac-item:hover,
          .pac-item-selected {
            background-color: #2a2a2a !important;
            color: #ffffff !important;
          }

          .pac-item-query {
            color: #ffffff !important;
            font-weight: 600 !important;
          }

          .pac-matched {
            color: #a78bfa !important;
            font-weight: 700 !important;
          }

          .pac-icon {
            background-image: none !important;
            background-color: #666666 !important;
            border-radius: 2px !important;
          }

          .pac-icon-marker {
            background-color: #a78bfa !important;
          }

          .pac-item:last-child {
            border-bottom: none !important;
          }

          /* Powered by Google logo dark mode */
          .pac-logo:after {
            filter: invert(1) contrast(0.8) !important;
          }
        `;
      } else {
        // Light theme styles
        style.textContent = `
          /* Google Places Autocomplete Light Mode */
          .pac-container {
            background-color: #ffffff !important;
            border: 1px solid hsl(var(--border)) !important;
            border-radius: calc(var(--radius) - 2px) !important;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
          }

          .pac-item {
            background-color: #ffffff !important;
            color: hsl(var(--foreground)) !important;
            border-bottom: 1px solid hsl(var(--border)) !important;
            padding: 8px 12px !important;
            transition: background-color 0.2s !important;
          }

          .pac-item:hover,
          .pac-item-selected {
            background-color: hsl(var(--accent)) !important;
            color: hsl(var(--accent-foreground)) !important;
          }

          .pac-item-query {
            color: hsl(var(--foreground)) !important;
            font-weight: 600 !important;
          }

          .pac-matched {
            color: hsl(var(--primary)) !important;
            font-weight: 700 !important;
          }

          .pac-icon {
            background-image: none !important;
            background-color: hsl(var(--muted-foreground)) !important;
            border-radius: 2px !important;
          }

          .pac-icon-marker {
            background-color: hsl(var(--primary)) !important;
          }

          .pac-item:last-child {
            border-bottom: none !important;
          }

          /* Powered by Google logo light mode */
          .pac-logo:after {
            filter: none !important;
          }
        `;
      }

      document.head.appendChild(style);
    };

    // Inject styles whenever theme changes
    injectThemeStyles();
  }, [theme]);

  useEffect(() => {
    const loadGoogleMaps = () => {
      // Check if API key is available
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn('Google Maps API key not found. Falling back to manual address entry.');
        setHasApiKey(false);
        setIsLoaded(true);
        return;
      }

      if (window.google && window.google.maps && window.google.maps.places) {
        initializeAutocomplete();
        setIsLoaded(true);
        return;
      }

      // Check if script is already loading
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        window.initGooglePlaces = () => {
          initializeAutocomplete();
          setIsLoaded(true);
        };
        return;
      }

      // Load Google Maps script with error handling
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces&loading=async`;
      script.async = true;
      script.defer = true;

      // Handle script loading errors
      script.onerror = () => {
        console.error('Failed to load Google Maps API. Falling back to manual address entry.');
        setHasApiKey(false);
        setIsLoaded(true);
      };

      window.initGooglePlaces = () => {
        try {
          initializeAutocomplete();
          setIsLoaded(true);
        } catch (error) {
          console.error('Failed to initialize Google Places autocomplete:', error);
          setHasApiKey(false);
          setIsLoaded(true);
        }
      };

      document.head.appendChild(script);

      return () => {
        delete window.initGooglePlaces;
      };
    };

    const initializeAutocomplete = () => {
      if (!inputRef.current || !window.google || !hasApiKey) return;

      try {
        // Suppress console warnings temporarily for the legacy API
        const originalWarn = console.warn;
        console.warn = (...args) => {
          const message = args[0];
          if (typeof message === 'string' && message.includes('google.maps.places.Autocomplete')) {
            // Suppress the deprecation warning
            return;
          }
          originalWarn.apply(console, args);
        };

        // Use the legacy Autocomplete (we know this works)
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: {
            country: 'us',
          },
          fields: ['address_components', 'formatted_address', 'geometry', 'name'],
          // Bias results to Tampa Bay area including St. Petersburg
          bounds: {
            north: 28.2, // North Tampa / Wesley Chapel area
            south: 27.4, // South St. Pete / Tierra Verde area
            east: -82.1, // East Tampa / Brandon area
            west: -82.9, // West St. Pete / Belcher area
          },
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();

          if (!place.address_components) {
            console.log('No address components found');
            return;
          }

          // Extract address components
          const addressComponents = place.address_components;
          let streetNumber = '';
          let streetName = '';
          let city = '';
          let state = '';
          let zipCode = '';

          addressComponents.forEach((component: GoogleAddressComponent) => {
            const types = component.types;

            if (types.includes('street_number')) {
              streetNumber = component.long_name;
            }
            if (types.includes('route')) {
              streetName = component.long_name;
            }
            if (types.includes('locality')) {
              city = component.long_name;
            }
            if (types.includes('administrative_area_level_1')) {
              state = component.short_name;
            }
            if (types.includes('postal_code')) {
              zipCode = component.long_name;
            }
          });

          const address = `${streetNumber} ${streetName}`.trim();

          // Update the input value
          setInputValue(address);

          // Call the callback with parsed data
          onPlaceSelect({
            address,
            city,
            state,
            zipCode,
            fullAddress: place.formatted_address || '',
            geometry: place.geometry || null,
          });
        });

        autocompleteRef.current = autocomplete as any;
      } catch (error) {
        console.error('Failed to initialize Google Places autocomplete:', error);
        setHasApiKey(false);
      }
    };

    loadGoogleMaps();

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onPlaceSelect, hasApiKey]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // For manual entry (when Google Places is not available or user is typing manually)
    if (!hasApiKey || !isLoaded) {
      onPlaceSelect({
        address: e.target.value,
        city: '',
        state: '',
        zipCode: '',
        fullAddress: e.target.value,
        geometry: null,
      });
    }
  };

  return (
    <Input
      ref={inputRef}
      id={id}
      placeholder={hasApiKey ? placeholder : `${placeholder} (manual entry)`}
      value={inputValue}
      onChange={handleInputChange}
      className={className}
      required={required}
      autoComplete="off"
    />
  );
}
