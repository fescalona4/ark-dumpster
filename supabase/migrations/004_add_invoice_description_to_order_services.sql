-- Add invoice_description field to order_services table
-- This allows each order to have custom descriptions for services that appear on invoices
ALTER TABLE order_services 
ADD COLUMN invoice_description TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN order_services.invoice_description IS 'Custom description for this service item that will appear on invoices for this specific order';