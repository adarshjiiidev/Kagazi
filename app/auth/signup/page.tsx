"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from 'next-auth/react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Header } from "@/components/header"
import { Loader2, Chrome } from 'lucide-react'
import { Separator } from "@/components/ui/separator"

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    if (!acceptTerms) {
      setError("Please accept the terms and conditions")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/auth/verify?email=${encodeURIComponent(formData.email)}`)
      } else {
        setError(data.message || 'Registration failed. Please try again.')
      }
    } catch (error) {
      console.error('Registration error:', error)
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
              <CardTitle className="text-2xl font-bold text-white">CREATE ACCOUNT</CardTitle>
              <CardDescription className="text-white/60">
                Start your paper trading journey with a free account
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="bg-red-900/20 border-red-500/50 text-red-400">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-white font-medium">
                      FIRST NAME
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className="bg-black border-white/20 text-white placeholder:text-white/40 focus:border-white"
                      required
                      disabled={isLoading || isGoogleLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-white font-medium">
                      LAST NAME
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className="bg-black border-white/20 text-white placeholder:text-white/40 focus:border-white"
                      required
                      disabled={isLoading || isGoogleLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-medium">
                    EMAIL
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
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
                      placeholder="Create a strong password (min 6 chars)"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="bg-black border-white/20 text-white placeholder:text-white/40 focus:border-white pr-12"
                      required
                      minLength={6}
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white font-medium">
                    CONFIRM PASSWORD
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className="bg-black border-white/20 text-white placeholder:text-white/40 focus:border-white pr-12"
                      required
                      disabled={isLoading || isGoogleLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white hover:bg-white/10"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading || isGoogleLoading}
                    >
                      {showConfirmPassword ? "HIDE" : "SHOW"}
                    </Button>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                    className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-black mt-1"
                    disabled={isLoading || isGoogleLoading}
                  />
                  <Label htmlFor="terms" className="text-sm text-white/80 leading-relaxed">
                    I agree to the{" "}
                    <Link href="/terms" className="text-white hover:underline font-medium">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-white hover:underline font-medium">
                      Privacy Policy
                    </Link>
                  </Label>
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
                      CREATING ACCOUNT...
                    </>
                  ) : (
                    "CREATE ACCOUNT"
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
                      SIGNING UP WITH GOOGLE...
                    </>
                  ) : (
                    <>
                      <Chrome className="mr-2 h-4 w-4" />
                      CONTINUE WITH GOOGLE
                    </>
                  )}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-white/60">Already have an account? </span>
                  <Link href="/auth/signin" className="text-white hover:underline font-medium">
                    SIGN IN
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
