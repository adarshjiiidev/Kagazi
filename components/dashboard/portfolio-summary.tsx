import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react"

export function PortfolioSummary() {
  const portfolioData = {
    totalValue: 100000,
    dayChange: 2500,
    dayChangePercent: 2.5,
    totalReturn: 15000,
    totalReturnPercent: 17.6,
    buyingPower: 25000,
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-heading font-bold">${portfolioData.totalValue.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Day's Change</CardTitle>
          {portfolioData.dayChange >= 0 ? (
            <TrendingUp className="h-4 w-4 text-primary" />
          ) : (
            <TrendingDown className="h-4 w-4 text-destructive" />
          )}
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-heading font-bold ${
              portfolioData.dayChange >= 0 ? "text-primary" : "text-destructive"
            }`}
          >
            ${Math.abs(portfolioData.dayChange).toLocaleString()}
          </div>
          <Badge variant={portfolioData.dayChangePercent >= 0 ? "default" : "destructive"}>
            {portfolioData.dayChangePercent >= 0 ? "+" : ""}
            {portfolioData.dayChangePercent}%
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Return</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-heading font-bold ${
              portfolioData.totalReturn >= 0 ? "text-primary" : "text-destructive"
            }`}
          >
            ${Math.abs(portfolioData.totalReturn).toLocaleString()}
          </div>
          <Badge variant={portfolioData.totalReturnPercent >= 0 ? "default" : "destructive"}>
            {portfolioData.totalReturnPercent >= 0 ? "+" : ""}
            {portfolioData.totalReturnPercent}%
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Buying Power</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-heading font-bold">${portfolioData.buyingPower.toLocaleString()}</div>
        </CardContent>
      </Card>
    </div>
  )
}
