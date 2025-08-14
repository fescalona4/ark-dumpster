-- Create website_visits table for custom analytics
CREATE TABLE website_visits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path text NOT NULL,
  user_agent text,
  ip_address inet,
  referrer text,
  session_id text,
  device_type text,
  browser text,
  country text,
  city text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX idx_website_visits_page_path ON website_visits(page_path);
CREATE INDEX idx_website_visits_created_at ON website_visits(created_at);
CREATE INDEX idx_website_visits_session_id ON website_visits(session_id);

-- Enable Row Level Security (optional)
ALTER TABLE website_visits ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows inserting visits (public access)
CREATE POLICY "Allow public insert on website_visits" ON website_visits
  FOR INSERT TO anon
  WITH CHECK (true);

-- Create a policy that allows admins to read all visits
CREATE POLICY "Allow authenticated read on website_visits" ON website_visits
  FOR SELECT TO authenticated
  USING (true);
