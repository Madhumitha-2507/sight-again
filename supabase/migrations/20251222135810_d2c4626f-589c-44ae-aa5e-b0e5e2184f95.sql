-- Create missing_persons table to store uploaded cases
CREATE TABLE public.missing_persons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  description TEXT NOT NULL,
  last_seen_location TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  image_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create matches table for AI-detected matches
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  missing_person_id UUID NOT NULL REFERENCES public.missing_persons(id) ON DELETE CASCADE,
  confidence_score DECIMAL(5,2) NOT NULL,
  frame_url TEXT,
  video_filename TEXT,
  location TEXT,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alerts table for notifications
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  missing_person_id UUID NOT NULL REFERENCES public.missing_persons(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL DEFAULT 'match_detected',
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public access for this app)
ALTER TABLE public.missing_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for this system)
CREATE POLICY "Allow public read access to missing_persons" 
ON public.missing_persons FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to missing_persons" 
ON public.missing_persons FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to missing_persons" 
ON public.missing_persons FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to matches" 
ON public.matches FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to matches" 
ON public.matches FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to matches" 
ON public.matches FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to alerts" 
ON public.alerts FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to alerts" 
ON public.alerts FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to alerts" 
ON public.alerts FOR UPDATE USING (true);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('person-images', 'person-images', true);

-- Create storage policies
CREATE POLICY "Allow public read access to person-images"
ON storage.objects FOR SELECT USING (bucket_id = 'person-images');

CREATE POLICY "Allow public upload to person-images"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'person-images');

-- Enable realtime for alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_missing_persons_updated_at
BEFORE UPDATE ON public.missing_persons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();