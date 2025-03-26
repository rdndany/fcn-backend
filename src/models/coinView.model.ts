import mongoose, { Document, Schema } from "mongoose";

export interface CoinViewDocument extends Document {
  coinId: mongoose.Types.ObjectId;
  ip_address: string;
  user_agent?: string;
  created_at: Date;
}

const coinViewSchema = new Schema<CoinViewDocument>({
  coinId: {
    type: Schema.Types.ObjectId,
    ref: "Coin",
    required: true,
    index: true,
  },
  ip_address: {
    type: String,
    required: true,
    index: true,
  },
  user_agent: { type: String },
  created_at: {
    type: Date,
    default: Date.now,
    index: { expires: "30d" }, // Auto-deletes after 30 days
  },
});

// Prevents duplicate views from same IP for same coin within 24h
coinViewSchema.index(
  { coinId: 1, ip_address: 1 },
  {
    unique: true,
    partialFilterExpression: {
      created_at: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  }
);

const CoinViewModel = mongoose.model<CoinViewDocument>(
  "CoinView",
  coinViewSchema
);
export default CoinViewModel;
