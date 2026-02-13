import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, Loader2, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

type ResetStep = 'requestOtp' | 'resetPassword';

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string } | undefined)?.message || fallback;
  }

  return fallback;
};

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<ResetStep>('requestOtp');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRequestLoading, setIsRequestLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleRequestOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsRequestLoading(true);

    try {
      await authAPI.requestPasswordResetOtp(email.trim());
      setMessage('OTP sent to your email. Enter it below to reset your password.');
      setStep('resetPassword');
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, 'Failed to send OTP. Please try again.'));
    } finally {
      setIsRequestLoading(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsResetLoading(true);

    try {
      await authAPI.resetPasswordWithOtp({
        email: email.trim(),
        otp: otp.trim(),
        newPassword
      });

      setMessage('Password changed successfully. Redirecting to login...');
      window.setTimeout(() => navigate('/login'), 1400);
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, 'Failed to reset password. Please check your OTP and try again.'));
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-blue-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader>
            <div className="mb-3 inline-flex items-center justify-center w-12 h-12 bg-cyan-600 rounded-xl">
              {step === 'requestOtp' ? <Mail className="h-6 w-6 text-white" /> : <KeyRound className="h-6 w-6 text-white" />}
            </div>
            <CardTitle>{step === 'requestOtp' ? 'Forgot Password' : 'Reset Password'}</CardTitle>
            <CardDescription>
              {step === 'requestOtp'
                ? 'Enter your email to receive an OTP code.'
                : 'Enter OTP and choose a new password.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert className="mb-4 border-cyan-200 bg-cyan-50 text-cyan-900">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {step === 'requestOtp' ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <Button type="submit" className="w-full h-11 bg-cyan-600 hover:bg-cyan-700" disabled={isRequestLoading}>
                  {isRequestLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      required
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      aria-label="Toggle new password visibility"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 bg-cyan-600 hover:bg-cyan-700" disabled={isResetLoading}>
                  {isResetLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('requestOtp');
                    setOtp('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                    setMessage('');
                  }}
                  className="w-full text-sm text-cyan-700 hover:text-cyan-900"
                >
                  Use another email
                </button>
              </form>
            )}
          </CardContent>

          <CardFooter>
            <p className="text-sm text-gray-600">
              Back to{' '}
              <Link to="/login" className="font-medium text-cyan-700 hover:text-cyan-900">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;