"use client"

import { useState, useEffect, useCallback } from "react"
import AdminLayout from "@/components/layout/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAllBookings, cancelBooking, confirmBooking } from "@/app/actions/bookings"
import { format } from "date-fns"
import { XCircle, CheckCircle, AlertCircle, Calendar, Plus, Filter } from "lucide-react"
import Link from "next/link"
import { formatTime, cn } from "@/lib/utils"
import type { Booking, Court, Payment } from "@prisma/client"

type BookingWithDetails = Booking & {
  court: Court
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
  }
  payments: Payment[]
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const loadBookings = useCallback(async (p: number) => {
    try {
      const data = await getAllBookings(p)
      let filtered = data.bookings as BookingWithDetails[]
      if (statusFilter !== "all") {
        filtered = filtered.filter((b) => b.status === statusFilter)
      }
      setBookings(filtered)
      setTotalPages(data.totalPages)
      setTotal(statusFilter === "all" ? data.total : filtered.length)
      setPage(data.page)
    } catch (err) {
      console.error("Failed to load bookings:", err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    loadBookings(page)
  }, [statusFilter, page, loadBookings])

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return
    try {
      await cancelBooking(bookingId)
      loadBookings(page)
    } catch (err) {
      console.error("Failed to cancel booking:", err)
    }
  }

  const handleConfirm = async (bookingId: string) => {
    if (!confirm("Confirm this booking without payment proof?")) return
    try {
      await confirmBooking(bookingId)
      loadBookings(page)
    } catch (err) {
      console.error("Failed to confirm booking:", err)
    }
  }

  const getPaymentStatus = (payments: Payment[]) => {
    if (payments.length === 0) return <Badge variant="outline" className="text-gray-500">No Payment</Badge>
    const latest = payments[payments.length - 1]
    switch (latest.status) {
      case "verified":
        return <Badge className="bg-[#16a34a] hover:bg-[#16a34a] text-white border-0"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>
      case "pending":
        return <Badge className="bg-[#f97316] hover:bg-[#f97316] text-white border-0"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>
      case "rejected":
        return <Badge className="bg-red-500 hover:bg-red-500 text-white border-0"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">{latest.status}</Badge>
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
              <span className="text-sm font-medium text-[#0a7c32]">{total} Total</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-gray-500" />
          <div className="flex gap-2">
            {["all", "confirmed", "pending", "cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all",
                  statusFilter === status
                    ? "bg-[#16a34a] border-[#16a34a] text-white"
                    : "bg-white border-gray-200 text-gray-700 hover:border-[#16a34a]/50"
                )}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
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
                  <TableHead>Payment</TableHead>
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
                    <TableCell>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</TableCell>
                    <TableCell className="font-medium">₱{booking.totalAmount}</TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>{getPaymentStatus(booking.payments)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {booking.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConfirm(booking.id)}
                            className="border-[#16a34a]/30 hover:bg-[#e8f5e9] hover:border-[#16a34a] text-[#16a34a] transition-colors"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        {booking.status !== "cancelled" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancel(booking.id)}
                            className="border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600 transition-colors"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancel
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => loadBookings(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => loadBookings(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
