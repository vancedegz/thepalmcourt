"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "@/components/layout/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAllProducts } from "@/app/actions/products"
import { getAllSales, cancelSale } from "@/app/actions/sales"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
  ArrowLeft,
  Receipt,
  Calendar,
  User,
  Phone,
  Package,
  XCircle,
  RotateCcw,
  Search,
} from "lucide-react"
import { Input } from "@/components/ui/input"

export default function SalesHistoryPage() {
  const router = useRouter()
  const [sales, setSales] = useState<any[]>([])
  const [products, setProducts] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [salesData, productsData] = await Promise.all([
        getAllSales(),
        getAllProducts(),
      ])
      setSales(salesData)
      const productMap: Record<string, any> = {}
      productsData.forEach((p: any) => {
        productMap[p.id] = p
      })
      setProducts(productMap)
    } catch (err) {
      console.error("Failed to load data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (saleId: string) => {
    if (!confirm("Cancel this sale? Stock will be restored.")) return
    try {
      await cancelSale(saleId)
      loadData()
    } catch (err) {
      console.error("Failed to cancel sale:", err)
    }
  }

  const filteredSales = sales.filter((sale) => {
    const product = products[sale.productId]
    const q = searchQuery.toLowerCase()
    return (
      sale.customerName.toLowerCase().includes(q) ||
      (sale.customerPhone && sale.customerPhone.toLowerCase().includes(q)) ||
      (product && product.name.toLowerCase().includes(q))
    )
  })

  const totalRevenue = filteredSales
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + s.totalPrice, 0)

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#16a34a]" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div>
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/pos")}
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to POS
          </Button>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#16a34a] to-[#0e8c3a] flex items-center justify-center">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales History</h1>
              <p className="text-sm text-gray-500">View all recorded sales and rentals</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#e8f5e9] rounded-lg border border-[#16a34a]/10">
            <span className="text-sm font-semibold text-[#16a34a]">
              Total Revenue: ₱{totalRevenue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer name, phone, or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="border-2 border-[#16a34a]/10">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Transactions</p>
              <p className="text-xl font-bold text-[#16a34a]">{filteredSales.length}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-[#16a34a]/10">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-xl font-bold text-[#16a34a]">
                {filteredSales.filter((s) => s.status === "completed").length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 border-red-100">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Cancelled</p>
              <p className="text-xl font-bold text-red-500">
                {filteredSales.filter((s) => s.status === "cancelled").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sales List */}
        {filteredSales.length === 0 ? (
          <Card className="border-2 border-[#16a34a]/10">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-[#e8f5e9] flex items-center justify-center mb-4">
                <Receipt className="h-8 w-8 text-[#16a34a]" />
              </div>
              <p className="text-lg font-semibold text-gray-600 mb-1">No sales recorded</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Try a different search term" : "Record your first sale from the POS page"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredSales.map((sale) => {
              const product = products[sale.productId]
              return (
                <Card
                  key={sale.id}
                  className={cn(
                    "border overflow-hidden transition-all",
                    sale.status === "cancelled"
                      ? "border-gray-200 opacity-60"
                      : "border-[#16a34a]/10 hover:shadow-md"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      {/* Left: Product & Customer */}
                      <div className="flex items-start gap-3 flex-1">
                        {product?.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product?.name || "Product"}
                            className="w-12 h-12 rounded-lg object-cover border flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 border flex items-center justify-center flex-shrink-0">
                            <Package className="h-6 w-6 text-gray-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900">{product?.name || "Unknown Product"}</h3>
                            {product?.type && (
                              <Badge
                                className={cn(
                                  product.type === "sale"
                                    ? "bg-[#16a34a] text-white border-0"
                                    : "bg-[#f97316] text-white border-0"
                                )}
                              >
                                {product.type === "sale" ? "Sale" : "Rent"}
                              </Badge>
                            )}
                            {sale.status === "cancelled" && (
                              <Badge variant="outline" className="text-red-500 border-red-300">
                                Cancelled
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3 text-gray-400" />
                              {sale.customerName}
                            </span>
                            {sale.customerPhone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-gray-400" />
                                {sale.customerPhone}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              {format(new Date(sale.createdAt), "MMM dd, yyyy hh:mm a")}
                            </span>
                          </div>
                          {sale.notes && (
                            <p className="text-xs text-gray-500 mt-1 italic">{sale.notes}</p>
                          )}
                        </div>
                      </div>

                      {/* Right: Amount & Actions */}
                      <div className="flex items-center gap-4 sm:text-right">
                        <div>
                          <p className="text-xl font-bold text-[#16a34a]">
                            ₱{sale.totalPrice.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {sale.quantity} x ₱{sale.unitPrice.toLocaleString()}
                          </p>
                        </div>
                        {sale.status === "completed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancel(sale.id)}
                            className="border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                        {sale.status === "cancelled" && (
                          <div className="flex items-center text-red-500 text-sm">
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Cancelled
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
