'use client';

import { useState } from 'react';
import GooglePlacesAutocomplete from './google-places-autocomplete';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function AddressFallbackDemo() {
  const [addressData, setAddressData] = useState<any>(null);
  const [simulateNoApiKey, setSimulateNoApiKey] = useState(false);

  const handlePlaceSelect = (data: any) => {
    setAddressData(data);
  };

  // Override the API key temporarily for demo
  const originalEnv = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (simulateNoApiKey) {
    // @ts-ignore
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = undefined;
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Address Autocomplete Fallback Demo</CardTitle>
          <CardDescription>
            Test the Google Places autocomplete with and without API key
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={() => setSimulateNoApiKey(false)}
              variant={!simulateNoApiKey ? "default" : "outline"}
            >
              With API Key
            </Button>
            <Button 
              onClick={() => setSimulateNoApiKey(true)}
              variant={simulateNoApiKey ? "default" : "outline"}
            >
              Simulate No API Key
            </Button>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium mb-2">
              Address {simulateNoApiKey && "(Manual Entry Mode)"}
            </label>
            <GooglePlacesAutocomplete
              id="address"
              placeholder="Enter your address"
              value=""
              onPlaceSelect={handlePlaceSelect}
            />
          </div>

          {addressData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selected Address Data</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-gray-100 p-2 rounded">
                  {JSON.stringify(addressData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
