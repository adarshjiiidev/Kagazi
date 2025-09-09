"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "DASHBOARD", href: "/dashboard" },
  { name: "MARKETS", href: "/dashboard/markets" },
  { name: "TRADE", href: "/dashboard/trade" },
  { name: "PORTFOLIO", href: "/dashboard/portfolio" },
  { name: "ORDERS", href: "/dashboard/orders" },
  { name: "HISTORY", href: "/dashboard/history" },
  { name: "SETTINGS", href: "/dashboard/settings" },
]

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div
      className={cn(
        "bg-black border-r border-white/10 transition-all duration-300 fixed left-0 top-16 h-full z-30",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex flex-col h-full">
        <div className="p-6">
          <h2 className="text-white font-bold text-lg mb-8">NAVIGATION</h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 pb-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "block px-4 py-3 text-sm font-medium transition-colors border-l-2",
                      isActive
                        ? "text-white border-white bg-white/5"
                        : "text-white/70 border-transparent hover:text-white hover:border-white/30",
                    )}
                  >
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <p className="text-white/40 text-xs font-mono">KAGAZI v1.0</p>
        </div>
      </div>
    </div>
  )
}
