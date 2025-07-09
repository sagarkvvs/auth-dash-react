-- Drop and recreate constraints to fix warnings
-- This will ensure no duplicate constraints exist

-- Check if constraints exist and drop them if they do
DO $$ 
BEGIN
    -- Drop existing constraints if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'attendance_student_id_fkey') THEN
        ALTER TABLE public.attendance DROP CONSTRAINT attendance_student_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'attendance_course_id_fkey') THEN
        ALTER TABLE public.attendance DROP CONSTRAINT attendance_course_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'attendance_marked_by_fkey') THEN
        ALTER TABLE public.attendance DROP CONSTRAINT attendance_marked_by_fkey;
    END IF;
END $$;

-- Re-add the constraints cleanly
ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_marked_by_fkey 
FOREIGN KEY (marked_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add other missing constraints if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'courses_faculty_id_fkey') THEN
        ALTER TABLE public.courses 
        ADD CONSTRAINT courses_faculty_id_fkey 
        FOREIGN KEY (faculty_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'courses_academic_year_id_fkey') THEN
        ALTER TABLE public.courses 
        ADD CONSTRAINT courses_academic_year_id_fkey 
        FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'student_courses_student_id_fkey') THEN
        ALTER TABLE public.student_courses 
        ADD CONSTRAINT student_courses_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'student_courses_course_id_fkey') THEN
        ALTER TABLE public.student_courses 
        ADD CONSTRAINT student_courses_course_id_fkey 
        FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'students_academic_year_id_fkey') THEN
        ALTER TABLE public.students 
        ADD CONSTRAINT students_academic_year_id_fkey 
        FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE SET NULL;
    END IF;
END $$;