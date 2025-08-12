# Google Places API Setup Guide

This application uses Google Places API for address autocomplete functionality. Follow these steps to set it up:

## 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

## 2. Enable Google Places API

1. In the Google Cloud Console, go to **APIs & Services > Library**
2. Search for "Places API" and enable it
3. Also enable "Maps JavaScript API" if you plan to display maps

## 3. Create API Credentials

1. Go to **APIs & Services > Credentials**
2. Click **+ CREATE CREDENTIALS** > **API Key**
3. Copy the generated API key
4. (Recommended) Click on the API key to configure restrictions:
   - **Application restrictions**: HTTP referrers (web sites)
   - Add your domain(s): `http://localhost:3000/*`, `https://yourdomain.com/*`
   - **API restrictions**: Restrict to Places API and Maps JavaScript API

## 4. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`
2. Add your Google Maps API key:
   ```bash
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

## 5. API Usage and Billing

- Google Places API has a free tier with limits
- Check [Google Cloud Pricing](https://cloud.google.com/maps-platform/pricing) for current rates
- Set up billing alerts to monitor usage
- Consider setting daily quotas to prevent unexpected charges

## 6. API Restrictions (Security)

For production, restrict your API key:

- **HTTP referrers**: Only your domain(s)
- **API restrictions**: Only enable required APIs
- Never expose API keys in client-side code (use NEXT*PUBLIC* prefix carefully)

## Features Implemented

- ✅ Address autocomplete with Google Places
- ✅ Automatic city, state, and ZIP code population
- ✅ US-only address restriction
- ✅ Fallback for manual entry if API fails
- ✅ Used in both contact form and admin create quote form

## Troubleshooting

### Common Issues:

1. **API Key Error**: Check that the key is correct and APIs are enabled
2. **Billing Error**: Ensure billing is enabled for your Google Cloud project
3. **Referrer Error**: Check that your domain is added to API key restrictions
4. **Loading Issues**: Check browser console for JavaScript errors

### Testing:

1. Open the contact form or admin create quote page
2. Start typing an address in the address field
3. You should see autocomplete suggestions appear
4. Selecting a suggestion should auto-populate city, state, and ZIP code
