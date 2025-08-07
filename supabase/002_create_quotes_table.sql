-- Create quotes table for dumpster rental quote requests
CREATE TABLE IF NOT EXISTS quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Customer Information
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    
    -- Service Location
    address VARCHAR(500),
    city VARCHAR(255),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    
    -- Service Details
    dumpster_size VARCHAR(100),
    dropoff_date DATE,
    time_needed VARCHAR(100),
    
    -- Additional Information
    message TEXT,
    
    -- Quote Status and Pricing
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'accepted', 'declined', 'completed')),
    quoted_price DECIMAL(10,2),
    quote_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    quoted_at TIMESTAMP WITH TIME ZONE,
    
    -- Internal tracking
    assigned_to VARCHAR(255),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_email ON quotes(email);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_dropoff_date ON quotes(dropoff_date);
CREATE INDEX IF NOT EXISTS idx_quotes_location ON quotes(city, state);

-- Enable Row Level Security (RLS)
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous inserts (for quote form submissions)
CREATE POLICY "Allow anonymous quote submissions" ON quotes
    FOR INSERT 
    TO anon 
    WITH CHECK (true);

-- Create policy to allow authenticated users to read all quotes
CREATE POLICY "Allow authenticated reads" ON quotes
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Create policy to allow authenticated users to update quotes
CREATE POLICY "Allow authenticated updates" ON quotes
    FOR UPDATE 
    TO authenticated 
    USING (true);

-- Create policy to allow authenticated users to delete quotes
CREATE POLICY "Allow authenticated deletes" ON quotes
    FOR DELETE 
    TO authenticated 
    USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quotes_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    -- Set quoted_at when status changes to 'quoted'
    IF NEW.status = 'quoted' AND OLD.status != 'quoted' THEN
        NEW.quoted_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update timestamps
CREATE TRIGGER update_quotes_updated_at 
    BEFORE UPDATE ON quotes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_quotes_updated_at_column();

-- Add helpful comments to the table
COMMENT ON TABLE quotes IS 'Dumpster rental quote requests with structured data';
COMMENT ON COLUMN quotes.status IS 'Quote status: pending, quoted, accepted, declined, completed';
COMMENT ON COLUMN quotes.priority IS 'Quote priority: low, normal, high, urgent';
COMMENT ON COLUMN quotes.quoted_price IS 'Final quoted price in dollars';
COMMENT ON COLUMN quotes.dropoff_date IS 'Requested or scheduled dropoff date';
COMMENT ON COLUMN quotes.quoted_at IS 'Timestamp when quote was provided to customer';
