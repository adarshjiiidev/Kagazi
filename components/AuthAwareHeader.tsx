'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, BarChart3 } from 'lucide-react';

interface AuthAwareHeaderProps {
  scrollY: number;
}

export function AuthAwareHeader({ scrollY }: AuthAwareHeaderProps) {
  const { data: session, status } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrollY > 50 ? "bg-black/90 backdrop-blur-sm border-b border-white/10" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-wider hover:text-gray-300 transition-colors">
            KAGAZI
          </Link>
          
          <nav className="hidden md:flex space-x-8">
            <Link href="#features" className="hover:text-gray-300 transition-colors">
              FEATURES
            </Link>
            <Link href="#about" className="hover:text-gray-300 transition-colors">
              ABOUT
            </Link>
            <Link href="#testimonials" className="hover:text-gray-300 transition-colors">
              REVIEWS
            </Link>
            <Link href="#contact" className="hover:text-gray-300 transition-colors">
              CONTACT
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-gray-600 animate-pulse" />
            ) : session ? (
              // Authenticated user
              <div className="flex items-center space-x-3">
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white text-white hover:bg-white hover:text-black bg-transparent"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    DASHBOARD
                  </Button>
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user.image || ''} alt={session.user.name || 'User'} />
                        <AvatarFallback className="bg-white text-black">
                          {session.user.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{session.user.name}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {session.user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              // Non-authenticated user
              <div className="flex space-x-4">
                <Link href="/auth/login">
                  <Button
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-black bg-transparent"
                  >
                    LOGIN
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="bg-white text-black hover:bg-gray-200">START TRADING</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
