
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, Calendar } from 'lucide-react'

interface AcademicYear {
  id: string
  year_name: string
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

export function AcademicYears() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null)
  const [formData, setFormData] = useState({
    year_name: '',
    start_date: '',
    end_date: '',
    is_active: false
  })

  useEffect(() => {
    fetchAcademicYears()
  }, [])

  const fetchAcademicYears = async () => {
    try {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('start_date', { ascending: false })

      if (error) throw error
      setAcademicYears(data || [])
    } catch (error) {
      console.error('Error fetching academic years:', error)
      toast({
        title: "Error",
        description: "Failed to fetch academic years",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingYear) {
        const { error } = await supabase
          .from('academic_years')
          .update({
            year_name: formData.year_name,
            start_date: formData.start_date,
            end_date: formData.end_date,
            is_active: formData.is_active
          })
          .eq('id', editingYear.id)

        if (error) throw error
        
        toast({
          title: "Success",
          description: "Academic year updated successfully",
        })
      } else {
        // If setting as active, deactivate all other years first
        if (formData.is_active) {
          await supabase
            .from('academic_years')
            .update({ is_active: false })
            .neq('id', '')
        }

        const { error } = await supabase
          .from('academic_years')
          .insert([{
            year_name: formData.year_name,
            start_date: formData.start_date,
            end_date: formData.end_date,
            is_active: formData.is_active
          }])

        if (error) throw error
        
        toast({
          title: "Success",
          description: "Academic year added successfully",
        })
      }

      setIsDialogOpen(false)
      setEditingYear(null)
      setFormData({
        year_name: '',
        start_date: '',
        end_date: '',
        is_active: false
      })
      fetchAcademicYears()
    } catch (error) {
      console.error('Error saving academic year:', error)
      toast({
        title: "Error",
        description: "Failed to save academic year",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (year: AcademicYear) => {
    setEditingYear(year)
    setFormData({
      year_name: year.year_name,
      start_date: year.start_date,
      end_date: year.end_date,
      is_active: year.is_active
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (yearId: string) => {
    if (!confirm('Are you sure you want to delete this academic year? This will also affect related data.')) return

    try {
      const { error } = await supabase
        .from('academic_years')
        .delete()
        .eq('id', yearId)

      if (error) throw error
      
      toast({
        title: "Success",
        description: "Academic year deleted successfully",
      })
      fetchAcademicYears()
    } catch (error) {
      console.error('Error deleting academic year:', error)
      toast({
        title: "Error",
        description: "Failed to delete academic year",
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = async (yearId: string, isActive: boolean) => {
    try {
      // If activating this year, deactivate all others first
      if (isActive) {
        await supabase
          .from('academic_years')
          .update({ is_active: false })
          .neq('id', yearId)
      }

      const { error } = await supabase
        .from('academic_years')
        .update({ is_active: isActive })
        .eq('id', yearId)

      if (error) throw error
      
      toast({
        title: "Success",
        description: `Academic year ${isActive ? 'activated' : 'deactivated'} successfully`,
      })
      fetchAcademicYears()
    } catch (error) {
      console.error('Error updating academic year status:', error)
      toast({
        title: "Error",
        description: "Failed to update academic year status",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
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
          <h2 className="text-2xl font-bold text-gray-900">Academic Years</h2>
          <p className="text-gray-600 mt-1">Manage academic year settings and periods</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingYear(null)
              setFormData({
                year_name: '',
                start_date: '',
                end_date: '',
                is_active: false
              })
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Academic Year
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingYear ? 'Edit Academic Year' : 'Add New Academic Year'}</DialogTitle>
              <DialogDescription>
                {editingYear ? 'Update academic year information' : 'Add a new academic year to the system'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="year_name">Year Name</Label>
                <Input
                  id="year_name"
                  type="text"
                  value={formData.year_name}
                  onChange={(e) => setFormData({ ...formData, year_name: e.target.value })}
                  placeholder="e.g., 2023-2024"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Set as active academic year</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingYear ? 'Update' : 'Add'} Academic Year
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Academic Years ({academicYears.length})
          </CardTitle>
          <CardDescription>All academic years in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {academicYears.map((year) => (
                <TableRow key={year.id}>
                  <TableCell className="font-semibold">{year.year_name}</TableCell>
                  <TableCell>{formatDate(year.start_date)}</TableCell>
                  <TableCell>{formatDate(year.end_date)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      year.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {year.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={year.is_active}
                      onCheckedChange={(checked) => handleToggleActive(year.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(year)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(year.id)}>
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
