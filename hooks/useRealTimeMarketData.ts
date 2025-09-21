'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChartData, QuoteData } from '@/lib/market-data';

interface UseRealTimeMarketDataProps {
  symbol: string;
  enabled: boolean;
  interval?: number; // milliseconds
  onDataUpdate?: (data: ChartData) => void;
  onQuoteUpdate?: (quote: QuoteData) => void;
  onError?: (error: Error) => void;
}

interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastUpdate: Date | null;
  updateCount: number;
  errorCount: number;
}

export function useRealTimeMarketData({
  symbol,
  enabled,
  interval = 1000,
  onDataUpdate,
  onQuoteUpdate,
  onError
}: UseRealTimeMarketDataProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    lastUpdate: null,
    updateCount: 0,
    errorCount: 0
  });

  const [latestQuote, setLatestQuote] = useState<QuoteData | null>(null);
  const [latestCandle, setLatestCandle] = useState<ChartData | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPriceRef = useRef<number>(0);
  const retryCountRef = useRef<number>(0);
  const maxRetries = 3;

  const fetchMarketData = useCallback(async () => {
    if (!symbol || !enabled) return;

    try {
      const response = await fetch(
        `/api/market/quote?symbol=${encodeURIComponent(symbol)}`,
        {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data.quote) {
        const quote = result.data.quote;
        const now = new Date();
        
        setLatestQuote(quote);
        
        // Generate realistic-looking candle data for real-time simulation
        // In production, this would come from actual market data feed
        const basePrice = quote.regularMarketPrice;
        const volatility = 0.002; // 0.2% volatility
        const priceChange = (Math.random() - 0.5) * volatility * basePrice;
        const newPrice = Math.max(0.01, basePrice + priceChange);
        
        // Create more realistic OHLC data
        const open = lastPriceRef.current || basePrice;
        const close = newPrice;
        const high = Math.max(open, close) * (1 + Math.random() * 0.001);
        const low = Math.min(open, close) * (1 - Math.random() * 0.001);
        
        const newCandle: ChartData = {
          time: Math.floor(now.getTime() / 1000).toString(),
          open,
          high,
          low,
          close,
          volume: quote.regularMarketVolume + Math.floor(Math.random() * 1000)
        };

        lastPriceRef.current = newPrice;
        setLatestCandle(newCandle);

        // Update connection state
        setConnectionState(prev => ({
          status: 'connected',
          lastUpdate: now,
          updateCount: prev.updateCount + 1,
          errorCount: 0
        }));

        // Trigger callbacks
        onDataUpdate?.(newCandle);
        onQuoteUpdate?.({
          ...quote,
          regularMarketPrice: newPrice,
          regularMarketChange: newPrice - basePrice,
          regularMarketChangePercent: ((newPrice - basePrice) / basePrice) * 100,
          timestamp: now.getTime()
        });

        // Reset retry count on success
        retryCountRef.current = 0;

      } else {
        throw new Error('Invalid response data');
      }

    } catch (error) {
      console.error('Real-time market data fetch error:', error);
      
      retryCountRef.current += 1;
      
      setConnectionState(prev => ({
        ...prev,
        status: retryCountRef.current >= maxRetries ? 'error' : 'connecting',
        errorCount: prev.errorCount + 1
      }));

      if (retryCountRef.current < maxRetries) {
        // Exponential backoff retry
        setTimeout(() => {
          fetchMarketData();
        }, Math.pow(2, retryCountRef.current) * 1000);
      } else {
        onError?.(error instanceof Error ? error : new Error('Unknown error'));
      }
    }
  }, [symbol, enabled, onDataUpdate, onQuoteUpdate, onError]);

  const startRealTimeUpdates = useCallback(() => {
    if (!enabled || !symbol) return;

    setConnectionState(prev => ({ ...prev, status: 'connecting' }));
    
    // Initial fetch
    fetchMarketData();
    
    // Set up interval
    intervalRef.current = setInterval(fetchMarketData, interval);
  }, [enabled, symbol, interval, fetchMarketData]);

  const stopRealTimeUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setConnectionState(prev => ({ 
      ...prev, 
      status: 'disconnected' 
    }));
    
    retryCountRef.current = 0;
  }, []);

  // Effect to start/stop updates based on enabled state
  useEffect(() => {
    if (enabled && symbol) {
      startRealTimeUpdates();
    } else {
      stopRealTimeUpdates();
    }

    return stopRealTimeUpdates;
  }, [enabled, symbol, startRealTimeUpdates, stopRealTimeUpdates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRealTimeUpdates();
    };
  }, [stopRealTimeUpdates]);

  // Methods for manual control
  const reconnect = useCallback(() => {
    retryCountRef.current = 0;
    stopRealTimeUpdates();
    if (enabled && symbol) {
      setTimeout(startRealTimeUpdates, 1000);
    }
  }, [enabled, symbol, startRealTimeUpdates, stopRealTimeUpdates]);

  const getConnectionStats = useCallback(() => {
    const uptime = connectionState.lastUpdate 
      ? Date.now() - connectionState.lastUpdate.getTime()
      : 0;
      
    return {
      ...connectionState,
      uptime,
      avgUpdatesPerMinute: connectionState.updateCount > 0 && connectionState.lastUpdate
        ? (connectionState.updateCount / (uptime / 60000)) || 0
        : 0
    };
  }, [connectionState]);

  return {
    connectionState,
    latestQuote,
    latestCandle,
    reconnect,
    getConnectionStats,
    startRealTimeUpdates,
    stopRealTimeUpdates
  };
}
