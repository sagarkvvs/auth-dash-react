
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
import { Plus, Edit, Trash2 } from 'lucide-react'

interface Student {
  id: string
  student_id: string
  full_name: string
  email: string
  phone: string
  department: string
  semester: number
  is_active: boolean
  academic_year_id: string
}

interface AcademicYear {
  id: string
  year_name: string
  is_active: boolean
}

export function Students() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [students, setStudents] = useState<Student[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState({
    student_id: '',
    full_name: '',
    email: '',
    phone: '',
    department: '',
    semester: 1,
    academic_year_id: ''
  })

  useEffect(() => {
    fetchStudents()
    fetchAcademicYears()
  }, [])

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('full_name')

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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
      if (editingStudent) {
        const { error } = await supabase
          .from('students')
          .update({
            student_id: formData.student_id,
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            department: formData.department,
            semester: formData.semester,
            academic_year_id: formData.academic_year_id
          })
          .eq('id', editingStudent.id)

        if (error) throw error
        
        toast({
          title: "Success",
          description: "Student updated successfully",
        })
      } else {
        const { error } = await supabase
          .from('students')
          .insert([{
            student_id: formData.student_id,
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            department: formData.department,
            semester: formData.semester,
            academic_year_id: formData.academic_year_id
          }])

        if (error) throw error
        
        toast({
          title: "Success",
          description: "Student added successfully",
        })
      }

      setIsDialogOpen(false)
      setEditingStudent(null)
      setFormData({
        student_id: '',
        full_name: '',
        email: '',
        phone: '',
        department: '',
        semester: 1,
        academic_year_id: ''
      })
      fetchStudents()
    } catch (error) {
      console.error('Error saving student:', error)
      toast({
        title: "Error",
        description: "Failed to save student",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setFormData({
      student_id: student.student_id,
      full_name: student.full_name,
      email: student.email || '',
      phone: student.phone || '',
      department: student.department,
      semester: student.semester,
      academic_year_id: student.academic_year_id || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)

      if (error) throw error
      
      toast({
        title: "Success",
        description: "Student deleted successfully",
      })
      fetchStudents()
    } catch (error) {
      console.error('Error deleting student:', error)
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      })
    }
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
          <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
          <p className="text-gray-600 mt-1">Manage student records and enrollment</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingStudent(null)
              setFormData({
                student_id: '',
                full_name: '',
                email: '',
                phone: '',
                department: '',
                semester: 1,
                academic_year_id: ''
              })
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{editingStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
              <DialogDescription>
                {editingStudent ? 'Update student information' : 'Add a new student to the system'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="student_id">Student ID</Label>
                  <Input
                    id="student_id"
                    type="text"
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                    required
                  />
                </div>
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
                  {editingStudent ? 'Update' : 'Add'} Student
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Students ({students.length})</CardTitle>
          <CardDescription>All registered students in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-mono">{student.student_id}</TableCell>
                  <TableCell className="font-medium">{student.full_name}</TableCell>
                  <TableCell>{student.email || '-'}</TableCell>
                  <TableCell>{student.department}</TableCell>
                  <TableCell>{student.semester}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      student.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {student.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(student)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(student.id)}>
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
