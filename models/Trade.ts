import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITrade extends Document {
  _id: string;
  userId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
  quantity: number;
  price: number; // Execution price
  limitPrice?: number; // For limit orders
  stopPrice?: number; // For stop orders
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'PARTIAL';
  executedQuantity: number;
  executedPrice: number;
  totalValue: number;
  charges: {
    brokerage: number;
    stt: number; // Securities Transaction Tax
    exchangeCharges: number;
    gst: number;
    stampDuty: number;
    sebiCharges: number;
    total: number;
  };
  pnl?: number; // Profit/Loss for sell orders
  createdAt: Date;
  updatedAt: Date;
  executedAt?: Date;
}

const tradeSchema = new Schema<ITrade>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['BUY', 'SELL'],
      required: true,
    },
    orderType: {
      type: String,
      enum: ['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'],
      required: true,
      default: 'MARKET',
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    limitPrice: {
      type: Number,
      min: 0,
    },
    stopPrice: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ['PENDING', 'EXECUTED', 'CANCELLED', 'PARTIAL'],
      default: 'PENDING',
    },
    executedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    executedPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalValue: {
      type: Number,
      required: true,
      min: 0,
    },
    charges: {
      brokerage: { type: Number, default: 0 },
      stt: { type: Number, default: 0 },
      exchangeCharges: { type: Number, default: 0 },
      gst: { type: Number, default: 0 },
      stampDuty: { type: Number, default: 0 },
      sebiCharges: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    pnl: {
      type: Number,
      default: 0,
    },
    executedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for better query performance
tradeSchema.index({ userId: 1, createdAt: -1 });
tradeSchema.index({ userId: 1, symbol: 1 });
tradeSchema.index({ userId: 1, status: 1 });

const Trade: Model<ITrade> = mongoose.models.Trade || mongoose.model<ITrade>('Trade', tradeSchema);

export default Trade;
