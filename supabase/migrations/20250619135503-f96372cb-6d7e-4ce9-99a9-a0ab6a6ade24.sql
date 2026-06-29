
-- Create a storage bucket for movie images
INSERT INTO storage.buckets (id, name, public)
VALUES ('movie-images', 'movie-images', true);

-- Create policy to allow anyone to view images (since bucket is public)
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'movie-images');

-- Create policy to allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'movie-images' AND auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update images
CREATE POLICY "Authenticated users can update images" ON storage.objects
FOR UPDATE USING (bucket_id = 'movie-images' AND auth.role() = 'authenticated');

-- Create policy to allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete images" ON storage.objects
FOR DELETE USING (bucket_id = 'movie-images' AND auth.role() = 'authenticated');
