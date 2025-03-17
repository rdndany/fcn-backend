import CoinModel, { CoinDocument } from "../models/coin.model";
import FavoritesModel, { FavoritesDocument } from "../models/favorites.model";
import { Types } from "mongoose";

export const updateIsFavoritedFlag = async (
  coinIds: Types.ObjectId[], // Coin IDs to check for favorites
  userId: string // User ID to check if they favorited the coins
): Promise<void> => {
  try {
    /** -------------------------------
     * STEP 1: Get user's favorite coins
     --------------------------------*/
    const userFavorites = await FavoritesModel.find({
      user_id: userId,
      coin_id: { $in: coinIds }, // Only the coins the user might have favorited
    });

    /** -------------------------------
     * STEP 2: Prepare bulk updates for isFavorited (true/false)
     --------------------------------*/
    const favoriteCoinIds = userFavorites.map((fav) => fav.coin_id.toString());

    const isFavoritedBulkOps = coinIds.map((coinId) => ({
      updateOne: {
        filter: { _id: coinId },
        update: {
          $set: { isFavorited: favoriteCoinIds.includes(coinId.toString()) },
        },
      },
    }));

    // Execute bulk update if needed
    if (isFavoritedBulkOps.length > 0) {
      const result = await CoinModel.bulkWrite(isFavoritedBulkOps);
    } else {
      console.log("No updates needed for isFavorited.");
    }
  } catch (error) {
    console.error("Error updating isFavorited flags:", error);
    throw new Error("Failed to update isFavorited flags.");
  }
};

export const getFavoritedCoinIds = async (
  userId: string,
  coinIds: Types.ObjectId[]
) => {
  const favorites = await FavoritesModel.find({
    user_id: userId,
    coin_id: { $in: coinIds },
  }).select("coin_id");

  return favorites.map((fav) => fav.coin_id.toString());
};
