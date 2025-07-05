
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react'

interface Course {
  id: string
  course_code: string
  course_name: string
  department: string
  semester: number
  credits: number
  faculty_id: string
  academic_year_id: string
  created_at: string
}

interface Faculty {
  id: string
  full_name: string
  email: string
}

interface AcademicYear {
  id: string
  year_name: string
  is_active: boolean
}

export function Courses() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [courses, setCourses] = useState<Course[]>([])
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    department: '',
    semester: 1,
    credits: 3,
    faculty_id: '',
    academic_year_id: ''
  })

  useEffect(() => {
    fetchCourses()
    fetchFaculty()
    fetchAcademicYears()
  }, [])

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('course_name')

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast({
        title: "Error",
        description: "Failed to fetch courses",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchFaculty = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('role', ['faculty', 'hod', 'admin'])
        .order('full_name')

      if (error) throw error
      setFaculty(data || [])
    } catch (error) {
      console.error('Error fetching faculty:', error)
    }
  }

  const fetchAcademicYears = async () => {
    try {
      const { data, error } = await supabase
        .from('academic_years')
        .select('id, year_name, is_active')
        .order('year_name', { ascending: false })

      if (error) throw error
      setAcademicYears(data || [])
    } catch (error) {
      console.error('Error fetching academic years:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingCourse) {
        const { error } = await supabase
          .from('courses')
          .update({
            course_code: formData.course_code,
            course_name: formData.course_name,
            department: formData.department,
            semester: formData.semester,
            credits: formData.credits,
            faculty_id: formData.faculty_id || null,
            academic_year_id: formData.academic_year_id || null
          })
          .eq('id', editingCourse.id)

        if (error) throw error
        
        toast({
          title: "Success",
          description: "Course updated successfully",
        })
      } else {
        const { error } = await supabase
          .from('courses')
          .insert([{
            course_code: formData.course_code,
            course_name: formData.course_name,
            department: formData.department,
            semester: formData.semester,
            credits: formData.credits,
            faculty_id: formData.faculty_id || null,
            academic_year_id: formData.academic_year_id || null
          }])

        if (error) throw error
        
        toast({
          title: "Success",
          description: "Course added successfully",
        })
      }

      setIsDialogOpen(false)
      setEditingCourse(null)
      setFormData({
        course_code: '',
        course_name: '',
        department: '',
        semester: 1,
        credits: 3,
        faculty_id: '',
        academic_year_id: ''
      })
      fetchCourses()
    } catch (error) {
      console.error('Error saving course:', error)
      toast({
        title: "Error",
        description: "Failed to save course",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      course_code: course.course_code,
      course_name: course.course_name,
      department: course.department,
      semester: course.semester,
      credits: course.credits,
      faculty_id: course.faculty_id || '',
      academic_year_id: course.academic_year_id || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)

      if (error) throw error
      
      toast({
        title: "Success",
        description: "Course deleted successfully",
      })
      fetchCourses()
    } catch (error) {
      console.error('Error deleting course:', error)
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      })
    }
  }

  const getFacultyName = (facultyId: string) => {
    const facultyMember = faculty.find(f => f.id === facultyId)
    return facultyMember ? facultyMember.full_name : 'Unassigned'
  }

  const getAcademicYearName = (yearId: string) => {
    const year = academicYears.find(y => y.id === yearId)
    return year ? year.year_name : 'Not Set'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Course Management</h2>
          <p className="text-gray-600 mt-1">Manage courses and curriculum</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingCourse(null)
              setFormData({
                course_code: '',
                course_name: '',
                department: '',
                semester: 1,
                credits: 3,
                faculty_id: '',
                academic_year_id: ''
              })
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{editingCourse ? 'Edit Course' : 'Add New Course'}</DialogTitle>
              <DialogDescription>
                {editingCourse ? 'Update course information' : 'Add a new course to the curriculum'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="course_code">Course Code</Label>
                  <Input
                    id="course_code"
                    type="text"
                    value={formData.course_code}
                    onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                    placeholder="e.g., CS101"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="course_name">Course Name</Label>
                  <Input
                    id="course_name"
                    type="text"
                    value={formData.course_name}
                    onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                    placeholder="e.g., Introduction to Computer Science"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g., Computer Science"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="credits">Credits</Label>
                  <Input
                    id="credits"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 3 })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="semester">Semester</Label>
                  <Select value={formData.semester.toString()} onValueChange={(value) => setFormData({ ...formData, semester: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8].map(sem => (
                        <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="faculty">Faculty</Label>
                  <Select value={formData.faculty_id} onValueChange={(value) => setFormData({ ...formData, faculty_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select faculty" />
                    </SelectTrigger>
                    <SelectContent>
                      {faculty.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="academic_year">Academic Year</Label>
                <Select value={formData.academic_year_id} onValueChange={(value) => setFormData({ ...formData, academic_year_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map(year => (
                      <SelectItem key={year.id} value={year.id}>{year.year_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCourse ? 'Update' : 'Add'} Course
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Courses ({courses.length})
          </CardTitle>
          <CardDescription>All courses in the curriculum</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Code</TableHead>
                <TableHead>Course Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Faculty</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-mono font-semibold">{course.course_code}</TableCell>
                  <TableCell className="font-medium">{course.course_name}</TableCell>
                  <TableCell>{course.department}</TableCell>
                  <TableCell>{course.semester}</TableCell>
                  <TableCell>{course.credits}</TableCell>
                  <TableCell>{getFacultyName(course.faculty_id)}</TableCell>
                  <TableCell>{getAcademicYearName(course.academic_year_id)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(course)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(course.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
