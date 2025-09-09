import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

interface AuthErrorPageProps {
  searchParams: {
    error?: string;
  };
}

const errorMessages: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The verification token has expired or has already been used.',
  Default: 'An unexpected error occurred during authentication.',
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const awaitedSearchParams = await searchParams;
  const error = awaitedSearchParams.error || 'Default';
  const errorMessage = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Authentication Error</CardTitle>
            <CardDescription>
              Something went wrong during the authentication process.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
            
            <div className="flex flex-col space-y-2">
              <Button asChild>
                <Link href="/auth/signin">
                  Try Again
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">
                  Go to Home
                </Link>
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              If you continue to experience issues, please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Authentication Error | Kagazi',
  description: 'An error occurred during authentication',
};
