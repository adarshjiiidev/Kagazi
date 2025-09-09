'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Shield, Clock } from 'lucide-react';

interface OTPVerificationProps {
  email: string;
  onSuccess?: () => void;
}

export function OTPVerification({ email, onSuccess }: OTPVerificationProps) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  const router = useRouter();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push('/auth/signin?verified=true');
          }
        }, 2000);
      } else {
        setError(data.message || 'Verification failed. Please try again.');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setCountdown(60); // 1 minute countdown
        setOtp(''); // Clear OTP input
      } else {
        setError(data.message || 'Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  const isOTPComplete = otp.length === 6;

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">KAGAZI</h1>
        <p className="text-white/60 text-lg">PAPER TRADING PLATFORM</p>
      </div>
      
      <Card className="bg-black border-white/20">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white/10 rounded-full">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white">VERIFY YOUR EMAIL</CardTitle>
          <CardDescription className="text-white/60">
            We've sent a 6-digit verification code to
            <br />
            <strong className="text-white">{email}</strong>
          </CardDescription>
        </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive" className="bg-red-900/20 border-red-500/50 text-red-400">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="bg-green-900/20 border-green-500/50 text-green-400">
            <Mail className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-center block text-white font-medium">
              ENTER VERIFICATION CODE
            </Label>
            <Input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="123456"
              value={otp}
              onChange={handleChange}
              className="text-center text-2xl font-mono tracking-widest bg-black border-white/20 text-white placeholder:text-white/40 focus:border-white"
              maxLength={6}
              required
              disabled={isLoading}
              autoComplete="one-time-code"
            />
            <p className="text-xs text-white/60 text-center">
              Enter the 6-digit code sent to your email
            </p>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-white text-black hover:bg-white/90 font-semibold py-3" 
            disabled={!isOTPComplete || isLoading || isResending}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                VERIFYING...
              </>
            ) : (
              'VERIFY EMAIL'
            )}
          </Button>
        </form>
        
        <div className="text-center space-y-4">
          <p className="text-sm text-white/60">
            Didn't receive the code?
          </p>
          
          <Button
            variant="link"
            type="button"
            className="p-0 h-auto font-normal text-white hover:text-white/80"
            onClick={handleResendOTP}
            disabled={isLoading || isResending || countdown > 0}
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                SENDING...
              </>
            ) : countdown > 0 ? (
              <>
                <Clock className="mr-2 h-4 w-4" />
                RESEND IN {countdown}S
              </>
            ) : (
              'RESEND VERIFICATION CODE'
            )}
          </Button>
          
          <div className="pt-4">
            <Button
              variant="outline"
              type="button"
              className="w-full border-white/20 text-white hover:bg-white/10 font-semibold"
              onClick={() => router.push('/auth/signup')}
              disabled={isLoading || isResending}
            >
              BACK TO SIGNUP
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
