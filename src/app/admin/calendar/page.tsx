"use client"

import { useState, useEffect, useCallback } from "react"
import AdminLayout from "@/components/layout/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getBookingsByDateRange, cancelBooking, confirmBooking, createAdminBooking } from "@/app/actions/bookings"
import { getActiveCourts } from "@/app/actions/courts"
import { getBusinessSettings, calculatePrice } from "@/app/actions/settings"
import { searchUsers } from "@/app/actions/users"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  parseISO,
} from "date-fns"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  XCircle,
  CheckCircle,
  AlertCircle,
  CalendarDays,
  Calendar as CalendarIcon,
  LayoutGrid,
  Columns3,
  Search,
  Phone,
  UserPlus,
} from "lucide-react"
import { cn, formatTime } from "@/lib/utils"
import type { Booking, Court, Payment, User as UserType } from "@prisma/client"

type SearchUser = Pick<UserType, "id" | "username" | "email" | "firstName" | "lastName" | "phone">

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

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const statusColors: Record<string, string> = {
  confirmed: "bg-[#16a34a]",
  pending: "bg-[#f97316]",
  cancelled: "bg-red-500",
}

type ViewMode = "month" | "week" | "day"

export default function AdminCalendarPage() {
  const [view, setView] = useState<ViewMode>("day")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedCourt, setSelectedCourt] = useState<string>("all")
  const [openingHour, setOpeningHour] = useState(6)
  const [closingHour, setClosingHour] = useState(22)

  // Inline create dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [createDate, setCreateDate] = useState<Date>(new Date())
  const [createCourtId, setCreateCourtId] = useState<string>("")
  const [createStartTime, setCreateStartTime] = useState<string>("")
  const [createDuration, setCreateDuration] = useState<number>(1)
  const [createError, setCreateError] = useState("")
  const [createLoading, setCreateLoading] = useState(false)

  // Customer search
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
    } catch (err) {
      console.error("Failed to load courts:", err)
    }
  }

  const [hoursWarning, setHoursWarning] = useState<string>("")

  const loadBusinessHours = async () => {
    try {
      const settings = await getBusinessSettings()
      if (!settings) return

      const openH = parseInt(settings.openingTime.split(":")[0], 10)
      const closeH = parseInt(settings.closingTime.split(":")[0], 10)

      if (Number.isNaN(openH) || Number.isNaN(closeH) || closeH <= openH) {
        setHoursWarning(`Business hours are invalid (${settings.openingTime} – ${settings.closingTime}). Using defaults 6:00 AM – 10:00 PM. Please fix in Settings.`)
        setOpeningHour(6)
        setClosingHour(22)
      } else {
        setHoursWarning("")
        setOpeningHour(openH)
        setClosingHour(closeH)
      }
    } catch {
      // fallback to defaults
    }
  }

  const loadBookings = useCallback(async () => {
    try {
      let start: Date, end: Date
      if (view === "month") {
        start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 })
        end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 })
      } else if (view === "week") {
        start = startOfWeek(currentDate, { weekStartsOn: 0 })
        end = endOfWeek(currentDate, { weekStartsOn: 0 })
      } else {
        start = new Date(currentDate)
        start.setHours(0, 0, 0, 0)
        end = new Date(currentDate)
        end.setHours(23, 59, 59, 999)
      }
      const data = await getBookingsByDateRange(start, end)
      setBookings(data as BookingWithDetails[])
    } catch (err) {
      console.error("Failed to load bookings:", err)
    }
  }, [currentDate, view])

  useEffect(() => {
    loadCourts()
    loadBusinessHours()
  }, [])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  const goPrev = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1))
    else if (view === "week") setCurrentDate(subWeeks(currentDate, 1))
    else setCurrentDate(subDays(currentDate, 1))
  }

  const goNext = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1))
    else if (view === "week") setCurrentDate(addWeeks(currentDate, 1))
    else setCurrentDate(addDays(currentDate, 1))
  }

  const goToday = () => setCurrentDate(new Date())

  const getDateLabel = () => {
    if (view === "month") return format(currentDate, "MMMM yyyy")
    if (view === "week") {
      const s = startOfWeek(currentDate, { weekStartsOn: 0 })
      const e = endOfWeek(currentDate, { weekStartsOn: 0 })
      return `${format(s, "MMM d")} \u2013 ${format(e, "MMM d, yyyy")}`
    }
    return format(currentDate, "EEEE, MMMM dd, yyyy")
  }

  const getBookingsForDay = (date: Date) => {
    return bookings.filter((b) => {
      const bookingDate = parseISO(b.date.toISOString())
      if (!isSameDay(bookingDate, date)) return false
      if (selectedCourt !== "all" && b.courtId !== selectedCourt) return false
      return true
    })
  }

  const getBookingForCell = (courtId: string, hour: number, date: Date) => {
    return bookings.find((b) => {
      const bookingDate = parseISO(b.date.toISOString())
      if (!isSameDay(bookingDate, date)) return false
      if (b.courtId !== courtId) return false
      if (b.status === "cancelled") return false
      const [startHour] = b.startTime.split(":").map(Number)
      const [endHour] = b.endTime.split(":").map(Number)
      return hour >= startHour && hour < endHour
    })
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

  const handleConfirm = async (bookingId: string) => {
    if (!confirm("Confirm this booking without payment proof?")) return
    try {
      await confirmBooking(bookingId)
      loadBookings()
    } catch (err) {
      console.error("Failed to confirm booking:", err)
    }
  }

  // Debounced user search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2 || isManual) {
      setSearchResults([])
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

  const openCreateDialog = (date: Date, courtId?: string, startTime?: string) => {
    setCreateDate(date)
    setCreateCourtId(courtId || (courts[0]?.id ?? ""))
    setCreateStartTime(startTime || `${openingHour.toString().padStart(2, "0")}:00`)
    setCreateDuration(1)
    setCreateError("")
    setSearchQuery("")
    setSearchResults([])
    setSelectedUser(null)
    setIsManual(false)
    setManualName("")
    setManualPhone("")
    setCreateOpen(true)
  }

  const handleCreateBooking = async () => {
    if (!createCourtId) {
      setCreateError("Please select a court")
      return
    }
    if (!createStartTime) {
      setCreateError("Please select a start time")
      return
    }
    if (!isManual && !selectedUser) {
      setCreateError("Please select a customer or enter manual details")
      return
    }
    if (isManual && !manualName.trim()) {
      setCreateError("Please enter the customer name")
      return
    }

    const [startHour] = createStartTime.split(":").map(Number)
    const endTime = `${(startHour + createDuration).toString().padStart(2, "0")}:00`

    setCreateLoading(true)
    setCreateError("")

    try {
      const priceInfo = await calculatePrice(createStartTime, endTime, createDate)
      await createAdminBooking({
        courtId: createCourtId,
        date: createDate,
        startTime: createStartTime,
        endTime,
        durationHours: createDuration,
        totalAmount: priceInfo.totalAmount,
        priceBreakdown: priceInfo.priceBreakdown,
        userId: selectedUser?.id,
        guestName: isManual ? manualName : undefined,
        guestPhone: isManual ? manualPhone : undefined,
      })
      setCreateOpen(false)
      loadBookings()
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed to create booking")
    } finally {
      setCreateLoading(false)
    }
  }

  const getPaymentBadge = (payments: Payment[]) => {
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

  const selectedDayBookings = selectedDate ? getBookingsForDay(selectedDate) : []

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const slotCount = Math.max(0, closingHour - openingHour)
  const timeSlots = Array.from({ length: slotCount }, (_, i) => openingHour + i)
  const displayedCourts = selectedCourt === "all" ? courts : courts.filter((c) => c.id === selectedCourt)

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Booking Calendar</h1>
            <p className="text-gray-600 mt-2">View and manage court bookings</p>
          </div>
          <Button
            className="bg-[#16a34a] hover:bg-[#0e8c3a] text-white"
            onClick={() => openCreateDialog(currentDate)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Booking
          </Button>
        </div>

        {/* Controls bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mb-6 bg-white border rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              {([
                { key: "month", label: "Month", icon: LayoutGrid },
                { key: "week", label: "Week", icon: CalendarIcon },
                { key: "day", label: "Day", icon: Columns3 },
              ] as const).map((v) => (
                <button
                  key={v.key}
                  onClick={() => setView(v.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    view === v.key
                      ? "bg-white text-[#16a34a] shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <v.icon className="h-3.5 w-3.5" />
                  {v.label}
                </button>
              ))}
            </div>

            {/* Court filter */}
            <Select value={selectedCourt} onValueChange={setSelectedCourt}>
              <SelectTrigger className="w-[140px] h-9 text-sm border-gray-200">
                <SelectValue placeholder="All Courts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courts</SelectItem>
                {courts.map((court) => (
                  <SelectItem key={court.id} value={court.id}>{court.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date navigation */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={goPrev} className="h-8 w-8 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold min-w-[160px] text-center text-gray-800">
              {getDateLabel()}
            </span>
            <Button variant="ghost" size="sm" onClick={goNext} className="h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToday} className="h-8 text-xs ml-1">
              Today
            </Button>
          </div>
        </div>

        {hoursWarning && (
          <div className="mb-4 bg-[#f97316]/10 border border-[#f97316]/30 text-[#c2410c] rounded-lg p-3 text-sm font-medium">
            {hoursWarning}
          </div>
        )}

        {/* ── MONTH VIEW ── */}
        {view === "month" && (
          <>
            <Card className="border-2 border-primary/10 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-7 border-b">
                  {dayLabels.map((day) => (
                    <div key={day} className="py-3 text-center text-sm font-semibold text-gray-600 bg-gray-50">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {monthDays.map((day) => {
                    const dayBookings = getBookingsForDay(day)
                    const isCurrentMonth = isSameMonth(day, currentDate)
                    const isToday = isSameDay(day, new Date())
                    const hasBookings = dayBookings.length > 0
                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => { setSelectedDate(day); setView("day") }}
                        className={cn(
                          "min-h-[100px] sm:min-h-[120px] border-r border-b p-1.5 sm:p-2 transition-colors",
                          !isCurrentMonth && "bg-gray-50/50",
                          hasBookings && "cursor-pointer hover:bg-[#e8f5e9]",
                          !hasBookings && "cursor-pointer hover:bg-gray-50",
                          isToday && "ring-2 ring-inset ring-[#16a34a]/40"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn(
                            "text-xs sm:text-sm font-medium",
                            !isCurrentMonth && "text-gray-400",
                            isCurrentMonth && isToday && "inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#16a34a] text-white text-xs font-bold",
                            isCurrentMonth && !isToday && "text-gray-700"
                          )}>
                            {format(day, "d")}
                          </span>
                          {dayBookings.length > 0 && (
                            <span className="text-[10px] font-bold text-[#16a34a] bg-[#e8f5e9] rounded-full px-1.5 py-0.5">
                              {dayBookings.length}
                            </span>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          {dayBookings.slice(0, 3).map((booking) => (
                            <div key={booking.id} className={cn(
                              "text-[10px] sm:text-[11px] rounded px-1.5 py-0.5 truncate text-white font-medium",
                              statusColors[booking.status] || "bg-gray-400"
                            )}>
                              {formatTime(booking.startTime)} {booking.court.name}
                            </div>
                          ))}
                          {dayBookings.length > 3 && (
                            <div className="text-[10px] text-gray-500 font-medium px-1.5">
                              +{dayBookings.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#16a34a]" /><span className="text-sm text-gray-600">Confirmed</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#f97316]" /><span className="text-sm text-gray-600">Pending</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-500" /><span className="text-sm text-gray-600">Cancelled</span></div>
            </div>
          </>
        )}

        {/* ── WEEK VIEW ── */}
        {view === "week" && (
          <Card className="border-2 border-primary/10 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b">
                {weekDays.map((day) => (
                  <div key={day.toISOString()} className={cn(
                    "py-3 text-center border-r last:border-r-0",
                    isSameDay(day, new Date()) ? "bg-[#e8f5e9]" : "bg-gray-50"
                  )}>
                    <div className="text-xs font-semibold text-gray-500 uppercase">{format(day, "EEE")}</div>
                    <div className={cn(
                      "text-lg font-bold mt-0.5",
                      isSameDay(day, new Date()) ? "text-[#16a34a]" : "text-gray-700"
                    )}>{format(day, "d")}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {weekDays.map((day) => {
                  const dayBookings = getBookingsForDay(day)
                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => { setSelectedDate(day); setView("day") }}
                      className={cn(
                        "min-h-[300px] sm:min-h-[400px] border-r last:border-r-0 border-b p-2 transition-colors",
                        dayBookings.length > 0 && "cursor-pointer hover:bg-[#e8f5e9]/50"
                      )}
                    >
                      <div className="space-y-1.5">
                        {dayBookings.map((booking) => (
                          <div key={booking.id} className={cn(
                            "rounded p-2 text-white text-[11px] font-medium cursor-pointer hover:opacity-90 transition-opacity",
                            statusColors[booking.status] || "bg-gray-400"
                          )}>
                            <div className="flex items-center justify-between">
                              <span>{formatTime(booking.startTime)}</span>
                              <span className="opacity-90">{booking.durationHours}h</span>
                            </div>
                            <div className="truncate opacity-90">{booking.court.name}</div>
                            <div className="truncate opacity-80">{booking.user.firstName} {booking.user.lastName}</div>
                          </div>
                        ))}
                        {dayBookings.length === 0 && (
                          <div className="text-center text-muted-foreground text-xs py-8">No bookings</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── DAY VIEW ── */}
        {view === "day" && (
          <Card className="border-2 border-primary/10 shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="py-3 px-2 text-center text-sm font-semibold text-gray-600 border-r w-[80px]">Time</th>
                    {displayedCourts.map((court) => (
                      <th key={court.id} className="py-3 px-2 text-center text-sm font-semibold text-gray-600 border-r last:border-r-0">
                        {court.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((hour) => {
                    const timeStr = `${hour.toString().padStart(2, "0")}:00`
                    return (
                      <tr key={hour} className="border-b last:border-b-0 hover:bg-gray-50/50">
                        <td className="py-3 px-2 text-center text-sm font-medium text-gray-700 border-r bg-gray-50/30">
                          {formatTime(timeStr)}
                        </td>
                        {displayedCourts.map((court) => {
                          const booking = getBookingForCell(court.id, hour, currentDate)
                          return (
                            <td key={court.id} className="p-1.5 border-r last:border-r-0 min-h-[60px]">
                              {booking ? (
                                <div
                                  onClick={() => setSelectedDate(currentDate)}
                                  className={cn(
                                    "rounded p-2 text-white text-[11px] font-medium cursor-pointer hover:opacity-90 transition-opacity",
                                    statusColors[booking.status] || "bg-gray-400"
                                  )}
                                >
                                  <div className="truncate">{booking.user.firstName} {booking.user.lastName}</div>
                                  <div className="truncate opacity-80">{formatTime(booking.startTime)} – {formatTime(booking.endTime)}</div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => openCreateDialog(currentDate, court.id, timeStr)}
                                  className="w-full h-full min-h-[48px] flex items-center justify-center rounded hover:bg-[#e8f5e9] hover:border-[#16a34a]/30 border border-transparent transition-colors cursor-pointer"
                                  title={`Book ${court.name} at ${formatTime(timeStr)}`}
                                >
                                  <Plus className="h-3.5 w-3.5 text-[#16a34a]/40 hover:text-[#16a34a]" />
                                </button>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Day detail dialog */}
        <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-[#16a34a]" />
                {selectedDate && format(selectedDate, "EEEE, MMMM dd, yyyy")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {selectedDayBookings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No bookings for this day</p>
              ) : (
                selectedDayBookings.map((booking) => (
                  <div key={booking.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#16a34a]">
                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                          </span>
                          <Badge variant="outline" className="text-xs">{booking.durationHours}h</Badge>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Court: </span>
                          <span className="font-medium">{booking.court.name}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Customer: </span>
                          <span className="font-medium">{booking.user.firstName} {booking.user.lastName}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Ref: </span>
                          <span className="font-mono text-xs">{booking.referenceNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          {getStatusBadge(booking.status)}
                          {getPaymentBadge(booking.payments)}
                          <span className="text-sm font-bold text-[#16a34a]">₱{booking.totalAmount}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {booking.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConfirm(booking.id)}
                            className="border-[#16a34a]/30 hover:bg-[#e8f5e9] hover:border-[#16a34a] text-[#16a34a]"
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
                            className="border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <Button
                className="w-full bg-gradient-to-r from-[#16a34a] to-[#0e8c3a] hover:from-[#0e8c3a] hover:to-[#0a7c32] text-white"
                onClick={() => {
                  setSelectedDate(null)
                  openCreateDialog(selectedDate!)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Booking for This Day
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── CREATE BOOKING DIALOG ── */}
        <Dialog open={createOpen} onOpenChange={(open) => { if (!open) setCreateOpen(false) }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Booking</DialogTitle>
              <DialogDescription>
                {format(createDate, "EEEE, MMMM dd, yyyy")}
              </DialogDescription>
            </DialogHeader>

            {createError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {createError}
              </div>
            )}

            <div className="space-y-4">
              {/* Court & Time */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-medium text-gray-700">Court</Label>
                  <Select value={createCourtId} onValueChange={setCreateCourtId}>
                    <SelectTrigger className="mt-1 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {courts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Start</Label>
                  <Select value={createStartTime} onValueChange={setCreateStartTime}>
                    <SelectTrigger className="mt-1 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((h) => {
                        const t = `${h.toString().padStart(2, "0")}:00`
                        return <SelectItem key={t} value={t}>{formatTime(t)}</SelectItem>
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Hours</Label>
                  <Select value={createDuration.toString()} onValueChange={(v) => setCreateDuration(parseInt(v, 10))}>
                    <SelectTrigger className="mt-1 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((h) => (
                        <SelectItem key={h} value={h.toString()}>{h} hour{h > 1 ? "s" : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Customer toggle */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => { setIsManual(!isManual); setSelectedUser(null); setSearchQuery(""); setSearchResults([]) }}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    isManual ? "bg-[#16a34a]" : "bg-gray-300"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    isManual ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
                <span className="text-sm font-medium text-gray-700">Walk-in / Manual entry</span>
              </div>

              {/* Customer selection */}
              {!isManual ? (
                <div className="relative">
                  <Label className="text-xs font-medium text-gray-700 mb-1 block">Search customer</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Type name, email, or username..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setSelectedUser(null) }}
                      className="pl-10 text-sm"
                    />
                  </div>
                  {searching && <p className="text-xs text-gray-500 mt-1">Searching...</p>}
                  {searchResults.length > 0 && !selectedUser && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-52 overflow-y-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => { setSelectedUser(user); setSearchResults([]); setSearchQuery(`${user.firstName} ${user.lastName}`) }}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-3"
                        >
                          <div className="h-8 w-8 rounded-full bg-[#e8f5e9] flex items-center justify-center text-[#16a34a] font-bold text-sm">
                            {user.firstName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-gray-500">{user.email} {user.phone && `\u00B7 ${user.phone}`}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchQuery.length >= 2 && !searching && searchResults.length === 0 && !selectedUser && (
                    <p className="text-xs text-gray-500 mt-1">No customers found. Toggle &quot;Walk-in&quot; to enter manually.</p>
                  )}
                  {selectedUser && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-[#16a34a] font-medium">
                      <CheckCircle className="h-4 w-4" />
                      {selectedUser.firstName} {selectedUser.lastName}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1 block">Customer Name *</Label>
                    <div className="relative">
                      <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input placeholder="Enter name" value={manualName} onChange={(e) => setManualName(e.target.value)} className="pl-10 text-sm" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1 block">Phone (optional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input placeholder="Enter phone" value={manualPhone} onChange={(e) => setManualPhone(e.target.value)} className="pl-10 text-sm" />
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleCreateBooking}
                disabled={createLoading}
                className="w-full bg-gradient-to-r from-[#16a34a] to-[#0e8c3a] hover:from-[#0e8c3a] hover:to-[#0a7c32] text-white"
              >
                {createLoading ? "Creating..." : "Create Booking"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
