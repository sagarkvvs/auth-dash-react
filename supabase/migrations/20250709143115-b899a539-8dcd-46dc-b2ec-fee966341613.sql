-- Add missing foreign key constraints to fix Supabase warnings

-- Add foreign keys for attendance table
ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_marked_by_fkey 
FOREIGN KEY (marked_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add foreign keys for courses table  
ALTER TABLE public.courses 
ADD CONSTRAINT courses_faculty_id_fkey 
FOREIGN KEY (faculty_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.courses 
ADD CONSTRAINT courses_academic_year_id_fkey 
FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE SET NULL;

-- Add foreign keys for student_courses table
ALTER TABLE public.student_courses 
ADD CONSTRAINT student_courses_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.student_courses 
ADD CONSTRAINT student_courses_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

-- Add foreign key for students table
ALTER TABLE public.students 
ADD CONSTRAINT students_academic_year_id_fkey 
FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE SET NULL;

-- Add indexes on foreign key columns for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_course_id ON public.attendance(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_marked_by ON public.attendance(marked_by);
CREATE INDEX IF NOT EXISTS idx_courses_faculty_id ON public.courses(faculty_id);
CREATE INDEX IF NOT EXISTS idx_courses_academic_year_id ON public.courses(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_student_id ON public.student_courses(student_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_course_id ON public.student_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_students_academic_year_id ON public.students(academic_year_id);