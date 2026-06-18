"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/layout/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAllBookings, cancelBooking } from "@/app/actions/bookings"
import { format } from "date-fns"
import { XCircle, CheckCircle, AlertCircle, Calendar, Search, Filter, Plus } from "lucide-react"
import Link from "next/link"

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      const data = await getAllBookings()
      setBookings(data)
    } catch (err) {
      console.error("Failed to load bookings:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return
    try {
      await cancelBooking(bookingId)
      loadBookings()
    } catch (err) {
      console.error("Failed to cancel booking:", err)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-[#16a34a] hover:bg-[#16a34a] text-white border-0"><CheckCircle className="h-3 w-3 mr-1" />Confirmed</Badge>
      case "pending":
        return <Badge className="bg-[#f97316] hover:bg-[#f97316] text-white border-0"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>
      case "cancelled":
        return <Badge className="bg-red-500 hover:bg-red-500 text-white border-0"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading bookings...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bookings Management</h1>
            <p className="text-gray-600 mt-2">View and manage all court bookings</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/bookings/create">
              <Button className="bg-[#16a34a] hover:bg-[#0e8c3a] text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Booking
              </Button>
            </Link>
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-lg border border-primary/10">
              <Calendar className="h-4 w-4 text-[#16a34a]" />
              <span className="text-sm font-medium text-[#0a7c32]">{bookings.length} Total</span>
            </div>
          </div>
        </div>

        <Card className="border-2 border-primary/10 shadow-sm overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Court</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.referenceNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.user.firstName} {booking.user.lastName}</p>
                        <p className="text-xs text-muted-foreground">{booking.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{booking.court.name}</TableCell>
                    <TableCell>{format(new Date(booking.date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{booking.startTime} - {booking.endTime}</TableCell>
                    <TableCell className="font-medium">₱{booking.totalAmount}</TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>
                      {booking.status !== "cancelled" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(booking.id)}
                          className="border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600 transition-colors"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
