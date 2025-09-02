-- Fix order number generation to prevent race conditions
-- This ensures atomic and consistent order number generation

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  order_num TEXT;
BEGIN
  -- Lock the orders table to prevent concurrent access during number generation
  LOCK TABLE orders IN EXCLUSIVE MODE;
  
  -- Get the next sequence number more reliably
  SELECT COALESCE(
    MAX(
      CASE 
        WHEN order_number ~ '^ORD[0-9]{6}$' 
        THEN CAST(SUBSTRING(order_number FROM 4) AS INTEGER)
        ELSE 0
      END
    ), 0
  ) + 1
  INTO next_num
  FROM orders;
  
  -- Format as ORD followed by 6-digit number with leading zeros
  order_num := 'ORD' || LPAD(next_num::TEXT, 6, '0');
  
  -- Ensure uniqueness by checking if this number already exists
  WHILE EXISTS (SELECT 1 FROM orders WHERE order_number = order_num) LOOP
    next_num := next_num + 1;
    order_num := 'ORD' || LPAD(next_num::TEXT, 6, '0');
  END LOOP;
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;