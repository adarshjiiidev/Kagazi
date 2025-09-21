"use client"

import { useState } from "react"
import { TradingChart } from "@/components/charts/TradingChart"
import { Button } from "@/components/ui/button"

// Mock data for testing
const mockChartData = [
  { time: "2024-01-01", open: 2800, high: 2850, low: 2780, close: 2830, volume: 1000000 },
  { time: "2024-01-02", open: 2830, high: 2880, low: 2820, close: 2870, volume: 1200000 },
  { time: "2024-01-03", open: 2870, high: 2900, low: 2840, close: 2860, volume: 950000 },
  { time: "2024-01-04", open: 2860, high: 2890, low: 2830, close: 2875, volume: 1100000 },
  { time: "2024-01-05", open: 2875, high: 2920, low: 2860, close: 2910, volume: 1300000 },
]

const mockQuote = {
  symbol: "RELIANCE.NS",
  displayName: "Reliance Industries",
  regularMarketPrice: 2910,
  regularMarketChange: 35,
  regularMarketChangePercent: 1.22,
  regularMarketPreviousClose: 2875,
  regularMarketOpen: 2880,
  regularMarketDayHigh: 2920,
  regularMarketDayLow: 2860,
  regularMarketVolume: 1300000,
  currency: "INR",
  marketState: "REGULAR"
}

export default function TestDashboard() {
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick')

  return (
    <div className="h-screen bg-black text-white">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">CANDLESTICK CHART TEST</h1>
          <div className="flex space-x-2">
            <Button
              variant={chartType === 'candlestick' ? 'default' : 'outline'}
              onClick={() => setChartType('candlestick')}
              className="bg-white text-black hover:bg-white/90"
            >
              Candlestick
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              onClick={() => setChartType('line')}
              className="bg-white text-black hover:bg-white/90"
            >
              Line
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-4 h-full">
        <div className="h-96">
          <TradingChart
            symbol="RELIANCE.NS"
            data={mockChartData}
            quote={mockQuote}
            height={400}
            showVolume={true}
            chartType={chartType}
            className="w-full h-full"
          />
        </div>
        
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-bold">Chart Features:</h2>
          <ul className="list-disc list-inside space-y-2 text-white/80">
            <li>Interactive candlestick chart using lightweight-charts library</li>
            <li>Volume bars at the bottom</li>
            <li>Switch between candlestick and line chart types</li>
            <li>Responsive design with proper scaling</li>
            <li>Time and price axes with proper formatting</li>
            <li>Hover interactions and crosshair</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
