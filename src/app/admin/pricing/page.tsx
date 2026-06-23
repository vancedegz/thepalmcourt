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
import { getPricingTiers, upsertPricingTier, deletePricingTier } from "@/app/actions/settings"
import { cn } from "@/lib/utils"
import { Plus, Edit, Trash2, Banknote, Clock, Calendar } from "lucide-react"
import type { PricingTier } from "@prisma/client"

const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

export default function AdminPricingPage() {
  const [tiers, setTiers] = useState<PricingTier[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    startTime: "",
    endTime: "",
    pricePerHour: 250,
    isActive: true,
    daysOfWeek: [] as string[],
  })

  const loadTiers = async () => {
    try {
      const data = await getPricingTiers()
      setTiers(data)
    } catch (err) {
      console.error("Failed to load pricing tiers:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function run() {
      await loadTiers()
    }
    run()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await upsertPricingTier({
        id: editingTier?.id,
        ...formData,
      })
      setDialogOpen(false)
      resetForm()
      loadTiers()
    } catch (err) {
      console.error("Failed to save pricing tier:", err)
    }
  }

  const handleEdit = (tier: PricingTier) => {
    setEditingTier(tier)
    setFormData({
      name: tier.name,
      startTime: tier.startTime,
      endTime: tier.endTime,
      pricePerHour: tier.pricePerHour,
      isActive: tier.isActive,
      daysOfWeek: tier.daysOfWeek,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (tierId: number) => {
    if (!confirm("Are you sure you want to delete this pricing tier?")) return
    try {
      await deletePricingTier(tierId)
      loadTiers()
    } catch (err) {
      console.error("Failed to delete pricing tier:", err)
    }
  }

  const resetForm = () => {
    setEditingTier(null)
    setFormData({
      name: "",
      startTime: "",
      endTime: "",
      pricePerHour: 250,
      isActive: true,
      daysOfWeek: [],
    })
  }

  const toggleDay = (day: string) => {
    setFormData({
      ...formData,
      daysOfWeek: formData.daysOfWeek.includes(day)
        ? formData.daysOfWeek.filter((d) => d !== day)
        : [...formData.daysOfWeek, day],
    })
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading pricing tiers...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pricing Tiers</h1>
            <p className="text-gray-600 mt-2">Configure time-based pricing for court bookings</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-gradient-to-r from-[#16a34a] to-[#0e8c3a] hover:from-[#0e8c3a] hover:to-[#0a7c32] shadow-md hover:shadow-lg transition-all">
                <Plus className="h-4 w-4 mr-2" />
                Add Pricing Tier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTier ? "Edit Pricing Tier" : "Add New Pricing Tier"}
                </DialogTitle>
                <DialogDescription>
                  {editingTier ? "Update pricing tier information" : "Create a new pricing tier"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Tier Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Morning, Afternoon, Evening"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="price">Price per Hour (₱)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.pricePerHour}
                    onChange={(e) =>
                      setFormData({ ...formData, pricePerHour: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Days of Week</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {daysOfWeek.map((day) => (
                      <Button
                        key={day}
                        type="button"
                        variant={formData.daysOfWeek.includes(day) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleDay(day)}
                      >
                        {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.isActive ? "active" : "inactive"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, isActive: value === "active" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  {editingTier ? "Update Tier" : "Create Tier"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => (
            <Card key={tier.id} className={cn(
              "border-2 hover:shadow-lg transition-all overflow-hidden",
              tier.isActive ? "border-primary/10" : "border-gray-200"
            )}>
              <div className={cn(
                "h-2",
                tier.isActive ? "bg-gradient-to-r from-primary to-secondary" : "bg-gradient-to-r from-gray-300 to-gray-200"
              )}></div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      tier.isActive ? "bg-primary/10" : "bg-gray-100"
                    )}>
                      <Banknote className={cn(
                        "h-6 w-6",
                        tier.isActive ? "text-[#16a34a]" : "text-gray-500"
                      )} />
                    </div>
                    <div>
                      <CardTitle>{tier.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {tier.startTime} - {tier.endTime}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={cn(
                    tier.isActive ? "bg-[#16a34a] text-white hover:bg-[#16a34a]" : "bg-gray-500 text-white hover:bg-gray-500"
                  )}>
                    {tier.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-4">
                    <p className={cn(
                      "text-3xl font-bold",
                      tier.isActive ? "text-[#16a34a]" : "text-gray-500"
                    )}>₱{tier.pricePerHour}</p>
                    <p className="text-sm text-muted-foreground">per hour</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Active Days
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {tier.daysOfWeek.map((day: string) => (
                        <Badge key={day} variant="outline" className="text-xs bg-[#e8f5e9] border-[#16a34a]/20 text-[#0a7c32]">
                          {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(tier)} className="border-primary/20 hover:bg-primary/5 hover:border-primary/40">
                      <Edit className="h-4 w-4 mr-2 text-[#16a34a]" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(tier.id)} className="border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
