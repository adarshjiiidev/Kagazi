import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const recentTrades = [
  {
    id: "1",
    symbol: "AAPL",
    type: "BUY",
    quantity: 50,
    price: 155.5,
    timestamp: "2024-01-15 10:30:00",
    status: "FILLED",
  },
  {
    id: "2",
    symbol: "GOOGL",
    type: "SELL",
    quantity: 5,
    price: 2850.0,
    timestamp: "2024-01-15 09:45:00",
    status: "FILLED",
  },
  {
    id: "3",
    symbol: "TSLA",
    type: "BUY",
    quantity: 25,
    price: 790.0,
    timestamp: "2024-01-15 09:15:00",
    status: "FILLED",
  },
  {
    id: "4",
    symbol: "MSFT",
    type: "BUY",
    quantity: 30,
    price: 310.0,
    timestamp: "2024-01-14 15:30:00",
    status: "FILLED",
  },
]

export function RecentTrades() {
  return (
    <Card className="bg-black border-white/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white text-lg font-bold">RECENT TRADES</CardTitle>
        <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
          VIEW ALL
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTrades.map((trade) => (
            <div key={trade.id} className="flex items-center justify-between p-4 border border-white/10 rounded">
              <div className="flex items-center space-x-4">
                <div
                  className={`px-3 py-1 text-xs font-bold rounded ${
                    trade.type === "BUY" ? "bg-green-400/20 text-green-400" : "bg-red-400/20 text-red-400"
                  }`}
                >
                  {trade.type}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white font-mono">{trade.symbol}</span>
                  </div>
                  <p className="text-sm text-white/60">
                    {trade.quantity} SHARES @ ${trade.price}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm text-white">${(trade.quantity * trade.price).toLocaleString()}</div>
                <div className="text-xs text-white/60 font-mono">{new Date(trade.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
