import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '../../pages/api/auth/[...nextauth]'
import { PortfolioOverview } from "@/components/portfolio-overview"
import { RecentTrades } from "@/components/recent-trades"
import { MarketSummary } from "@/components/market-summary"
import { PerformanceChart } from "@/components/performance-chart"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  // Redirect to sign in if not authenticated
  if (!session) {
    redirect('/auth/signin')
  }
  return (
    <div className="space-y-8 ml-64">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">DASHBOARD</h1>
        <p className="text-white/60 text-lg">
          Welcome back, {session.user.name}! Ready to continue trading?
        </p>
        {session.user.emailVerified && (
          <p className="text-green-400 text-sm mt-1">✓ Email verified</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <PerformanceChart />
          <RecentTrades />
        </div>
        <div className="space-y-8">
          <PortfolioOverview />
          <MarketSummary />
        </div>
      </div>
    </div>
  )
}
