"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import AdminLayout from "@/components/layout/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllProducts, createProduct, updateProduct, deleteProduct, toggleProductStatus } from "@/app/actions/products"
import { UploadButton } from "@/lib/uploadthing"
import { cn } from "@/lib/utils"
import type { Product } from "@prisma/client"
import {
  ShoppingCart,
  Plus,
  Package,
  Tag,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Search,
  ImageIcon,
  ImageOff,
  Receipt,
  History,
} from "lucide-react"

export default function AdminPosPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    type: "sale" as "sale" | "rent",
    imageUrl: "",
    stock: "",
  })

  const loadProducts = async () => {
    try {
      const data = await getAllProducts()
      setProducts(data)
    } catch (err) {
      console.error("Failed to load products:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function run() {
      await loadProducts()
    }
    run()
  }, [])

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      type: "sale",
      imageUrl: "",
      stock: "",
    })
    setEditingProduct(null)
    setError("")
    setSuccess("")
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      type: product.type,
      imageUrl: product.imageUrl || "",
      stock: String(product.stock),
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: formData.name,
          description: formData.description || undefined,
          price: Number(formData.price),
          type: formData.type,
          imageUrl: formData.imageUrl || undefined,
          stock: Number(formData.stock),
        })
        setSuccess("Product updated successfully")
      } else {
        await createProduct({
          name: formData.name,
          description: formData.description || undefined,
          price: Number(formData.price),
          type: formData.type,
          imageUrl: formData.imageUrl || undefined,
          stock: Number(formData.stock),
        })
        setSuccess("Product created successfully")
      }
      resetForm()
      setDialogOpen(false)
      loadProducts()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save product")
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return
    try {
      await deleteProduct(productId)
      loadProducts()
    } catch (err) {
      console.error("Failed to delete product:", err)
    }
  }

  const handleToggleStatus = async (productId: string) => {
    try {
      await toggleProductStatus(productId)
      loadProducts()
    } catch (err) {
      console.error("Failed to toggle status:", err)
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-[#16a34a]" />
              Point of Sale
            </h1>
            <p className="text-gray-600 mt-2">Manage items for sale and rent</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/pos/record")}
              className="border-[#16a34a]/30 hover:bg-[#e8f5e9] hover:border-[#16a34a]"
            >
              <Receipt className="h-4 w-4 mr-2 text-[#16a34a]" />
              Record Sale
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/admin/pos/history")}
              className="border-[#16a34a]/30 hover:bg-[#e8f5e9] hover:border-[#16a34a]"
            >
              <History className="h-4 w-4 mr-2 text-[#16a34a]" />
              Sales History
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                className="bg-gradient-to-r from-[#16a34a] to-[#0e8c3a] hover:from-[#0e8c3a] hover:to-[#0a7c32] shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Edit Item" : "Add New Item"}</DialogTitle>
                <DialogDescription>
                  {editingProduct ? "Update product information" : "Create a new product or rental item"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
                )}
                {success && (
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-[#16a34a] text-sm">{success}</div>
                )}
                <div>
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., Pickleball Paddle, Court Rental Shoes"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the item"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price (₱)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock">Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      required
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "sale" | "rent") => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">For Sale</SelectItem>
                      <SelectItem value="rent">For Rent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Item Image (Optional)</Label>
                  {formData.imageUrl ? (
                    <div className="mt-2 space-y-2">
                      <Image
                        src={formData.imageUrl}
                        alt="Preview"
                        width={400}
                        height={160}
                        className="w-full h-40 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, imageUrl: "" })}
                        className="w-full border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <ImageOff className="h-4 w-4 mr-2" />
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <UploadButton
                      endpoint="productImage"
                      onClientUploadComplete={(res) => {
                        if (res && res[0]) {
                          setFormData({ ...formData, imageUrl: res[0].ufsUrl })
                        }
                      }}
                      onUploadError={(error: Error) => {
                        console.error("Upload error:", error)
                        setError("Failed to upload image")
                      }}
                      appearance={{
                        button:
                          "ut-ready:bg-[#16a34a] ut-ready:hover:bg-[#0e8c3a] ut-uploading:bg-[#16a34a]/50 ut-uploading:cursor-not-allowed rounded-md px-4 py-2 text-sm font-medium text-white transition-colors cursor-pointer w-full",
                        allowedContent: "text-muted-foreground text-xs",
                      }}
                    />
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#16a34a] to-[#0e8c3a] hover:from-[#0e8c3a] hover:to-[#0a7c32]"
                >
                  {editingProduct ? "Update Item" : "Create Item"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-2 border-[#16a34a]/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#16a34a]">{products.length}</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-[#16a34a]/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">For Sale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#16a34a]">
                {products.filter((p) => p.type === "sale").length}
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-[#16a34a]/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">For Rent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#f97316]">
                {products.filter((p) => p.type === "rent").length}
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-[#16a34a]/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#0a7c32]">
                {products.filter((p) => p.isActive).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card className="border-2 border-[#16a34a]/10 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-[#e8f5e9] flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-[#16a34a]" />
              </div>
              <p className="text-lg font-semibold text-gray-600 mb-1">No items found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Try a different search term" : "Add your first product to get started"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className={cn(
                  "border-2 overflow-hidden transition-all hover:shadow-lg group",
                  product.isActive ? "border-[#16a34a]/10" : "border-gray-200 opacity-70"
                )}
              >
                {/* Image */}
                <div className="relative h-40 bg-gray-100">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="h-10 w-10 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge
                      className={cn(
                        product.type === "sale"
                          ? "bg-[#16a34a] text-white border-0"
                          : "bg-[#f97316] text-white border-0"
                      )}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {product.type === "sale" ? "Sale" : "Rent"}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      {product.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold text-[#16a34a]">₱{product.price}</p>
                      <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                    </div>
                    {!product.isActive && (
                      <Badge variant="outline" className="text-gray-500 border-gray-300">
                        Inactive
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2 pt-3 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      className="flex-1 border-[#16a34a]/20 hover:bg-[#e8f5e9] hover:border-[#16a34a]/40"
                    >
                      <Edit3 className="h-3 w-3 mr-1 text-[#16a34a]" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(product.id)}
                      className={cn(
                        "border-gray-200 hover:bg-gray-50",
                        product.isActive ? "text-gray-600" : "text-[#16a34a]"
                      )}
                    >
                      {product.isActive ? (
                        <EyeOff className="h-3 w-3 mr-1" />
                      ) : (
                        <Eye className="h-3 w-3 mr-1" />
                      )}
                      {product.isActive ? "Hide" : "Show"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                      className="border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
