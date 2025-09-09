"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to signup page since that's where our auth logic is
    router.push('/auth/signup')
  }, [router])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-bold mb-4">KAGAZI</div>
        <div className="text-white/60">Redirecting to sign up...</div>
      </div>
    </div>
  )
}
