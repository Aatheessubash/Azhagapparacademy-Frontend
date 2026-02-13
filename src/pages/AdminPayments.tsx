/**
 * Admin Payments
 * Payment verification and management
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentAPI } from '../services/api';
import { resolveMediaUrl } from '@/lib/media';
import { formatINR } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  CreditCard,
  Loader2
} from 'lucide-react';

interface Payment {
  _id: string;
  userId: { name: string; email: string };
  courseId: { title: string };
  transactionId: string;
  amount: number;
  proofImage: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  notes?: string;
  rejectionReason?: string;
}

const AdminPayments: React.FC = () => {
  const navigate = useNavigate();
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verifyAction, setVerifyAction] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const response = await paymentAPI.getAll();
      setPayments(response.data.payments);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedPayment || !verifyAction) return;

    setIsSubmitting(true);
    try {
      await paymentAPI.verify(selectedPayment._id, {
        status: verifyAction === 'approve' ? 'approved' : 'rejected',
        notes,
        rejectionReason: verifyAction === 'reject' ? rejectionReason : undefined
      });
      
      setShowVerifyDialog(false);
      setSelectedPayment(null);
      setVerifyAction(null);
      setNotes('');
      setRejectionReason('');
      fetchPayments();
    } catch (error) {
      console.error('Failed to verify payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openVerifyDialog = (payment: Payment, action: 'approve' | 'reject') => {
    setSelectedPayment(payment);
    setVerifyAction(action);
    setShowVerifyDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  const filteredPayments = payments.filter(payment =>
    payment.userId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.userId.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.courseId.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.transactionId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingPayments = filteredPayments.filter(p => p.status === 'pending');
  const approvedPayments = filteredPayments.filter(p => p.status === 'approved');
  const rejectedPayments = filteredPayments.filter(p => p.status === 'rejected');

  const PaymentCard: React.FC<{ payment: Payment }> = ({ payment }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(payment.status)}
              <span className="text-sm text-gray-500">
                {new Date(payment.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500">Student</p>
                <p className="font-medium">{payment.userId.name}</p>
                <p className="text-sm text-gray-500">{payment.userId.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Course</p>
                <p className="font-medium">{payment.courseId.title}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Transaction ID</p>
                <p className="font-mono text-sm">{payment.transactionId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Amount</p>
                <p className="font-bold text-lg text-green-600">{formatINR(payment.amount)}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <a 
              href={resolveMediaUrl(payment.proofImage)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-24 h-24 bg-gray-100 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
            >
              <img 
                src={resolveMediaUrl(payment.proofImage)} 
                alt="Payment Proof" 
                className="w-full h-full object-cover"
              />
            </a>
            <span className="text-xs text-gray-500">Click to enlarge</span>
          </div>
        </div>

        {payment.status === 'pending' && (
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => openVerifyDialog(payment, 'approve')}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
              onClick={() => openVerifyDialog(payment, 'reject')}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </div>
        )}

        {payment.notes && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500">Notes</p>
            <p className="text-sm">{payment.notes}</p>
          </div>
        )}

        {payment.rejectionReason && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-red-500">Rejection Reason</p>
            <p className="text-sm text-red-600">{payment.rejectionReason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/admin')}>
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Payment Verification</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student, course, or transaction ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingPayments.length}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedPayments.length}</p>
                <p className="text-sm text-gray-500">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rejectedPayments.length}</p>
                <p className="text-sm text-gray-500">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending">
          <TabsList className="mb-6">
            <TabsTrigger value="pending">
              Pending ({pendingPayments.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approvedPayments.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedPayments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="space-y-4">
              {pendingPayments.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
                  <p className="text-gray-500">No pending payments to verify</p>
                </div>
              ) : (
                pendingPayments.map((payment) => (
                  <PaymentCard key={payment._id} payment={payment} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="approved">
            <div className="space-y-4">
              {approvedPayments.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No approved payments yet</p>
                </div>
              ) : (
                approvedPayments.map((payment) => (
                  <PaymentCard key={payment._id} payment={payment} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="rejected">
            <div className="space-y-4">
              {rejectedPayments.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No rejected payments</p>
                </div>
              ) : (
                rejectedPayments.map((payment) => (
                  <PaymentCard key={payment._id} payment={payment} />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
          </>
        )}
      </main>

      {/* Verify Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {verifyAction === 'approve' ? 'Approve Payment' : 'Reject Payment'}
            </DialogTitle>
            <DialogDescription>
              {verifyAction === 'approve' 
                ? 'Approve this payment and grant course access to the student.'
                : 'Reject this payment. The student will need to submit a new payment.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Student:</span>
                  <p className="font-medium">{selectedPayment?.userId.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Amount:</span>
                  <p className="font-medium">{formatINR(selectedPayment?.amount)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Course:</span>
                  <p className="font-medium">{selectedPayment?.courseId.title}</p>
                </div>
                <div>
                  <span className="text-gray-500">Transaction ID:</span>
                  <p className="font-medium">{selectedPayment?.transactionId}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this payment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {verifyAction === 'reject' && (
                <div>
                  <Label htmlFor="rejectionReason">Rejection Reason</Label>
                  <Textarea
                    id="rejectionReason"
                    placeholder="Explain why this payment is being rejected..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleVerify}
              disabled={isSubmitting || (verifyAction === 'reject' && !rejectionReason)}
              className={verifyAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {verifyAction === 'approve' ? 'Approve Payment' : 'Reject Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayments;
