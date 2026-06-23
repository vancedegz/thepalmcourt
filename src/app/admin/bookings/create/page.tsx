"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "@/components/layout/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { searchUsers } from "@/app/actions/users"
import { getActiveCourts } from "@/app/actions/courts"
import { getAvailableSlots, createAdminBooking } from "@/app/actions/bookings"
import { calculatePrice } from "@/app/actions/settings"
import { format, addDays, isSameDay } from "date-fns"
import { Calendar as CalendarIcon, Check, X, Search, User, Phone, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Court, User as UserType } from "@prisma/client"

type SearchUser = Pick<UserType, "id" | "username" | "email" | "firstName" | "lastName" | "phone">

type CourtPriceInfo = {
  totalAmount: number
  priceBreakdown: { hour: string; price: number; tier: string }[]
}

interface CourtBookings {
  [courtId: string]: { startTime: string; endTime: string }[]
}

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
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
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

export default function AdminCreateBookingPage() {
  const router = useRouter()
  const [courts, setCourts] = useState<Court[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [selectedCourt, setSelectedCourt] = useState<string>("")
  const [courtBookings, setCourtBookings] = useState<CourtBookings>({})
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [showSummary, setShowSummary] = useState(false)
  const [priceInfo, setPriceInfo] = useState<CourtPriceInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // User search
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null)
  const [isManual, setIsManual] = useState(false)
  const [manualName, setManualName] = useState("")
  const [manualPhone, setManualPhone] = useState("")
  const [searching, setSearching] = useState(false)

  const loadCourts = async () => {
    try {
      const data = await getActiveCourts()
      setCourts(data)
      if (data.length > 0) setSelectedCourt(data[0].id)
    } catch {
      setError("Failed to load courts")
    }
  }

  const loadCourtBookings = useCallback(async () => {
    if (!selectedCourt || !selectedDate) return
    try {
      const slots = await getAvailableSlots(selectedCourt, selectedDate)
      setCourtBookings({ [selectedCourt]: slots })
    } catch {
      setError("Failed to load bookings")
    }
  }, [selectedCourt, selectedDate])

  useEffect(() => {
    async function run() {
      await loadCourts()
    }
    run()
  }, [])

  useEffect(() => {
    if (!selectedCourt || !selectedDate) return
    async function run() {
      await loadCourtBookings()
    }
    run()
  }, [selectedCourt, selectedDate, loadCourtBookings])

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2 || isManual) {
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await searchUsers(searchQuery)
        setSearchResults(results)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, isManual])

  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 6; hour < 22; hour++) {
      slots.push({ time: `${hour.toString().padStart(2, "0")}:00`, hour })
    }
    return slots
  }

  const isSlotBooked = (courtId: string, time: string) => {
    const bookings = courtBookings[courtId] || []
    const [hour] = time.split(":").map(Number)
    return bookings.some((booking) => {
      const [startHour] = booking.startTime.split(":").map(Number)
      const [endHour] = booking.endTime.split(":").map(Number)
      return hour >= startHour && hour < endHour
    })
  }

  const isSlotSelected = (time: string) => selectedSlots.includes(time)

  const isSlotPast = (time: string) => {
    if (!selectedDate) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sel = new Date(selectedDate)
    sel.setHours(0, 0, 0, 0)
    if (sel.getTime() !== today.getTime()) return false
    const now = new Date()
    const gmt8 = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Shanghai" }))
    const currentHour = gmt8.getHours()
    const [slotHour] = time.split(":").map(Number)
    return slotHour <= currentHour
  }

  const handleSlotClick = (time: string) => {
    if (isSlotBooked(selectedCourt, time) || isSlotPast(time)) return
    if (isSlotSelected(time)) {
      setSelectedSlots(selectedSlots.filter((t) => t !== time))
    } else {
      setSelectedSlots([...selectedSlots, time])
    }
    setError("")
  }

  const handleProceedToSummary = async () => {
    if (!selectedCourt) {
      setError("Please select a court")
      return
    }
    if (selectedSlots.length === 0) {
      setError("Please select at least one time slot")
      return
    }
    if (!isManual && !selectedUser) {
      setError("Please select a customer or enter manual details")
      return
    }
    if (isManual && !manualName.trim()) {
      setError("Please enter the customer's name")
      return
    }

    const sorted = [...selectedSlots].sort((a, b) => {
      const [aHour] = a.split(":").map(Number)
      const [bHour] = b.split(":").map(Number)
      return aHour - bHour
    })

    for (let i = 0; i < sorted.length - 1; i++) {
      const [currentHour] = sorted[i].split(":").map(Number)
      const [nextHour] = sorted[i + 1].split(":").map(Number)
      if (nextHour !== currentHour + 1) {
        setError("Please select consecutive time slots")
        return
      }
    }

    const startTime = sorted[0]
    const [lastHour] = sorted[sorted.length - 1].split(":").map(Number)
    const endTime = `${(lastHour + 1).toString().padStart(2, "0")}:00`

    try {
      const info = await calculatePrice(startTime, endTime, selectedDate!)
      setPriceInfo(info)
      setShowSummary(true)
    } catch {
      setError("Failed to calculate price")
    }
  }

  const handleConfirmBooking = async () => {
    if (!selectedDate || selectedSlots.length === 0 || !priceInfo) return

    const sorted = [...selectedSlots].sort((a, b) => {
      const [aHour] = a.split(":").map(Number)
      const [bHour] = b.split(":").map(Number)
      return aHour - bHour
    })
    const startTime = sorted[0]
    const [lastHour] = sorted[sorted.length - 1].split(":").map(Number)
    const endTime = `${(lastHour + 1).toString().padStart(2, "0")}:00`

    setLoading(true)
    setError("")

    try {
      await createAdminBooking({
        courtId: selectedCourt,
        date: selectedDate,
        startTime,
        endTime,
        durationHours: sorted.length,
        totalAmount: priceInfo.totalAmount,
        priceBreakdown: priceInfo.priceBreakdown,
        userId: selectedUser?.id,
        guestName: isManual ? manualName : undefined,
        guestPhone: isManual ? manualPhone : undefined,
      })
      router.push("/admin/bookings")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create booking")
    } finally {
      setLoading(false)
    }
  }

  const timeSlots = generateTimeSlots()

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create Booking</h1>
          <p className="text-gray-600 mt-2">Book a court on behalf of a customer</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Customer Selection */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-[#16a34a]" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setIsManual(!isManual)
                      setSelectedUser(null)
                      setSearchQuery("")
                      setSearchResults([])
                    }}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      isManual ? "bg-[#16a34a]" : "bg-gray-300"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        isManual ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                  <span className="font-medium text-sm">Walk-in / Manual entry</span>
                </div>
                {selectedUser && !isManual && (
                  <Badge className="bg-[#16a34a] text-white">
                    <Check className="h-3 w-3 mr-1" />
                    {selectedUser.firstName} {selectedUser.lastName}
                  </Badge>
                )}
              </div>

              {!isManual ? (
                <div className="relative">
                  <Label className="mb-2 block text-sm font-medium text-gray-700">Search customer</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Type name, email, or username..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setSelectedUser(null) }}
                      className="pl-10"
                    />
                  </div>
                  {searching && <p className="text-xs text-gray-500 mt-1">Searching...</p>}
                  {searchResults.length > 0 && !selectedUser && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => { setSelectedUser(user); setSearchResults([]); setSearchQuery(`${user.firstName} ${user.lastName}`) }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-3"
                        >
                          <div className="h-8 w-8 rounded-full bg-[#e8f5e9] flex items-center justify-center text-[#16a34a] font-bold text-sm">
                            {user.firstName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-gray-500">{user.email} {user.phone && `· ${user.phone}`}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchQuery.length >= 2 && !searching && searchResults.length === 0 && !selectedUser && (
                    <p className="text-xs text-gray-500 mt-1">No customers found. Toggle &quot;Walk-in&quot; to enter manually.</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block text-sm font-medium text-gray-700">Customer Name *</Label>
                    <div className="relative">
                      <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Enter customer name"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm font-medium text-gray-700">Phone (optional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Enter phone number"
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Court Selection */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-[#16a34a]" />
                Court & Date
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <Label className="mb-2 block text-sm font-medium text-gray-700">Select Court</Label>
                <div className="flex flex-wrap gap-2">
                  {courts.map((court) => (
                    <button
                      key={court.id}
                      onClick={() => { setSelectedCourt(court.id); setSelectedSlots([]) }}
                      className={cn(
                        "px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all",
                        selectedCourt === court.id
                          ? "bg-[#16a34a] border-[#16a34a] text-white"
                          : "bg-white border-gray-200 text-gray-700 hover:border-[#16a34a]/50"
                      )}
                    >
                      {court.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block text-sm font-medium text-gray-700">
                  {selectedDate ? format(selectedDate, "MMMM yyyy") : "Select Date"}
                </Label>
                <DateStrip selectedDate={selectedDate} onSelect={(date) => { setSelectedDate(date); setSelectedSlots([]) }} />
              </div>
            </CardContent>
          </Card>

          {/* Time Slots */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-[#16a34a]" />
                Time Slots
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex gap-4 text-sm mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gradient-to-br from-green-100 to-green-50 border-2 border-[#16a34a]/30 rounded shadow-sm" />
                  <span className="font-medium">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gradient-to-br from-[#16a34a] to-[#0e8c3a] border-2 border-[#16a34a] rounded shadow-sm" />
                  <span className="font-medium">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gradient-to-br from-gray-200 to-gray-100 border-2 border-gray-300 rounded shadow-sm" />
                  <span className="font-medium">Booked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gradient-to-br from-gray-300 to-gray-200 border-2 border-gray-400 rounded shadow-sm" />
                  <span className="font-medium">Past</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {timeSlots.map((slot) => {
                  const booked = isSlotBooked(selectedCourt, slot.time)
                  const selected = isSlotSelected(slot.time)
                  const past = isSlotPast(slot.time)
                  return (
                    <button
                      key={slot.time}
                      onClick={() => handleSlotClick(slot.time)}
                      disabled={booked || past}
                      className={cn(
                        "h-12 rounded-lg border-2 transition-all duration-200 flex items-center justify-center font-medium shadow-sm",
                        (booked || past) && "bg-gradient-to-br from-gray-200 to-gray-100 border-gray-300 cursor-not-allowed opacity-60",
                        !booked && !past && !selected && "bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9] border-[#16a34a]/40 hover:from-[#c8e6c9] hover:to-[#a5d6a7] hover:border-[#16a34a] cursor-pointer text-[#0a7c32]",
                        selected && "bg-gradient-to-br from-[#16a34a] to-[#0e8c3a] border-[#16a34a] text-white shadow-md ring-2 ring-[#16a34a]/30 ring-offset-2"
                      )}
                    >
                      {(booked || past) && <X className="h-3 w-3 text-gray-500" />}
                      {selected && <Check className="h-4 w-4" />}
                      {!booked && !past && !selected && <span className="text-sm">{slot.time}</span>}
                    </button>
                  )
                })}
              </div>

              {selectedSlots.length > 0 && (
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={handleProceedToSummary}
                    size="lg"
                    className="bg-gradient-to-r from-[#16a34a] to-[#0e8c3a] hover:from-[#0e8c3a] hover:to-[#0a7c32] text-white px-8 py-6 text-lg shadow-lg"
                  >
                    Continue with {selectedSlots.length} slot{selectedSlots.length > 1 ? "s" : ""}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Booking Summary</DialogTitle>
              <DialogDescription>Review before creating the booking</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">
                  {isManual ? manualName : `${selectedUser?.firstName} ${selectedUser?.lastName}`}
                </p>
                {isManual && manualPhone && <p className="text-sm text-gray-500">{manualPhone}</p>}
                {!isManual && selectedUser && (
                  <p className="text-sm text-gray-500">{selectedUser.email} {selectedUser.phone && `· ${selectedUser.phone}`}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Court</p>
                <p className="font-medium">{courts.find((c) => c.id === selectedCourt)?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{selectedDate && format(selectedDate, "MMMM dd, yyyy")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">
                  {selectedSlots.length > 0 && (() => {
                    const sorted = [...selectedSlots].sort((a, b) => {
                      const [aHour] = a.split(":").map(Number)
                      const [bHour] = b.split(":").map(Number)
                      return aHour - bHour
                    })
                    const start = sorted[0]
                    const [lastHour] = sorted[sorted.length - 1].split(":").map(Number)
                    const end = `${(lastHour + 1).toString().padStart(2, "0")}:00`
                    return `${start} - ${end}`
                  })()}
                </p>
              </div>
              {priceInfo && (
                <>
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-2">Price Breakdown</p>
                    <div className="space-y-1">
                      {priceInfo.priceBreakdown.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>
                            {item.hour} <Badge variant="outline" className="ml-1">{item.tier}</Badge>
                          </span>
                          <span className="font-medium">₱{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-semibold">Total Amount</p>
                      <p className="text-2xl font-bold text-[#16a34a]">₱{priceInfo.totalAmount}</p>
                    </div>
                  </div>
                </>
              )}
              <Button
                onClick={handleConfirmBooking}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#16a34a] to-[#0e8c3a] hover:from-[#0e8c3a] hover:to-[#0a7c32] text-white"
                size="lg"
              >
                {loading ? "Creating Booking..." : "Confirm Booking"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                The customer will need to upload payment proof
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
