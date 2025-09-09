import { PortfolioPositions } from "@/components/portfolio-positions"
import { PortfolioPerformance } from "@/components/portfolio-performance"
import { PortfolioAllocation } from "@/components/portfolio-allocation"

export default function PortfolioPage() {
  return (
    <div className="space-y-8 ml-64">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">PORTFOLIO</h1>
        <p className="text-white/60 text-lg">Detailed view of your positions and performance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <PortfolioPositions />
        </div>
        <div className="space-y-8">
          <PortfolioPerformance />
          <PortfolioAllocation />
        </div>
      </div>
    </div>
  )
}
