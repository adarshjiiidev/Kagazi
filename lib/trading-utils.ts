/**
 * Trading Utilities for Indian Stock Market
 * Includes brokerage calculation, P&L calculation, and order execution logic
 */

import { ITrade } from '@/models/Trade';
import { IPortfolio, IHolding } from '@/models/Portfolio';
import { QuoteData } from './market-data';

export interface TradingCharges {
  brokerage: number;
  stt: number; // Securities Transaction Tax
  exchangeCharges: number;
  gst: number;
  stampDuty: number;
  sebiCharges: number;
  total: number;
}

export interface OrderRequest {
  symbol: string;
  type: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
  quantity: number;
  price?: number; // Current market price for market orders
  limitPrice?: number; // For limit orders
  stopPrice?: number; // For stop orders
}

export interface OrderValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Calculate trading charges for Indian stock market
 * Based on typical discount broker rates
 */
export function calculateTradingCharges(
  orderValue: number, 
  orderType: 'BUY' | 'SELL'
): TradingCharges {
  // Brokerage: ₹20 per order or 0.03% whichever is lower
  const brokerageRate = 0.0003; // 0.03%
  const brokerageFlat = 20;
  const brokerage = Math.min(orderValue * brokerageRate, brokerageFlat);

  // STT: 0.1% on delivery (both buy & sell) for equity
  const sttRate = orderType === 'SELL' ? 0.001 : 0; // Only on sell side for delivery
  const stt = orderValue * sttRate;

  // Exchange charges: NSE - 0.00345%
  const exchangeRate = 0.0000345;
  const exchangeCharges = orderValue * exchangeRate;

  // SEBI charges: 0.0001%
  const sebiRate = 0.000001;
  const sebiCharges = orderValue * sebiRate;

  // Stamp duty: 0.015% or ₹1500 per crore on buy side
  const stampDutyRate = orderType === 'BUY' ? 0.00015 : 0;
  const stampDuty = orderValue * stampDutyRate;

  // GST: 18% on (brokerage + exchange charges + SEBI charges)
  const gstableAmount = brokerage + exchangeCharges + sebiCharges;
  const gst = gstableAmount * 0.18;

  const total = brokerage + stt + exchangeCharges + gst + stampDuty + sebiCharges;

  return {
    brokerage: Math.round(brokerage * 100) / 100,
    stt: Math.round(stt * 100) / 100,
    exchangeCharges: Math.round(exchangeCharges * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    stampDuty: Math.round(stampDuty * 100) / 100,
    sebiCharges: Math.round(sebiCharges * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Validate order before execution
 */
export function validateOrder(
  order: OrderRequest, 
  portfolio: IPortfolio, 
  currentPrice: number
): OrderValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validations
  if (order.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }

  if (order.quantity % 1 !== 0) {
    errors.push('Quantity must be a whole number');
  }

  if (order.orderType === 'LIMIT' && !order.limitPrice) {
    errors.push('Limit price is required for limit orders');
  }

  if (order.orderType === 'STOP' && !order.stopPrice) {
    errors.push('Stop price is required for stop orders');
  }

  if (order.orderType === 'STOP_LIMIT' && (!order.limitPrice || !order.stopPrice)) {
    errors.push('Both limit price and stop price are required for stop-limit orders');
  }

  // Price validations
  if (order.limitPrice && order.limitPrice <= 0) {
    errors.push('Limit price must be greater than 0');
  }

  if (order.stopPrice && order.stopPrice <= 0) {
    errors.push('Stop price must be greater than 0');
  }

  // Market hours validation (can be bypassed for paper trading)
  // const marketOpen = isMarketOpen();
  // if (!marketOpen && order.orderType === 'MARKET') {
  //   warnings.push('Market is closed. Order will be queued for next session.');
  // }

  // Buy order validations
  if (order.type === 'BUY') {
    const orderPrice = order.orderType === 'MARKET' ? currentPrice : (order.limitPrice || currentPrice);
    const orderValue = order.quantity * orderPrice;
    const charges = calculateTradingCharges(orderValue, 'BUY');
    const totalRequired = orderValue + charges.total;

    if (totalRequired > portfolio.cash) {
      errors.push(`Insufficient funds. Required: ₹${totalRequired.toFixed(2)}, Available: ₹${portfolio.cash.toFixed(2)}`);
    }

    // Price impact warning for large orders
    if (order.quantity > 1000) {
      warnings.push('Large order size may impact market price');
    }
  }

  // Sell order validations
  if (order.type === 'SELL') {
    const holding = portfolio.holdings.find(h => h.symbol === order.symbol);
    
    if (!holding) {
      errors.push(`You don't own any shares of ${order.symbol}`);
    } else if (holding.quantity < order.quantity) {
      errors.push(`Insufficient quantity. You own ${holding.quantity} shares, trying to sell ${order.quantity}`);
    }
  }

  // Price band validations (Indian markets have 10% price bands)
  const priceVariation = Math.abs(currentPrice - (order.limitPrice || currentPrice)) / currentPrice;
  if (priceVariation > 0.1) {
    warnings.push('Order price is beyond 10% price band');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Execute market order
 */
export function executeMarketOrder(
  order: OrderRequest,
  currentPrice: number
): { executedPrice: number; executedQuantity: number; status: string } {
  // Add some realistic price slippage for market orders
  const slippagePercent = Math.random() * 0.001; // 0-0.1% slippage
  const slippage = order.type === 'BUY' ? slippagePercent : -slippagePercent;
  const executedPrice = currentPrice * (1 + slippage);

  return {
    executedPrice: Math.round(executedPrice * 100) / 100,
    executedQuantity: order.quantity,
    status: 'EXECUTED',
  };
}

/**
 * Check if limit order should be executed
 */
export function checkLimitOrderExecution(
  order: { type: 'BUY' | 'SELL'; limitPrice: number },
  currentPrice: number
): boolean {
  if (order.type === 'BUY') {
    return currentPrice <= order.limitPrice;
  } else {
    return currentPrice >= order.limitPrice;
  }
}

/**
 * Update portfolio after trade execution
 */
export function updatePortfolioAfterTrade(
  portfolio: IPortfolio,
  trade: ITrade,
  currentQuote: QuoteData
): IPortfolio {
  const updatedPortfolio = { ...portfolio };
  
  if (trade.type === 'BUY') {
    // Deduct cash
    updatedPortfolio.cash -= (trade.totalValue + trade.charges.total);
    
    // Update or add holding
    const existingHolding = updatedPortfolio.holdings.find(h => h.symbol === trade.symbol);
    
    if (existingHolding) {
      // Update existing holding
      const totalQuantity = existingHolding.quantity + trade.executedQuantity;
      const totalInvested = (existingHolding.averagePrice * existingHolding.quantity) + 
                           (trade.executedPrice * trade.executedQuantity) + trade.charges.total;
      
      existingHolding.quantity = totalQuantity;
      existingHolding.averagePrice = totalInvested / totalQuantity;
      existingHolding.investedValue = totalInvested;
      existingHolding.currentPrice = currentQuote.regularMarketPrice;
      existingHolding.currentValue = totalQuantity * currentQuote.regularMarketPrice;
      existingHolding.pnl = existingHolding.currentValue - existingHolding.investedValue;
      existingHolding.pnlPercent = (existingHolding.pnl / existingHolding.investedValue) * 100;
      existingHolding.dayChange = currentQuote.regularMarketChange;
      existingHolding.dayChangePercent = currentQuote.regularMarketChangePercent;
      existingHolding.lastUpdated = new Date();
    } else {
      // Add new holding
      const investedValue = (trade.executedPrice * trade.executedQuantity) + trade.charges.total;
      const currentValue = trade.executedQuantity * currentQuote.regularMarketPrice;
      
      const newHolding: IHolding = {
        symbol: trade.symbol,
        quantity: trade.executedQuantity,
        averagePrice: investedValue / trade.executedQuantity,
        currentPrice: currentQuote.regularMarketPrice,
        investedValue,
        currentValue,
        pnl: currentValue - investedValue,
        pnlPercent: ((currentValue - investedValue) / investedValue) * 100,
        dayChange: currentQuote.regularMarketChange,
        dayChangePercent: currentQuote.regularMarketChangePercent,
        lastUpdated: new Date(),
      };
      
      updatedPortfolio.holdings.push(newHolding);
    }
    
  } else if (trade.type === 'SELL') {
    // Add cash (minus charges)
    updatedPortfolio.cash += (trade.totalValue - trade.charges.total);
    
    // Update holding
    const holding = updatedPortfolio.holdings.find(h => h.symbol === trade.symbol);
    if (holding) {
      holding.quantity -= trade.executedQuantity;
      
      if (holding.quantity === 0) {
        // Remove holding if quantity becomes 0
        updatedPortfolio.holdings = updatedPortfolio.holdings.filter(h => h.symbol !== trade.symbol);
      } else {
        // Update remaining holding values
        holding.investedValue = holding.averagePrice * holding.quantity;
        holding.currentValue = holding.quantity * currentQuote.regularMarketPrice;
        holding.pnl = holding.currentValue - holding.investedValue;
        holding.pnlPercent = (holding.pnl / holding.investedValue) * 100;
        holding.lastUpdated = new Date();
      }
    }
  }
  
  // Recalculate portfolio totals
  updatedPortfolio.totalInvested = updatedPortfolio.holdings.reduce((sum, holding) => 
    sum + holding.investedValue, 0
  );
  
  updatedPortfolio.currentValue = updatedPortfolio.holdings.reduce((sum, holding) => 
    sum + holding.currentValue, 0
  );
  
  updatedPortfolio.totalPnl = updatedPortfolio.currentValue - updatedPortfolio.totalInvested;
  updatedPortfolio.totalPnlPercent = updatedPortfolio.totalInvested > 0 
    ? (updatedPortfolio.totalPnl / updatedPortfolio.totalInvested) * 100 
    : 0;
    
  updatedPortfolio.dayPnl = updatedPortfolio.holdings.reduce((sum, holding) => 
    sum + (holding.dayChange * holding.quantity), 0
  );
  
  updatedPortfolio.dayPnlPercent = updatedPortfolio.currentValue > 0 
    ? (updatedPortfolio.dayPnl / updatedPortfolio.currentValue) * 100 
    : 0;

  return updatedPortfolio;
}

/**
 * Calculate P&L for a sell trade
 */
export function calculateTradePnL(
  sellTrade: ITrade,
  averageBuyPrice: number
): number {
  const buyValue = sellTrade.executedQuantity * averageBuyPrice;
  const sellValue = sellTrade.totalValue;
  const totalCharges = sellTrade.charges.total;
  
  return sellValue - buyValue - totalCharges;
}

/**
 * Get order book summary
 */
export interface OrderBookSummary {
  totalBuyOrders: number;
  totalSellOrders: number;
  totalBuyValue: number;
  totalSellValue: number;
  pendingOrders: number;
  executedToday: number;
}

export function getOrderBookSummary(trades: ITrade[]): OrderBookSummary {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayTrades = trades.filter(trade => 
    trade.createdAt >= today
  );
  
  const summary = todayTrades.reduce((acc, trade) => {
    if (trade.type === 'BUY') {
      acc.totalBuyOrders++;
      acc.totalBuyValue += trade.totalValue;
    } else {
      acc.totalSellOrders++;
      acc.totalSellValue += trade.totalValue;
    }
    
    if (trade.status === 'PENDING') {
      acc.pendingOrders++;
    } else if (trade.status === 'EXECUTED') {
      acc.executedToday++;
    }
    
    return acc;
  }, {
    totalBuyOrders: 0,
    totalSellOrders: 0,
    totalBuyValue: 0,
    totalSellValue: 0,
    pendingOrders: 0,
    executedToday: 0,
  });
  
  return summary;
}

/**
 * Format currency for Indian market
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
}

/**
 * Get trading session info
 */
export function getTradingSessionInfo(): {
  isOpen: boolean;
  nextSession: string;
  timeToNextSession: string;
} {
  const now = new Date();
  const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  
  const day = istTime.getDay();
  const isWeekend = day === 0 || day === 6;
  
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const currentTime = hours * 60 + minutes;
  
  const marketOpen = 9 * 60 + 15; // 9:15 AM
  const marketClose = 15 * 60 + 30; // 3:30 PM
  
  const isOpen = !isWeekend && currentTime >= marketOpen && currentTime <= marketClose;
  
  let nextSession: string;
  let timeToNextSession: string;
  
  if (isOpen) {
    nextSession = 'Market Close';
    const minutesToClose = marketClose - currentTime;
    timeToNextSession = `${Math.floor(minutesToClose / 60)}h ${minutesToClose % 60}m`;
  } else {
    nextSession = 'Market Open';
    let nextOpen = new Date(istTime);
    
    if (currentTime >= marketClose || isWeekend) {
      // Next day
      nextOpen.setDate(nextOpen.getDate() + 1);
      nextOpen.setHours(9, 15, 0, 0);
    } else {
      // Same day
      nextOpen.setHours(9, 15, 0, 0);
    }
    
    // Skip weekends
    while (nextOpen.getDay() === 0 || nextOpen.getDay() === 6) {
      nextOpen.setDate(nextOpen.getDate() + 1);
    }
    
    const timeDiff = nextOpen.getTime() - istTime.getTime();
    const hoursToOpen = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutesToOpen = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    timeToNextSession = `${hoursToOpen}h ${minutesToOpen}m`;
  }
  
  return {
    isOpen,
    nextSession,
    timeToNextSession,
  };
}
