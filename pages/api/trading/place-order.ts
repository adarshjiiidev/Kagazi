import type { NextApiRequest, NextApiResponse } from 'next';
import { requireEmailVerification } from '@/lib/session-management';
import { createErrorHandler } from '@/lib/error-handling';
import dbConnect from '@/lib/mongodb';
import Trade from '@/models/Trade';
import Portfolio from '@/models/Portfolio';
import { getQuote } from '@/lib/market-data';
import {
  OrderRequest,
  validateOrder,
  calculateTradingCharges,
  executeMarketOrder,
  updatePortfolioAfterTrade
} from '@/lib/trading-utils';

const handler = createErrorHandler()(
  requireEmailVerification(async (req, res, session) => {
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        message: 'Only POST requests are allowed'
      });
    }

    await dbConnect();

    const orderRequest: OrderRequest = req.body;

    // Validate required fields
    if (!orderRequest.symbol || !orderRequest.type || !orderRequest.orderType || !orderRequest.quantity) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields: symbol, type, orderType, quantity'
      });
    }

    try {
      // Get current quote for the symbol
      const quote = await getQuote(orderRequest.symbol);
      if (!quote) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_SYMBOL',
          message: `Unable to fetch quote for symbol: ${orderRequest.symbol}`
        });
      }

      // Get or create user portfolio
      let portfolio = await Portfolio.findOne({ userId: session.user.id });
      if (!portfolio) {
        portfolio = new Portfolio({
          userId: session.user.id,
          cash: 1000000, // Default ₹10 lakh virtual money
          totalInvested: 0,
          currentValue: 0,
          totalPnl: 0,
          totalPnlPercent: 0,
          holdings: []
        });
        await portfolio.save();
      }

      // Validate the order
      const validation = validateOrder(orderRequest, portfolio, quote.regularMarketPrice);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'ORDER_VALIDATION_FAILED',
          message: validation.errors[0],
          errors: validation.errors,
          warnings: validation.warnings
        });
      }

      // Calculate order details
      let executedPrice = quote.regularMarketPrice;
      let executedQuantity = orderRequest.quantity;
      let orderStatus = 'PENDING';

      // For market orders, execute immediately
      if (orderRequest.orderType === 'MARKET') {
        const execution = executeMarketOrder(orderRequest, quote.regularMarketPrice);
        executedPrice = execution.executedPrice;
        executedQuantity = execution.executedQuantity;
        orderStatus = execution.status;
      }

      const orderValue = executedPrice * executedQuantity;
      const charges = calculateTradingCharges(orderValue, orderRequest.type);

      // Create trade record
      const trade = new Trade({
        userId: session.user.id,
        symbol: orderRequest.symbol,
        type: orderRequest.type,
        orderType: orderRequest.orderType,
        quantity: orderRequest.quantity,
        price: executedPrice,
        limitPrice: orderRequest.limitPrice,
        stopPrice: orderRequest.stopPrice,
        status: orderStatus,
        executedQuantity: orderStatus === 'EXECUTED' ? executedQuantity : 0,
        executedPrice: orderStatus === 'EXECUTED' ? executedPrice : 0,
        totalValue: orderValue,
        charges,
        executedAt: orderStatus === 'EXECUTED' ? new Date() : undefined
      });

      await trade.save();

      // Update portfolio if order was executed
      if (orderStatus === 'EXECUTED') {
        const updatedPortfolio = updatePortfolioAfterTrade(portfolio, trade, quote);
        
        // Save updated portfolio
        await Portfolio.findOneAndUpdate(
          { userId: session.user.id },
          {
            cash: updatedPortfolio.cash,
            totalInvested: updatedPortfolio.totalInvested,
            currentValue: updatedPortfolio.currentValue,
            totalPnl: updatedPortfolio.totalPnl,
            totalPnlPercent: updatedPortfolio.totalPnlPercent,
            dayPnl: updatedPortfolio.dayPnl,
            dayPnlPercent: updatedPortfolio.dayPnlPercent,
            holdings: updatedPortfolio.holdings
          },
          { new: true }
        );
      }

      return res.status(201).json({
        success: true,
        message: orderStatus === 'EXECUTED' 
          ? `${orderRequest.type} order executed successfully`
          : `${orderRequest.type} order placed successfully`,
        data: {
          orderId: trade._id,
          symbol: trade.symbol,
          type: trade.type,
          orderType: trade.orderType,
          quantity: trade.quantity,
          price: trade.price,
          status: trade.status,
          totalValue: trade.totalValue,
          charges: trade.charges,
          executedAt: trade.executedAt
        },
        warnings: validation.warnings
      });

    } catch (error) {
      console.error('Place order error:', error);
      return res.status(500).json({
        success: false,
        error: 'ORDER_EXECUTION_FAILED',
        message: 'Failed to place order. Please try again.'
      });
    }
  })
);

export default handler;
