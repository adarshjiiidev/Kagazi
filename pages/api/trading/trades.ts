import type { NextApiRequest, NextApiResponse } from 'next';
import { requireEmailVerification } from '@/lib/session-management';
import { createErrorHandler } from '@/lib/error-handling';
import dbConnect from '@/lib/mongodb';
import Trade from '@/models/Trade';
import { getDisplayName, formatPrice } from '@/lib/market-data';

interface TradeResponse {
  success: boolean;
  data?: {
    trades: Array<{
      id: string;
      symbol: string;
      displayName: string;
      type: 'BUY' | 'SELL';
      orderType: string;
      quantity: number;
      price: number;
      executedPrice: number;
      executedQuantity: number;
      totalValue: number;
      charges: {
        total: number;
        brokerage: number;
        stt: number;
        exchangeCharges: number;
        gst: number;
        stampDuty: number;
        sebiCharges: number;
      };
      status: string;
      createdAt: Date;
      executedAt?: Date;
    }>;
    summary: {
      totalTrades: number;
      totalBuyOrders: number;
      totalSellOrders: number;
      totalBuyValue: number;
      totalSellValue: number;
      totalCharges: number;
      todayTrades: number;
    };
  };
  error?: string;
  message?: string;
}

const handler = createErrorHandler()<TradeResponse>()(
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
      const { limit = '20', status, type, days = '30' } = req.query;
      const limitNum = parseInt(limit as string, 10);
      const daysNum = parseInt(days as string, 10);

      // Build query filters
      const filters: any = { userId: session.user.id };
      
      if (status && status !== 'ALL') {
        filters.status = status;
      }
      
      if (type && type !== 'ALL') {
        filters.type = type;
      }

      // Date filter for recent trades
      const dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - daysNum);
      filters.createdAt = { $gte: dateFilter };

      // Get user's trades
      const trades = await Trade.find(filters)
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .lean();

      // Format trades data
      const formattedTrades = trades.map(trade => ({
        id: trade._id.toString(),
        symbol: trade.symbol,
        displayName: getDisplayName(trade.symbol),
        type: trade.type,
        orderType: trade.orderType,
        quantity: trade.quantity,
        price: trade.price,
        executedPrice: trade.executedPrice || 0,
        executedQuantity: trade.executedQuantity || 0,
        totalValue: trade.totalValue,
        charges: trade.charges,
        status: trade.status,
        createdAt: trade.createdAt,
        executedAt: trade.executedAt
      }));

      // Calculate summary statistics
      const allTrades = await Trade.find({ userId: session.user.id }).lean();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTrades = allTrades.filter(trade => 
        trade.createdAt >= today
      );

      const summary = allTrades.reduce((acc, trade) => {
        acc.totalTrades++;
        
        if (trade.type === 'BUY') {
          acc.totalBuyOrders++;
          acc.totalBuyValue += trade.totalValue;
        } else {
          acc.totalSellOrders++;
          acc.totalSellValue += trade.totalValue;
        }
        
        acc.totalCharges += trade.charges.total;
        return acc;
      }, {
        totalTrades: 0,
        totalBuyOrders: 0,
        totalSellOrders: 0,
        totalBuyValue: 0,
        totalSellValue: 0,
        totalCharges: 0,
        todayTrades: todayTrades.length
      });

      return res.status(200).json({
        success: true,
        data: {
          trades: formattedTrades,
          summary
        }
      });

    } catch (error) {
      console.error('Trades fetch error:', error);
      return res.status(500).json({
        success: false,
        error: 'TRADES_FETCH_FAILED',
        message: 'Failed to fetch trading history'
      });
    }
  })
);

export default handler;
