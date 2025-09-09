'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface SignOutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function SignOutButton({ 
  variant = 'outline', 
  size = 'default', 
  className = '' 
}: SignOutButtonProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleSignOut}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign out
    </Button>
  );
}
