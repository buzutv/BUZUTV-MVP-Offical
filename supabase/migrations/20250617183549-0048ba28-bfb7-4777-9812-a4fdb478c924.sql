
-- Add seasons_data column to store detailed season information as JSON
ALTER TABLE public.content 
ADD COLUMN seasons_data JSONB;
