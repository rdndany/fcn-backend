import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { getAuth } from "@clerk/express";
import { HTTPSTATUS } from "../config/http.config";
import { updateIsFavoritedFlag } from "../services/favorites.service";
import FavoritesModel from "../models/favorites.model";
import { Types } from "mongoose";
import { fetchVotesToCoins } from "../services/vote.service";
import CoinModel from "../models/coin.model";
import { getLogger } from "log4js";
import { redisClient } from "../config/redis.config";
import {
  CacheInvalidationScope,
  invalidateCoinCaches,
} from "../utils/coin.utils";
import { getClientIp } from "request-ip";

const logger = getLogger("favorites-controller");

// Add this route in your backend API
export async function favoriteCoinController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { coinId } = req.params;
    const userId = getAuth(req).userId;

    // logger.info("Attempting to update favorite status:", { coinId, userId });

    if (!coinId || !userId) {
      // logger.warn("Missing required parameters:", { coinId, userId });
      res.status(400).json({
        success: false,
        message: "Missing required parameters",
      });
      return;
    }

    // Convert coinId to ObjectId
    const coinObjectId = new Types.ObjectId(coinId);

    // Check if the user already has the coin in favorites
    const existingFavorite = await FavoritesModel.findOne({
      user_id: userId,
      coin_id: coinId,
    }).lean();

    if (existingFavorite) {
      // If already favorited, remove it (unfavorite)
      // logger.info("Removing coin from favorites:", { coinId, userId });
      await FavoritesModel.deleteOne({
        user_id: userId,
        coin_id: coinId,
      });
    } else {
      // If not favorited, add it to favorites
      // logger.info("Adding coin to favorites:", { coinId, userId });
      const newFavorite = new FavoritesModel({
        user_id: userId,
        coin_id: coinId,
      });
      await newFavorite.save();
    }

    // After adding/removing from favorites, update the isFavorited flag in coins
    await updateIsFavoritedFlag([coinObjectId], userId);

    // Invalidate relevant caches using the centralized cache invalidation function
    await invalidateCoinCaches(CacheInvalidationScope.FAVORITE);

    // logger.info("Successfully updated favorite status:", {
    //   coinId,
    //   userId,
    //   action: existingFavorite ? "unfavorited" : "favorited",
    // });

    res.status(200).json({
      success: true,
      message: `Coin ${
        existingFavorite ? "unfavorited" : "favorited"
      } successfully`,
      isFavorited: !existingFavorite,
    });
  } catch (error) {
    // logger.error("Error in favoriteCoinController:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update favorite status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Add this route in your backend API
export async function favoriteCoinControllerBySlug(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { slug } = req.params;
    const userId = getAuth(req).userId;

    // logger.info("Attempting to update favorite status:", { coinId, userId });

    if (!slug || !userId) {
      // logger.warn("Missing required parameters:", { coinId, userId });
      res.status(400).json({
        success: false,
        message: "Missing required parameters",
      });
      return;
    }
    // get coin by slug
    const coin = await CoinModel.findOne({ slug }).lean();
    if (!coin) {
      res.status(404).json({
        success: false,
        message: "Coin not found",
      });
      return;
    }
    const coinObjectId = new Types.ObjectId(coin._id);

    // Check if the user already has the coin in favorites
    const existingFavorite = await FavoritesModel.findOne({
      user_id: userId,
      coin_id: coin._id,
    }).lean();

    if (existingFavorite) {
      // If already favorited, remove it (unfavorite)
      // logger.info("Removing coin from favorites:", { coinId, userId });
      await FavoritesModel.deleteOne({
        user_id: userId,
        coin_id: coin._id,
      });
    } else {
      // If not favorited, add it to favorites
      // logger.info("Adding coin to favorites:", { coinId, userId });
      const newFavorite = new FavoritesModel({
        user_id: userId,
        coin_id: coin._id,
      });
      await newFavorite.save();
    }

    // After adding/removing from favorites, update the isFavorited flag in coins
    await updateIsFavoritedFlag([coinObjectId], userId);

    // Invalidate relevant caches using the centralized cache invalidation function
    await invalidateCoinCaches(CacheInvalidationScope.FAVORITE);

    // logger.info("Successfully updated favorite status:", {
    //   coinId,
    //   userId,
    //   action: existingFavorite ? "unfavorited" : "favorited",
    // });

    res.status(200).json({
      success: true,
      message: `Coin ${
        existingFavorite ? "unfavorited" : "favorited"
      } successfully`,
      isFavorited: !existingFavorite,
    });
  } catch (error) {
    // logger.error("Error in favoriteCoinController:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update favorite status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getUserFavorites(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = getAuth(req).userId;
    // logger.info("Attempting to fetch user favorites:", { userId });

    if (!userId) {
      // logger.warn("No user ID provided");
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "User ID is required",
      });
      return;
    }

    // Get client IP address
    const ipAddress = getClientIp(req);
    if (!ipAddress) {
      // logger.warn("Failed to extract client IP address");
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid request: Could not determine client IP",
      });
      return;
    }

    // Fetch the favorite coins for the given user
    const favorites = await FavoritesModel.find({ user_id: userId })
      .populate("coin_id")
      .lean();

    // Generate cache key with correct format
    const cacheKey = `userFavorites:${userId}:cacheData`;

    // Try cache first
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      const parsedCache = JSON.parse(cachedData);
      // logger.info("Cache hit for user favorites:", {
      //   userId,
      //   favoritedCount: parsedCache.favoritedCoinIds.length,
      // });
      res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "Favorites fetched from cache",
        favorites: parsedCache.favorites,
        favoritedCoinIds: parsedCache.favoritedCoinIds,
      });
      return;
    }

    if (!favorites.length) {
      // logger.info("No favorites found for user:", { userId });
      // Cache empty favorites
      const emptyCache = {
        favorites: [],
        favoritedCoinIds: [],
        userId,
        timestamp: Date.now(),
      };
      await redisClient.setex(cacheKey, 300, JSON.stringify(emptyCache));

      res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "No favorites found for this user",
        favorites: [],
        favoritedCoinIds: [],
      });
      return;
    }

    // Extract and process coin data
    const coins = favorites.map((favorite) => favorite.coin_id);
    const coinIds = coins.map((coin) => coin._id);
    const favoritedCoinIds = coinIds.map((id) => id.toString());

    // Fetch updated coin data with optimized field selection
    const updatedCoins = await CoinModel.find({ _id: { $in: coinIds } })
      .select({
        logo: 1,
        name: 1,
        symbol: 1,
        slug: 1,
        price: 1,
        price24h: 1,
        mkap: 1,
        chain: 1,
        premium: 1,
        audit: 1,
        kyc: 1,
        launchDate: 1,
        presale: 1,
        fairlaunch: 1,
        todayVotes: 1,
        votes: 1,
        userVoted: 1,
        isFavorited: 1,
        address: 1,
        status: 1,
      })
      .lean()
      .sort({ votes: -1 });

    // Update coins with vote and favorite flags
    const coinsWithUpdatedFlags = await fetchVotesToCoins({
      coins: updatedCoins,
      favoritedCoinIds,
      ipAddress,
      coinIds,
      userId,
    });

    if (!coinsWithUpdatedFlags) {
      // logger.error("Failed to update coin flags");
      res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to process coin data",
      });
      return;
    }

    // Prepare cache data
    const cacheData = {
      favorites: coinsWithUpdatedFlags,
      favoritedCoinIds,
      userId,
      timestamp: Date.now(),
    };

    // Cache the results for 5 minutes with the correct key format
    await redisClient.setex(cacheKey, 300, JSON.stringify(cacheData));

    // logger.info("Successfully fetched favorites for user:", {
    //   userId,
    //   coinCount: coinsWithUpdatedFlags.length,
    //   favoritedCount: favoritedCoinIds.length,
    // });

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Favorites fetched successfully",
      favorites: coinsWithUpdatedFlags,
      favoritedCoinIds,
    });
  } catch (error) {
    // logger.error("Error in getUserFavorites controller:", error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch favorites",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
