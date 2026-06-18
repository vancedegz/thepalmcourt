"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/layout/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getBusinessSettings, updateBusinessSettings } from "@/app/actions/settings"
import { Settings, Clock, MapPin, Phone, Mail, FileText, CreditCard, Building, Save } from "lucide-react"

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    logoUrl: "",
    email: "",
    phone: "",
    address: "",
    openingTime: "",
    closingTime: "",
    defaultPricePerHour: 250,
    bookingRules: "",
    paymentInstructions: "",
    bankDetails: "",
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await getBusinessSettings()
      if (data) {
        setFormData({
          name: data.name,
          logoUrl: data.logoUrl || "",
          email: data.email,
          phone: data.phone,
          address: data.address,
          openingTime: data.openingTime,
          closingTime: data.closingTime,
          defaultPricePerHour: data.defaultPricePerHour,
          bookingRules: data.bookingRules || "",
          paymentInstructions: data.paymentInstructions || "",
          bankDetails: data.bankDetails || "",
        })
      }
    } catch (err) {
      setError("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setMessage("")

    try {
      await updateBusinessSettings(formData)
      setMessage("Settings updated successfully")
    } catch (err: any) {
      setError(err.message || "Failed to update settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Business Settings</h1>
          <p className="text-gray-600 mt-2">Configure your business information and operating hours</p>
        </div>

        {message && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{message}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-2 border-primary/10 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#16a34a] to-[#66bb6a]"></div>
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-2 text-[#16a34a]">
                <Building className="h-5 w-5" />
                Business Information
              </CardTitle>
              <CardDescription>Basic information about your business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <Label htmlFor="name">Business Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
                <Input
                  id="logoUrl"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-secondary/20 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#f97316] to-[#fb923c]"></div>
            <CardHeader className="bg-gradient-to-r from-secondary/5 to-transparent">
              <CardTitle className="flex items-center gap-2 text-[#f97316]">
                <Clock className="h-5 w-5" />
                Operating Hours
              </CardTitle>
              <CardDescription>Set your business hours and default pricing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="openingTime">Opening Time</Label>
                  <Input
                    id="openingTime"
                    type="time"
                    value={formData.openingTime}
                    onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="closingTime">Closing Time</Label>
                  <Input
                    id="closingTime"
                    type="time"
                    value={formData.closingTime}
                    onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="defaultPrice">Default Price (₱/hour)</Label>
                  <Input
                    id="defaultPrice"
                    type="number"
                    value={formData.defaultPricePerHour}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultPricePerHour: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/10 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#66bb6a] to-[#fb923c]"></div>
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-2 text-[#0a7c32]">
                <FileText className="h-5 w-5" />
                Policies & Instructions
              </CardTitle>
              <CardDescription>Booking rules and payment information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <Label htmlFor="bookingRules">Booking Rules</Label>
                <Input
                  id="bookingRules"
                  value={formData.bookingRules}
                  onChange={(e) => setFormData({ ...formData, bookingRules: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="paymentInstructions">Payment Instructions</Label>
                <Input
                  id="paymentInstructions"
                  value={formData.paymentInstructions}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentInstructions: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="bankDetails">Bank Details</Label>
                <Input
                  id="bankDetails"
                  value={formData.bankDetails}
                  onChange={(e) => setFormData({ ...formData, bankDetails: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" disabled={saving} className="bg-gradient-to-r from-[#16a34a] to-[#0e8c3a] hover:from-[#0e8c3a] hover:to-[#0a7c32] shadow-md hover:shadow-lg transition-all px-8">
            <Save className="h-5 w-5 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </div>
    </AdminLayout>
  )
}
