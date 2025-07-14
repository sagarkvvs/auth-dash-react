-- Update RLS policy to allow all authenticated users to insert students
DROP POLICY IF EXISTS "Faculty can manage students" ON students;

-- Create separate policies for different operations
CREATE POLICY "Authenticated users can view students" 
ON students FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can add students" 
ON students FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Faculty can update students" 
ON students FOR UPDATE 
TO authenticated 
USING (get_current_user_role() = ANY (ARRAY['faculty'::text, 'hod'::text, 'admin'::text]));

CREATE POLICY "Faculty can delete students" 
ON students FOR DELETE 
TO authenticated 
USING (get_current_user_role() = ANY (ARRAY['faculty'::text, 'hod'::text, 'admin'::text]));