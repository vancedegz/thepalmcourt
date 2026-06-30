"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import PublicLayout from "@/components/layout/PublicLayout"
import { useBusinessSettings } from "@/lib/business-settings-context"
import { getPricingTiers } from "@/app/actions/settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Phone, Mail, CheckCircle, Calendar, CreditCard, Sun, Sunset, Moon } from "lucide-react"
import { formatTime } from "@/lib/utils"
import type { PricingTier } from "@prisma/client"

function formatHourRange(openingTime: string, closingTime: string): string {
  const openH = parseInt(openingTime.split(":")[0] ?? "6", 10)
  const closeH = parseInt(closingTime.split(":")[0] ?? "22", 10)
  const effectiveClose = closeH <= openH ? closeH + 24 : closeH
  const fmt = (h: number) => {
    const hh = h % 24
    const period = hh < 12 ? "AM" : "PM"
    const display = hh % 12 === 0 ? 12 : hh % 12
    return `${display} ${period}`
  }
  return `${fmt(openH)} to ${fmt(effectiveClose)}`
}

export default function HomePage() {
  const { name, logoUrl, settings } = useBusinessSettings()
  const [tiers, setTiers] = useState<PricingTier[]>([])

  useEffect(() => {
    async function load() {
      try {
        const data = await getPricingTiers()
        setTiers(data.filter((t) => t.isActive))
      } catch {
        // ignore — fallback to defaults
      }
    }
    load()
  }, [])

  const phone = settings?.phone ?? "+63 917 123 4567"
  const email = settings?.email ?? "info@thepalmcourt.com"
  const address = settings?.address ?? "General Santos, Philippines"
  const hoursLabel = settings
    ? formatHourRange(settings.openingTime, settings.closingTime)
    : "6:00 AM to 10:00 PM"

  // Build a stable list of pricing cards: prefer active tiers, fall back to defaults.
  const pricingCards = tiers.length > 0
    ? tiers.map((tier, i) => {
        const icons = [Sun, Sunset, Moon]
        const Icon = icons[i % icons.length]
        const colors = [
          { bg: "from-[#c8e6c9] to-[#e8f5e9]", text: "text-[#16a34a]", border: "border-primary/10" },
          { bg: "from-[#ffedd5] to-[#fff7ed]", text: "text-[#f97316]", border: "border-primary" },
          { bg: "from-[#056b28] to-[#0a7c32]", text: "text-[#056b28]", border: "border-primary/10" },
        ]
        const c = colors[i % colors.length]
        return {
          id: tier.id,
          name: tier.name,
          price: tier.pricePerHour,
          range: `${formatTime(tier.startTime)} - ${formatTime(tier.endTime)}`,
          days: Array.isArray(tier.daysOfWeek) ? tier.daysOfWeek.join(", ") : "All week",
          Icon,
          c,
          popular: i === 1,
        }
      })
    : [
        { id: "default-morning", name: "Morning", price: 200, range: "6:00 AM - 12:00 PM", days: "All week", Icon: Sun, c: { bg: "from-[#c8e6c9] to-[#e8f5e9]", text: "text-[#16a34a]", border: "border-primary/10" }, popular: false },
        { id: "default-afternoon", name: "Afternoon", price: 250, range: "12:00 PM - 6:00 PM", days: "All week", Icon: Sunset, c: { bg: "from-[#ffedd5] to-[#fff7ed]", text: "text-[#f97316]", border: "border-primary" }, popular: true },
        { id: "default-evening", name: "Evening", price: 300, range: "6:00 PM - 10:00 PM", days: "All week", Icon: Moon, c: { bg: "from-[#056b28] to-[#0a7c32]", text: "text-[#056b28]", border: "border-primary/10" }, popular: false },
      ]

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#16a34a] via-[#0a7c32] to-[#f97316] overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534330207526-9e4e75c7f60c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] opacity-20 bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#004d1f]/90 via-[#0a7c32]/70 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center text-white">
            <div className="flex justify-center mb-8">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 border-2 border-white/30">
                <Image
                  src={logoUrl}
                  alt={name}
                  width={128}
                  height={128}
                  className="h-24 w-24 md:h-32 md:w-32 object-contain"
                />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6">
              Where the Game <span className="text-[#fed7aa]">Meets</span> The Vibe
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-3 sm:mb-4 max-w-3xl mx-auto text-white/90">
              Book your premium pickleball court at {name}
            </p>
            <p className="text-base sm:text-lg mb-8 sm:mb-10 max-w-2xl mx-auto text-white/80">
              Premium courts with tropical atmosphere. Easy reservations, flexible scheduling, and exceptional facilities in the heart of General Santos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 py-6 bg-white text-[#16a34a] hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all font-bold">
                  Book a Court Now
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-2 border-white text-white hover:bg-white/10 bg-transparent transition-all">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-1 text-sm bg-[#e8f5e9] text-[#16a34a] hover:bg-[#c8e6c9]">Why Choose Us</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Play Your Way, Anytime
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the best pickleball facilities with tropical vibes and professional service.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg group">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#16a34a] to-[#0e8c3a] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Easy Booking</CardTitle>
                <CardDescription className="text-base">
                  Reserve your court online in just a few clicks. Choose your preferred time and date instantly.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-2 border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg group">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Flexible Hours</CardTitle>
                <CardDescription className="text-base">
                  Open from {hoursLabel} daily. Book morning, afternoon, or evening slots that fit your schedule.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-2 border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg group">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0e8c3a] to-[#f97316] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CreditCard className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Fair Pricing</CardTitle>
                <CardDescription className="text-base">
                  Competitive rates with time-based pricing tiers. Morning, afternoon, and evening rates.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Courts Overview */}
      <section className="py-20 bg-gradient-to-br from-[#e8f5e9] to-[#fff7ed]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-1 text-sm bg-[#f97316]/10 text-[#c2410c] hover:bg-[#f97316]/20">Our Courts</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Three Premium Courts
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional courts with unique features to suit every player and occasion.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-primary/10 hover:border-primary/30 hover:shadow-xl transition-all overflow-hidden">
              <div className="h-3 bg-gradient-to-r from-[#16a34a] to-[#66bb6a]"></div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  Court 1
                  <Badge className="bg-[#16a34a] text-white">Premium</Badge>
                </CardTitle>
                <CardDescription className="text-base">
                  Premium court with tropical vibes and professional surface
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-[#16a34a]" />
                    Professional-grade surface
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-[#16a34a]" />
                    Premium net & equipment
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-2 border-secondary/20 hover:border-secondary/40 hover:shadow-xl transition-all overflow-hidden">
              <div className="h-3 bg-gradient-to-r from-[#fb923c] to-[#f97316]"></div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  Court 2
                  <Badge className="bg-[#f97316] text-white">Main</Badge>
                </CardTitle>
                <CardDescription className="text-base">
                  Main court with excellent lighting and palm tree views
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-[#f97316]" />
                    Excellent LED lighting
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-[#f97316]" />
                    Tropical palm tree views
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/10 hover:border-primary/30 hover:shadow-xl transition-all overflow-hidden">
              <div className="h-3 bg-gradient-to-r from-[#66bb6a] to-[#fb923c]"></div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  Court 3
                  <Badge className="bg-[#0a7c32] text-white">Casual</Badge>
                </CardTitle>
                <CardDescription className="text-base">
                  Relaxed atmosphere court perfect for casual games
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-[#16a34a]" />
                    Relaxed environment
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-[#16a34a]" />
                    Perfect for practice
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-1 text-sm bg-[#e8f5e9] text-[#16a34a] hover:bg-[#c8e6c9]">Pricing</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Different rates for different times to suit your schedule and budget.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingCards.map((card, i) => {
              const Icon = card.Icon
              const cardClass = i === 1
                ? "text-center border-2 border-primary relative overflow-hidden hover:shadow-xl transition-all md:transform md:-translate-y-4"
                : `text-center border-2 ${card.c.border} hover:border-primary/30 hover:shadow-xl transition-all`
              return (
                <Card key={card.id} className={cardClass}>
                  {card.popular && (
                    <>
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#16a34a] to-[#f97316]"></div>
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-[#f97316] text-white">Popular</Badge>
                      </div>
                    </>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex justify-center mb-4">
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${card.c.bg} flex items-center justify-center`}>
                        <Icon className={`h-8 w-8 ${card.c.text}`} />
                      </div>
                    </div>
                    <CardTitle className="text-2xl">{card.name}</CardTitle>
                    <div className={`text-4xl font-bold ${card.c.text}`}>₱{card.price}</div>
                    <CardDescription>per hour</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-left">
                      <li className="flex items-center gap-2">
                        <CheckCircle className={`h-4 w-4 ${card.c.text}`} />
                        {card.range}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className={`h-4 w-4 ${card.c.text}`} />
                        {card.days}
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-br from-[#004d1f] to-[#056b28] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Get in Touch
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Have questions? We&apos;re here to help you get started on your pickleball journey.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm text-white hover:bg-white/20 transition-all">
              <CardHeader className="text-center">
                <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-7 w-7 text-[#f97316]" />
                </div>
                <CardTitle className="text-white">Phone</CardTitle>
                <CardDescription className="text-white/80 text-base">{phone}</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm text-white hover:bg-white/20 transition-all">
              <CardHeader className="text-center">
                <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-7 w-7 text-[#f97316]" />
                </div>
                <CardTitle className="text-white">Email</CardTitle>
                <CardDescription className="text-white/80 text-base">{email}</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm text-white hover:bg-white/20 transition-all">
              <CardHeader className="text-center">
                <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-7 w-7 text-[#f97316]" />
                </div>
                <CardTitle className="text-white">Location</CardTitle>
                <CardDescription className="text-white/80 text-base">{address}</CardDescription>
              </CardHeader>
            </Card>
          </div>
          <div className="text-center mt-12">
            <Link href="/register">
              <Button size="lg" className="text-lg px-10 py-6 bg-white text-[#16a34a] hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all font-bold">
                Start Playing Today 🌴
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
