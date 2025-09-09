"use client"

import { useState } from "react"
import { MarketInstruments } from "@/components/market-instruments"
import { Watchlist } from "@/components/watchlist"
import { MarketSearch } from "@/components/market-search"
import { MarketCategories } from "@/components/market-categories"

export default function MarketsPage() {
  const [selectedCategory, setSelectedCategory] = useState("stocks")
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="space-y-8 ml-64">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">MARKETS</h1>
        <p className="text-white/60 text-lg">Explore and track financial instruments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <MarketSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          <MarketCategories selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
          <MarketInstruments category={selectedCategory} searchQuery={searchQuery} />
        </div>
        <div>
          <Watchlist />
        </div>
      </div>
    </div>
  )
}
