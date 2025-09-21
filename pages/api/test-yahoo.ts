import type { NextApiRequest, NextApiResponse } from 'next';
import yahooFinance from 'yahoo-finance2';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Testing Yahoo Finance integration...');
    
    // Test with a reliable stock symbol
    const symbol = 'RELIANCE.NS';
    
    console.log(`Fetching quote for ${symbol}...`);
    const quote = await yahooFinance.quote(symbol, {}, { timeout: 10000 });
    
    console.log('Quote response:', quote);
    
    if (!quote) {
      return res.status(404).json({ 
        error: 'No quote data returned',
        symbol 
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume,
        displayName: quote.displayName || quote.longName,
        currency: quote.currency,
        exchange: quote.exchange,
        timestamp: new Date().toISOString(),
        rawData: quote
      }
    });
    
  } catch (error) {
    console.error('Yahoo Finance test error:', error);
    return res.status(500).json({
      success: false,
      error: 'Yahoo Finance API error',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error
    });
  }
}
