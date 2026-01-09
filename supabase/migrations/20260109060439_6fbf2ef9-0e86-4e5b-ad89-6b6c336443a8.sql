-- Add appearance/physical description columns to missing_persons table
ALTER TABLE public.missing_persons 
ADD COLUMN IF NOT EXISTS height_cm INTEGER,
ADD COLUMN IF NOT EXISTS build TEXT,
ADD COLUMN IF NOT EXISTS hair_color TEXT,
ADD COLUMN IF NOT EXISTS clothing_description TEXT,
ADD COLUMN IF NOT EXISTS distinctive_features TEXT;