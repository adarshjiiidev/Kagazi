"use client"

import { useState, useEffect } from "react"
import { Clock, Circle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface MarketStatusData {
  isOpen: boolean
  state: string
  sessionInfo: {
    isOpen: boolean
    nextSession: string
    timeToNextSession: string
  }
}

export function MarketStatus() {
  const [marketStatus, setMarketStatus] = useState<MarketStatusData | null>(null)

  const fetchMarketStatus = async () => {
    try {
      const response = await fetch('/api/market/data?type=indices')
      const data = await response.json()

      if (data.success) {
        setMarketStatus(data.data.marketStatus)
      }
    } catch (error) {
      console.error('Market status fetch error:', error)
    }
  }

  useEffect(() => {
    fetchMarketStatus()
    
    // Update every minute
    const interval = setInterval(fetchMarketStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  if (!marketStatus) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" />
        <span className="text-white/60 text-sm">Loading status...</span>
      </div>
    )
  }

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'REGULAR':
        return 'text-green-400'
      case 'PRE':
      case 'POST':
        return 'text-yellow-400'
      default:
        return 'text-red-400'
    }
  }

  const getStatusText = (state: string) => {
    switch (state) {
      case 'REGULAR':
        return 'Market Open'
      case 'PRE':
        return 'Pre-Market'
      case 'POST':
        return 'After Hours'
      default:
        return 'Market Closed'
    }
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        <Circle className={`w-2 h-2 fill-current ${getStatusColor(marketStatus.state)}`} />
        <span className={`text-sm font-medium ${getStatusColor(marketStatus.state)}`}>
          {getStatusText(marketStatus.state)}
        </span>
      </div>
      
      <div className="flex items-center space-x-1 text-white/60">
        <Clock className="w-3 h-3" />
        <span className="text-xs">
          {marketStatus.sessionInfo.nextSession}: {marketStatus.sessionInfo.timeToNextSession}
        </span>
      </div>
    </div>
  )
}
