
-- Step 1: Create a security definer function to check user roles safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Step 2: Drop existing RLS policies that cause infinite recursion
DROP POLICY IF EXISTS "Faculty can manage academic years" ON public.academic_years;
DROP POLICY IF EXISTS "Faculty can manage courses" ON public.courses;
DROP POLICY IF EXISTS "Faculty can manage students" ON public.students;
DROP POLICY IF EXISTS "Faculty can manage student courses" ON public.student_courses;
DROP POLICY IF EXISTS "Faculty can manage attendance" ON public.attendance;

-- Step 3: Create new secure RLS policies using the security definer function
CREATE POLICY "Faculty can manage academic years" ON public.academic_years
  FOR ALL TO authenticated 
  USING (public.get_current_user_role() IN ('faculty', 'hod', 'admin'));

CREATE POLICY "Faculty can manage courses" ON public.courses
  FOR ALL TO authenticated 
  USING (public.get_current_user_role() IN ('faculty', 'hod', 'admin'));

CREATE POLICY "Faculty can manage students" ON public.students
  FOR ALL TO authenticated 
  USING (public.get_current_user_role() IN ('faculty', 'hod', 'admin'));

CREATE POLICY "Faculty can manage student courses" ON public.student_courses
  FOR ALL TO authenticated 
  USING (public.get_current_user_role() IN ('faculty', 'hod', 'admin'));

CREATE POLICY "Faculty can manage attendance" ON public.attendance
  FOR ALL TO authenticated 
  USING (public.get_current_user_role() IN ('faculty', 'hod', 'admin'));

-- Step 4: Add missing INSERT policy for profiles table to allow new user registration
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
