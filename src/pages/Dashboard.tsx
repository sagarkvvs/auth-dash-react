
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Users, Calendar, TrendingUp, UserCheck, FileText, Clock, AlertCircle } from 'lucide-react'

interface DashboardStats {
  totalStudents: number
  presentToday: number
  absentToday: number
  attendanceRate: number
}

interface RecentActivity {
  id: string
  type: 'attendance' | 'student' | 'course'
  message: string
  timestamp: string
}

export function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch total students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id')
        .eq('is_active', true)

      if (studentsError) throw studentsError

      const totalStudents = studentsData?.length || 0

      // Fetch today's attendance
      const today = new Date().toISOString().split('T')[0]
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('status')
        .eq('date', today)

      if (attendanceError && attendanceError.code !== 'PGRST116') {
        throw attendanceError
      }

      const presentToday = attendanceData?.filter(record => record.status === 'present').length || 0
      const absentToday = attendanceData?.filter(record => record.status === 'absent').length || 0
      const totalTodayRecords = attendanceData?.length || 0

      // Calculate attendance rate (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const { data: monthlyAttendance, error: monthlyError } = await supabase
        .from('attendance')
        .select('status')
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])

      if (monthlyError && monthlyError.code !== 'PGRST116') {
        throw monthlyError
      }

      const monthlyPresent = monthlyAttendance?.filter(record => record.status === 'present' || record.status === 'late').length || 0
      const monthlyTotal = monthlyAttendance?.length || 0
      const attendanceRate = monthlyTotal > 0 ? Math.round((monthlyPresent / monthlyTotal) * 100) : 0

      setStats({
        totalStudents,
        presentToday,
        absentToday,
        attendanceRate
      })

      // Fetch recent activity
      const { data: recentAttendance, error: recentError } = await supabase
        .from('attendance')
        .select(`
          id,
          date,
          status,
          students!inner(full_name),
          courses!inner(course_name)
        `)
        .order('marked_at', { ascending: false })
        .limit(5)

      if (recentError && recentError.code !== 'PGRST116') {
        throw recentError
      }

      const activities: RecentActivity[] = recentAttendance?.map(record => ({
        id: record.id,
        type: 'attendance' as const,
        message: `${Array.isArray(record.students) ? record.students[0]?.full_name : record.students?.full_name || 'Student'} marked ${record.status} for ${Array.isArray(record.courses) ? record.courses[0]?.course_name : record.courses?.course_name || 'course'}`,
        timestamp: record.date
      })) || []

      setRecentActivity(activities)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const dashboardStats = [
    {
      title: 'Total Students',
      value: loading ? '...' : stats.totalStudents.toString(),
      icon: Users,
      description: 'Active students',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Present Today',
      value: loading ? '...' : stats.presentToday.toString(),
      icon: UserCheck,
      description: 'Students present',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Absent Today',
      value: loading ? '...' : stats.absentToday.toString(),
      icon: AlertCircle,
      description: 'Students absent',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Attendance Rate',
      value: loading ? '...' : `${stats.attendanceRate}%`,
      icon: TrendingUp,
      description: 'Last 30 days',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  const quickActions = [
    {
      title: 'Mark Attendance',
      description: 'Record student attendance for today',
      icon: UserCheck,
      href: '/attendance',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'View Reports',
      description: 'Generate detailed attendance reports',
      icon: FileText,
      href: '/reports',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      title: 'Manage Students',
      description: 'Add or update student information',
      icon: Users,
      href: '/students',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      title: 'Academic Years',
      description: 'Configure academic year settings',
      icon: Calendar,
      href: '/years',
      color: 'bg-orange-600 hover:bg-orange-700',
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-600 mt-1">
            {profile?.role === 'faculty' ? 'Faculty' : 'HOD'} Dashboard - Monitor attendance and manage students
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Access frequently used features quickly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                variant="outline"
                className="h-auto p-4 flex-col items-start text-left hover:shadow-md transition-all"
                onClick={() => window.location.href = action.href}
              >
                <div className={`p-2 rounded-lg ${action.color} mb-3`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest attendance and system updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-sm text-gray-600">Loading recent activity...</div>
              </div>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <UserCheck className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.message}
                    </p>
                    <p className="text-sm text-gray-600">
                      Attendance recorded
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    No recent activity
                  </p>
                  <p className="text-sm text-gray-600">
                    Start marking attendance to see activity here
                  </p>
                </div>
                <span className="text-sm text-gray-500">-</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
