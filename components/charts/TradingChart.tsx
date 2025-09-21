'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  CandlestickData, 
  LineData,
  HistogramData,
  ColorType,
  CrosshairMode,
  LineStyle,
  PriceScaleMode
} from 'lightweight-charts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity,
  Maximize2,
  Settings,
  Pencil,
  Minus,
  TrendingUpIcon,
  Square,
  Trash2,
  ZoomIn,
  ZoomOut,
  Wifi,
  WifiOff,
  Play,
  Pause
} from 'lucide-react';
import { ChartData, QuoteData, formatPrice, formatChangePercent, getChangeColor } from '@/lib/market-data';

interface TradingChartProps {
  symbol: string;
  data: ChartData[];
  quote?: QuoteData;
  height?: number;
  showVolume?: boolean;
  chartType?: 'candlestick' | 'line' | 'area';
  onIntervalChange?: (interval: string) => void;
  className?: string;
  enableRealTime?: boolean;
  onDataUpdate?: (newData: ChartData) => void;
}

interface DrawingTool {
  id: string;
  type: 'line' | 'horizontal' | 'vertical' | 'rectangle';
  points: Array<{ time: number; price: number }>;
  color: string;
}

const intervals = [
  { label: '1D', value: '1d' },
  { label: '5D', value: '5d' },
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '6M', value: '6M' },
  { label: '1Y', value: '1Y' },
  { label: '2Y', value: '2Y' },
  { label: '5Y', value: '5Y' },
];

export function TradingChart({
  symbol,
  data,
  quote,
  height = 400,
  showVolume = true,
  chartType = 'candlestick',
  onIntervalChange,
  className = '',
  enableRealTime = false,
  onDataUpdate
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const lineSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  
  const [selectedInterval, setSelectedInterval] = useState('1M');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentChartType, setCurrentChartType] = useState(chartType);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [selectedDrawingTool, setSelectedDrawingTool] = useState<string>('line');
  const [drawings, setDrawings] = useState<DrawingTool[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<DrawingTool | null>(null);
  const [isRealTimeActive, setIsRealTimeActive] = useState(enableRealTime);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  
  const realTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // Create chart with enhanced dark theme
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        backgroundColor: '#000000',
        textColor: '#f8fafc',
        fontSize: 12,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      },
      grid: {
        vertLines: { 
          color: 'rgba(255, 255, 255, 0.06)',
          style: LineStyle.Dotted,
          visible: true 
        },
        horzLines: { 
          color: 'rgba(255, 255, 255, 0.06)',
          style: LineStyle.Dotted,
          visible: true 
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: 'rgba(148, 163, 184, 0.8)',
          style: LineStyle.Solid,
          labelBackgroundColor: '#1e293b',
        },
        horzLine: {
          width: 1,
          color: 'rgba(148, 163, 184, 0.8)',
          style: LineStyle.Solid,
          labelBackgroundColor: '#1e293b',
        },
      },
      priceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textColor: '#cbd5e1',
        entireTextOnly: false,
        scaleMargins: {
          top: 0.08,
          bottom: showVolume ? 0.25 : 0.08,
        },
        borderVisible: true,
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textColor: '#cbd5e1',
        timeVisible: true,
        secondsVisible: isRealTimeActive,
        borderVisible: true,
        tickMarkFormatter: (time: any) => {
          const date = new Date(time * 1000);
          if (isRealTimeActive) {
            return date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });
          }
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });
        },
      },
      handleScale: {
        axisPressedMouseMove: {
          time: true,
          price: true,
        },
        mouseWheel: true,
        pinch: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      kineticScroll: {
        touch: true,
        mouse: false,
      },
    });

    chartRef.current = chart;

    // Add main price series based on chart type
    if (currentChartType === 'candlestick') {
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#00d4aa',
        downColor: '#ff4757',
        borderUpColor: '#00d4aa',
        borderDownColor: '#ff4757',
        wickUpColor: '#00d4aa',
        wickDownColor: '#ff4757',
        priceLineVisible: false,
        lastValueVisible: true,
        borderVisible: true,
      });
      candlestickSeriesRef.current = candlestickSeries;

      // Convert data to candlestick format with proper time handling
      const candlestickData: CandlestickData[] = data.map(item => {
        // If time is a string (timestamp), convert to number
        const timeValue = typeof item.time === 'string' ? parseInt(item.time) : item.time;
        return {
          time: timeValue as any,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        };
      })
      .filter(item => item.open > 0) // Filter out invalid data
      .sort((a, b) => (a.time as number) - (b.time as number)) // Sort by time ascending
      .reduce((acc, item) => {
        // Remove duplicates by keeping the last occurrence of each timestamp
        const existingIndex = acc.findIndex(existing => existing.time === item.time);
        if (existingIndex !== -1) {
          acc[existingIndex] = item; // Replace existing with newer data
        } else {
          acc.push(item);
        }
        return acc;
      }, [] as CandlestickData[]);

      if (candlestickData.length > 0) {
        // Debug: Log first few timestamps to check for issues
        console.log('Candlestick data timestamps (first 5):', candlestickData.slice(0, 5).map(d => ({
          timestamp: d.time,
          date: new Date((d.time as number) * 1000).toISOString()
        })));
        
        candlestickSeries.setData(candlestickData);
        console.log(`Loaded ${candlestickData.length} historical candles`);
        
        // Initialize lastTimestamp with the last historical data point
        const lastHistoricalTime = candlestickData[candlestickData.length - 1].time as number;
        lastTimestampRef.current = lastHistoricalTime;
        console.log('Initialized lastTimestamp with historical data:', {
          timestamp: lastHistoricalTime,
          date: new Date(lastHistoricalTime * 1000).toISOString()
        });
      }
    } else {
      const lineSeries = chart.addLineSeries({
        color: currentChartType === 'area' ? '#0ea5e9' : '#0ea5e9',
        lineWidth: 3,
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 6,
        crosshairMarkerBorderColor: '#0ea5e9',
        crosshairMarkerBackgroundColor: '#0ea5e9',
      });
      
      if (currentChartType === 'area') {
        lineSeries.applyOptions({
          topColor: 'rgba(14, 165, 233, 0.4)',
          bottomColor: 'rgba(14, 165, 233, 0.02)',
          lineColor: '#0ea5e9',
          lineWidth: 3,
        });
      }
      
      lineSeriesRef.current = lineSeries;

      // Convert data to line format with proper time handling
      const lineData: LineData[] = data.map(item => {
        const timeValue = typeof item.time === 'string' ? parseInt(item.time) : item.time;
        return {
          time: timeValue as any,
          value: item.close,
        };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => (a.time as number) - (b.time as number)) // Sort by time ascending
      .reduce((acc, item) => {
        // Remove duplicates by keeping the last occurrence of each timestamp
        const existingIndex = acc.findIndex(existing => existing.time === item.time);
        if (existingIndex !== -1) {
          acc[existingIndex] = item; // Replace existing with newer data
        } else {
          acc.push(item);
        }
        return acc;
      }, [] as LineData[]);

      if (lineData.length > 0) {
        lineSeries.setData(lineData);
        
        // Initialize lastTimestamp with the last historical data point
        const lastHistoricalTime = lineData[lineData.length - 1].time as number;
        lastTimestampRef.current = lastHistoricalTime;
        console.log('Initialized lastTimestamp with line data:', {
          timestamp: lastHistoricalTime,
          date: new Date(lastHistoricalTime * 1000).toISOString()
        });
      }
    }

    // Add volume series if enabled
    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        color: '#8b5cf6',
        priceScaleId: '',
        base: 0,
      });

      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.75,
          bottom: 0,
        },
        mode: PriceScaleMode.Logarithmic,
      });

      volumeSeriesRef.current = volumeSeries;

      const volumeData: HistogramData[] = data.map(item => {
        const timeValue = typeof item.time === 'string' ? parseInt(item.time) : item.time;
        return {
          time: timeValue as any,
          value: item.volume || 0,
          color: item.close >= item.open ? 'rgba(0, 212, 170, 0.8)' : 'rgba(255, 71, 87, 0.8)',
        };
      })
      .filter(item => item.value >= 0)
      .sort((a, b) => (a.time as number) - (b.time as number)) // Sort by time ascending
      .reduce((acc, item) => {
        // Remove duplicates by keeping the last occurrence of each timestamp
        const existingIndex = acc.findIndex(existing => existing.time === item.time);
        if (existingIndex !== -1) {
          acc[existingIndex] = item; // Replace existing with newer data
        } else {
          acc.push(item);
        }
        return acc;
      }, [] as HistogramData[]);

      if (volumeData.length > 0) {
        volumeSeries.setData(volumeData);
      }
    }

    // Add click handler for drawing
    const handleChartClick = (param: any) => {
      if (!isDrawingMode || !selectedDrawingTool) return;
      
      const price = param.seriesPrices?.get(candlestickSeriesRef.current || lineSeriesRef.current);
      if (!price || !param.time) return;
      
      if (!isDrawing) {
        // Start new drawing
        const newDrawing: DrawingTool = {
          id: Date.now().toString(),
          type: selectedDrawingTool as any,
          points: [{ time: param.time, price }],
          color: '#3b82f6',
        };
        setCurrentDrawing(newDrawing);
        setIsDrawing(true);
      } else if (currentDrawing) {
        // Complete drawing
        const completedDrawing = {
          ...currentDrawing,
          points: [...currentDrawing.points, { time: param.time, price }],
        };
        setDrawings(prev => [...prev, completedDrawing]);
        setCurrentDrawing(null);
        setIsDrawing(false);
        addDrawingToChart(chart, completedDrawing);
      }
    };
    
    if (isDrawingMode) {
      chart.subscribeClick(handleChartClick);
    }
    
    // Add existing drawings to chart
    drawings.forEach(drawing => {
      addDrawingToChart(chart, drawing);
    });

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (isDrawingMode && chart) {
        chart.unsubscribeClick(handleChartClick);
      }
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      if (realTimeIntervalRef.current) {
        clearInterval(realTimeIntervalRef.current);
      }
    };
  }, [data, height, showVolume, currentChartType, isDrawingMode, selectedDrawingTool, isDrawing, currentDrawing, drawings]);
  
  // State to track current 5-minute candle
  const [currentCandle, setCurrentCandle] = useState<{
    startTime: number;
    endTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  } | null>(null);
  
  // Helper function to get next 5-minute aligned timestamp
  const getNext5MinuteInterval = (timestamp: number): number => {
    const date = new Date(timestamp);
    const minutes = date.getMinutes();
    const alignedMinutes = Math.floor(minutes / 5) * 5;
    date.setMinutes(alignedMinutes, 0, 0); // Reset seconds and milliseconds
    return Math.floor(date.getTime() / 1000);
  };
  
  // Helper function to get current 5-minute interval start time
  const getCurrentCandleStartTime = (timestamp: number): number => {
    const date = new Date(timestamp);
    const minutes = date.getMinutes();
    const alignedMinutes = Math.floor(minutes / 5) * 5;
    date.setMinutes(alignedMinutes, 0, 0); // Reset seconds and milliseconds to 0
    return Math.floor(date.getTime() / 1000);
  };
  
  // Helper function to check if we should create a new candle
  const shouldCreateNewCandle = (timestamp: number, currentCandleStartTime: number): boolean => {
    const currentIntervalStart = getCurrentCandleStartTime(timestamp);
    return currentIntervalStart !== currentCandleStartTime;
  };

  // Real-time candle management
  
  // Real-time data updates with proper 5-minute candles
  useEffect(() => {
    if (!isRealTimeActive || !symbol) {
      return;
    }
    
    setConnectionStatus('connecting');
    
    const fetchRealTimeData = async () => {
      try {
        const response = await fetch(`/api/market/quote?symbol=${encodeURIComponent(symbol)}`);
        const result = await response.json();
        
        if (result.success && result.data.quote) {
          const quote = result.data.quote;
          const now = new Date();
          const currentTimestamp = now.getTime();
          
          // Check if market is closed and stop real-time updates
          if (quote.marketState === 'CLOSED') {
            console.log('Market is closed, stopping real-time updates');
            setConnectionStatus('disconnected');
            setIsRealTimeActive(false);
            
            // Clear the interval to stop further updates
            if (realTimeIntervalRef.current) {
              clearInterval(realTimeIntervalRef.current);
              realTimeIntervalRef.current = null;
            }
            return;
          }
          
          // Use actual market prices from Yahoo Finance
          const currentPrice = quote.regularMarketPrice;
          const dayHigh = quote.regularMarketDayHigh || currentPrice;
          const dayLow = quote.regularMarketDayLow || currentPrice;
          const openPrice = quote.regularMarketOpen || currentPrice;
          const volume = quote.regularMarketVolume || 0;
          
          // Debug: Log real market data
          console.log('Real market data:', {
            symbol,
            price: currentPrice,
            open: openPrice,
            high: dayHigh,
            low: dayLow,
            volume,
            marketState: quote.marketState
          });
          
          const currentCandleStartTime = getCurrentCandleStartTime(currentTimestamp);
          
          // Check if we need to create a new candle or update existing one
          if (!currentCandle || shouldCreateNewCandle(currentTimestamp, currentCandle.startTime)) {
            // Create new 5-minute candle using real market data
            const newCandle = {
              startTime: currentCandleStartTime,
              endTime: currentCandleStartTime + (5 * 60),
              open: openPrice,
              high: Math.max(openPrice, currentPrice, dayHigh),
              low: Math.min(openPrice, currentPrice, dayLow),
              close: currentPrice,
              volume: volume
            };
            
            setCurrentCandle(newCandle);
            
            console.log('Creating new 5-minute candle at:', new Date(currentCandleStartTime * 1000).toLocaleTimeString(), {
              open: openPrice,
              high: newCandle.high,
              low: newCandle.low,
              close: currentPrice,
              volume: volume
            });
            
          } else {
            // Update existing candle within the same 5-minute interval using real data
            const updatedCandle = {
              ...currentCandle,
              high: Math.max(currentCandle.high, currentPrice, dayHigh),
              low: Math.min(currentCandle.low, currentPrice, dayLow),
              close: currentPrice,
              volume: Math.max(currentCandle.volume, volume) // Use the latest volume data
            };
            
            setCurrentCandle(updatedCandle);
          }
          
          setLastUpdate(now);
          setConnectionStatus('connected');
        } else {
          console.warn('No quote data received from API');
          setConnectionStatus('disconnected');
        }
      } catch (error) {
        console.error('Real-time data fetch error:', error);
        setConnectionStatus('disconnected');
      }
    };
    
    // Initial fetch
    fetchRealTimeData();
    
    // Set up interval for real-time updates (every 2 seconds for stability)
    realTimeIntervalRef.current = setInterval(fetchRealTimeData, 2000);
    
    return () => {
      if (realTimeIntervalRef.current) {
        clearInterval(realTimeIntervalRef.current);
      }
    };
  }, [isRealTimeActive, symbol, showVolume, onDataUpdate]);
  
  // Track the last timestamp to ensure we only update with newer data
  const lastTimestampRef = useRef<number>(0);
  
  // Separate effect to update chart when currentCandle changes
  useEffect(() => {
    if (!currentCandle || !isRealTimeActive) return;
    
    // Ensure startTime is a proper number timestamp
    const timestamp = typeof currentCandle.startTime === 'number' 
      ? currentCandle.startTime 
      : parseInt(currentCandle.startTime.toString());
    
    // Only proceed if this timestamp is newer than the last one
    if (timestamp <= lastTimestampRef.current) {
      console.log('Skipping update - timestamp is not newer than last:', {
        currentTimestamp: timestamp,
        lastTimestamp: lastTimestampRef.current,
        currentTime: new Date(timestamp * 1000).toISOString(),
        lastTime: new Date(lastTimestampRef.current * 1000).toISOString()
      });
      return;
    }
    
    // Debug: Check timestamp format
    console.log('Updating chart with timestamp:', {
      originalTime: currentCandle.startTime,
      convertedTime: timestamp,
      timeType: typeof timestamp,
      dateString: new Date(timestamp * 1000).toISOString(),
      isNewer: timestamp > lastTimestampRef.current
    });
    
    // Update candlestick chart
    if (candlestickSeriesRef.current) {
      try {
        candlestickSeriesRef.current.update({
          time: timestamp as any,
          open: currentCandle.open,
          high: currentCandle.high,
          low: currentCandle.low,
          close: currentCandle.close,
        });
        lastTimestampRef.current = timestamp;
      } catch (error) {
        console.error('Failed to update candlestick chart:', error);
        console.error('Error details:', {
          timestamp,
          lastTimestamp: lastTimestampRef.current,
          candle: currentCandle
        });
      }
    }
    
    // Update line chart
    if (lineSeriesRef.current) {
      try {
        lineSeriesRef.current.update({
          time: timestamp as any,
          value: currentCandle.close,
        });
      } catch (error) {
        console.error('Failed to update line chart:', error);
      }
    }
    
    // Update volume chart
    if (volumeSeriesRef.current && showVolume) {
      try {
        volumeSeriesRef.current.update({
          time: timestamp as any,
          value: currentCandle.volume,
          color: currentCandle.close >= currentCandle.open ? 'rgba(0, 212, 170, 0.8)' : 'rgba(255, 71, 87, 0.8)',
        });
      } catch (error) {
        console.error('Failed to update volume chart:', error);
      }
    }
    
    // Trigger callback with current candle data
    const chartDataForCallback: ChartData = {
      time: timestamp.toString(),
      open: currentCandle.open,
      high: currentCandle.high,
      low: currentCandle.low,
      close: currentCandle.close,
      volume: currentCandle.volume
    };
    
    onDataUpdate?.(chartDataForCallback);
  }, [currentCandle, isRealTimeActive, showVolume, onDataUpdate]);
  
  // Function to add drawing to chart
  const addDrawingToChart = useCallback((chart: IChartApi, drawing: DrawingTool) => {
    if (drawing.points.length < 2) return;
    
    const [point1, point2] = drawing.points;
    
    if (drawing.type === 'line') {
      const lineSeries = chart.addLineSeries({
        color: drawing.color,
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      
      lineSeries.setData([
        { time: point1.time, value: point1.price },
        { time: point2.time, value: point2.price },
      ]);
    }
  }, []);

  const handleIntervalChange = (interval: string) => {
    setSelectedInterval(interval);
    onIntervalChange?.(interval);
  };

  const handleChartTypeChange = (type: 'candlestick' | 'line' | 'area') => {
    setCurrentChartType(type);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  const toggleRealTime = () => {
    setIsRealTimeActive(!isRealTimeActive);
  };

  return (
    <Card className={`bg-black border-gray-800 shadow-2xl ${className}`}>
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gradient-to-r from-gray-900/50 to-black/50">
        <div className="flex items-center space-x-4">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-bold text-white">{symbol}</h3>
              {isRealTimeActive && (
                <div className="flex items-center space-x-1">
                  {connectionStatus === 'connected' ? (
                    <Wifi className="w-4 h-4 text-green-400" />
                  ) : connectionStatus === 'connecting' ? (
                    <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-xs text-gray-400 font-bold">LIVE 5M</span>
                </div>
              )}
            </div>
            {quote && (
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-2xl font-bold text-white">
                  {formatPrice(quote.regularMarketPrice)}
                </span>
                <div className={`flex items-center space-x-1 ${getChangeColor(quote.regularMarketChange)}`}>
                  {quote.regularMarketChange >= 0 ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                  <span className="text-lg font-semibold">
                    {formatChangePercent(quote.regularMarketChangePercent)}
                  </span>
                </div>
                <Badge 
                  variant={quote.marketState === 'REGULAR' ? 'default' : 'secondary'}
                  className="text-xs font-semibold bg-blue-600 text-white border-blue-500"
                >
                  {quote.marketState === 'REGULAR' ? 'MARKET OPEN' : quote.marketState}
                </Badge>
                {isRealTimeActive && (
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-400">
                      Last update: {lastUpdate.toLocaleTimeString()}
                    </span>
                    {currentCandle && (
                      <span className="text-xs text-purple-400">
                        Candle: {new Date(currentCandle.startTime * 1000).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}-{new Date(currentCandle.endTime * 1000).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Real-time Toggle */}
          <Button
            variant={isRealTimeActive ? 'default' : 'outline'}
            size="sm"
            onClick={toggleRealTime}
            className={`flex items-center space-x-2 px-3 ${
              isRealTimeActive 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'border-gray-600 text-gray-300 hover:bg-gray-800'
            }`}
          >
            {isRealTimeActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="text-xs font-medium">
              {isRealTimeActive ? 'LIVE 5M' : 'START LIVE 5M'}
            </span>
          </Button>
          
          {/* Chart Type Buttons */}
          <div className="flex items-center space-x-1 bg-gray-800 rounded-md p-1">
            <Button
              variant={currentChartType === 'candlestick' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleChartTypeChange('candlestick')}
              className="p-2 h-8"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
            <Button
              variant={currentChartType === 'line' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleChartTypeChange('line')}
              className="p-2 h-8"
            >
              <Activity className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Time Intervals */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/30">
        <div className="flex items-center space-x-1 bg-gray-800 rounded-lg p-1">
          {intervals.map((interval) => (
            <Button
              key={interval.value}
              variant={selectedInterval === interval.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleIntervalChange(interval.value)}
              className={`h-8 px-3 text-xs font-medium transition-all ${
                selectedInterval === interval.value 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {interval.label}
            </Button>
          ))}
        </div>

        {quote && (
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-1">
              <span className="text-gray-400 font-medium">OPEN:</span>
              <span className="text-white font-semibold">{formatPrice(quote.regularMarketOpen)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-gray-400 font-medium">HIGH:</span>
              <span className="text-green-400 font-semibold">{formatPrice(quote.regularMarketDayHigh)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-gray-400 font-medium">LOW:</span>
              <span className="text-red-400 font-semibold">{formatPrice(quote.regularMarketDayLow)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-gray-400 font-medium">VOLUME:</span>
              <span className="text-blue-400 font-semibold">{quote.regularMarketVolume.toLocaleString()}</span>
            </div>
            {isRealTimeActive && (
              <div className="flex items-center space-x-1">
                <span className="text-gray-400 font-medium">TIMEFRAME:</span>
                <span className="text-purple-400 font-semibold">5 MINUTES</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div className="relative" style={{ backgroundColor: '#000000' }}>
        <div
          ref={chartContainerRef}
          className={`${isFullscreen ? 'fixed inset-0 z-50' : 'rounded-b-lg overflow-hidden'}`}
          style={{ 
            height: isFullscreen ? '100vh' : height,
            backgroundColor: '#000000'
          }}
        />
        
        {data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-300 text-lg font-medium">Loading chart data...</p>
              <p className="text-gray-500 text-sm mt-2">Fetching market data for {symbol}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
