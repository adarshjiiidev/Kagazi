"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn, getSession } from 'next-auth/react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Header } from "@/components/header"
import { Loader2, Chrome } from 'lucide-react'
import { Separator } from "@/components/ui/separator"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          setError('Invalid email or password')
        } else if (result.error.includes('verify')) {
          setError('Please verify your email before signing in')
        } else {
          setError(result.error)
        }
      } else if (result?.ok) {
        // Refresh session and redirect
        await getSession()
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setError('')
    
    try {
      await signIn('google', {
        callbackUrl: '/dashboard'
      })
    } catch (error) {
      console.error('Google sign-in error:', error)
      setError('Failed to sign in with Google. Please try again.')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <div className="pt-24 pb-16 flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
          </div>

          <Card className="bg-black border-white/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">SIGN IN</CardTitle>
              <CardDescription className="text-white/60">
                Enter your credentials to access your trading account
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="bg-red-900/20 border-red-500/50 text-red-400">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-medium">
                    EMAIL
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-black border-white/20 text-white placeholder:text-white/40 focus:border-white"
                    required
                    disabled={isLoading || isGoogleLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white font-medium">
                    PASSWORD
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-black border-white/20 text-white placeholder:text-white/40 focus:border-white pr-12"
                      required
                      disabled={isLoading || isGoogleLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white hover:bg-white/10"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading || isGoogleLoading}
                    >
                      {showPassword ? "HIDE" : "SHOW"}
                    </Button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-6">
                <br />
                <Button
              
                  type="submit"
                  className="w-full bg-white text-black hover:bg-white/90 font-semibold py-3"
                  disabled={isLoading || isGoogleLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      SIGNING IN...
                    </>
                  ) : (
                    "SIGN IN"
                  )}
                
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full bg-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-black px-2 text-white/60">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10 font-semibold py-3"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading || isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      SIGNING IN WITH GOOGLE...
                    </>
                  ) : (
                    <>
                      <Chrome className="mr-2 h-4 w-4" />
                      CONTINUE WITH GOOGLE
                    </>
                  )}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-white/60">Don't have an account? </span>
                  <Link href="/auth/signup" className="text-white hover:underline font-medium">
                    SIGN UP
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
