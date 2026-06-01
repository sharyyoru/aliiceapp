-- Function to generate unique invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_number text;
  year_prefix text;
  next_seq integer;
BEGIN
  -- Get current year as 2-digit prefix
  year_prefix := to_char(CURRENT_DATE, 'YY');
  
  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(
    CASE 
      WHEN consultation_id ~ ('^' || year_prefix || '-[0-9]+$') 
      THEN CAST(SUBSTRING(consultation_id FROM '-([0-9]+)$') AS integer)
      ELSE 0
    END
  ), 0) + 1
  INTO next_seq
  FROM consultations
  WHERE consultation_id LIKE year_prefix || '-%';
  
  -- Format as YY-XXXXX (e.g., 26-00001)
  new_number := year_prefix || '-' || LPAD(next_seq::text, 5, '0');
  
  RETURN new_number;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION generate_invoice_number() TO authenticated;
