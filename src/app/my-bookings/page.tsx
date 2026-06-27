"use client"

import { useState, useEffect } from "react"
import CustomerLayout from "@/components/layout/CustomerLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { cn, formatTime } from "@/lib/utils"
import { getMyBookings } from "@/app/actions/bookings"
import { uploadPaymentScreenshot } from "@/app/actions/payments"
import { format } from "date-fns"
import type { Booking, Court, Payment } from "@prisma/client"

type PriceBreakdownItem = { hour: string; price: number; tier: string }

type BookingWithDetails = Booking & {
  court: Court
  payments: Payment[]
  priceBreakdown: PriceBreakdownItem[]
}
import { Calendar, Clock, MapPin, Upload, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { UploadButton } from "@/lib/uploadthing"

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const loadBookings = async () => {
    try {
      const data = await getMyBookings()
      setBookings(data as BookingWithDetails[])
    } catch (err) {
      console.error("Failed to load bookings:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function run() {
      await loadBookings()
    }
    run()
  }, [])

  const handleUploadComplete = async (bookingId: string, url: string) => {
    try {
      await uploadPaymentScreenshot(bookingId, url)
      loadBookings()
    } catch (err) {
      console.error("Failed to save screenshot:", err)
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

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-[#16a34a] hover:bg-[#16a34a] text-white border-0">Verified</Badge>
      case "pending":
        return <Badge className="bg-[#f97316] hover:bg-[#f97316] text-white border-0">Pending</Badge>
      case "rejected":
        return <Badge className="bg-red-500 hover:bg-red-500 text-white border-0">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading bookings...</p>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-2">View and manage your court reservations</p>
        </div>

        {bookings.length === 0 ? (
          <Card className="border-2 border-primary/10 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Calendar className="h-10 w-10 text-[#16a34a]" />
              </div>
              <p className="text-xl font-semibold mb-2">No bookings yet</p>
              <p className="text-muted-foreground mb-6 text-center max-w-md">Start your pickleball journey by booking a court at The Palm Court</p>
              <Button onClick={() => window.location.href = "/book"} className="bg-gradient-to-r from-[#16a34a] to-[#0e8c3a] hover:from-[#0e8c3a] hover:to-[#0a7c32] shadow-md hover:shadow-lg transition-all px-8">
                Book a Court Now
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="border-2 border-primary/10 hover:shadow-lg transition-all overflow-hidden">
                <div className={cn(
                  "h-1.5",
                  booking.status === "confirmed" ? "bg-gradient-to-r from-[#16a34a] to-[#66bb6a]" :
                  booking.status === "pending" ? "bg-gradient-to-r from-[#f97316] to-[#fb923c]" :
                  "bg-gradient-to-r from-red-400 to-red-300"
                )}></div>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                        booking.status === "confirmed" ? "bg-primary/10" :
                        booking.status === "pending" ? "bg-secondary/10" :
                        "bg-red-50"
                      )}>
                        <MapPin className={cn(
                          "h-6 w-6",
                          booking.status === "confirmed" ? "text-[#16a34a]" :
                          booking.status === "pending" ? "text-[#f97316]" :
                          "text-red-500"
                        )} />
                      </div>
                      <div>
                        <CardTitle className="text-lg sm:text-xl">{booking.court.name}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Ref: {booking.referenceNumber}</CardDescription>
                      </div>
                    </div>
                    <div className="sm:self-start">{getStatusBadge(booking.status)}</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Date:</span>
                        <span>{format(new Date(booking.date), "MMMM dd, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Time:</span>
                        <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Duration:</span>
                        <span>{booking.durationHours} hour(s)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Total Amount:</span>
                        <span className="text-lg font-bold text-[#16a34a]">₱{booking.totalAmount}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Payment Status</Label>
                        <div className="mt-1">
                          {booking.payments.map((payment) => (
                            <div key={payment.id} className="space-y-2">
                              {getPaymentStatusBadge(payment.status)}
                              {payment.status === "pending" && !payment.screenshotUrl && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="ml-2">
                                      <Upload className="h-4 w-4 mr-2" />
                                      Upload Proof
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Upload Payment Screenshot</DialogTitle>
                                      <DialogDescription>
                                        Upload a screenshot of your payment confirmation
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <UploadButton
                                        endpoint="paymentScreenshot"
                                        onClientUploadComplete={(res) => {
                                          if (res && res[0]) {
                                            handleUploadComplete(booking.id, res[0].ufsUrl)
                                          }
                                        }}
                                        onUploadError={(error: Error) => {
                                          console.error("Upload error:", error)
                                        }}
                                        appearance={{
                                          button: "ut-ready:bg-[#16a34a] ut-ready:hover:bg-[#0e8c3a] ut-uploading:bg-[#16a34a]/50 ut-uploading:cursor-not-allowed rounded-md px-4 py-2 text-sm font-medium text-white transition-colors cursor-pointer",
                                          allowedContent: "text-muted-foreground text-xs",
                                        }}
                                      />
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                              {payment.screenshotUrl && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Screenshot uploaded - awaiting verification
                                </p>
                              )}
                              {payment.adminNotes && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Admin notes: {payment.adminNotes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Price Breakdown</Label>
                        <div className="mt-1 space-y-1">
                          {booking.priceBreakdown.map((item, index) => (
                            <div key={index} className="flex justify-between text-xs">
                              <span>{item.hour} - {item.tier}</span>
                              <span>₱{item.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  )
}
