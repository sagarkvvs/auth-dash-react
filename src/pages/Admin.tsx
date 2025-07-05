
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
import { Plus, Edit, Trash2, Shield, Users, Settings } from 'lucide-react'

interface Profile {
  id: string
  email: string
  full_name: string
  employee_id: string
  role: 'faculty' | 'hod' | 'admin'
  department: string
  created_at: string
}

export function Admin() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    employee_id: '',
    role: 'faculty' as 'faculty' | 'hod' | 'admin',
    department: ''
  })

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name')

      if (error) throw error
      setProfiles(data || [])
    } catch (error) {
      console.error('Error fetching profiles:', error)
      toast({
        title: "Error",
        description: "Failed to fetch user profiles",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingProfile) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            employee_id: formData.employee_id,
            role: formData.role,
            department: formData.department
          })
          .eq('id', editingProfile.id)

        if (error) throw error
        
        toast({
          title: "Success",
          description: "User profile updated successfully",
        })
      } else {
        // For adding new users, we'd typically need to create them via auth first
        // This is a simplified version - in practice, you'd want to send an invitation
        toast({
          title: "Info",
          description: "Adding new users requires auth signup. Please use the signup form.",
        })
        return
      }

      setIsDialogOpen(false)
      setEditingProfile(null)
      setFormData({
        email: '',
        full_name: '',
        employee_id: '',
        role: 'faculty',
        department: ''
      })
      fetchProfiles()
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: "Error",
        description: "Failed to save user profile",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (profileData: Profile) => {
    setEditingProfile(profileData)
    setFormData({
      email: profileData.email,
      full_name: profileData.full_name || '',
      employee_id: profileData.employee_id || '',
      role: profileData.role,
      department: profileData.department || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return

    try {
      // Note: This will only delete the profile, not the auth user
      // In a real application, you'd want to handle auth user deletion as well
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId)

      if (error) throw error
      
      toast({
        title: "Success",
        description: "User profile deleted successfully",
      })
      fetchProfiles()
    } catch (error) {
      console.error('Error deleting profile:', error)
      toast({
        title: "Error",
        description: "Failed to delete user profile",
        variant: "destructive",
      })
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'hod':
        return 'bg-blue-100 text-blue-800'
      case 'faculty':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  // Check if current user has admin privileges
  if (profile?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need administrator privileges to access this page.</p>
        </div>
      </div>
    )
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
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingProfile(null)
              setFormData({
                email: '',
                full_name: '',
                employee_id: '',
                role: 'faculty',
                department: ''
              })
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingProfile ? 'Edit User' : 'Add New User'}</DialogTitle>
              <DialogDescription>
                {editingProfile ? 'Update user information and permissions' : 'Add a new user to the system'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!!editingProfile}
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
              <div>
                <Label htmlFor="employee_id">Employee ID</Label>
                <Input
                  id="employee_id"
                  type="text"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value: 'faculty' | 'hod' | 'admin') => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="faculty">Faculty</SelectItem>
                      <SelectItem value="hod">HOD</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProfile ? 'Update' : 'Add'} User
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{profiles.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Faculty</p>
                <p className="text-3xl font-bold text-gray-900">
                  {profiles.filter(p => p.role === 'faculty').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-3xl font-bold text-gray-900">
                  {profiles.filter(p => p.role === 'admin').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            User Accounts ({profiles.length})
          </CardTitle>
          <CardDescription>All registered users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profileData) => (
                <TableRow key={profileData.id}>
                  <TableCell className="font-medium">{profileData.full_name || 'Not Set'}</TableCell>
                  <TableCell>{profileData.email}</TableCell>
                  <TableCell className="font-mono">{profileData.employee_id || '-'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleColor(profileData.role)}`}>
                      {profileData.role}
                    </span>
                  </TableCell>
                  <TableCell>{profileData.department || '-'}</TableCell>
                  <TableCell>{formatDate(profileData.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(profileData)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {profileData.id !== profile?.id && (
                        <Button size="sm" variant="outline" onClick={() => handleDelete(profileData.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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
