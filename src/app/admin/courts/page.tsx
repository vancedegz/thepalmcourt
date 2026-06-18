"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/layout/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCourts, upsertCourt, deleteCourt } from "@/app/actions/courts"
import { cn } from "@/lib/utils"
import { Plus, Edit, Trash2, MapPin } from "lucide-react"

export default function AdminCourtsPage() {
  const [courts, setCourts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCourt, setEditingCourt] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    number: 1,
    description: "",
    status: "active" as "active" | "maintenance",
  })

  useEffect(() => {
    loadCourts()
  }, [])

  const loadCourts = async () => {
    try {
      const data = await getCourts()
      setCourts(data)
    } catch (err) {
      console.error("Failed to load courts:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await upsertCourt({
        id: editingCourt?.id,
        ...formData,
      })
      setDialogOpen(false)
      resetForm()
      loadCourts()
    } catch (err) {
      console.error("Failed to save court:", err)
    }
  }

  const handleEdit = (court: any) => {
    setEditingCourt(court)
    setFormData({
      name: court.name,
      number: court.number,
      description: court.description || "",
      status: court.status,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (courtId: string) => {
    if (!confirm("Are you sure you want to delete this court?")) return
    try {
      await deleteCourt(courtId)
      loadCourts()
    } catch (err) {
      console.error("Failed to delete court:", err)
    }
  }

  const resetForm = () => {
    setEditingCourt(null)
    setFormData({
      name: "",
      number: 1,
      description: "",
      status: "active",
    })
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading courts...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Courts Management</h1>
            <p className="text-gray-600 mt-2">Manage your pickleball courts</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-gradient-to-r from-[#16a34a] to-[#0e8c3a] hover:from-[#0e8c3a] hover:to-[#0a7c32] shadow-md hover:shadow-lg transition-all">
                <Plus className="h-4 w-4 mr-2" />
                Add Court
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCourt ? "Edit Court" : "Add New Court"}</DialogTitle>
                <DialogDescription>
                  {editingCourt ? "Update court information" : "Create a new court"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Court Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="number">Court Number</Label>
                  <Input
                    id="number"
                    type="number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "maintenance") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  {editingCourt ? "Update Court" : "Create Court"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courts.map((court) => (
            <Card key={court.id} className="border-2 border-primary/10 hover:shadow-lg transition-all overflow-hidden group">
              <div className={cn(
                "h-2",
                court.status === "active" ? "bg-gradient-to-r from-[#16a34a] to-[#66bb6a]" : "bg-gradient-to-r from-gray-400 to-gray-300"
              )}></div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      court.status === "active" ? "bg-primary/10" : "bg-gray-100"
                    )}>
                      <MapPin className={cn(
                        "h-6 w-6",
                        court.status === "active" ? "text-[#16a34a]" : "text-gray-500"
                      )} />
                    </div>
                    <div>
                      <CardTitle>{court.name}</CardTitle>
                      <CardDescription>Court #{court.number}</CardDescription>
                    </div>
                  </div>
                  <Badge className={cn(
                    court.status === "active" ? "bg-[#16a34a] text-white hover:bg-[#16a34a]" : "bg-gray-500 text-white hover:bg-gray-500"
                  )}>
                    {court.status === "active" ? "Active" : "Maintenance"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {court.description || "No description"}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(court)} className="border-primary/20 hover:bg-primary/5 hover:border-primary/40">
                    <Edit className="h-4 w-4 mr-2 text-[#16a34a]" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(court.id)}
                    className="border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
