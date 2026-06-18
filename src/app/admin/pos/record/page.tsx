"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "@/components/layout/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAllProducts } from "@/app/actions/products"
import { createBatchSales } from "@/app/actions/sales"
import { cn } from "@/lib/utils"
import {
  ShoppingCart,
  ArrowLeft,
  Minus,
  Plus,
  Receipt,
  User,
  Phone,
  Package,
  Trash2,
  Search,
  ImageIcon,
} from "lucide-react"

interface CartItem {
  productId: string
  name: string
  price: number
  type: "sale" | "rent"
  imageUrl: string | null
  stock: number
  qty: number
}

export default function RecordSalePage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState("")

  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const data = await getAllProducts()
      setProducts(data.filter((p: any) => p.isActive))
    } catch (err) {
      console.error("Failed to load products:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  )

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        if (existing.qty >= product.stock) return prev
        return prev.map((i) =>
          i.productId === product.id ? { ...i, qty: i.qty + 1 } : i
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          type: product.type,
          imageUrl: product.imageUrl,
          stock: product.stock,
          qty: 1,
        },
      ]
    })
  }

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item
        const newQty = Math.max(1, Math.min(item.stock, item.qty + delta))
        return { ...item, qty: newQty }
      })
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId))
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (cart.length === 0) {
      setError("Cart is empty. Add items first.")
      return
    }
    if (!customerName.trim()) {
      setError("Please enter customer name")
      return
    }

    setSubmitting(true)
    try {
      await createBatchSales(
        cart.map((item) => ({
          productId: item.productId,
          quantity: item.qty,
          unitPrice: item.price,
        })),
        customerName.trim(),
        customerPhone.trim() || undefined,
        notes.trim() || undefined
      )
      setSuccess(`Sale recorded! ${cartCount} item(s) — ₱${cartTotal.toLocaleString()}`)
      setCart([])
      setCustomerName("")
      setCustomerPhone("")
      setNotes("")
      loadProducts()
    } catch (err: any) {
      setError(err.message || "Failed to record sale")
    } finally {
      setSubmitting(false)
    }
  }

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/pos")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#16a34a] to-[#0e8c3a] flex items-center justify-center">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Record Sale / Rental</h1>
              <p className="text-sm text-gray-500">Select items and checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#e8f5e9] rounded-lg border border-[#16a34a]/10">
            <ShoppingCart className="h-4 w-4 text-[#16a34a]" />
            <span className="text-sm font-semibold text-[#16a34a]">
              {cartCount} item(s) — ₱{cartTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-[#16a34a] text-sm">{success}</div>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: Product Catalog */}
          <div className="lg:col-span-3 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {filteredProducts.length === 0 ? (
              <Card className="border-2 border-[#16a34a]/10">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-gray-500">No items found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {filteredProducts.map((product) => {
                  const inCart = cart.find((i) => i.productId === product.id)
                  const remaining = product.stock - (inCart?.qty || 0)
                  const outOfStock = remaining <= 0
                  return (
                    <Card
                      key={product.id}
                      className={cn(
                        "border overflow-hidden transition-all hover:shadow-md group",
                        outOfStock
                          ? "border-gray-200 opacity-60"
                          : "border-[#16a34a]/10 hover:border-[#16a34a]/30 cursor-pointer"
                      )}
                      onClick={() => !outOfStock && addToCart(product)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-14 h-14 rounded-lg object-cover border flex-shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-gray-100 border flex items-center justify-center flex-shrink-0">
                              <ImageIcon className="h-6 w-6 text-gray-300" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                              <Badge
                                className={cn(
                                  "text-[10px] h-5",
                                  product.type === "sale"
                                    ? "bg-[#16a34a] text-white border-0"
                                    : "bg-[#f97316] text-white border-0"
                                )}
                              >
                                {product.type === "sale" ? "Sale" : "Rent"}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">₱{product.price.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">
                              Stock: {remaining}
                              {inCart && (
                                <span className="text-[#16a34a] font-medium ml-1">(In cart: {inCart.qty})</span>
                              )}
                            </p>
                          </div>
                          {!outOfStock && (
                            <div className="w-8 h-8 rounded-full bg-[#16a34a] text-white flex items-center justify-center flex-shrink-0">
                              <Plus className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right: Cart & Checkout */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-[#16a34a]/10 sticky top-4">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b">
                  <ShoppingCart className="h-5 w-5 text-[#16a34a]" />
                  <h2 className="font-semibold text-lg">Cart</h2>
                  {cartCount > 0 && (
                    <Badge className="bg-[#16a34a] text-white border-0">{cartCount}</Badge>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="py-8 text-center">
                    <ShoppingCart className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Your cart is empty</p>
                    <p className="text-xs text-gray-300">Click items on the left to add</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-100"
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-10 h-10 rounded object-cover border flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-white border flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="h-4 w-4 text-gray-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">₱{item.price.toLocaleString()} each</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQty(item.productId, -1)}
                            disabled={item.qty <= 1}
                            className="h-7 w-7 p-0 rounded-md"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQty(item.productId, 1)}
                            disabled={item.qty >= item.stock}
                            className="h-7 w-7 p-0 rounded-md"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right min-w-[60px]">
                          <p className="text-sm font-semibold">₱{(item.price * item.qty).toLocaleString()}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.productId)}
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total */}
                {cart.length > 0 && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Subtotal</span>
                      <span className="text-sm font-medium">₱{cartTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-[#16a34a]">₱{cartTotal.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Customer Info */}
                <form onSubmit={handleCheckout} className="space-y-3 pt-3 border-t">
                  <div>
                    <Label htmlFor="customerName" className="flex items-center gap-1 text-xs">
                      <User className="h-3 w-3 text-[#16a34a]" />
                      Customer Name *
                    </Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter name"
                      className="h-9 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone" className="flex items-center gap-1 text-xs">
                      <Phone className="h-3 w-3 text-[#16a34a]" />
                      Phone (Optional)
                    </Label>
                    <Input
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+63..."
                      className="h-9 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes" className="text-xs">Notes (Optional)</Label>
                    <Input
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any notes..."
                      className="h-9 text-sm mt-1"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting || cart.length === 0}
                    className="w-full bg-gradient-to-r from-[#16a34a] to-[#0e8c3a] hover:from-[#0e8c3a] hover:to-[#0a7c32] text-white py-5 text-base shadow-md hover:shadow-lg transition-all"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    {submitting ? "Recording..." : "Checkout"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
