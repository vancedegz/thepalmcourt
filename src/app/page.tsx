import Link from "next/link"
import PublicLayout from "@/components/layout/PublicLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Phone, Mail, CheckCircle, Calendar, CreditCard, Sun, Sunset, Moon } from "lucide-react"

export default function HomePage() {
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
                <img
                  src="https://hyrwy9xec9.ufs.sh/f/0efuR0hwb0QyWwEIYatMroMZ2QKbfuBX34Y5cNptxEj6a9DR"
                  alt="The Palm Court"
                  className="h-24 w-24 md:h-32 md:w-32 object-contain"
                />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6">
              Where the Game <span className="text-[#fed7aa]">Meets</span> The Vibe
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-3 sm:mb-4 max-w-3xl mx-auto text-white/90">
              Book your premium pickleball court at The Palm Court
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
                  Open from 6 AM to 10 PM daily. Book morning, afternoon, or evening slots that fit your schedule.
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
            <Card className="text-center border-2 border-primary/10 hover:border-primary/30 hover:shadow-xl transition-all">
              <CardHeader className="pb-2">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#c8e6c9] to-[#e8f5e9] flex items-center justify-center">
                    <Sun className="h-8 w-8 text-[#16a34a]" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Morning</CardTitle>
                <div className="text-4xl font-bold text-[#16a34a]">₱200</div>
                <CardDescription>per hour</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-[#16a34a]" />
                    6:00 AM - 12:00 PM
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-[#16a34a]" />
                    All week
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="text-center border-2 border-primary relative overflow-hidden hover:shadow-xl transition-all md:transform md:-translate-y-4">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#16a34a] to-[#f97316]"></div>
              <div className="absolute top-4 right-4">
                <Badge className="bg-[#f97316] text-white">Popular</Badge>
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ffedd5] to-[#fff7ed] flex items-center justify-center">
                    <Sunset className="h-8 w-8 text-[#f97316]" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Afternoon</CardTitle>
                <div className="text-4xl font-bold text-[#f97316]">₱250</div>
                <CardDescription>per hour</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-[#f97316]" />
                    12:00 PM - 6:00 PM
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-[#f97316]" />
                    All week
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="text-center border-2 border-primary/10 hover:border-primary/30 hover:shadow-xl transition-all">
              <CardHeader className="pb-2">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#056b28] to-[#0a7c32] flex items-center justify-center">
                    <Moon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Evening</CardTitle>
                <div className="text-4xl font-bold text-[#056b28]">₱300</div>
                <CardDescription>per hour</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-[#056b28]" />
                    6:00 PM - 10:00 PM
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-[#056b28]" />
                    All week
                  </li>
                </ul>
              </CardContent>
            </Card>
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
              Have questions? We're here to help you get started on your pickleball journey.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm text-white hover:bg-white/20 transition-all">
              <CardHeader className="text-center">
                <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-7 w-7 text-[#f97316]" />
                </div>
                <CardTitle className="text-white">Phone</CardTitle>
                <CardDescription className="text-white/80 text-base">+63 917 123 4567</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm text-white hover:bg-white/20 transition-all">
              <CardHeader className="text-center">
                <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-7 w-7 text-[#f97316]" />
                </div>
                <CardTitle className="text-white">Email</CardTitle>
                <CardDescription className="text-white/80 text-base">info@thepalmcourt.com</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm text-white hover:bg-white/20 transition-all">
              <CardHeader className="text-center">
                <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-7 w-7 text-[#f97316]" />
                </div>
                <CardTitle className="text-white">Location</CardTitle>
                <CardDescription className="text-white/80 text-base">General Santos, Philippines</CardDescription>
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
