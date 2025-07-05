import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { FileText, Download, Calendar, Users, BarChart3 } from 'lucide-react'

interface Course {
  id: string
  course_code: string
  course_name: string
}

interface AttendanceReport {
  student_id: string
  student_name: string
  total_classes: number
  present_count: number
  absent_count: number
  late_count: number
  attendance_percentage: number
}

interface AttendanceSummary {
  total_students: number
  total_classes: number
  average_attendance: number
  present_today: number
  absent_today: number
}

export function Reports() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [attendanceReport, setAttendanceReport] = useState<AttendanceReport[]>([])
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      generateReport()
    }
  }, [selectedCourse, selectedMonth])

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, course_code, course_name')
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

  const generateReport = async () => {
    if (!selectedCourse) return

    try {
      setLoading(true)
      
      // Get start and end dates for the selected month
      const startDate = `${selectedMonth}-01`
      const endDate = new Date(selectedMonth + '-01')
      endDate.setMonth(endDate.getMonth() + 1)
      endDate.setDate(0)
      const endDateStr = endDate.toISOString().split('T')[0]

      // Fetch attendance data for the selected course and month
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          student_id,
          status,
          date,
          students!inner(student_id, full_name)
        `)
        .eq('course_id', selectedCourse)
        .gte('date', startDate)
        .lte('date', endDate)

      if (attendanceError) throw attendanceError

      // Get unique dates (classes held)
      const uniqueDates = [...new Set(attendanceData?.map(record => record.date) || [])]
      const totalClasses = uniqueDates.length

      // Process attendance data
      const studentAttendance: { [key: string]: any } = {}
      
      attendanceData?.forEach(record => {
        const studentId = record.student_id
        if (!studentAttendance[studentId]) {
          studentAttendance[studentId] = {
            student_id: record.students.student_id,
            student_name: record.students.full_name,
            present_count: 0,
            absent_count: 0,
            late_count: 0,
            total_classes: totalClasses
          }
        }
        
        if (record.status === 'present') {
          studentAttendance[studentId].present_count++
        } else if (record.status === 'absent') {
          studentAttendance[studentId].absent_count++
        } else if (record.status === 'late') {
          studentAttendance[studentId].late_count++
        }
      })

      // Calculate attendance percentages
      const reportData: AttendanceReport[] = Object.values(studentAttendance).map((student: any) => ({
        ...student,
        attendance_percentage: totalClasses > 0 ? 
          ((student.present_count + student.late_count) / totalClasses) * 100 : 0
      }))

      setAttendanceReport(reportData)

      // Calculate summary
      const totalStudents = reportData.length
      const averageAttendance = reportData.length > 0 ? 
        reportData.reduce((sum, student) => sum + student.attendance_percentage, 0) / reportData.length : 0

      // Get today's attendance
      const today = new Date().toISOString().split('T')[0]
      const { data: todayAttendance } = await supabase
        .from('attendance')
        .select('status')
        .eq('course_id', selectedCourse)
        .eq('date', today)

      const presentToday = todayAttendance?.filter(record => record.status === 'present').length || 0
      const absentToday = todayAttendance?.filter(record => record.status === 'absent').length || 0

      setAttendanceSummary({
        total_students: totalStudents,
        total_classes: totalClasses,
        average_attendance: averageAttendance,
        present_today: presentToday,
        absent_today: absentToday
      })

    } catch (error) {
      console.error('Error generating report:', error)
      toast({
        title: "Error",
        description: "Failed to generate attendance report",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (attendanceReport.length === 0) return

    const headers = ['Student ID', 'Student Name', 'Total Classes', 'Present', 'Absent', 'Late', 'Attendance %']
    const csvContent = [
      headers.join(','),
      ...attendanceReport.map(record => [
        record.student_id,
        record.student_name,
        record.total_classes,
        record.present_count,
        record.absent_count,
        record.late_count,
        record.attendance_percentage.toFixed(2) + '%'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `attendance_report_${selectedMonth}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Success",
      description: "Report exported successfully",
    })
  }

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 75) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Reports</h2>
          <p className="text-gray-600 mt-1">Generate and analyze attendance reports</p>
        </div>
        {attendanceReport.length > 0 && (
          <Button onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Select course and time period for the report</CardDescription>
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
              <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">
                Month
              </label>
              <input
                type="month"
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {attendanceSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-3xl font-bold text-gray-900">{attendanceSummary.total_students}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Classes</p>
                  <p className="text-3xl font-bold text-gray-900">{attendanceSummary.total_classes}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Attendance</p>
                  <p className="text-3xl font-bold text-gray-900">{attendanceSummary.average_attendance.toFixed(1)}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Present</p>
                  <p className="text-3xl font-bold text-gray-900">{attendanceSummary.present_today}</p>
                </div>
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedCourse && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Attendance Report
            </CardTitle>
            <CardDescription>
              Detailed attendance report for selected course and month
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Generating report...</div>
            ) : attendanceReport.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No attendance data found for the selected period
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Total Classes</TableHead>
                    <TableHead>Present</TableHead>
                    <TableHead>Absent</TableHead>
                    <TableHead>Late</TableHead>
                    <TableHead>Attendance %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceReport.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{record.student_id}</TableCell>
                      <TableCell className="font-medium">{record.student_name}</TableCell>
                      <TableCell>{record.total_classes}</TableCell>
                      <TableCell className="text-green-600">{record.present_count}</TableCell>
                      <TableCell className="text-red-600">{record.absent_count}</TableCell>
                      <TableCell className="text-yellow-600">{record.late_count}</TableCell>
                      <TableCell>
                        <span className={`font-semibold ${getAttendanceColor(record.attendance_percentage)}`}>
                          {record.attendance_percentage.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
