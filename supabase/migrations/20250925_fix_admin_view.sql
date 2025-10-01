-- Create a function to get all profiles (bypassing RLS)
CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM profiles ORDER BY created_at DESC;
$$;

-- Create a function to create other functions (for client-side use)
CREATE OR REPLACE FUNCTION public.create_get_all_profiles_function(sql_command text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_command;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_get_all_profiles_function TO authenticated;

-- Fix the admin policy to ensure it works correctly
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );
