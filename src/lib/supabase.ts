
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yrhvitfzgxlgftdchgkn.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyaHZpdGZ6Z3hsZ2Z0ZGNoZ2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzU2NjQsImV4cCI6MjA2NzMxMTY2NH0.U3YsycFDgvUyIWBnOGO5s46nYXciIqw79WqopaUSSUo'

export const supabase = createClient(supabaseUrl, supabaseKey)

export type UserRole = 'faculty' | 'hod' | 'admin'

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  employee_id?: string
  full_name?: string
  department?: string
}
