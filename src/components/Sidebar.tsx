
import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Calendar,
  FileText,
  GraduationCap,
  Users,
  Settings,
  Calendar as CalendarIcon,
  UserCheck,
  BookOpen,
  LogOut
} from 'lucide-react'

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
  },
  {
    title: 'Mark Attendance',
    href: '/attendance',
    icon: UserCheck,
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: FileText,
  },
  {
    title: 'Students',
    href: '/students',
    icon: Users,
  },
  {
    title: 'Courses',
    href: '/courses',
    icon: BookOpen,
  },
  {
    title: 'Academic Years',
    href: '/years',
    icon: CalendarIcon,
  },
  {
    title: 'Admin',
    href: '/admin',
    icon: Settings,
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation()
  const { signOut } = useAuth()
  const { toast } = useToast()

  const handleSignOut = async () => {
    await signOut()
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    })
  }

  return (
    <div className={cn('pb-12 w-64', className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center mb-8">
            <GraduationCap className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">SVLNS College</h2>
              <p className="text-sm text-gray-600">Attendance System</p>
            </div>
          </div>
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100 hover:text-gray-900 transition-colors',
                  location.pathname === item.href
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-700'
                )}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.title}
              </Link>
            ))}
            
            {/* Sign Out Button */}
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors mt-4"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
