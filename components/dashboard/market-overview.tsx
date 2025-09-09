import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"

const marketData = [
  {
    symbol: "S&P 500",
    value: "4,567.89",
    change: "+23.45",
    changePercent: "+0.52%",
    isPositive: true,
  },
  {
    symbol: "NASDAQ",
    value: "14,234.56",
    change: "-45.67",
    changePercent: "-0.32%",
    isPositive: false,
  },
  {
    symbol: "DOW",
    value: "34,567.12",
    change: "+123.45",
    changePercent: "+0.36%",
    isPositive: true,
  },
]

export function MarketOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {marketData.map((market) => (
            <div key={market.symbol} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{market.symbol}</div>
                <div className="text-2xl font-heading font-bold">{market.value}</div>
              </div>
              <div className="text-right">
                <div className={`flex items-center gap-1 ${market.isPositive ? "text-primary" : "text-destructive"}`}>
                  {market.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span className="text-sm font-medium">{market.change}</span>
                </div>
                <Badge variant={market.isPositive ? "default" : "destructive"}>{market.changePercent}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
