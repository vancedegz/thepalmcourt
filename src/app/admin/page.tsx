"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/layout/AdminLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllBookings } from "@/app/actions/bookings"
import { getPendingPayments } from "@/app/actions/payments"
import { getCourts } from "@/app/actions/courts"
import { DollarSign, Calendar, CheckCircle, MapPin, TrendingUp, Users, ArrowRight } from "lucide-react"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingPayments: 0,
    confirmedRevenue: 0,
    activeCourts: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [bookings, payments, courts] = await Promise.all([
        getAllBookings(),
        getPendingPayments(),
        getCourts(),
      ])

      const confirmedBookings = bookings.filter((b) => b.status === "confirmed")
      const confirmedRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalAmount, 0)
      const activeCourts = courts.filter((c) => c.status === "active").length

      setStats({
        totalBookings: bookings.length,
        pendingPayments: payments.length,
        confirmedRevenue,
        activeCourts,
      })
    } catch (err) {
      console.error("Failed to load stats:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your pickleball court business</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-[#16a34a] overflow-hidden hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-[#e8f5e9] to-transparent">
              <CardTitle className="text-sm font-medium text-[#0a7c32]">Total Bookings</CardTitle>
              <div className="w-10 h-10 rounded-full bg-[#16a34a]/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-[#16a34a]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#16a34a]">{stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">All time bookings</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#f97316] overflow-hidden hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-[#fff7ed] to-transparent">
              <CardTitle className="text-sm font-medium text-[#c2410c]">Pending Payments</CardTitle>
              <div className="w-10 h-10 rounded-full bg-[#f97316]/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-[#f97316]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#f97316]">{stats.pendingPayments}</div>
              <p className="text-xs text-muted-foreground">Awaiting verification</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#0a7c32] overflow-hidden hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-[#c8e6c9] to-transparent">
              <CardTitle className="text-sm font-medium text-[#004d1f]">Confirmed Revenue</CardTitle>
              <div className="w-10 h-10 rounded-full bg-[#0a7c32]/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#0a7c32]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#0a7c32]">₱{stats.confirmedRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From confirmed bookings</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#c2410c] overflow-hidden hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-[#ffedd5] to-transparent">
              <CardTitle className="text-sm font-medium text-[#7c2d12]">Active Courts</CardTitle>
              <div className="w-10 h-10 rounded-full bg-[#c2410c]/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-[#c2410c]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#c2410c]">{stats.activeCourts}</div>
              <p className="text-xs text-muted-foreground">Available for booking</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card className="border-2 border-primary/10 hover:shadow-lg transition-all">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
              <CardTitle className="text-[#16a34a] flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <a
                href="/admin/payments"
                className="flex items-center justify-between p-4 rounded-xl border-2 border-primary/10 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group"
              >
                <div>
                  <div className="font-semibold text-[#16a34a] group-hover:text-[#0a7c32]">Verify Payments</div>
                  <div className="text-sm text-muted-foreground">
                    {stats.pendingPayments} pending verification
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-[#16a34a] opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
              </a>
              <a
                href="/admin/bookings"
                className="flex items-center justify-between p-4 rounded-xl border-2 border-primary/10 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group"
              >
                <div>
                  <div className="font-semibold text-[#16a34a] group-hover:text-[#0a7c32]">Manage Bookings</div>
                  <div className="text-sm text-muted-foreground">
                    View and manage all bookings
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-[#16a34a] opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
              </a>
              <a
                href="/admin/courts"
                className="flex items-center justify-between p-4 rounded-xl border-2 border-primary/10 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group"
              >
                <div>
                  <div className="font-semibold text-[#16a34a] group-hover:text-[#0a7c32]">Manage Courts</div>
                  <div className="text-sm text-muted-foreground">
                    Add or edit court information
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-[#16a34a] opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
              </a>
            </CardContent>
          </Card>

          <Card className="border-2 border-secondary/20 hover:shadow-lg transition-all">
            <CardHeader className="bg-gradient-to-r from-secondary/5 to-transparent border-b">
              <CardTitle className="text-[#f97316] flex items-center gap-2">
                <Users className="h-5 w-5" />
                System Configuration
              </CardTitle>
              <CardDescription>Business settings and configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <a
                href="/admin/settings"
                className="flex items-center justify-between p-4 rounded-xl border-2 border-secondary/10 hover:border-secondary/30 hover:bg-secondary/5 transition-all cursor-pointer group"
              >
                <div>
                  <div className="font-semibold text-[#f97316] group-hover:text-[#c2410c]">Business Settings</div>
                  <div className="text-sm text-muted-foreground">
                    Update contact info and hours
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-[#f97316] opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
              </a>
              <a
                href="/admin/pricing"
                className="flex items-center justify-between p-4 rounded-xl border-2 border-secondary/10 hover:border-secondary/30 hover:bg-secondary/5 transition-all cursor-pointer group"
              >
                <div>
                  <div className="font-semibold text-[#f97316] group-hover:text-[#c2410c]">Pricing Tiers</div>
                  <div className="text-sm text-muted-foreground">
                    Configure time-based pricing
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-[#f97316] opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
