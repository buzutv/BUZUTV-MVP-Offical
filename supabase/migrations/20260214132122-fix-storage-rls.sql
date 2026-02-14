
-- Relax RLS for movie-images bucket to allow both authenticated and anonymous uploads
-- This is necessary because the admin login currently uses a simulated auth system
-- that doesn't create a real Supabase session.

DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;

CREATE POLICY "Allow both authenticated and anonymous uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'movie-images');

CREATE POLICY "Allow both authenticated and anonymous updates" ON storage.objects
FOR UPDATE USING (bucket_id = 'movie-images');

CREATE POLICY "Allow both authenticated and anonymous deletes" ON storage.objects
FOR DELETE USING (bucket_id = 'movie-images');

CREATE POLICY "Public Read Access" ON storage.objects
FOR SELECT USING (bucket_id = 'movie-images');
