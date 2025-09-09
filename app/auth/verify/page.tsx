import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { OTPVerification } from '@/components/auth/OTPVerification';

interface VerifyPageProps {
  searchParams: {
    email?: string;
  };
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const awaitedSearchParams = await searchParams;
  const email = awaitedSearchParams.email;

  // Redirect to signup if no email provided
  if (!email) {
    redirect('/auth/signup');
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <Suspense fallback={
          <div className="text-center">
            <div className="text-2xl font-bold mb-4">KAGAZI</div>
            <div className="text-white/60">Loading...</div>
          </div>
        }>
          <OTPVerification email={decodeURIComponent(email)} />
        </Suspense>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Verify Email | Kagazi',
  description: 'Verify your email address to complete registration',
};
