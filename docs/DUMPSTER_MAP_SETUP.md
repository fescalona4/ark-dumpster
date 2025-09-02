# Google Maps Setup for Dumpster Map

The dumpster page includes a map view that shows all dumpsters based on their addresses. To enable this feature, you need to configure the Google Maps API.

## Quick Setup

1. **Get a Google Maps API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the "Maps JavaScript API" and "Geocoding API"
   - Create an API key in the "Credentials" section

2. **Configure the Environment Variable**:
   - Add your API key to your `.env.local` file:

   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

3. **Restart the Development Server**:
   ```bash
   npm run dev
   ```

## Features

The dumpster map includes:

- **Color-coded markers** based on dumpster status:
  - 🟢 Green: Available
  - 🔵 Blue: Assigned
  - 🟠 Orange: In Transit
  - 🟠 Orange: Maintenance
  - 🔴 Red: Out of Service

- **Interactive info windows** with dumpster details when clicking markers
- **Automatic map bounds** to show all dumpsters
- **Geocoding support** for addresses
- **GPS coordinates support** (if available in dumpster data)
- **Status legend** for easy reference

## Data Requirements

For dumpsters to appear on the map, they need either:

- An `address` field with a valid address
- A `last_known_location` field with a valid address
- `gps_coordinates` field with "lat,lng" format

## Troubleshooting

- If you see "Map Error" message, check your API key configuration
- Ensure your Google Cloud project has billing enabled
- Make sure the APIs are enabled in your Google Cloud Console
- Check the browser console for any API-related errors
