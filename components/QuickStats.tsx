"use client"

import { TrendingUp, TrendingDown, BarChart3, Volume2 } from "lucide-react"

interface QuickStatsProps {
  quote: {
    symbol: string
    displayName: string
    regularMarketPrice: number
    regularMarketChange: number
    regularMarketChangePercent: number
    regularMarketOpen: number
    regularMarketDayHigh: number
    regularMarketDayLow: number
    regularMarketVolume: number
    regularMarketPreviousClose: number
    currency: string
  }
}

export function QuickStats({ quote }: QuickStatsProps) {
  const formatCurrency = (amount: number) => {
    if (quote.currency === 'INR') {
      return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const formatVolume = (volume: number) => {
    if (volume >= 10000000) {
      return `${(volume / 10000000).toFixed(1)}Cr`
    } else if (volume >= 100000) {
      return `${(volume / 100000).toFixed(1)}L`
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`
    }
    return volume.toString()
  }

  const isPositive = quote.regularMarketChange >= 0

  return (
    <div className="border-b border-white/10 p-4 bg-black">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <h2 className="text-2xl font-bold font-mono text-white">
                {quote.symbol.replace('.NS', '').replace('.BO', '')}
              </h2>
              <div className="text-sm text-white/60">{quote.displayName}</div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-3xl font-bold font-mono text-white">
                {formatCurrency(quote.regularMarketPrice)}
              </div>
              <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
                <div className="text-lg font-mono font-bold">
                  {isPositive ? '+' : ''}{formatCurrency(quote.regularMarketChange)}
                </div>
                <div className="text-sm">
                  ({isPositive ? '+' : ''}{quote.regularMarketChangePercent.toFixed(2)}%)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="flex items-center space-x-2 mb-1">
            <BarChart3 className="w-4 h-4 text-white/60" />
            <div className="text-xs text-white/60">Open</div>
          </div>
          <div className="font-mono text-white font-bold">
            {formatCurrency(quote.regularMarketOpen)}
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="flex items-center space-x-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <div className="text-xs text-white/60">High</div>
          </div>
          <div className="font-mono text-white font-bold">
            {formatCurrency(quote.regularMarketDayHigh)}
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="flex items-center space-x-2 mb-1">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <div className="text-xs text-white/60">Low</div>
          </div>
          <div className="font-mono text-white font-bold">
            {formatCurrency(quote.regularMarketDayLow)}
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="flex items-center space-x-2 mb-1">
            <BarChart3 className="w-4 h-4 text-white/60" />
            <div className="text-xs text-white/60">Prev Close</div>
          </div>
          <div className="font-mono text-white font-bold">
            {formatCurrency(quote.regularMarketPreviousClose)}
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="flex items-center space-x-2 mb-1">
            <Volume2 className="w-4 h-4 text-blue-400" />
            <div className="text-xs text-white/60">Volume</div>
          </div>
          <div className="font-mono text-white font-bold">
            {formatVolume(quote.regularMarketVolume)}
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="flex items-center space-x-2 mb-1">
            <BarChart3 className="w-4 h-4 text-white/60" />
            <div className="text-xs text-white/60">Day Range</div>
          </div>
          <div className="font-mono text-white text-sm">
            {formatCurrency(quote.regularMarketDayLow)} - {formatCurrency(quote.regularMarketDayHigh)}
          </div>
        </div>
      </div>
    </div>
  )
}
