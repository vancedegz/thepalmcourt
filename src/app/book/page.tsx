"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import CustomerLayout from "@/components/layout/CustomerLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getActiveCourts } from "@/app/actions/courts"
import { getAvailableSlots } from "@/app/actions/bookings"
import { calculatePrice, getBusinessSettings } from "@/app/actions/settings"
import { createMultipleBookings } from "@/app/actions/bookings"
import { useBusinessSettings } from "@/lib/business-settings-context"
import { format, addDays, isSameDay } from "date-fns"
import { Calendar as CalendarIcon, Check } from "lucide-react"
import { cn, formatTime } from "@/lib/utils"
import type { Court } from "@prisma/client"

function DateStrip({
  selectedDate,
  onSelect,
}: {
  selectedDate: Date | undefined
  onSelect: (date: Date | undefined) => void
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i))

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {days.map((date) => {
        const isSelected = selectedDate ? isSameDay(date, selectedDate) : false
        const isToday = isSameDay(date, today)
        const dayName = isToday ? "Today" : dayLabels[date.getDay()]
        const dayNum = format(date, "d")
        return (
          <button
            key={date.toISOString()}
            onClick={() => onSelect(date)}
            className={cn(
              "flex-shrink-0 flex flex-col items-center justify-center w-16 h-[72px] rounded-xl border-2 transition-all cursor-pointer",
              isSelected
                ? "bg-[#16a34a] border-[#16a34a] text-white shadow-md scale-105"
                : "bg-white border-gray-200 text-gray-700 hover:border-[#16a34a]/50 hover:bg-[#e8f5e9]"
            )}
          >
            <span className={cn("text-[10px] font-semibold uppercase tracking-wide", isSelected ? "text-white/90" : "text-gray-500")}>
              {dayName}
            </span>
            <span className="text-lg font-bold leading-tight">{dayNum}</span>
          </button>
        )
      })}
    </div>
  )
}

interface CourtBookings {
  [courtIdDate: string]: {
    startTime: string
    endTime: string
  }[]
}

export default function BookPage() {
  const router = useRouter()
  const [courts, setCourts] = useState<Court[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [courtBookings, setCourtBookings] = useState<CourtBookings>({})
  const [selectedSlots, setSelectedSlots] = useState<{ courtId: string; time: string; date: Date; hour: number }[]>([])
  const [showSummary, setShowSummary] = useState(false)
  const [priceInfo, setPriceInfo] = useState<
    | { courtId: string; courtName: string; startDate: Date; endDate: Date; startTime: string; endTime: string; durationHours: number; totalAmount: number; priceBreakdown: { hour: string; price: number; tier: string }[] }[]
    | null
  >(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [openingHour, setOpeningHour] = useState(6)
  const [closingHour, setClosingHour] = useState(22)
  const { settings: businessSettings } = useBusinessSettings()

  const loadCourts = async () => {
    try {
      const data = await getActiveCourts()
      setCourts(data)
    } catch {
      setError("Failed to load courts")
    }
  }

  const loadAllBookings = useCallback(async () => {
    if (!selectedDate) return
    try {
      const bookingsMap: CourtBookings = {}
      const nextDay = addDays(selectedDate, 1)
      await Promise.all(
        courts.flatMap((court) => [
          getAvailableSlots(court.id, selectedDate).then((slots) => {
            bookingsMap[`${court.id}:${selectedDate.toISOString()}`] = slots
          }),
          getAvailableSlots(court.id, nextDay).then((slots) => {
            bookingsMap[`${court.id}:${nextDay.toISOString()}`] = slots
          }),
        ])
      )
      setCourtBookings(bookingsMap)
    } catch {
      setError("Failed to load bookings")
    }
  }, [courts, selectedDate])

  useEffect(() => {
    async function run() {
      await loadCourts()
      try {
        const settings = await getBusinessSettings()
        const openH = settings?.openingTime ? parseInt(settings.openingTime.split(":")[0], 10) : 6
        const closeH = settings?.closingTime ? parseInt(settings.closingTime.split(":")[0], 10) : 22
        setOpeningHour(openH)
        setClosingHour(closeH <= openH ? closeH + 24 : closeH)
      } catch {
        // fallback to defaults
      }
    }
    run()
  }, [])

  useEffect(() => {
    if (selectedDate && courts.length > 0) {
      async function run() {
        await loadAllBookings()
      }
      run()
    }
  }, [selectedDate, courts, loadAllBookings])

  const generateTimeSlots = () => {
    if (!selectedDate) return []
    const slots = []
    const count = closingHour - openingHour
    for (let i = 0; i < count; i++) {
      const hour = openingHour + i
      const time = `${(hour % 24).toString().padStart(2, "0")}:00`
      const date = hour >= 24 ? addDays(selectedDate, 1) : selectedDate
      slots.push({
        time,
        hour,
        date,
      })
    }
    return slots
  }

  const isSlotBooked = (courtId: string, time: string, slotDate: Date) => {
    const key = `${courtId}:${slotDate.toISOString()}`
    const bookings = courtBookings[key] || []
    const [hour] = time.split(":").map(Number)
    return bookings.some((booking) => {
      const [startHour] = booking.startTime.split(":").map(Number)
      const [endHour] = booking.endTime.split(":").map(Number)
      const effectiveEnd = endHour <= startHour ? endHour + 24 : endHour
      return hour >= startHour && hour < effectiveEnd
    })
  }

  const isSlotSelected = (courtId: string, time: string) => {
    return selectedSlots.some((slot) => slot.courtId === courtId && slot.time === time)
  }

  const isSlotPast = (time: string, date: Date) => {
    const slotDate = new Date(date)
    slotDate.setHours(0, 0, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (slotDate.getTime() > today.getTime()) return false
    if (slotDate.getTime() < today.getTime()) return true

    // Slot is today — compare current hour
    const [slotHour] = time.split(":").map(Number)
    const now = new Date()
    const tz = businessSettings?.timezone || "Asia/Manila"
    const tzNow = new Date(now.toLocaleString("en-US", { timeZone: tz }))
    const currentHour = tzNow.getHours()

    return slotHour <= currentHour
  }

  const handleSlotClick = (courtId: string, time: string, date: Date) => {
    if (isSlotBooked(courtId, time, date) || isSlotPast(time, date)) return

    const isSelected = isSlotSelected(courtId, time)

    if (isSelected) {
      setSelectedSlots(selectedSlots.filter((s) => !(s.courtId === courtId && s.time === time)))
    } else {
      const slotHour = generateTimeSlots().find((s) => s.time === time && s.date.toISOString() === date.toISOString())?.hour ?? parseInt(time.split(":")[0], 10)
      setSelectedSlots([...selectedSlots, { courtId, time, date, hour: slotHour }])
    }
    setError("")
  }

  const handleProceedToSummary = async () => {
    if (selectedSlots.length === 0) {
      setError("Please select at least one time slot")
      return
    }

    // Group slots by court
    const slotsByCourt: Record<string, typeof selectedSlots> = {}
    for (const slot of selectedSlots) {
      if (!slotsByCourt[slot.courtId]) slotsByCourt[slot.courtId] = []
      slotsByCourt[slot.courtId].push(slot)
    }

    // Validate each court's slots are consecutive
    for (const [courtId, slots] of Object.entries(slotsByCourt)) {
      // Sort by raw hour (slot.hour preserves overnight ordering: 22, 23, 24, 25...)
      const sorted = [...slots].sort((a, b) => a.hour - b.hour)
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i + 1].hour !== sorted[i].hour + 1) {
          const courtName = courts.find((c) => c.id === courtId)?.name || "Selected court"
          setError(`${courtName}: Please select consecutive time slots`)
          return
        }
      }
    }

    // Calculate price per court
    const courtPrices: NonNullable<typeof priceInfo> = []
    try {
      for (const [courtId, slots] of Object.entries(slotsByCourt)) {
        const sorted = [...slots].sort((a, b) => a.hour - b.hour)
        const startTime = sorted[0].time
        const startDate = sorted[0].date
        const lastSlotHour = sorted[sorted.length - 1].hour
        const endTime = `${((lastSlotHour + 1) % 24).toString().padStart(2, "0")}:00`
        const endDate = sorted[sorted.length - 1].date
        const info = await calculatePrice(startTime, endTime, startDate)
        courtPrices.push({
          courtId,
          courtName: courts.find((c) => c.id === courtId)?.name || "Court",
          startDate,
          endDate,
          startTime,
          endTime,
          durationHours: slots.length,
          ...info,
        })
      }
      setPriceInfo(courtPrices)
      setShowSummary(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to calculate price"
      console.error("[calculatePrice error]", err)
      setError(msg)
    }
  }

  const handleConfirmBooking = async () => {
    if (!selectedDate || selectedSlots.length === 0 || !priceInfo) return

    const bookings = priceInfo.map((courtPrice) => ({
      courtId: courtPrice.courtId,
      date: courtPrice.startDate,
      startTime: courtPrice.startTime,
      endTime: courtPrice.endTime,
      durationHours: courtPrice.durationHours,
      totalAmount: courtPrice.totalAmount,
      priceBreakdown: courtPrice.priceBreakdown,
    }))

    setLoading(true)
    setError("")

    try {
      await createMultipleBookings(bookings)
      router.push("/my-bookings")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create booking")
    } finally {
      setLoading(false)
    }
  }

  const timeSlots = generateTimeSlots()

  return (
    <CustomerLayout>
      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Book a Court</h1>
          <p className="text-gray-600 mt-2">Select your preferred date and time slots 🌴</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Booking Card */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Date Strip */}
              <div className="w-full">
                <div className="flex items-center gap-3 mb-3">
                  <CalendarIcon className="h-5 w-5 text-[#16a34a]" />
                  <CardTitle className="text-lg">
                    {selectedDate ? format(selectedDate, "MMMM yyyy") : "Select a date"}
                  </CardTitle>
                </div>
                <DateStrip selectedDate={selectedDate} onSelect={setSelectedDate} />
              </div>
              
              {/* Legend */}
              <div className="flex gap-4 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gradient-to-br from-green-100 to-green-50 border-2 border-primary/30 rounded shadow-sm"></div>
                  <span className="font-medium">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gradient-to-br from-primary to-primary/80 border-2 border-primary rounded shadow-sm"></div>
                  <span className="font-medium">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gradient-to-br from-gray-200 to-gray-100 border-2 border-gray-300 rounded shadow-sm"></div>
                  <span className="font-medium">Booked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gradient-to-br from-gray-300 to-gray-200 border-2 border-gray-400 rounded shadow-sm"></div>
                  <span className="font-medium">Past</span>
                </div>
              </div>
            </div>
            
          </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-6 px-6">
                <div className="min-w-[500px]">
                  {/* Header Row - Courts */}
                  <div className="grid grid-cols-[80px_repeat(auto-fit,minmax(100px,1fr))] sm:grid-cols-[100px_repeat(auto-fit,minmax(120px,1fr))] gap-2 mb-2">
                    <div className="font-semibold text-sm text-gray-600">Time</div>
                    {courts.map((court) => (
                      <div key={court.id} className="text-center">
                        <div className="font-semibold text-sm">{court.name}</div>
                        <div className="text-xs text-gray-500 truncate hidden sm:block">{court.description}</div>
                      </div>
                    ))}
                  </div>

                  {/* Time Slots Grid */}
                  <div className="space-y-2 mt-4">
                    {timeSlots.map((slot) => (
                      <div key={slot.time} className="grid grid-cols-[80px_repeat(auto-fit,minmax(100px,1fr))] sm:grid-cols-[100px_repeat(auto-fit,minmax(120px,1fr))] gap-2">
                        <div className="flex items-center font-semibold text-xs sm:text-sm text-gray-800 bg-gray-50 px-2 sm:px-3 rounded-lg border border-gray-200">
                          {formatTime(slot.time)}
                        </div>
                        {courts.map((court) => {
                          const booked = isSlotBooked(court.id, slot.time, slot.date)
                          const selected = isSlotSelected(court.id, slot.time)
                          const past = isSlotPast(slot.time, slot.date)

                          return (
                            <button
                              key={`${court.id}-${slot.time}-${slot.date.toISOString()}`}
                              onClick={() => handleSlotClick(court.id, slot.time, slot.date)}
                              disabled={booked || past}
                              className={cn(
                                "h-10 sm:h-12 rounded-lg border-2 transition-all duration-200 flex items-center justify-center font-medium shadow-sm hover:shadow-md cursor-pointer",
                                booked && "bg-gradient-to-br from-red-100 to-red-50 border-red-200 cursor-not-allowed text-red-600",
                                past && !booked && "bg-gradient-to-br from-gray-200 to-gray-100 border-gray-300 cursor-not-allowed opacity-60",
                                !booked && !past && !selected && "bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9] border-[#16a34a]/40 hover:from-[#c8e6c9] hover:to-[#a5d6a7] hover:border-[#16a34a] cursor-pointer text-[#0a7c32]",
                                selected && "bg-gradient-to-br from-[#16a34a] to-[#0e8c3a] border-[#0e8c3a] text-white hover:from-[#0e8c3a] hover:to-[#0a7c32] ring-2 ring-[#16a34a]/30 ring-offset-2"
                              )}
                            >
                              {booked && <span className="text-[10px] sm:text-xs font-semibold">Booked</span>}
                              {past && !booked && <span className="text-[10px] sm:text-xs text-gray-500">Closed</span>}
                              {selected && <Check className="h-4 w-4 sm:h-5 sm:w-5 font-bold" />}
                              {!booked && !past && !selected && <span className="text-[10px] sm:text-xs opacity-0 group-hover:opacity-100">Click</span>}
                            </button>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Continue Button */}
              {selectedSlots.length > 0 && (
                <div className="mt-6 flex justify-center">
                  <Button 
                    onClick={handleProceedToSummary} 
                    size="lg"
                    className="bg-gradient-to-r from-[#16a34a] to-[#0e8c3a] hover:from-[#0e8c3a] hover:to-[#0a7c32] text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    Continue with {selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''} →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

        {/* Booking Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Booking Summary</DialogTitle>
              <DialogDescription>Review your booking details before confirming</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {priceInfo && Array.isArray(priceInfo) && priceInfo.map((courtPrice) => (
                <div key={courtPrice.courtId} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-[#16a34a]">{courtPrice.courtName}</p>
                    <Badge variant="outline">{courtPrice.durationHours}h</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {format(courtPrice.startDate, "MMMM dd, yyyy")} {formatTime(courtPrice.startTime)} - {formatTime(courtPrice.endTime)}
                  </p>
                  {courtPrice.startDate.getTime() !== courtPrice.endDate.getTime() && (
                    <p className="text-xs text-muted-foreground">
                      Ends {format(courtPrice.endDate, "MMMM dd, yyyy")}
                    </p>
                  )}
                  <div className="space-y-1">
                    {courtPrice.priceBreakdown.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{formatTime(item.hour)} <Badge variant="outline" className="ml-1 text-[10px]">{item.tier}</Badge></span>
                        <span className="font-medium">₱{item.price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
                    <span>Subtotal</span>
                    <span>₱{courtPrice.totalAmount}</span>
                  </div>
                </div>
              ))}

              {(businessSettings?.paymentInstructions || businessSettings?.bankDetails) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2 text-sm">
                  {businessSettings.paymentInstructions && (
                    <div>
                      <p className="font-semibold text-amber-900 mb-0.5">Payment Instructions</p>
                      <p className="text-amber-800 whitespace-pre-line">{businessSettings.paymentInstructions}</p>
                    </div>
                  )}
                  {businessSettings.bankDetails && (
                    <div>
                      <p className="font-semibold text-amber-900 mb-0.5">Bank Details</p>
                      <p className="text-amber-800 whitespace-pre-line">{businessSettings.bankDetails}</p>
                    </div>
                  )}
                </div>
              )}

              {priceInfo && Array.isArray(priceInfo) && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-semibold">Total Amount</p>
                    <p className="text-2xl font-bold text-[#16a34a]">
                      ₱{priceInfo.reduce((sum, p) => sum + (p.totalAmount || 0), 0)}
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={handleConfirmBooking}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#16a34a] to-[#0e8c3a] hover:from-[#0e8c3a] hover:to-[#0a7c32] text-white"
                size="lg"
              >
                {loading ? "Creating Bookings..." : `Confirm ${priceInfo && Array.isArray(priceInfo) ? priceInfo.length : 1} Booking${priceInfo && Array.isArray(priceInfo) && priceInfo.length > 1 ? 's' : ''}`}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                You will need to upload payment proof after booking
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </CustomerLayout>
  )
}
