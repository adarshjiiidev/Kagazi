/**
 * Yahoo Finance API Integration for Indian Market Data
 * Supports NSE stocks, Nifty 50, and BankNifty indices
 */

import yahooFinance from 'yahoo-finance2';
import axios from 'axios';
import { logger } from './error-handling';

// Indian market symbols
export const INDIAN_INDICES = {
  NIFTY_50: '^NSEI',
  BANK_NIFTY: '^NSEBANK',
  NIFTY_IT: '^CNXIT',
  NIFTY_AUTO: '^CNXAUTO',
  NIFTY_PHARMA: '^CNXPHARMA',
} as const;

// Popular NSE stocks
export const POPULAR_STOCKS = [
  'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'HINDUNILVR.NS',
  'ITC.NS', 'ICICIBANK.NS', 'KOTAKBANK.NS', 'LT.NS', 'SBIN.NS',
  'BHARTIARTL.NS', 'ASIANPAINT.NS', 'MARUTI.NS', 'BAJFINANCE.NS',
  'HCLTECH.NS', 'AXISBANK.NS', 'NESTLEIND.NS', 'WIPRO.NS',
  'ULTRACEMCO.NS', 'TITAN.NS', 'ADANIENTERPRISES.NS', 'POWERGRID.NS',
  'NTPC.NS', 'ONGC.NS', 'JSWSTEEL.NS'
];

export interface QuoteData {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketPreviousClose: number;
  regularMarketOpen: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  marketCap?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  avgVolume?: number;
  displayName: string;
  currency: string;
  exchangeName: string;
  marketState: 'REGULAR' | 'CLOSED' | 'PRE' | 'POST';
  timestamp: number;
}

export interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/**
 * Get real-time quote for a symbol
 */
export async function getQuote(symbol: string): Promise<QuoteData | null> {
  try {
    console.log(`Fetching quote for symbol: ${symbol}`);
    const quote = await yahooFinance.quote(symbol, {}, {
      timeout: 5000,
    });
    
    console.log(`Yahoo Finance response for ${symbol}:`, quote);
    
    if (!quote || typeof quote.regularMarketPrice !== 'number') {
      console.log(`Invalid quote data for ${symbol}:`, quote);
      return null;
    }

    return {
      symbol: quote.symbol || symbol,
      regularMarketPrice: quote.regularMarketPrice,
      regularMarketChange: quote.regularMarketChange || 0,
      regularMarketChangePercent: quote.regularMarketChangePercent || 0,
      regularMarketPreviousClose: quote.regularMarketPreviousClose || quote.regularMarketPrice,
      regularMarketOpen: quote.regularMarketOpen || quote.regularMarketPrice,
      regularMarketDayHigh: quote.regularMarketDayHigh || quote.regularMarketPrice,
      regularMarketDayLow: quote.regularMarketDayLow || quote.regularMarketPrice,
      regularMarketVolume: quote.regularMarketVolume || 0,
      marketCap: quote.marketCap,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
      avgVolume: quote.averageVolume || quote.averageDailyVolume10Day,
      displayName: quote.displayName || quote.longName || quote.shortName || getDisplayName(symbol),
      currency: quote.currency || 'INR',
      exchangeName: quote.fullExchangeName || quote.exchange || 'NSE',
      marketState: getMarketState(),
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error(`Failed to fetch quote for ${symbol}:`, error);
    logger.error(`Failed to fetch quote for ${symbol}`, error);
    return null;
  }
}

/**
 * Get multiple quotes at once
 */
export async function getMultipleQuotes(symbols: string[]): Promise<Map<string, QuoteData>> {
  const quotes = new Map<string, QuoteData>();
  
  try {
    // Process in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const promises = batch.map(symbol => getQuote(symbol));
      const results = await Promise.allSettled(promises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          quotes.set(batch[index], result.value);
        }
      });
      
      // Add delay between batches
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  } catch (error) {
    logger.error('Failed to fetch multiple quotes', error);
  }
  
  return quotes;
}

/**
 * Get historical data for charting
 */
export async function getHistoricalData(
  symbol: string,
  period1: Date,
  period2: Date = new Date(),
  interval: '1m' | '5m' | '15m' | '1h' | '1d' = '5m'
): Promise<ChartData[]> {
  try {
    console.log(`Fetching historical data for ${symbol} from ${period1.toISOString()} to ${period2.toISOString()}, interval: ${interval}`);
    
    // For intraday data, use chart API instead of historical API
    if (['1m', '5m', '15m', '1h'].includes(interval)) {
      // Use chart API which supports intraday intervals
      const result = await yahooFinance.chart(symbol, {
        period1: period1,
        period2: period2,
        interval: interval,
      }, {
        timeout: 10000,
      });

      console.log(`Chart data response for ${symbol}:`, result?.quotes?.length || 0, 'items');

      if (!result?.quotes || result.quotes.length === 0) {
        console.log(`No chart data found for ${symbol}`);
        return [];
      }

      const chartData = result.quotes.map((quote, index) => {
        const timestamp = result.meta?.timestamp?.[index] || Date.now() / 1000;
        
        return {
          time: Math.floor(timestamp).toString(), // Use original timestamp without alignment
          open: quote.open || quote.close || 0,
          high: quote.high || quote.close || 0,
          low: quote.low || quote.close || 0,
          close: quote.close || 0,
          volume: quote.volume || 0,
        };
      })
      .filter(item => 
        item.open > 0 && 
        item.high > 0 && 
        item.low > 0 && 
        item.close > 0
      )
      .sort((a, b) => parseInt(a.time) - parseInt(b.time)) // Sort by timestamp
      .reduce((acc, item) => {
        // Remove duplicates by keeping the last occurrence of each timestamp
        const existingIndex = acc.findIndex(existing => existing.time === item.time);
        if (existingIndex !== -1) {
          acc[existingIndex] = item; // Replace with newer data
        } else {
          acc.push(item);
        }
        return acc;
      }, [] as ChartData[]);

      console.log(`Processed ${chartData.length} valid chart data points for ${symbol}`);
      return chartData;
    } else {
      // For daily data, use historical API
      const result = await yahooFinance.historical(symbol, {
        period1: period1,
        period2: period2,
        interval: interval,
      }, {
        timeout: 10000,
      });

      console.log(`Historical data response for ${symbol}:`, result?.length || 0, 'items');

      if (!result || result.length === 0) {
        console.log(`No historical data found for ${symbol}`);
        return [];
      }

      const chartData = result.map(item => {
        return {
          time: item.date.toISOString().split('T')[0],
          open: item.open || 0,
          high: item.high || 0,
          low: item.low || 0,
          close: item.close || 0,
          volume: item.volume || 0,
        };
      }).filter(item => 
        item.open > 0 && 
        item.high > 0 && 
        item.low > 0 && 
        item.close > 0
      );

      console.log(`Processed ${chartData.length} valid historical data points for ${symbol}`);
      return chartData;
    }
  } catch (error) {
    console.error(`Failed to fetch historical data for ${symbol}:`, error);
    logger.error(`Failed to fetch historical data for ${symbol}`, error);
    return [];
  }
}

/**
 * Search for Indian stocks
 */
export async function searchStocks(query: string): Promise<Array<{
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}>> {
  try {
    console.log(`Searching for stocks with query: ${query}`);
    
    // First try exact matches from our popular stocks
    const exactMatches = POPULAR_STOCKS
      .filter(symbol => 
        symbol.toLowerCase().includes(query.toLowerCase()) ||
        getDisplayName(symbol).toLowerCase().includes(query.toLowerCase())
      )
      .map(symbol => ({
        symbol,
        name: getDisplayName(symbol),
        exchange: 'NSE',
        type: 'EQUITY',
      }));

    if (exactMatches.length > 0) {
      console.log(`Found ${exactMatches.length} exact matches from popular stocks`);
      return exactMatches.slice(0, 10);
    }

    // If no exact matches, try Yahoo Finance search
    const results = await yahooFinance.search(query, {}, {
      timeout: 5000,
    });
    
    console.log(`Yahoo Finance search returned ${results.quotes?.length || 0} results`);
    
    if (!results.quotes || results.quotes.length === 0) {
      return [];
    }
    
    return results.quotes
      .filter(quote => 
        quote.symbol?.endsWith('.NS') || 
        quote.symbol?.endsWith('.BO') ||
        quote.exchange?.includes('NSE') ||
        quote.exchange?.includes('BSE') ||
        (quote.symbol && !quote.symbol.includes('.') && quote.region === 'IN')
      )
      .map(quote => ({
        symbol: quote.symbol || '',
        name: quote.longname || quote.shortname || quote.displayName || '',
        exchange: quote.exchange || 'NSE',
        type: quote.quoteType || 'EQUITY',
      }))
      .filter(result => result.symbol && result.name)
      .slice(0, 15); // Limit results
  } catch (error) {
    console.error(`Failed to search stocks for query: ${query}:`, error);
    logger.error(`Failed to search stocks for query: ${query}`, error);
    
    // Fallback to popular stocks if search fails
    return POPULAR_STOCKS
      .filter(symbol => 
        symbol.toLowerCase().includes(query.toLowerCase()) ||
        getDisplayName(symbol).toLowerCase().includes(query.toLowerCase())
      )
      .map(symbol => ({
        symbol,
        name: getDisplayName(symbol),
        exchange: 'NSE',
        type: 'EQUITY',
      }))
      .slice(0, 5);
  }
}

/**
 * Get market indices data
 */
export async function getIndicesData(): Promise<Map<string, QuoteData>> {
  const indices = Object.values(INDIAN_INDICES);
  return await getMultipleQuotes(indices);
}

/**
 * Get popular stocks data
 */
export async function getPopularStocksData(): Promise<Map<string, QuoteData>> {
  return await getMultipleQuotes(POPULAR_STOCKS.slice(0, 10)); // Top 10 for quick loading
}

/**
 * Check if market is open (Indian market hours: 9:15 AM - 3:30 PM IST)
 */
export function isMarketOpen(): boolean {
  const now = new Date();
  const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  
  const day = istTime.getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0 || day === 6) return false; // Weekend
  
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const currentTime = hours * 60 + minutes;
  
  const marketOpen = 9 * 60 + 15; // 9:15 AM
  const marketClose = 15 * 60 + 30; // 3:30 PM
  
  return currentTime >= marketOpen && currentTime <= marketClose;
}

/**
 * Get current market state
 */
export function getMarketState(): 'REGULAR' | 'CLOSED' | 'PRE' | 'POST' {
  const now = new Date();
  const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  
  const day = istTime.getDay();
  if (day === 0 || day === 6) return 'CLOSED'; // Weekend
  
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const currentTime = hours * 60 + minutes;
  
  const preMarketStart = 9 * 60; // 9:00 AM
  const marketOpen = 9 * 60 + 15; // 9:15 AM  
  const marketClose = 15 * 60 + 30; // 3:30 PM
  const postMarketEnd = 16 * 60; // 4:00 PM
  
  if (currentTime >= marketOpen && currentTime <= marketClose) {
    return 'REGULAR';
  } else if (currentTime >= preMarketStart && currentTime < marketOpen) {
    return 'PRE';
  } else if (currentTime > marketClose && currentTime <= postMarketEnd) {
    return 'POST';
  } else {
    return 'CLOSED';
  }
}

/**
 * Get next market open time
 */
export function getNextMarketOpen(): Date {
  const now = new Date();
  const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  
  let nextOpen = new Date(istTime);
  nextOpen.setHours(9, 15, 0, 0); // 9:15 AM IST
  
  // If market time has passed today, get next trading day
  if (istTime.getHours() > 15 || (istTime.getHours() === 15 && istTime.getMinutes() >= 30)) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }
  
  // Skip weekends
  while (nextOpen.getDay() === 0 || nextOpen.getDay() === 6) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }
  
  return nextOpen;
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return `₹${price.toLocaleString('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }
  return price.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
}

/**
 * Format change percentage
 */
export function formatChangePercent(changePercent: number): string {
  const sign = changePercent >= 0 ? '+' : '';
  return `${sign}${changePercent.toFixed(2)}%`;
}

/**
 * Get color for price change
 */
export function getChangeColor(change: number): string {
  if (change > 0) return 'text-green-600';
  if (change < 0) return 'text-red-600';
  return 'text-gray-600';
}

/**
 * Convert symbol to display name
 */
export function getDisplayName(symbol: string): string {
  const symbolMap: { [key: string]: string } = {
    '^NSEI': 'Nifty 50',
    '^NSEBANK': 'Bank Nifty',
    '^CNXIT': 'Nifty IT',
    '^CNXAUTO': 'Nifty Auto',
    '^CNXPHARMA': 'Nifty Pharma',
    'RELIANCE.NS': 'Reliance Industries',
    'TCS.NS': 'Tata Consultancy Services',
    'HDFCBANK.NS': 'HDFC Bank',
    'INFY.NS': 'Infosys',
    'HINDUNILVR.NS': 'Hindustan Unilever',
    'ITC.NS': 'ITC Limited',
    'ICICIBANK.NS': 'ICICI Bank',
    'KOTAKBANK.NS': 'Kotak Mahindra Bank',
  };
  
  return symbolMap[symbol] || symbol.replace('.NS', '').replace('.BO', '');
}
