"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface OrderPanelProps {
  symbol: string
  quote: {
    regularMarketPrice: number
    currency: string
  } | null
  onOrderPlaced?: () => void
}

interface Portfolio {
  cash: number
  totalValue: number
}

export function OrderPanel({ symbol, quote, onOrderPlaced }: OrderPanelProps) {
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY')
  const [orderMode, setOrderMode] = useState<'MARKET' | 'LIMIT'>('MARKET')
  const [quantity, setQuantity] = useState('')
  const [limitPrice, setLimitPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)

  const fetchPortfolio = async () => {
    try {
      const response = await fetch('/api/trading/portfolio')
      const data = await response.json()
      
      if (data.success) {
        setPortfolio(data.data.portfolio)
      }
    } catch (error) {
      console.error('Portfolio fetch error:', error)
    }
  }

  useEffect(() => {
    fetchPortfolio()
  }, [])

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const calculateOrderValue = () => {
    const qty = parseInt(quantity) || 0
    const price = orderMode === 'MARKET' 
      ? (quote?.regularMarketPrice || 0)
      : (parseFloat(limitPrice) || 0)
    return qty * price
  }

  const calculateCharges = (orderValue: number) => {
    // Simplified charge calculation
    const brokerage = Math.min(orderValue * 0.0003, 20) // 0.03% or ₹20 max
    const stt = orderType === 'SELL' ? orderValue * 0.001 : 0 // 0.1% on sell
    const exchangeCharges = orderValue * 0.0000345
    const gst = (brokerage + exchangeCharges) * 0.18
    const total = brokerage + stt + exchangeCharges + gst
    return total
  }

  const handlePlaceOrder = async () => {
    if (!quote || !quantity) {
      toast.error('Please enter quantity')
      return
    }

    const qty = parseInt(quantity)
    if (qty <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }

    if (orderMode === 'LIMIT' && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      toast.error('Please enter valid limit price')
      return
    }

    const orderValue = calculateOrderValue()
    const charges = calculateCharges(orderValue)
    const totalCost = orderType === 'BUY' ? orderValue + charges : orderValue - charges

    if (orderType === 'BUY' && portfolio && totalCost > portfolio.cash) {
      toast.error('Insufficient funds')
      return
    }

    try {
      setLoading(true)
      
      const orderData = {
        symbol,
        type: orderType,
        orderType: orderMode,
        quantity: qty,
        price: quote.regularMarketPrice,
        ...(orderMode === 'LIMIT' && { limitPrice: parseFloat(limitPrice) })
      }

      const response = await fetch('/api/trading/place-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        setQuantity('')
        setLimitPrice('')
        fetchPortfolio() // Refresh portfolio
        onOrderPlaced?.()
      } else {
        toast.error(result.message || 'Order failed')
      }
    } catch (error) {
      console.error('Order placement error:', error)
      toast.error('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const orderValue = calculateOrderValue()
  const charges = calculateCharges(orderValue)
  const totalCost = orderType === 'BUY' ? orderValue + charges : orderValue - charges

  return (
    <div className="h-full bg-black border-l border-white/10">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-bold text-white flex items-center">
          <ShoppingCart className="w-5 h-5 mr-2" />
          Place Order
        </h2>
        <div className="text-sm text-white/60 mt-1">
          {symbol.replace('.NS', '').replace('.BO', '')}
          {quote && (
            <span className="ml-2 font-mono">
              @ {formatCurrency(quote.regularMarketPrice)}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Buy/Sell Tabs */}
        <Tabs value={orderType} onValueChange={(value) => setOrderType(value as 'BUY' | 'SELL')}>
          <TabsList className="grid w-full grid-cols-2 bg-white/10">
            <TabsTrigger 
              value="BUY" 
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-white/60"
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              BUY
            </TabsTrigger>
            <TabsTrigger 
              value="SELL"
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-white/60"
            >
              <TrendingDown className="w-4 h-4 mr-1" />
              SELL
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Order Mode */}
        <div className="space-y-2">
          <Label className="text-white/80">Order Type</Label>
          <Tabs value={orderMode} onValueChange={(value) => setOrderMode(value as 'MARKET' | 'LIMIT')}>
            <TabsList className="grid w-full grid-cols-2 bg-white/10">
              <TabsTrigger 
                value="MARKET"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-white/60"
              >
                Market
              </TabsTrigger>
              <TabsTrigger 
                value="LIMIT"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-white/60"
              >
                Limit
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <Label className="text-white/80">Quantity</Label>
          <Input
            type="number"
            placeholder="Enter quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="bg-white/5 border-white/20 text-white placeholder-white/40"
            min="1"
            step="1"
          />
        </div>

        {/* Limit Price */}
        {orderMode === 'LIMIT' && (
          <div className="space-y-2">
            <Label className="text-white/80">Limit Price</Label>
            <Input
              type="number"
              placeholder="Enter limit price"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="bg-white/5 border-white/20 text-white placeholder-white/40"
              min="0.01"
              step="0.01"
            />
          </div>
        )}

        {/* Order Summary */}
        {quantity && quote && (
          <Card className="bg-white/5 border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/80">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Quantity:</span>
                <span className="text-white font-mono">{quantity} shares</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Price:</span>
                <span className="text-white font-mono">
                  {orderMode === 'MARKET' 
                    ? formatCurrency(quote.regularMarketPrice)
                    : limitPrice ? formatCurrency(parseFloat(limitPrice)) : '-'
                  }
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Order Value:</span>
                <span className="text-white font-mono">{formatCurrency(orderValue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Est. Charges:</span>
                <span className="text-white font-mono">{formatCurrency(charges)}</span>
              </div>
              <div className="border-t border-white/20 pt-2 flex justify-between font-bold">
                <span className="text-white/80">Total:</span>
                <span className={`font-mono ${orderType === 'BUY' ? 'text-red-400' : 'text-green-400'}`}>
                  {formatCurrency(Math.abs(totalCost))}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portfolio Info */}
        {portfolio && (
          <Card className="bg-white/5 border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/80">Available Funds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="font-mono text-white font-bold">
                  {formatCurrency(portfolio.cash)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Place Order Button */}
        <Button
          onClick={handlePlaceOrder}
          disabled={loading || !quantity || !quote}
          className={`w-full font-bold ${
            orderType === 'BUY' 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-red-600 hover:bg-red-700'
          } text-white`}
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Placing Order...</span>
            </div>
          ) : (
            `${orderType} ${quantity ? `${quantity} shares` : ''}`
          )}
        </Button>

        {/* Disclaimer */}
        <div className="flex items-start space-x-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
          <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-yellow-400/80">
            <strong>Paper Trading:</strong> This is a virtual trading platform. No real money is involved.
          </div>
        </div>
      </div>
    </div>
  )
}
