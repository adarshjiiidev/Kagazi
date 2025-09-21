"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useState, useEffect } from "react"
import { TradingChart } from "@/components/charts/TradingChart"
import { StockSelector } from "@/components/StockSelector"
import { MarketStatus } from "@/components/MarketStatus"
import { QuickStats } from "@/components/QuickStats"
import { OrderPanel } from "@/components/OrderPanel"

interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface QuoteData {
  symbol: string;
  displayName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketPreviousClose: number;
  regularMarketOpen: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  currency: string;
  marketState: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [selectedStock, setSelectedStock] = useState("RELIANCE.NS")
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOrderPanel, setShowOrderPanel] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      redirect("/auth/signin")
    }
  }, [session, status])

  // Redirect if email not verified
  useEffect(() => {
    if (session?.user && !session.user.emailVerified) {
      redirect("/auth/verify")
    }
  }, [session])

  const fetchStockData = async (symbol: string) => {
    try {
      setLoading(true)
      
      // Fetch quote data
      const quoteResponse = await fetch(`/api/market/quote?symbol=${encodeURIComponent(symbol)}`)
      const quoteResult = await quoteResponse.json()
      
      if (quoteResult.success) {
        setQuoteData(quoteResult.data.quote)
      }

      // Fetch historical data for chart with 5-minute intervals from 9:15 AM today
      const endDate = new Date()
      const startDate = new Date()
      
      // Set start date to 9:15 AM of the current day (Indian market opening time)
      startDate.setHours(9, 15, 0, 0) // 9:15 AM IST
      
      // If current time is before 9:15 AM today, use previous trading day
      if (endDate < startDate) {
        startDate.setDate(startDate.getDate() - 1)
        // Skip weekends - if it's Monday, go to Friday
        while (startDate.getDay() === 0 || startDate.getDay() === 6) {
          startDate.setDate(startDate.getDate() - 1)
        }
        startDate.setHours(9, 15, 0, 0)
      }
      
      const historyResponse = await fetch(
        `/api/market/quote?symbol=${encodeURIComponent(symbol)}&historical=true&period1=${startDate.toISOString().split('T')[0]}&period2=${endDate.toISOString().split('T')[0]}&interval=5m`
      )
      const historyResult = await historyResponse.json()
      
      if (historyResult.success && historyResult.data.historicalData) {
        console.log('Loaded historical data:', historyResult.data.historicalData.length, 'candles');
        
        // Debug: Log first few data points to check structure and timestamps
        const sampleData = historyResult.data.historicalData.slice(0, 5);
        console.log('Sample historical data:', sampleData.map(d => ({
          time: d.time,
          timestamp: typeof d.time === 'string' ? parseInt(d.time) : d.time,
          date: new Date((typeof d.time === 'string' ? parseInt(d.time) : d.time) * 1000).toISOString(),
          ohlc: { open: d.open, high: d.high, low: d.low, close: d.close }
        })));
        
        setChartData(historyResult.data.historicalData);
      } else {
        console.log('No historical data available, using empty array');
        setChartData([]);
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
      // Set empty data on error to allow chart to render
      setChartData([]);
      setQuoteData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStockData(selectedStock)
  }, [selectedStock])

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">TRADING DASHBOARD</h1>
          <MarketStatus />
        </div>
        
        <div className="flex items-center space-x-4">
          <StockSelector 
            selectedStock={selectedStock} 
            onStockChange={setSelectedStock} 
          />
          <button
            onClick={() => setShowOrderPanel(!showOrderPanel)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md font-medium transition-colors"
          >
            {showOrderPanel ? 'Hide Orders' : 'Place Order'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Chart Area */}
        <div className="flex-1 flex flex-col">
          {/* Quick Stats */}
          {quoteData && (
            <QuickStats quote={quoteData} />
          )}

          {/* Chart */}
          <div className="flex-1 p-4">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-white/60">Loading chart data...</p>
                </div>
              </div>
            ) : (
              <TradingChart
                symbol={selectedStock}
                data={chartData}
                quote={quoteData}
                height={600}
                showVolume={true}
                chartType="candlestick"
                className="h-full"
                enableRealTime={true}
                onDataUpdate={(newData) => {
                  // Optionally handle new real-time data
                  console.log('New candle data:', newData);
                }}
              />
            )}
          </div>
        </div>

        {/* Order Panel */}
        {showOrderPanel && (
          <div className="w-80 border-l border-white/10">
            <OrderPanel 
              symbol={selectedStock}
              quote={quoteData}
              onOrderPlaced={() => {
                // Optionally close panel after order
                // setShowOrderPanel(false)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
