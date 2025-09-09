import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IOTPVerification extends Document {
  _id: string;
  email: string;
  otp: string;
  type: 'email_verification' | 'password_reset';
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const otpVerificationSchema = new Schema<IOTPVerification>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
      length: 6,
    },
    type: {
      type: String,
      enum: ['email_verification', 'password_reset'],
      default: 'email_verification',
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
otpVerificationSchema.index({ email: 1, type: 1 });
otpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

const OTPVerification: Model<IOTPVerification> = 
  mongoose.models.OTPVerification || 
  mongoose.model<IOTPVerification>('OTPVerification', otpVerificationSchema);

export default OTPVerification;
