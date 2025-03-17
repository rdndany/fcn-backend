import mongoose, { Document, Schema } from "mongoose";
import { CoinDocument } from "./coin.model";

export interface FavoritesDocument extends Document {
  coin_id: CoinDocument;
  user_id: String;
}

const favoritesSchema = new Schema<FavoritesDocument>(
  {
    coin_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Coin",
    },
    user_id: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const FavoritesModel = mongoose.model<FavoritesDocument>(
  "Favorites",
  favoritesSchema
);
export default FavoritesModel;
