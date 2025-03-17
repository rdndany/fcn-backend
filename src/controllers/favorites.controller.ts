import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { getAuth } from "@clerk/express";
import { HTTPSTATUS } from "../config/http.config";
import { updateIsFavoritedFlag } from "../services/favorites.service";
import FavoritesModel from "../models/favorites.model";
import { Types } from "mongoose";
import { fetchVotesToCoins } from "../services/vote.service";
import CoinModel from "../models/coin.model";

// Add this route in your backend API
export const favoriteCoinController = asyncHandler(
  async (req: Request, res: Response) => {
    const { coinId } = req.params; // Coin ID to favorite/unfavorite

    const userId = getAuth(req).userId;

    if (!coinId || !userId) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    try {
      // Convert coinId to ObjectId
      const coinObjectId = new Types.ObjectId(coinId);
      // Check if the user already has the coin in favorites
      const existingFavorite = await FavoritesModel.findOne({
        user_id: userId,
        coin_id: coinId,
      });

      if (existingFavorite) {
        // If already favorited, remove it (unfavorite)
        await FavoritesModel.deleteOne({
          user_id: userId,
          coin_id: coinId,
        });
      } else {
        // If not favorited, add it to favorites
        const newFavorite = new FavoritesModel({
          user_id: userId,
          coin_id: coinId,
        });
        await newFavorite.save();
      }

      // After adding/removing from favorites, update the isFavorited flag in coins
      await updateIsFavoritedFlag([coinObjectId], userId);

      return res
        .status(200)
        .json({ message: "Favorite status updated successfully" });
    } catch (error) {
      console.error("Error updating favorite:", error);
      return res.status(500).json({ message: "Error updating favorite" });
    }
  }
);

export const getUserFavorites = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const userId = getAuth(req).userId; // Get the user ID from the auth

    if (!userId) {
      return res
        .status(HTTPSTATUS.BAD_REQUEST)
        .json({ message: "User ID is required" });
    }

    try {
      // Fetch the favorite coins for the given user, populate the 'coin_id' field with coin details
      const favorites = await FavoritesModel.find({ user_id: userId })
        .populate("coin_id") // Populate the coin data (assuming coin_id is the reference to the Coin model)
        .exec();

      if (!favorites.length) {
        return res.status(HTTPSTATUS.OK).json({
          message: "No favorites found for this user",
          favorites: [],
        });
      }

      // Extract the coin data (populate 'coin_id')
      const coins = favorites.map((favorite) => favorite.coin_id);

      const coinIds: Types.ObjectId[] = coins.map(
        (coin) => coin._id as Types.ObjectId
      );

      const rawIp = String(
        req.headers["x-forwarded-for"] || req.socket.remoteAddress
      );

      const ipAddress = rawIp.split(",")[rawIp.split(",").length - 1].trim();

      // After updating the votes, fetch the updated coins data again
      const updatedCoins = await CoinModel.find({
        _id: { $in: coinIds },
      })
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
        })
        .lean()
        .sort({ votes: -1 })
        .exec();

      // Step 2: Get the user's favorite coin IDs (don't refetch all coins!)
      let favoritedCoinIds: string[] = [];

      const coinsWithUpdatedFlags = await fetchVotesToCoins({
        coins: updatedCoins,
        favoritedCoinIds,
        ipAddress,
        coinIds,
        userId,
      });
      // Return the updated coins with the updated vote counts
      return res.status(HTTPSTATUS.OK).json({
        message: "Favorites fetched successfully",
        favorites: coinsWithUpdatedFlags, // Send the populated and updated coin data
      });
    } catch (error) {
      console.error(error);
      return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        message: "Failed to fetch favorites",
        error: error instanceof Error ? error.message : error,
      });
    }
  }
);
