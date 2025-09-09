import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"

const recentTrades = [
  {
    id: 1,
    symbol: "AAPL",
    type: "BUY",
    quantity: 100,
    price: 175.5,
    time: "10:30 AM",
    status: "Filled",
  },
  {
    id: 2,
    symbol: "TSLA",
    type: "SELL",
    quantity: 50,
    price: 245.8,
    time: "09:45 AM",
    status: "Filled",
  },
  {
    id: 3,
    symbol: "GOOGL",
    type: "BUY",
    quantity: 25,
    price: 142.3,
    time: "09:15 AM",
    status: "Pending",
  },
]

export function RecentTrades() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Trades</CardTitle>
        <Button variant="ghost" size="sm">
          View All
          <ArrowUpRight className="ml-1 h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTrades.map((trade) => (
            <div key={trade.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant={trade.type === "BUY" ? "default" : "secondary"}>{trade.type}</Badge>
                <div>
                  <div className="font-medium">{trade.symbol}</div>
                  <div className="text-sm text-muted-foreground">
                    {trade.quantity} shares @ ${trade.price}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{trade.time}</div>
                <Badge variant={trade.status === "Filled" ? "default" : "outline"}>{trade.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
