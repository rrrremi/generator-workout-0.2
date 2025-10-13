-- ============================================================================
-- FIX MEASUREMENT IMAGES STORAGE
-- ============================================================================
-- Fix storage bucket and policies for measurement images
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload own measurement images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own measurement images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own measurement images" ON storage.objects;

-- Update bucket to be public (so we can access images via URL)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'measurement-images';

-- Create simpler, more permissive policies
CREATE POLICY "Authenticated users can upload measurement images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'measurement-images');

CREATE POLICY "Authenticated users can view measurement images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'measurement-images');

CREATE POLICY "Users can delete own measurement images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'measurement-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
