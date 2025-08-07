# Supabase Setup Guide for ARK Dumpster

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `ark-dumpster` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
5. Wait for project to be created (takes ~2 minutes)

## 2. Get Your Project Credentials

1. Go to your project dashboard
2. Click on "Settings" in the sidebar
3. Click on "API" in the settings menu
4. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - **Service role key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## 3. Update Your Environment Variables

1. Open your `.env.local` file
2. Add your Supabase credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 4. Set Up Your Database

1. In your Supabase dashboard, go to "SQL Editor"
2. Click "New Query"
3. Copy and paste the contents of `supabase/002_create_quotes_table.sql`
4. Click "Run" to execute the migration
5. Your `quotes` table should now be created with proper security policies

**If upgrading from a previous version:**
- Also run `supabase/003_drop_contacts_table.sql` to remove the deprecated contacts table

## 5. Verify Your Setup

1. Check the "Table Editor" in your Supabase dashboard
2. You should see a `quotes` table with the following columns:
   - `id` (UUID, Primary Key)
   - `first_name` (VARCHAR)
   - `last_name` (VARCHAR)
   - `email` (VARCHAR)
   - `phone` (VARCHAR)
   - `address` (VARCHAR)
   - `city` (VARCHAR)
   - `state` (VARCHAR)
   - `zip_code` (VARCHAR)
   - `dumpster_size` (VARCHAR)
   - `dropoff_date` (VARCHAR)
   - `time_needed` (VARCHAR)
   - `message` (TEXT)
   - `status` (ENUM)
   - `quoted_price` (NUMERIC)
   - `quote_notes` (TEXT)
   - `priority` (ENUM)
   - `phone` (VARCHAR)
   - `message` (TEXT)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

## 6. Test the Integration

You can test the connection by:

1. Starting your development server: `npm run dev`
2. Going to your contact form
3. Submitting a test message
4. Checking your Supabase table to see if the data was saved

## 7. Security Notes

- The `anon` key allows public access for contact form submissions
- The `service_role` key has admin privileges - keep it secure!
- Row Level Security (RLS) is enabled to protect your data
- Only authenticated users can read/update/delete contacts

## 8. Next Steps

Consider setting up:
- **Authentication**: Add user login for admin dashboard
- **Admin Dashboard**: Create pages to view/manage contacts
- **Real-time**: Subscribe to new contact submissions
- **File Storage**: If you need to handle file uploads

## Files Created

- `lib/supabase.ts` - Client-side Supabase configuration
- `lib/supabase-server.ts` - Server-side Supabase configuration  
- `lib/database.ts` - Database utility functions
- `supabase/002_create_quotes_table.sql` - Database migration for quotes
- `supabase/003_drop_contacts_table.sql` - Migration to remove deprecated contacts table

## Useful Commands

```bash
# Install Supabase CLI (optional)
npm install -g supabase

# Start local development
npm run dev

# Check if Supabase is connected (in browser console)
console.log(window.supabase)
```

## Troubleshooting

- **Connection issues**: Check your environment variables
- **Permission errors**: Verify your RLS policies
- **Type errors**: Update the Database type in `lib/supabase.ts`
- **Migration errors**: Check the SQL syntax in Supabase SQL Editor
