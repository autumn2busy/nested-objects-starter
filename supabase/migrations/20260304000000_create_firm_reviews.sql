-- Create the firm_reviews table to store UGC ratings and comments
CREATE TABLE IF NOT EXISTS public.firm_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  firm_id uuid NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  status text DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(firm_id, profile_id) -- A user can only review a firm once
);

-- Protect with Row Level Security (RLS)
ALTER TABLE public.firm_reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read access to approved reviews
CREATE POLICY "Approved reviews are viewable by everyone" 
  ON public.firm_reviews FOR SELECT 
  USING (status = 'approved');

-- (Note: Insertions/Updates will be handled via a secure Server Action using the Service Role Key
-- to prevent spoofing of profile_id. Therefore, no public INSERT policy is needed).

-- Add a comment to describe the table
COMMENT ON TABLE public.firm_reviews IS 'User generated content (UGC) reviews for hiring firms submitted by authenticated members';
