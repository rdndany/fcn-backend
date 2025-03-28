import CoinModel from "../models/coin.model";
import FavoritesModel from "../models/favorites.model";
import { Types } from "mongoose";
import { getLogger } from "log4js";

const logger = getLogger("favorites-service");

export async function updateIsFavoritedFlag(
  coinIds: Types.ObjectId[],
  userId: string
): Promise<boolean> {
  try {
    logger.info("Attempting to update favorite flags:", {
      coinCount: coinIds.length,
      userId,
    });

    // Input validation
    if (!coinIds.length || !userId) {
      logger.warn("Invalid parameters for updating favorite flags:", {
        hasCoinIds: Boolean(coinIds.length),
        hasUserId: Boolean(userId),
      });
      return false;
    }

    // Find all favorites for the given user and coins in a single query
    const favorites = await FavoritesModel.find({
      user_id: userId,
      coin_id: { $in: coinIds },
    })
      .select("coin_id")
      .lean();

    // Create a Set for O(1) lookup of favorited coin IDs
    const favoritedCoinIds = new Set(
      favorites.map((f) => f.coin_id.toString())
    );

    // Prepare bulk update operations
    const bulkOps = coinIds.map((coinId) => ({
      updateOne: {
        filter: { _id: coinId },
        update: {
          $set: { isFavorited: favoritedCoinIds.has(coinId.toString()) },
        },
      },
    }));

    // Execute bulk update in a single operation
    const result = await CoinModel.bulkWrite(bulkOps);

    logger.info("Successfully updated favorite flags:", {
      totalCoins: coinIds.length,
      updatedCoins: result.modifiedCount,
      favoritedCount: favoritedCoinIds.size,
    });

    return true;
  } catch (error) {
    logger.error("Error updating favorite flags:", {
      error: error instanceof Error ? error.message : "Unknown error",
      coinCount: coinIds.length,
      userId,
    });
    return false;
  }
}

export async function getFavoritedCoinIds(
  userId: string,
  coinIds: Types.ObjectId[]
): Promise<string[]> {
  try {
    logger.info("Fetching favorited coin IDs:", {
      userId,
      coinCount: coinIds.length,
    });

    const favorites = await FavoritesModel.find({
      user_id: userId,
      coin_id: { $in: coinIds },
    })
      .select("coin_id")
      .lean();

    const favoritedIds = favorites.map((fav) => fav.coin_id.toString());

    logger.info("Successfully fetched favorited coin IDs:", {
      userId,
      foundCount: favoritedIds.length,
    });

    return favoritedIds;
  } catch (error) {
    logger.error("Error fetching favorited coin IDs:", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId,
    });
    return [];
  }
}

export async function getFavoritedCoinBySlug(
  slug: string,
  userId: string
): Promise<boolean> {
  const coin = await CoinModel.findOne({ slug }).lean();
  if (!coin) {
    return false;
  }
  const coinId = coin._id.toString();
  const coinObjectId = new Types.ObjectId(coinId);
  // check if the coin is favorited
  const isFavorited = await FavoritesModel.findOne({
    user_id: userId,
    coin_id: coinObjectId,
  });
  return isFavorited ? true : false;
}
