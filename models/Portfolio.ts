import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IHolding {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  dayChange: number;
  dayChangePercent: number;
  lastUpdated: Date;
}

export interface IPortfolio extends Document {
  _id: string;
  userId: string;
  totalInvested: number;
  currentValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  dayPnl: number;
  dayPnlPercent: number;
  cash: number; // Available cash for trading
  holdings: IHolding[];
  createdAt: Date;
  updatedAt: Date;
}

const holdingSchema = new Schema<IHolding>({
  symbol: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  averagePrice: { type: Number, required: true, min: 0 },
  currentPrice: { type: Number, required: true, min: 0 },
  investedValue: { type: Number, required: true, min: 0 },
  currentValue: { type: Number, required: true, min: 0 },
  pnl: { type: Number, required: true },
  pnlPercent: { type: Number, required: true },
  dayChange: { type: Number, default: 0 },
  dayChangePercent: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
});

const portfolioSchema = new Schema<IPortfolio>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    totalInvested: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    currentValue: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalPnl: {
      type: Number,
      required: true,
      default: 0,
    },
    totalPnlPercent: {
      type: Number,
      required: true,
      default: 0,
    },
    dayPnl: {
      type: Number,
      default: 0,
    },
    dayPnlPercent: {
      type: Number,
      default: 0,
    },
    cash: {
      type: Number,
      required: true,
      default: 1000000, // Default virtual cash: ₹10 lakhs
      min: 0,
    },
    holdings: [holdingSchema],
  },
  {
    timestamps: true,
  }
);

const Portfolio: Model<IPortfolio> = mongoose.models.Portfolio || mongoose.model<IPortfolio>('Portfolio', portfolioSchema);

export default Portfolio;
