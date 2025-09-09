"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"

// Mock chart data
const generateChartData = (days: number) => {
  const data = []
  let value = 100000
  for (let i = 0; i < days; i++) {
    value += (Math.random() - 0.5) * 1000
    data.push({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      value: Math.round(value),
    })
  }
  return data
}

export function PerformanceChart() {
  const [timeframe, setTimeframe] = useState("7D")
  const timeframes = ["1D", "7D", "1M", "3M", "1Y"]

  const chartData = generateChartData(timeframe === "1D" ? 1 : timeframe === "7D" ? 7 : 30)
  const currentValue = chartData[chartData.length - 1]?.value || 100000
  const previousValue = chartData[0]?.value || 100000
  const change = currentValue - previousValue
  const changePercent = ((change / previousValue) * 100).toFixed(2)

  return (
    <Card className="bg-black border-white/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white text-lg font-bold">PORTFOLIO PERFORMANCE</CardTitle>
        <div className="flex space-x-1">
          {timeframes.map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeframe(tf)}
              className={
                timeframe === tf
                  ? "bg-white text-black hover:bg-white/90"
                  : "border-white/20 text-white hover:bg-white/10"
              }
            >
              {tf}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Performance Summary */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold font-mono text-white">${currentValue.toLocaleString()}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`text-lg font-mono font-bold ${change >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {change >= 0 ? "+" : ""}${Math.abs(change).toLocaleString()}
                </span>
                <span className={`text-sm ${change >= 0 ? "text-green-400" : "text-red-400"}`}>
                  ({change >= 0 ? "+" : ""}
                  {changePercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Simple Chart Placeholder */}
          <div className="h-64 bg-white/5 border border-white/10 rounded flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold text-white/20">CHART</div>
              <p className="text-sm text-white/60">PORTFOLIO PERFORMANCE VISUALIZATION</p>
              <p className="text-xs text-white/40 font-mono">TRADINGVIEW INTEGRATION COMING SOON</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
