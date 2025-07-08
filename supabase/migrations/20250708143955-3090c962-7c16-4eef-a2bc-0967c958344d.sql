-- Remove foreign key constraint from profiles table that references auth.users
-- This is causing warnings as we should not reference auth schema directly
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Add a comment to clarify that id should match auth.uid() but without FK constraint
COMMENT ON COLUMN public.profiles.id IS 'Should match auth.uid() but without foreign key constraint to avoid auth schema dependencies';