"use client"

import Link from "next/link"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DashboardHeader() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("kagazi_token")
    router.push("/auth/login")
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-sm border-b border-white/10">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-8">
          <Link href="/dashboard" className="text-xl font-bold text-white">
            KAGAZI
          </Link>

          {/* Search */}
          <div className="hidden md:block">
            <Input
              placeholder="SEARCH INSTRUMENTS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 bg-black border-white/20 text-white placeholder:text-white/40 focus:border-white"
            />
          </div>
        </div>

        <div className="flex items-center space-x-6">
          {/* Account Balance */}
          <div className="hidden sm:flex items-center space-x-4 text-sm font-mono">
            <div className="text-white/60">BALANCE:</div>
            <div className="text-white">$100,000.00</div>
          </div>

          {/* P&L */}
          <div className="hidden sm:flex items-center space-x-4 text-sm font-mono">
            <div className="text-white/60">P&L:</div>
            <div className="text-green-400">+$2,450.00</div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-xs text-white/60 font-mono">LIVE</span>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-white hover:bg-white/10">
                MENU
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-black border-white/20" align="end">
              <div className="p-3 border-b border-white/10">
                <p className="font-medium text-white">JOHN DOE</p>
                <p className="text-sm text-white/60">demo@kagazi.com</p>
              </div>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/settings")}
                className="text-white hover:bg-white/10"
              >
                SETTINGS
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={handleLogout} className="text-white hover:bg-white/10">
                LOGOUT
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
