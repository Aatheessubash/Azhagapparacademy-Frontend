/**
 * Payment Page
 * QR code payment and proof upload
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { courseAPI, paymentAPI } from '../services/api';
import { formatINR } from '@/lib/currency';
import MediaImage from '@/components/MediaImage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  QrCode,
  CreditCard,
  Loader2,
  Copy,
  Check,
  Smartphone
} from 'lucide-react';

interface Course {
  _id: string;
  title: string;
  price: number;
  isFree: boolean;
  qrCodeImage?: string;
  paymentUpiId?: string;
  paymentReceiverName?: string;
}

const Payment: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedUpiId, setCopiedUpiId] = useState(false);
  const [isLaunchingUpi, setIsLaunchingUpi] = useState(false);

  const fetchCourse = useCallback(async () => {
    if (!courseId) return;

    try {
      setIsLoading(true);
      const response = await courseAPI.getById(courseId!);
      setCourse(response.data.course);

      // If course is free or already unlocked, skip payment flow
      const c = response.data.course;
      if (c.isFree || c.price === 0 || c.hasAccess || c.paymentStatus === 'approved' || c.paymentStatus === 'free') {
        navigate(`/course/${courseId}`);
      }
    } catch (error) {
      console.error('Failed to fetch course:', error);
      setError('Failed to load course information');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, navigate]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const buildUpiQueryString = useCallback((selectedCourse: Course | null) => {
    const upiId = selectedCourse?.paymentUpiId?.trim();
    const amount = Number(selectedCourse?.price);

    if (!selectedCourse || !upiId || !Number.isFinite(amount) || amount <= 0) {
      return null;
    }

    // Keep up to 2 decimals, but avoid sending unnecessary trailing ".00" in UPI deep links.
    const roundedAmount = Math.round(amount * 100) / 100;
    const upiAmount =
      Number.isInteger(roundedAmount)
        ? roundedAmount.toString()
        : roundedAmount.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');

    const payeeName =
      selectedCourse.paymentReceiverName?.trim() ||
      selectedCourse.title?.trim() ||
      'Course Payment';
    const safePayeeName = payeeName.slice(0, 60);
    const note = `${selectedCourse.title} course payment`.trim().slice(0, 80) || 'Course payment';

    // Build URI manually so spaces are encoded as %20 (not +), which some UPI handlers show better.
    const params: Array<[string, string]> = [
      ['pa', upiId],
      ['pn', safePayeeName],
      ['am', upiAmount],
      ['cu', 'INR'],
      ['tn', note]
    ];

    return params
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
  }, []);

  const copyUpiId = () => {
    const upiId = course?.paymentUpiId?.trim();
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopiedUpiId(true);
    setTimeout(() => setCopiedUpiId(false), 2000);
  };

  const openGPay = () => {
    setError('');
    const query = buildUpiQueryString(course);
    if (!query) {
      setError('GPay UPI details are not configured correctly. Please scan the QR code to pay.');
      return;
    }

    const upiLink = `upi://pay?${query}`;
    const gpayLink = `gpay://upi/pay?${query}`;
    const androidIntentLink =
      `intent://upi/pay?${query}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;

    const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    const isAndroid = /android/i.test(navigator.userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

    setIsLaunchingUpi(true);

    if (isAndroid) {
      window.location.href = androidIntentLink;
      window.setTimeout(() => {
        setIsLaunchingUpi(false);
      }, 1500);
      return;
    }

    if (isIOS) {
      window.location.href = gpayLink;
      window.setTimeout(() => {
        // Fallback only if app did not take focus.
        if (!document.hidden) {
          window.location.href = upiLink;
        }
        setIsLaunchingUpi(false);
      }, 1200);
      return;
    }

    if (isMobile) {
      window.location.href = upiLink;
      window.setTimeout(() => {
        setIsLaunchingUpi(false);
      }, 1200);
      return;
    }

    window.location.href = upiLink;
    window.setTimeout(() => {
      setIsLaunchingUpi(false);
    }, 1000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      setProofImage(file);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!transactionId.trim()) {
      setError('Please enter the transaction ID');
      return;
    }

    if (!proofImage) {
      setError('Please upload payment proof');
      return;
    }

    setIsSubmitting(true);

    try {
      await paymentAPI.submit({
        courseId: courseId!,
        transactionId: transactionId.trim(),
        amount: course?.price
      }, proofImage);

      setSuccess(true);
    } catch (err: unknown) {
      if (axios.isAxiosError<{ message?: string }>(err)) {
        setError(err.response?.data?.message || 'Failed to submit payment');
      } else {
        setError('Failed to submit payment');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTransactionId = () => {
    navigator.clipboard.writeText(transactionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Your payment proof has been submitted successfully. Our team will verify it shortly.
            </p>
            <div className="space-y-3">
              <Button className="w-full" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate(`/course/${courseId}`)}>
                Back to Course
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Payment</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Complete Your Purchase</h2>
          <p className="text-gray-600 mt-2">Scan the QR code and upload your payment proof</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* QR Code Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Scan QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* QR Code Display */}
              <div className="flex justify-center">
                <MediaImage
                  src={course?.qrCodeImage}
                  alt="Payment QR Code"
                  className="w-64 h-64 object-contain border rounded-lg bg-white"
                  fallback={
                  <div className="w-64 h-64 bg-gray-100 flex items-center justify-center rounded-lg border-2 border-dashed">
                    <div className="text-center">
                      <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">QR Code not available</p>
                    </div>
                  </div>
                  }
                />
              </div>

              <Separator />

              {/* Payment Details */}
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <span className="text-gray-600">Course</span>
                  <span className="font-medium text-right max-w-[60%]">{course?.title}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <span className="text-gray-600">Amount to Pay</span>
                  <span className="text-2xl font-bold text-green-600">{formatINR(course?.price)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  type="button"
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700"
                  disabled={
                    isLaunchingUpi ||
                    !course?.paymentUpiId ||
                    !Number.isFinite(Number(course?.price)) ||
                    Number(course?.price) <= 0
                  }
                  onClick={openGPay}
                >
                  {isLaunchingUpi ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Opening GPay...
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4 mr-2" />
                      Open in GPay
                    </>
                  )}
                </Button>
                {course?.paymentUpiId ? (
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 bg-white">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">UPI ID</p>
                      <p className="text-sm font-medium truncate">{course.paymentUpiId.trim()}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={copyUpiId}>
                      {copiedUpiId ? (
                        <>
                          <Check className="w-4 h-4 mr-1 text-green-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-orange-600 text-center font-medium">
                    UPI ID is not configured for this course. Please pay by scanning QR code.
                  </p>
                )}
              </div>

              <div className="text-sm text-gray-500 text-center">
                <p>Scan the QR code with your payment app</p>
                <p className="mt-1">After payment, enter the transaction ID below</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Proof Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Payment Proof
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Transaction ID */}
                <div className="space-y-2">
                  <Label htmlFor="transactionId">
                    Transaction ID <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="transactionId"
                      placeholder="Enter transaction ID from your payment"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="pr-10"
                    />
                    {transactionId && (
                      <button
                        type="button"
                        onClick={copyTransactionId}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Enter the transaction/reference number from your payment receipt
                  </p>
                </div>

                {/* Payment Proof Upload */}
                <div className="space-y-2">
                  <Label>
                    Payment Proof <span className="text-red-500">*</span>
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                    {previewUrl ? (
                      <div className="relative">
                        <img 
                          src={previewUrl} 
                          alt="Payment Proof Preview" 
                          className="max-h-48 mx-auto rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (previewUrl) {
                              URL.revokeObjectURL(previewUrl);
                            }
                            setProofImage(null);
                            setPreviewUrl(null);
                          }}
                          aria-label="Remove uploaded proof"
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          x
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 mb-1">
                          Click to upload screenshot or receipt
                        </p>
                        <p className="text-xs text-gray-400">
                          PNG, JPG up to 10MB
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-700">
                      <p className="font-medium mb-1">Important:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Make sure the transaction ID is clearly visible</li>
                        <li>Upload a clear screenshot of your payment</li>
                        <li>Your course will be unlocked after admin verification</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-12"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Submit Payment Proof
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Payment;
