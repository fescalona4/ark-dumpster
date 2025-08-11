"use client";

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

declare global {
  interface Window {
    google?: any;
    initGooglePlaces?: () => void;
  }
}

interface GooglePlacesAutocompleteProps {
  id: string;
  placeholder: string;
  value: string;
  onPlaceSelect: (place: any) => void;
  className?: string;
  required?: boolean;
}

export default function GooglePlacesAutocomplete({
  id,
  placeholder,
  value,
  onPlaceSelect,
  className,
  required
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const loadGoogleMaps = () => {
      // Check if API key is available
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn('Google Maps API key not found. Falling back to manual address entry.');
        setHasApiKey(false);
        setIsLoaded(true); // Set loaded to true so the fallback input works
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
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`;
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
        const autocomplete = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ['address'],
            componentRestrictions: { country: 'us' }, // Restrict to US
            fields: ['address_components', 'formatted_address', 'geometry', 'name']
          }
        );

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          
          if (!place.address_components) {
            console.log("No address components found");
            return;
          }

          // Extract address components
          const addressComponents = place.address_components;
          let streetNumber = '';
          let streetName = '';
          let city = '';
          let state = '';
          let zipCode = '';

          addressComponents.forEach((component: any) => {
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
            fullAddress: place.formatted_address,
            geometry: place.geometry
          });
        });

        autocompleteRef.current = autocomplete;
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
  }, [onPlaceSelect]);

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
        geometry: null
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
