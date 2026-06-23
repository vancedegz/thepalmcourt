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
import { getAllPayments, verifyPayment } from "@/app/actions/payments"
import { format } from "date-fns"
import { CheckCircle, XCircle, Eye, CreditCard, Clock, AlertTriangle } from "lucide-react"
import Image from "next/image"
import type { Payment, Booking, Court } from "@prisma/client"

type PaymentWithDetails = Payment & {
  booking: Booking & {
    court: Court
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
      phone: string | null
    }
  }
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [adminNotes, setAdminNotes] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const loadPayments = async (p: number) => {
    try {
      const data = await getAllPayments(p)
      setPayments(data.payments as PaymentWithDetails[])
      setTotalPages(data.totalPages)
      setPage(data.page)
    } catch (err) {
      console.error("Failed to load payments:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function run() {
      await loadPayments(1)
    }
    run()
  }, [])

  const handleVerify = async (paymentId: string, approved: boolean) => {
    try {
      await verifyPayment(paymentId, approved, adminNotes)
      setAdminNotes("")
      loadPayments(page)
    } catch (err) {
      console.error("Failed to verify payment:", err)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-[#16a34a] hover:bg-[#16a34a] text-white border-0"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>
      case "pending":
        return <Badge className="bg-[#f97316] hover:bg-[#f97316] text-white border-0"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case "rejected":
        return <Badge className="bg-red-500 hover:bg-red-500 text-white border-0"><AlertTriangle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading payments...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payments Management</h1>
            <p className="text-gray-600 mt-2">Verify and manage payment submissions</p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-lg border border-secondary/20">
              <CreditCard className="h-4 w-4 text-[#f97316]" />
              <span className="text-sm font-medium text-[#c2410c]">
                {payments.filter(p => p.status === "pending").length} Pending
              </span>
            </div>
          </div>
        </div>

        <Card className="border-2 border-primary/10 shadow-sm overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Booking Ref</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Court</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Screenshot</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.booking.referenceNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {payment.booking.user.firstName} {payment.booking.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payment.booking.user.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{payment.booking.court.name}</TableCell>
                    <TableCell>
                      {format(new Date(payment.booking.date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">₱{payment.amount}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      {payment.screenshotUrl ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="border-primary/20 hover:bg-primary/5 hover:border-primary/40">
                              <Eye className="h-4 w-4 mr-2 text-[#16a34a]" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg overflow-auto">
                            <DialogHeader>
                              <DialogTitle>Payment Screenshot</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Image
                                src={payment.screenshotUrl}
                                alt="Payment screenshot"
                                width={600}
                                height={400}
                                className="max-w-full max-h-[60vh] object-contain rounded-lg border"
                              />
                              <a
                                href={payment.screenshotUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline break-all block"
                              >
                                {payment.screenshotUrl}
                              </a>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not uploaded</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {payment.status === "pending" && payment.screenshotUrl && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              Verify
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg overflow-auto">
                            <DialogHeader>
                              <DialogTitle>Verify Payment</DialogTitle>
                              <DialogDescription>
                                Review and approve or reject this payment
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Screenshot</Label>
                                <Image
                                  src={payment.screenshotUrl}
                                  alt="Payment screenshot"
                                  width={500}
                                  height={400}
                                  className="max-w-full max-h-[50vh] object-contain rounded-lg border mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="notes">Admin Notes (Optional)</Label>
                                <Input
                                  id="notes"
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Add notes about this payment"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  className="flex-1 bg-green-500 hover:bg-green-600"
                                  onClick={() => handleVerify(payment.id, true)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  className="flex-1"
                                  onClick={() => handleVerify(payment.id, false)}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => loadPayments(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => loadPayments(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
