import type { NextApiRequest, NextApiResponse } from 'next';
import { getQuote, searchStocks, getHistoricalData, formatPrice, formatChangePercent, getChangeColor } from '@/lib/market-data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { symbol, search, historical, period1, period2, interval = '1d' } = req.query;

    // Handle stock search
    if (search) {
      console.log(`Searching for stocks: ${search}`);
      const searchResults = await searchStocks(search as string);
      return res.status(200).json({
        success: true,
        data: {
          searchResults
        }
      });
    }

    // Handle historical data request
    if (historical && symbol) {
      console.log(`Fetching historical data for ${symbol}`);
      const startDate = period1 
        ? new Date(period1 as string) 
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days ago
      
      const endDate = period2 
        ? new Date(period2 as string) 
        : new Date(); // Default to now

      const historicalData = await getHistoricalData(
        symbol as string,
        startDate,
        endDate,
        interval as any
      );

      return res.status(200).json({
        success: true,
        data: {
          historicalData
        }
      });
    }

    // Handle quote request
    if (symbol) {
      console.log(`Fetching quote for ${symbol}`);
      const quote = await getQuote(symbol as string);
      
      if (!quote) {
        return res.status(404).json({
          success: false,
          error: 'QUOTE_NOT_FOUND',
          message: `Quote not found for symbol: ${symbol}`
        });
      }

      const formattedQuote = {
        ...quote,
        formattedPrice: formatPrice(quote.regularMarketPrice, quote.currency),
        formattedChange: formatChangePercent(quote.regularMarketChangePercent),
        changeColor: getChangeColor(quote.regularMarketChange)
      };

      return res.status(200).json({
        success: true,
        data: {
          quote: formattedQuote
        }
      });
    }

    // No valid request parameters
    return res.status(400).json({
      success: false,
      error: 'INVALID_REQUEST',
      message: 'Please provide symbol, search query, or historical data parameters'
    });

  } catch (error) {
    console.error('Quote request error:', error);
    return res.status(500).json({
      success: false,
      error: 'QUOTE_REQUEST_FAILED',
      message: 'Failed to process quote request'
    });
  }
}
