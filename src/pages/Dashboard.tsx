
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
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-screen bg-gray-50">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {profile?.role === 'faculty' ? 'Faculty' : 
             profile?.role === 'hod' ? 'HOD' : 'Admin'} Dashboard
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 bg-white px-3 py-2 rounded-lg shadow-sm">
          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>Updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Stats Grid - Mobile First */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {dashboardStats.map((stat) => (
          <Card 
            key={stat.title} 
            className="hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-white"
          >
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1 hidden sm:block">{stat.description}</p>
                </div>
                <div className={`p-2 sm:p-3 rounded-lg ${stat.bgColor} self-start sm:self-center`}>
                  <stat.icon className={`h-4 w-4 sm:h-6 sm:w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions - Mobile Optimized */}
      <Card className="border-0 shadow-md bg-white">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Quick Actions
          </CardTitle>
          <CardDescription className="text-sm">
            Access frequently used features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                variant="outline"
                className="h-auto p-4 sm:p-6 flex-col items-start text-left hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20 min-h-[120px] sm:min-h-[140px] group"
                onClick={() => window.location.href = action.href}
              >
                <div className={`p-2 sm:p-3 rounded-lg ${action.color} mb-3 group-hover:scale-110 transition-transform duration-200`}>
                  <action.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{action.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{action.description}</p>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity - Mobile Optimized */}
      <Card className="border-0 shadow-md bg-white">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
          <CardDescription className="text-sm">
            Latest attendance updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {loading ? (
              <div className="flex items-center justify-center p-6 sm:p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <div className="text-sm text-gray-600">Loading recent activity...</div>
                </div>
              </div>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  <div className="p-2 bg-blue-100 rounded-full flex-shrink-0 mt-1">
                    <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {activity.message}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Attendance recorded
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {new Date(activity.timestamp).toLocaleDateString([], { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center space-x-3 sm:space-x-4 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-dashed border-blue-200">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    No recent activity
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Start marking attendance to see activity here
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
