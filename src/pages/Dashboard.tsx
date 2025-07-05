
import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Users, Calendar, TrendingUp, UserCheck, FileText, Clock, AlertCircle } from 'lucide-react'

export function Dashboard() {
  const { profile } = useAuth()

  const stats = [
    {
      title: 'Total Students',
      value: '8',
      icon: Users,
      description: 'Active students',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Present Today',
      value: '0',
      icon: UserCheck,
      description: 'Students present',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Absent Today',
      value: '0',
      icon: AlertCircle,
      description: 'Students absent',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Attendance Rate',
      value: '0%',
      icon: TrendingUp,
      description: 'Overall rate',
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
        {stats.map((stat) => (
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
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-full">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  System initialized
                </p>
                <p className="text-sm text-gray-600">
                  Attendance system is ready for use
                </p>
              </div>
              <span className="text-sm text-gray-500">Just now</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
