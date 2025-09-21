"use client"

import { useState, useRef, useEffect } from "react"
import { Search, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface StockSelectorProps {
  selectedStock: string
  onStockChange: (stock: string) => void
}

interface SearchResult {
  symbol: string
  name: string
  exchange: string
  type: string
}

const POPULAR_STOCKS = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank" },
  { symbol: "INFY.NS", name: "Infosys" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank" },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever" },
  { symbol: "ITC.NS", name: "ITC Limited" },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank" },
  { symbol: "LT.NS", name: "Larsen & Toubro" },
  { symbol: "SBIN.NS", name: "State Bank of India" },
]

export function StockSelector({ selectedStock, onStockChange }: StockSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedStockInfo = POPULAR_STOCKS.find(s => s.symbol === selectedStock) || {
    symbol: selectedStock,
    name: selectedStock.replace('.NS', '').replace('.BO', '')
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery("")
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const searchStocks = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/market/quote?search=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (data.success) {
        setSearchResults(data.data.searchResults || [])
      }
    } catch (error) {
      console.error('Stock search error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchStocks(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleStockSelect = (stock: string) => {
    onStockChange(stock)
    setIsOpen(false)
    setSearchQuery("")
  }

  return (
    <div ref={dropdownRef} className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-black border-white/20 text-white hover:bg-white/10 min-w-48 justify-between"
      >
        <div className="text-left">
          <div className="font-mono font-bold text-sm">{selectedStockInfo.symbol.replace('.NS', '')}</div>
          <div className="text-xs text-white/60 truncate">{selectedStockInfo.name}</div>
        </div>
        <ChevronDown className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-black border border-white/20 rounded-md shadow-lg z-50">
          {/* Search Input */}
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/20 text-white placeholder-white/40"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {searchQuery === "" ? (
              /* Popular Stocks */
              <div className="p-2">
                <div className="text-xs text-white/60 px-2 py-1 mb-2">Popular Stocks</div>
                {POPULAR_STOCKS.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleStockSelect(stock.symbol)}
                    className={`w-full text-left p-2 hover:bg-white/10 rounded-md transition-colors ${
                      selectedStock === stock.symbol ? 'bg-white/10' : ''
                    }`}
                  >
                    <div className="font-mono font-bold text-sm">{stock.symbol.replace('.NS', '')}</div>
                    <div className="text-xs text-white/60">{stock.name}</div>
                  </button>
                ))}
              </div>
            ) : loading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                <div className="text-xs text-white/60 mt-2">Searching...</div>
              </div>
            ) : searchResults.length > 0 ? (
              /* Search Results */
              <div className="p-2">
                <div className="text-xs text-white/60 px-2 py-1 mb-2">Search Results</div>
                {searchResults.map((result) => (
                  <button
                    key={`${result.symbol}-${result.exchange}`}
                    onClick={() => handleStockSelect(result.symbol)}
                    className="w-full text-left p-2 hover:bg-white/10 rounded-md transition-colors"
                  >
                    <div className="font-mono font-bold text-sm">{result.symbol}</div>
                    <div className="text-xs text-white/60">{result.name}</div>
                    <div className="text-xs text-white/40">{result.exchange} • {result.type}</div>
                  </button>
                ))}
              </div>
            ) : searchQuery.length >= 2 ? (
              <div className="p-8 text-center text-white/60 text-sm">
                No results found for "{searchQuery}"
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
