import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const portfolioData = {
  totalValue: 102450.0,
  totalPnL: 2450.0,
  totalPnLPercent: 2.45,
  dayPnL: 450.0,
  dayPnLPercent: 0.44,
  positions: [
    { symbol: "AAPL", shares: 50, avgPrice: 150.0, currentPrice: 155.5, pnl: 275.0 },
    { symbol: "GOOGL", shares: 10, avgPrice: 2800.0, currentPrice: 2850.0, pnl: 500.0 },
    { symbol: "TSLA", shares: 25, avgPrice: 800.0, currentPrice: 790.0, pnl: -250.0 },
    { symbol: "MSFT", shares: 30, avgPrice: 300.0, currentPrice: 310.0, pnl: 300.0 },
  ],
}

export function PortfolioOverview() {
  return (
    <div className="space-y-6">
      <Card className="bg-black border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-lg font-bold">PORTFOLIO OVERVIEW</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total Portfolio Value */}
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <span className="text-white/60 font-medium">TOTAL VALUE</span>
            <span className="text-2xl font-bold font-mono text-white">
              ${portfolioData.totalValue.toLocaleString()}
            </span>
          </div>

          {/* Total P&L */}
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <span className="text-white/60 font-medium">TOTAL P&L</span>
            <div className="text-right">
              <div className="text-xl font-mono text-green-400">+${portfolioData.totalPnL.toLocaleString()}</div>
              <div className="text-sm text-green-400">+{portfolioData.totalPnLPercent}%</div>
            </div>
          </div>

          {/* Day P&L */}
          <div className="flex items-center justify-between py-3">
            <span className="text-white/60 font-medium">DAY P&L</span>
            <div className="text-right">
              <div className="text-lg font-mono text-green-400">+${portfolioData.dayPnL.toLocaleString()}</div>
              <div className="text-sm text-green-400">+{portfolioData.dayPnLPercent}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Positions */}
      <Card className="bg-black border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-lg font-bold">TOP POSITIONS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {portfolioData.positions.map((position) => (
              <div
                key={position.symbol}
                className="flex items-center justify-between py-3 border-b border-white/5 last:border-b-0"
              >
                <div>
                  <div className="font-bold text-white font-mono">{position.symbol}</div>
                  <div className="text-sm text-white/60">
                    {position.shares} SHARES @ ${position.avgPrice}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-mono font-bold ${position.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {position.pnl >= 0 ? "+" : ""}${position.pnl.toLocaleString()}
                  </div>
                  <div className="text-sm text-white/60 font-mono">${position.currentPrice}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
