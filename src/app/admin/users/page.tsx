"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/layout/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllUsers, createUser, updateUserRole, toggleUserStatus, resetUserPassword } from "@/app/actions/users"
import { format } from "date-fns"
import {
  Users,
  Plus,
  Shield,
  User,
  UserCheck,
  UserX,
  Lock,
  Edit3,
  CheckCircle,
  XCircle,
  Search,
} from "lucide-react"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [newPassword, setNewPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "customer" as "customer" | "staff" | "admin",
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await getAllUsers()
      setUsers(data)
    } catch (err) {
      console.error("Failed to load users:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    try {
      await createUser(formData)
      setSuccess("User created successfully")
      setFormData({
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phone: "",
        role: "customer",
      })
      setDialogOpen(false)
      loadUsers()
    } catch (err: any) {
      setError(err.message || "Failed to create user")
    }
  }

  const handleRoleChange = async (userId: string, role: "customer" | "staff" | "admin") => {
    try {
      await updateUserRole(userId, role)
      loadUsers()
    } catch (err) {
      console.error("Failed to update role:", err)
    }
  }

  const handleToggleStatus = async (userId: string) => {
    try {
      await toggleUserStatus(userId)
      loadUsers()
    } catch (err) {
      console.error("Failed to toggle status:", err)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !newPassword) return
    try {
      await resetUserPassword(selectedUser.id, newPassword)
      setResetPasswordDialog(false)
      setNewPassword("")
      setSelectedUser(null)
      setSuccess("Password reset successfully")
      loadUsers()
    } catch (err) {
      setError("Failed to reset password")
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-[#16a34a] hover:bg-[#16a34a] text-white border-0">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        )
      case "staff":
        return (
          <Badge className="bg-[#f97316] hover:bg-[#f97316] text-white border-0">
            <UserCheck className="h-3 w-3 mr-1" />
            Staff
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
            <User className="h-3 w-3 mr-1" />
            Customer
          </Badge>
        )
    }
  }

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge className="bg-[#16a34a] hover:bg-[#16a34a] text-white border-0">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-300">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    )
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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2">Manage all system users, roles, and accounts</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-[#16a34a] to-[#0e8c3a] hover:from-[#0e8c3a] hover:to-[#0a7c32] shadow-md hover:shadow-lg transition-all">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>Add a new user to the system</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4 pt-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: "customer" | "staff" | "admin") =>
                        setFormData({ ...formData, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-[#16a34a] to-[#0e8c3a] hover:from-[#0e8c3a] hover:to-[#0a7c32]">
                    <Plus className="h-4 w-4 mr-2" />
                    Create User
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {success && (
          <div className="mb-6 p-3 rounded-lg bg-green-50 border border-green-200 text-[#16a34a] text-sm">
            {success}
          </div>
        )}

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name, username, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Card className="border-2 border-[#16a34a]/10 shadow-sm overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-[#e8f5e9] to-transparent">
                  <TableHead className="text-[#0a7c32] font-semibold">User</TableHead>
                  <TableHead className="text-[#0a7c32] font-semibold">Role</TableHead>
                  <TableHead className="text-[#0a7c32] font-semibold">Status</TableHead>
                  <TableHead className="text-[#0a7c32] font-semibold">Contact</TableHead>
                  <TableHead className="text-[#0a7c32] font-semibold">Joined</TableHead>
                  <TableHead className="text-[#0a7c32] font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-[#e8f5e9] flex items-center justify-center mb-4">
                          <Users className="h-8 w-8 text-[#16a34a]" />
                        </div>
                        <p className="text-lg font-semibold text-gray-600 mb-1">No users found</p>
                        <p className="text-sm text-muted-foreground">
                          {searchQuery ? "Try a different search term" : "Create your first user to get started"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c8e6c9] to-[#e8f5e9] flex items-center justify-center text-sm font-bold text-[#16a34a]">
                            {user.firstName.charAt(0).toUpperCase()}
                            {user.lastName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">@{user.username}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">{user.email}</div>
                        {user.phone && <div className="text-xs text-muted-foreground">{user.phone}</div>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(user.createdAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Select
                            value={user.role}
                            onValueChange={(value: "customer" | "staff" | "admin") =>
                              handleRoleChange(user.id, value)
                            }
                          >
                            <SelectTrigger className="w-[110px] h-8 text-xs border-[#16a34a]/20">
                              <Edit3 className="h-3 w-3 mr-1 text-[#16a34a]" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="customer">Customer</SelectItem>
                              <SelectItem value="staff">Staff</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(user.id)}
                            className={
                              user.status === "active"
                                ? "border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600 h-8 px-2"
                                : "border-[#16a34a]/20 hover:bg-[#e8f5e9] hover:border-[#16a34a]/40 text-[#16a34a] h-8 px-2"
                            }
                          >
                            {user.status === "active" ? (
                              <UserX className="h-3 w-3" />
                            ) : (
                              <UserCheck className="h-3 w-3" />
                            )}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setResetPasswordDialog(true)
                            }}
                            className="border-[#f97316]/20 hover:bg-[#fff7ed] hover:border-[#f97316]/40 text-[#f97316] h-8 px-2"
                          >
                            <Lock className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Reset Password Dialog */}
        <Dialog open={resetPasswordDialog} onOpenChange={setResetPasswordDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Set a new password for {selectedUser?.firstName} {selectedUser?.lastName}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleResetPassword} className="space-y-4 pt-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#f97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#c2410c]"
              >
                <Lock className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
