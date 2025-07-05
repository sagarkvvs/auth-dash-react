
-- Create user profiles table to store additional user information
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  employee_id TEXT UNIQUE,
  role TEXT CHECK (role IN ('faculty', 'hod', 'admin')) NOT NULL DEFAULT 'faculty',
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create academic years table
CREATE TABLE public.academic_years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year_name TEXT NOT NULL, -- e.g., "2023-2024"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_code TEXT NOT NULL UNIQUE,
  course_name TEXT NOT NULL,
  department TEXT NOT NULL,
  semester INTEGER CHECK (semester >= 1 AND semester <= 8),
  credits INTEGER DEFAULT 3,
  faculty_id UUID REFERENCES public.profiles(id),
  academic_year_id UUID REFERENCES public.academic_years(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  department TEXT NOT NULL,
  semester INTEGER CHECK (semester >= 1 AND semester <= 8),
  academic_year_id UUID REFERENCES public.academic_years(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_courses table (many-to-many relationship)
CREATE TABLE public.student_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent', 'late')) NOT NULL,
  marked_by UUID REFERENCES public.profiles(id),
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  UNIQUE(student_id, course_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for academic years (faculty and above can view/manage)
CREATE POLICY "Authenticated users can view academic years" ON public.academic_years
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Faculty can manage academic years" ON public.academic_years
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'hod', 'admin'))
  );

-- Create RLS policies for courses
CREATE POLICY "Authenticated users can view courses" ON public.courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Faculty can manage courses" ON public.courses
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'hod', 'admin'))
  );

-- Create RLS policies for students
CREATE POLICY "Authenticated users can view students" ON public.students
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Faculty can manage students" ON public.students
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'hod', 'admin'))
  );

-- Create RLS policies for student_courses
CREATE POLICY "Authenticated users can view student courses" ON public.student_courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Faculty can manage student courses" ON public.student_courses
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'hod', 'admin'))
  );

-- Create RLS policies for attendance
CREATE POLICY "Authenticated users can view attendance" ON public.attendance
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Faculty can manage attendance" ON public.attendance
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'hod', 'admin'))
  );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'faculty')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
