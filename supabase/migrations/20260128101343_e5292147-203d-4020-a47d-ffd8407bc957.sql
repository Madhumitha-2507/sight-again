-- Add storage policies for person-images bucket to allow public uploads
CREATE POLICY "Allow public uploads to person-images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'person-images');

CREATE POLICY "Allow public updates to person-images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'person-images');

CREATE POLICY "Allow public deletes from person-images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'person-images');