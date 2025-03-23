"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserFavorites = exports.favoriteCoinController = void 0;
const asyncHandler_middleware_1 = require("../middlewares/asyncHandler.middleware");
const express_1 = require("@clerk/express");
const http_config_1 = require("../config/http.config");
const favorites_service_1 = require("../services/favorites.service");
const favorites_model_1 = __importDefault(require("../models/favorites.model"));
const mongoose_1 = require("mongoose");
const vote_service_1 = require("../services/vote.service");
const coin_model_1 = __importDefault(require("../models/coin.model"));
// Add this route in your backend API
exports.favoriteCoinController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { coinId } = req.params; // Coin ID to favorite/unfavorite
    const userId = (0, express_1.getAuth)(req).userId;
    if (!coinId || !userId) {
        return res.status(400).json({ message: "Missing required parameters" });
    }
    try {
        // Convert coinId to ObjectId
        const coinObjectId = new mongoose_1.Types.ObjectId(coinId);
        // Check if the user already has the coin in favorites
        const existingFavorite = await favorites_model_1.default.findOne({
            user_id: userId,
            coin_id: coinId,
        });
        if (existingFavorite) {
            // If already favorited, remove it (unfavorite)
            await favorites_model_1.default.deleteOne({
                user_id: userId,
                coin_id: coinId,
            });
        }
        else {
            // If not favorited, add it to favorites
            const newFavorite = new favorites_model_1.default({
                user_id: userId,
                coin_id: coinId,
            });
            await newFavorite.save();
        }
        // After adding/removing from favorites, update the isFavorited flag in coins
        await (0, favorites_service_1.updateIsFavoritedFlag)([coinObjectId], userId);
        return res
            .status(200)
            .json({ message: "Favorite status updated successfully" });
    }
    catch (error) {
        console.error("Error updating favorite:", error);
        return res.status(500).json({ message: "Error updating favorite" });
    }
});
exports.getUserFavorites = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = (0, express_1.getAuth)(req).userId; // Get the user ID from the auth
    if (!userId) {
        return res
            .status(http_config_1.HTTPSTATUS.BAD_REQUEST)
            .json({ message: "User ID is required" });
    }
    try {
        // Fetch the favorite coins for the given user, populate the 'coin_id' field with coin details
        const favorites = await favorites_model_1.default.find({ user_id: userId })
            .populate("coin_id") // Populate the coin data (assuming coin_id is the reference to the Coin model)
            .exec();
        if (!favorites.length) {
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "No favorites found for this user",
                favorites: [],
            });
        }
        // Extract the coin data (populate 'coin_id')
        const coins = favorites.map((favorite) => favorite.coin_id);
        const coinIds = coins.map((coin) => coin._id);
        const rawIp = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress);
        const ipAddress = rawIp.split(",")[rawIp.split(",").length - 1].trim();
        // After updating the votes, fetch the updated coins data again
        const updatedCoins = await coin_model_1.default.find({
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
        let favoritedCoinIds = [];
        const coinsWithUpdatedFlags = await (0, vote_service_1.fetchVotesToCoins)({
            coins: updatedCoins,
            favoritedCoinIds,
            ipAddress,
            coinIds,
            userId,
        });
        // Return the updated coins with the updated vote counts
        return res.status(http_config_1.HTTPSTATUS.OK).json({
            message: "Favorites fetched successfully",
            favorites: coinsWithUpdatedFlags, // Send the populated and updated coin data
        });
    }
    catch (error) {
        console.error(error);
        return res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            message: "Failed to fetch favorites",
            error: error instanceof Error ? error.message : error,
        });
    }
});
