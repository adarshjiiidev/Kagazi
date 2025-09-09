'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SignOutButton } from './SignOutButton';
import { User, Shield, ShieldCheck } from 'lucide-react';

export function UserProfileCard() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-gray-700 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-700 rounded animate-pulse w-24" />
              <div className="h-3 bg-gray-700 rounded animate-pulse w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <Card className="bg-gray-900 border-gray-700 text-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <User className="mr-2 h-5 w-5" />
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={session.user.image || ''} alt={session.user.name || 'User'} />
            <AvatarFallback className="bg-gray-700 text-white">
              {session.user.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="font-medium">{session.user.name}</p>
            <p className="text-sm text-gray-400">{session.user.email}</p>
            <div className="flex items-center space-x-2">
              {session.user.emailVerified ? (
                <Badge variant="secondary" className="text-xs bg-green-900 text-green-100 hover:bg-green-900">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  <Shield className="mr-1 h-3 w-3" />
                  Unverified
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="pt-2">
          <SignOutButton variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white" />
        </div>
      </CardContent>
    </Card>
  );
}
