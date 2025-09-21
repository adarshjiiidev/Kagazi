import type { NextApiRequest, NextApiResponse } from 'next';
import { createErrorHandler } from '@/lib/error-handling';
import {
  getIndicesData,
  getPopularStocksData,
  getQuote,
  isMarketOpen,
  getMarketState
} from '@/lib/market-data';
import { getTradingSessionInfo } from '@/lib/trading-utils';

interface MarketDataResponse {
  success: boolean;
  data?: {
    indices: Array<{
      symbol: string;
      displayName: string;
      price: number;
      change: number;
      changePercent: number;
      currency: string;
    }>;
    popularStocks: Array<{
      symbol: string;
      displayName: string;
      price: number;
      change: number;
      changePercent: number;
      currency: string;
      volume: number;
    }>;
    marketStatus: {
      isOpen: boolean;
      state: string;
      sessionInfo: {
        isOpen: boolean;
        nextSession: string;
        timeToNextSession: string;
      };
    };
  };
  error?: string;
  message?: string;
}

async function handleMarketData(
  req: NextApiRequest,
  res: NextApiResponse<MarketDataResponse>
) {
  try {
    const { type } = req.query;

    // Handle specific data requests
    if (type === 'indices') {
      const indices = await getIndicesData();
      const formattedIndices = Array.from(indices.entries()).map(([symbol, quote]) => ({
        symbol,
        displayName: quote.displayName,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        currency: quote.currency,
      }));

      return res.status(200).json({
        success: true,
        data: {
          indices: formattedIndices,
          popularStocks: [],
          marketStatus: {
            isOpen: isMarketOpen(),
            state: getMarketState(),
            sessionInfo: getTradingSessionInfo()
          }
        }
      });
    }

    if (type === 'popular') {
      const popularStocks = await getPopularStocksData();
      const formattedStocks = Array.from(popularStocks.entries()).map(([symbol, quote]) => ({
        symbol,
        displayName: quote.displayName,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        currency: quote.currency,
        volume: quote.regularMarketVolume,
      }));

      return res.status(200).json({
        success: true,
        data: {
          indices: [],
          popularStocks: formattedStocks,
          marketStatus: {
            isOpen: isMarketOpen(),
            state: getMarketState(),
            sessionInfo: getTradingSessionInfo()
          }
        }
      });
    }

    // Default: get both indices and popular stocks
    const [indices, popularStocks] = await Promise.all([
      getIndicesData(),
      getPopularStocksData()
    ]);

    const formattedIndices = Array.from(indices.entries()).map(([symbol, quote]) => ({
      symbol,
      displayName: quote.displayName,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      currency: quote.currency,
    }));

    const formattedStocks = Array.from(popularStocks.entries()).map(([symbol, quote]) => ({
      symbol,
      displayName: quote.displayName,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      currency: quote.currency,
      volume: quote.regularMarketVolume,
    }));

    return res.status(200).json({
      success: true,
      data: {
        indices: formattedIndices,
        popularStocks: formattedStocks,
        marketStatus: {
          isOpen: isMarketOpen(),
          state: getMarketState(),
          sessionInfo: getTradingSessionInfo()
        }
      }
    });

  } catch (error) {
    console.error('Market data fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'MARKET_DATA_FETCH_FAILED',
      message: 'Failed to fetch market data'
    });
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse<MarketDataResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Only GET requests are allowed'
    });
  }

  return handleMarketData(req, res);
}

export default createErrorHandler(handler);
