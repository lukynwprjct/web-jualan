-- Add is_public column if not exists
ALTER TABLE brand_settings 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Update existing rows to be public by default
UPDATE brand_settings SET is_public = true WHERE is_public IS NULL;

-- Make column not nullable after population
ALTER TABLE brand_settings 
ALTER COLUMN is_public SET NOT NULL;
