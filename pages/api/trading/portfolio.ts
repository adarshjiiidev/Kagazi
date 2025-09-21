import type { NextApiRequest, NextApiResponse } from 'next';
import { requireEmailVerification } from '@/lib/session-management';
import { createErrorHandler } from '@/lib/error-handling';
import dbConnect from '@/lib/mongodb';
import Portfolio from '@/models/Portfolio';
import { getMultipleQuotes } from '@/lib/market-data';

const handler = createErrorHandler()(
  requireEmailVerification(async (req, res, session) => {
    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        message: 'Only GET requests are allowed'
      });
    }

    await dbConnect();

    try {
      // Get user portfolio
      let portfolio = await Portfolio.findOne({ userId: session.user.id });
      
      if (!portfolio) {
        // Create default portfolio for new users
        portfolio = new Portfolio({
          userId: session.user.id,
          cash: 1000000, // ₹10 lakh virtual money
          totalInvested: 0,
          currentValue: 0,
          totalPnl: 0,
          totalPnlPercent: 0,
          dayPnl: 0,
          dayPnlPercent: 0,
          holdings: []
        });
        await portfolio.save();
      }

      // If user has holdings, update them with current prices
      if (portfolio.holdings.length > 0) {
        const symbols = portfolio.holdings.map(h => h.symbol);
        const quotes = await getMultipleQuotes(symbols);
        
        let totalInvested = 0;
        let totalCurrentValue = 0;
        let totalDayPnl = 0;

        // Update each holding with current market data
        portfolio.holdings = portfolio.holdings.map(holding => {
          const quote = quotes.get(holding.symbol);
          
          if (quote) {
            const currentValue = holding.quantity * quote.regularMarketPrice;
            const pnl = currentValue - holding.investedValue;
            const pnlPercent = (pnl / holding.investedValue) * 100;
            const dayChange = quote.regularMarketChange * holding.quantity;
            const dayChangePercent = quote.regularMarketChangePercent;

            totalInvested += holding.investedValue;
            totalCurrentValue += currentValue;
            totalDayPnl += dayChange;

            return {
              ...holding,
              currentPrice: quote.regularMarketPrice,
              currentValue,
              pnl,
              pnlPercent,
              dayChange,
              dayChangePercent,
              lastUpdated: new Date()
            };
          }
          
          // Keep existing data if quote is not available
          totalInvested += holding.investedValue;
          totalCurrentValue += holding.currentValue;
          totalDayPnl += holding.dayChange;
          
          return holding;
        });

        // Update portfolio totals
        portfolio.totalInvested = totalInvested;
        portfolio.currentValue = totalCurrentValue;
        portfolio.totalPnl = totalCurrentValue - totalInvested;
        portfolio.totalPnlPercent = totalInvested > 0 ? (portfolio.totalPnl / totalInvested) * 100 : 0;
        portfolio.dayPnl = totalDayPnl;
        portfolio.dayPnlPercent = totalCurrentValue > 0 ? (totalDayPnl / totalCurrentValue) * 100 : 0;

        // Save updated portfolio
        await portfolio.save();
      }

      // Calculate portfolio summary
      const totalValue = portfolio.cash + portfolio.currentValue;
      const allocatedPercent = totalValue > 0 ? (portfolio.currentValue / totalValue) * 100 : 0;
      const cashPercent = totalValue > 0 ? (portfolio.cash / totalValue) * 100 : 100;

      return res.status(200).json({
        success: true,
        data: {
          portfolio: {
            userId: portfolio.userId,
            cash: portfolio.cash,
            totalInvested: portfolio.totalInvested,
            currentValue: portfolio.currentValue,
            totalValue,
            totalPnl: portfolio.totalPnl,
            totalPnlPercent: portfolio.totalPnlPercent,
            dayPnl: portfolio.dayPnl,
            dayPnlPercent: portfolio.dayPnlPercent,
            allocatedPercent,
            cashPercent,
            holdingsCount: portfolio.holdings.length,
            lastUpdated: new Date()
          },
          holdings: portfolio.holdings.map(holding => ({
            symbol: holding.symbol,
            quantity: holding.quantity,
            averagePrice: holding.averagePrice,
            currentPrice: holding.currentPrice,
            investedValue: holding.investedValue,
            currentValue: holding.currentValue,
            pnl: holding.pnl,
            pnlPercent: holding.pnlPercent,
            dayChange: holding.dayChange,
            dayChangePercent: holding.dayChangePercent,
            weightage: portfolio.currentValue > 0 ? (holding.currentValue / portfolio.currentValue) * 100 : 0,
            lastUpdated: holding.lastUpdated
          }))
        }
      });

    } catch (error) {
      console.error('Portfolio fetch error:', error);
      return res.status(500).json({
        success: false,
        error: 'PORTFOLIO_FETCH_FAILED',
        message: 'Failed to fetch portfolio data'
      });
    }
  })
);

export default handler;
