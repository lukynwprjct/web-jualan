-- Create user_identities table
CREATE TABLE IF NOT EXISTS public.user_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  lokasi TEXT NOT NULL,
  sent_to_whatsapp BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_identities ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert (for welcome page form)
CREATE POLICY "Allow authenticated insert"
  ON public.user_identities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow everyone to read (optional)
CREATE POLICY "Allow public read"
  ON public.user_identities
  FOR SELECT
  TO public
  WITH CHECK (true);
