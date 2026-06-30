"use client"

import { useState, useEffect, useMemo } from "react"
import CustomerLayout from "@/components/layout/CustomerLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { cn, formatTime } from "@/lib/utils"
import { getMyBookings, expireOverdueBookings } from "@/app/actions/bookings"
import { uploadPaymentScreenshot } from "@/app/actions/payments"
import { format } from "date-fns"
import type { Booking, Court, Payment } from "@prisma/client"

type PriceBreakdownItem = { hour: string; price: number; tier: string }

type BookingWithDetails = Booking & {
  court: Court
  payments: Payment[]
  priceBreakdown: PriceBreakdownItem[]
  paymentDeadline: Date | null
}
import { Calendar, Clock, MapPin, Upload, CheckCircle, XCircle, AlertCircle, Timer, CreditCard, Hourglass, Banknote } from "lucide-react"
import { UploadButton } from "@/lib/uploadthing"
import { useBusinessSettings } from "@/lib/business-settings-context"

const PAYMENT_WINDOW_MS = 15 * 60 * 1000

function PaymentCountdown({
  deadline,
  createdAt,
  onExpire,
}: {
  deadline: Date | string
  createdAt?: Date | string | null
  onExpire?: () => void
}) {
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(tick)
  }, [])

  const deadlineMs = useMemo(() => new Date(deadline).getTime(), [deadline])
  const createdMs = useMemo(() => (createdAt ? new Date(createdAt).getTime() : null), [createdAt])

  const remainingMs = Math.max(0, deadlineMs - now)
  const totalMs = createdMs ? deadlineMs - createdMs : PAYMENT_WINDOW_MS
  const progress = totalMs > 0 ? remainingMs / totalMs : 0
  const urgent = remainingMs < 5 * 60 * 1000
  const expired = remainingMs === 0

  useEffect(() => {
    if (expired && onExpire) onExpire()
  }, [expired, onExpire])

  const minutes = Math.floor(remainingMs / 60000)
  const seconds = Math.floor((remainingMs % 60000) / 1000)
  const display = `${minutes}:${seconds.toString().padStart(2, "0")}`

  // Circular progress ring
  const radius = 24
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - Math.max(0, Math.min(1, progress)))

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2 shadow-sm w-full",
        urgent
          ? "bg-red-50 border-red-200 text-red-700"
          : "bg-amber-50 border-amber-200 text-amber-700"
      )}
    >
      <div className="relative flex-shrink-0">
        <svg className="h-12 w-12 -rotate-90" viewBox="0 0 56 56">
          <circle
            cx="28"
            cy="28"
            r={radius}
            className={urgent ? "stroke-red-200" : "stroke-amber-200"}
            strokeWidth="5"
            fill="none"
          />
          <circle
            cx="28"
            cy="28"
            r={radius}
            className={cn(
              "transition-all duration-1000 ease-linear",
              urgent ? "stroke-red-500" : "stroke-amber-500"
            )}
            strokeWidth="5"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Timer className={cn("h-4 w-4", urgent ? "text-red-500" : "text-amber-500")} />
        </div>
      </div>
      <div className="min-w-[70px] flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">Pay within</p>
        <p className={cn(
          "text-xl font-bold tabular-nums tracking-tight",
          urgent ? "text-red-600" : "text-amber-600"
        )}>
          {display}
        </p>
      </div>
    </div>
  )
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const { settings: businessSettings } = useBusinessSettings()

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

  // Periodically ask the server to expire overdue pending bookings, then reload if any changed
  useEffect(() => {
    const check = setInterval(async () => {
      try {
        const expiredCount = await expireOverdueBookings()
        if (expiredCount > 0) {
          loadBookings()
        }
      } catch (err) {
        console.error("Failed to check expired bookings:", err)
      }
    }, 10000)
    return () => clearInterval(check)
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
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="border-2 border-primary/10 hover:shadow-lg transition-all overflow-hidden">
                <div className={cn(
                  "h-1.5",
                  booking.status === "confirmed" ? "bg-gradient-to-r from-[#16a34a] to-[#66bb6a]" :
                  booking.status === "pending" ? "bg-gradient-to-r from-[#f97316] to-[#fb923c]" :
                  "bg-gradient-to-r from-red-400 to-red-300"
                )}></div>
                <CardHeader className="p-4 pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                        booking.status === "confirmed" ? "bg-primary/10" :
                        booking.status === "pending" ? "bg-secondary/10" :
                        "bg-red-50"
                      )}>
                        <MapPin className={cn(
                          "h-5 w-5",
                          booking.status === "confirmed" ? "text-[#16a34a]" :
                          booking.status === "pending" ? "text-[#f97316]" :
                          "text-red-500"
                        )} />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base sm:text-lg truncate">{booking.court.name}</CardTitle>
                        <CardDescription className="text-xs">Ref: {booking.referenceNumber}</CardDescription>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-3">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium text-muted-foreground w-16">Date</span>
                        <span>{format(new Date(booking.date), "MMMM dd, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium text-muted-foreground w-16">Time</span>
                        <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Hourglass className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium text-muted-foreground w-16">Duration</span>
                        <span>{booking.durationHours} hour(s)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Banknote className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium text-muted-foreground w-16">Total</span>
                        <span className="text-lg font-bold text-[#16a34a]">₱{booking.totalAmount}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <Label className="text-sm font-medium">Payment Status</Label>
                        </div>
                        <div className="space-y-2">
                          {booking.payments.map((payment) => (
                            <div key={payment.id} className="space-y-2">
                              <div className="flex items-center gap-2">
                                {getPaymentStatusBadge(payment.status)}
                              </div>
                              {booking.status === "pending" &&
                                booking.paymentDeadline &&
                                !booking.payments.some((p) => p.screenshotUrl) && (
                                  <PaymentCountdown
                                    deadline={booking.paymentDeadline}
                                    createdAt={booking.createdAt}
                                    onExpire={loadBookings}
                                  />
                                )}
                              {payment.status === "pending" && !payment.screenshotUrl && booking.status === "pending" && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                  <p className="text-sm text-amber-800 mb-2 font-medium leading-snug">
                                    Upload your payment screenshot to confirm this booking.
                                  </p>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button className="bg-[#16a34a] hover:bg-[#0e8c3a] text-white w-full sm:w-auto">
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload Payment Screenshot
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
                                        {(businessSettings?.paymentInstructions || businessSettings?.bankDetails) && (
                                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2 text-sm">
                                            {businessSettings.paymentInstructions && (
                                              <div>
                                                <p className="font-semibold text-amber-900 mb-0.5">Payment Instructions</p>
                                                <p className="text-amber-800 whitespace-pre-line break-words">{businessSettings.paymentInstructions}</p>
                                              </div>
                                            )}
                                            {businessSettings.bankDetails && (
                                              <div>
                                                <p className="font-semibold text-amber-900 mb-0.5">Bank Details</p>
                                                <p className="text-amber-800 whitespace-pre-line break-words">{businessSettings.bankDetails}</p>
                                              </div>
                                            )}
                                          </div>
                                        )}
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
                                </div>
                              )}
                              {payment.screenshotUrl && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-2.5">
                                  <p className="text-sm text-green-800">
                                    <CheckCircle className="h-4 w-4 inline mr-1" />
                                    Screenshot uploaded — awaiting admin verification
                                  </p>
                                </div>
                              )}
                              {payment.adminNotes && (
                                <p className="text-xs text-muted-foreground">
                                  Admin notes: {payment.adminNotes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-1 block">Price Breakdown</Label>
                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-2 space-y-1">
                          {booking.priceBreakdown.map((item, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">{item.hour} <span className="text-gray-400">·</span> {item.tier}</span>
                              <span className="font-medium">₱{item.price}</span>
                            </div>
                          ))}
                          <div className="border-t border-gray-200 pt-1.5 mt-1 flex justify-between items-center text-sm font-semibold">
                            <span>Total</span>
                            <span className="text-[#16a34a]">₱{booking.totalAmount}</span>
                          </div>
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
