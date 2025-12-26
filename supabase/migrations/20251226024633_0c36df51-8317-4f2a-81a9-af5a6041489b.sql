-- Allow public delete access to missing_persons
CREATE POLICY "Allow public delete access to missing_persons"
ON public.missing_persons
FOR DELETE
USING (true);