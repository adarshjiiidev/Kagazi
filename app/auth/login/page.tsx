"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to signin page since that's where our auth logic is
    router.push('/auth/signin')
  }, [router])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
      </div>
    </div>
  )
}
