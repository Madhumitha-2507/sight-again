-- Add columns to store detailed analysis breakdown
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS face_similarity NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS appearance_match NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS analysis_details JSONB,
ADD COLUMN IF NOT EXISTS reasoning TEXT;