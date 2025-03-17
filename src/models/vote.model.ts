import mongoose, { Document, Schema } from "mongoose";

export interface VoteDocument extends Document {
  coin_id: mongoose.Types.ObjectId;
  ip_address: string;
  organic: boolean;
  created_at: Date;
}

const voteSchema = new Schema<VoteDocument>({
  coin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Coin",
    required: true,
  },
  ip_address: { type: String, required: true },
  organic: { type: Boolean },
  created_at: { type: Date },
});

const VoteModel = mongoose.model<VoteDocument>("Vote", voteSchema);
export default VoteModel;
