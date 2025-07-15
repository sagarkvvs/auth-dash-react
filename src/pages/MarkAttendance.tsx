import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { UserCheck, UserX, Clock, Save } from 'lucide-react'

interface Course {
  id: string
  course_code: string
  course_name: string
  department: string
}

interface Student {
  id: string
  student_id: string
  full_name: string
  department: string
}

interface AttendanceRecord {
  student_id: string
  status: 'present' | 'absent' | 'late'
}

export function MarkAttendance() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      fetchStudentsForCourse()
      fetchExistingAttendance()
    }
  }, [selectedCourse, selectedDate])

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, course_code, course_name, department')
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
    }
  }

  const fetchStudentsForCourse = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('student_courses')
        .select(`
          students (
            id,
            student_id,
            full_name,
            department
          )
        `)
        .eq('course_id', selectedCourse)

      if (error) throw error
      
      // Fix the data extraction - students is nested inside each record
      const studentList = data?.map(item => item.students).filter(Boolean).flat() || []
      setStudents(studentList)
      
      // Initialize attendance with 'present' by default
      const initialAttendance: Record<string, 'present' | 'absent' | 'late'> = {}
      studentList.forEach(student => {
        if (student?.id) {
          initialAttendance[student.id] = 'present'
        }
      })
      setAttendance(initialAttendance)
    } catch (error) {
      console.error('Error fetching students:', error)
      toast({
        title: "Error",
        description: "Failed to fetch students for course",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchExistingAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('course_id', selectedCourse)
        .eq('date', selectedDate)

      if (error) throw error
      
      if (data && data.length > 0) {
        const existingAttendance: Record<string, 'present' | 'absent' | 'late'> = {}
        data.forEach(record => {
          existingAttendance[record.student_id] = record.status as 'present' | 'absent' | 'late'
        })
        setAttendance(prev => ({ ...prev, ...existingAttendance }))
      }
    } catch (error) {
      console.error('Error fetching existing attendance:', error)
    }
  }

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  const handleSaveAttendance = async () => {
    if (!selectedCourse || !profile?.id) return

    try {
      setSaving(true)
      
      // First, delete existing attendance for this date and course
      await supabase
        .from('attendance')
        .delete()
        .eq('course_id', selectedCourse)
        .eq('date', selectedDate)

      // Then insert new attendance records
      const attendanceRecords = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: studentId,
        course_id: selectedCourse,
        date: selectedDate,
        status,
        marked_by: profile.id
      }))

      const { error } = await supabase
        .from('attendance')
        .insert(attendanceRecords)

      if (error) throw error
      
      toast({
        title: "Success",
        description: "Attendance saved successfully",
      })
    } catch (error) {
      console.error('Error saving attendance:', error)
      toast({
        title: "Error",
        description: "Failed to save attendance",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <UserCheck className="h-4 w-4 text-green-600" />
      case 'absent':
        return <UserX className="h-4 w-4 text-red-600" />
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mark Attendance</h2>
          <p className="text-gray-600 mt-1">Record student attendance for courses</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Course and Date</CardTitle>
          <CardDescription>Choose the course and date to mark attendance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-2">
                Course
              </label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.course_code} - {course.course_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedCourse && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Student Attendance</CardTitle>
                <CardDescription>Mark attendance for each student</CardDescription>
              </div>
              <Button onClick={handleSaveAttendance} disabled={saving} className="hidden md:flex">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Attendance'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading students...</div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No students enrolled in this course
              </div>
            ) : (
              <>
                {/* Mobile-friendly card layout */}
                <div className="md:hidden space-y-4">
                  {students.map((student) => (
                    <Card key={student.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-base">{student.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{student.student_id}</p>
                        </div>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(attendance[student.id])}`}>
                          {getStatusIcon(attendance[student.id])}
                          <span className="ml-1 capitalize">{attendance[student.id]}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          size="sm"
                          variant={attendance[student.id] === 'present' ? 'default' : 'outline'}
                          onClick={() => handleAttendanceChange(student.id, 'present')}
                          className="flex items-center justify-center"
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant={attendance[student.id] === 'late' ? 'default' : 'outline'}
                          onClick={() => handleAttendanceChange(student.id, 'late')}
                          className="flex items-center justify-center"
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Late
                        </Button>
                        <Button
                          size="sm"
                          variant={attendance[student.id] === 'absent' ? 'default' : 'outline'}
                          onClick={() => handleAttendanceChange(student.id, 'absent')}
                          className="flex items-center justify-center"
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Absent
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop table layout */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-mono">{student.student_id}</TableCell>
                          <TableCell className="font-medium">{student.full_name}</TableCell>
                          <TableCell>{student.department}</TableCell>
                          <TableCell>
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(attendance[student.id])}`}>
                              {getStatusIcon(attendance[student.id])}
                              <span className="ml-1 capitalize">{attendance[student.id]}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant={attendance[student.id] === 'present' ? 'default' : 'outline'}
                                onClick={() => handleAttendanceChange(student.id, 'present')}
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={attendance[student.id] === 'late' ? 'default' : 'outline'}
                                onClick={() => handleAttendanceChange(student.id, 'late')}
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={attendance[student.id] === 'absent' ? 'default' : 'outline'}
                                onClick={() => handleAttendanceChange(student.id, 'absent')}
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile save button at bottom */}
                <div className="md:hidden mt-6">
                  <Button onClick={handleSaveAttendance} disabled={saving} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Attendance'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
