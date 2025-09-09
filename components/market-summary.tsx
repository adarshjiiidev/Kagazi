import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const marketData = [
  { symbol: "S&P 500", value: 4756.5, change: 23.45, changePercent: 0.49 },
  { symbol: "NASDAQ", value: 14845.12, change: -12.34, changePercent: -0.08 },
  { symbol: "DOW", value: 37248.35, change: 156.78, changePercent: 0.42 },
  { symbol: "VIX", value: 13.45, change: -0.23, changePercent: -1.68 },
]

export function MarketSummary() {
  return (
    <Card className="bg-black border-white/20">
      <CardHeader>
        <CardTitle className="text-white text-lg font-bold">MARKET SUMMARY</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {marketData.map((market) => (
            <div
              key={market.symbol}
              className="flex items-center justify-between py-3 border-b border-white/10 last:border-b-0"
            >
              <div>
                <span className="font-bold text-white text-sm">{market.symbol}</span>
                <p className="text-xs text-white/60 font-mono">{market.value.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs font-mono font-bold ${market.change >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {market.change >= 0 ? "+" : ""}
                    {market.change}
                  </span>
                </div>
                <div className={`text-xs font-mono ${market.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {market.change >= 0 ? "+" : ""}
                  {market.changePercent}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
