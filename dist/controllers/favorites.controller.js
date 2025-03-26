"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.favoriteCoinController = favoriteCoinController;
exports.getUserFavorites = getUserFavorites;
const express_1 = require("@clerk/express");
const http_config_1 = require("../config/http.config");
const favorites_service_1 = require("../services/favorites.service");
const favorites_model_1 = __importDefault(require("../models/favorites.model"));
const mongoose_1 = require("mongoose");
const vote_service_1 = require("../services/vote.service");
const coin_model_1 = __importDefault(require("../models/coin.model"));
const log4js_1 = require("log4js");
const redis_config_1 = require("../config/redis.config");
const coin_utils_1 = require("../utils/coin.utils");
const request_ip_1 = require("request-ip");
const logger = (0, log4js_1.getLogger)("favorites-controller");
// Add this route in your backend API
function favoriteCoinController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { coinId } = req.params;
            const userId = (0, express_1.getAuth)(req).userId;
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
            const coinObjectId = new mongoose_1.Types.ObjectId(coinId);
            // Check if the user already has the coin in favorites
            const existingFavorite = yield favorites_model_1.default.findOne({
                user_id: userId,
                coin_id: coinId,
            }).lean();
            if (existingFavorite) {
                // If already favorited, remove it (unfavorite)
                // logger.info("Removing coin from favorites:", { coinId, userId });
                yield favorites_model_1.default.deleteOne({
                    user_id: userId,
                    coin_id: coinId,
                });
            }
            else {
                // If not favorited, add it to favorites
                // logger.info("Adding coin to favorites:", { coinId, userId });
                const newFavorite = new favorites_model_1.default({
                    user_id: userId,
                    coin_id: coinId,
                });
                yield newFavorite.save();
            }
            // After adding/removing from favorites, update the isFavorited flag in coins
            yield (0, favorites_service_1.updateIsFavoritedFlag)([coinObjectId], userId);
            // Invalidate relevant caches using the centralized cache invalidation function
            yield (0, coin_utils_1.invalidateCoinCaches)(coin_utils_1.CacheInvalidationScope.FAVORITE);
            // logger.info("Successfully updated favorite status:", {
            //   coinId,
            //   userId,
            //   action: existingFavorite ? "unfavorited" : "favorited",
            // });
            res.status(200).json({
                success: true,
                message: `Coin ${existingFavorite ? "unfavorited" : "favorited"} successfully`,
                isFavorited: !existingFavorite,
            });
        }
        catch (error) {
            // logger.error("Error in favoriteCoinController:", error);
            res.status(500).json({
                success: false,
                message: "Failed to update favorite status",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });
}
function getUserFavorites(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = (0, express_1.getAuth)(req).userId;
            // logger.info("Attempting to fetch user favorites:", { userId });
            if (!userId) {
                // logger.warn("No user ID provided");
                res.status(http_config_1.HTTPSTATUS.BAD_REQUEST).json({
                    success: false,
                    message: "User ID is required",
                });
                return;
            }
            // Get client IP address
            const ipAddress = (0, request_ip_1.getClientIp)(req);
            if (!ipAddress) {
                // logger.warn("Failed to extract client IP address");
                res.status(http_config_1.HTTPSTATUS.BAD_REQUEST).json({
                    success: false,
                    message: "Invalid request: Could not determine client IP",
                });
                return;
            }
            // Fetch the favorite coins for the given user
            const favorites = yield favorites_model_1.default.find({ user_id: userId })
                .populate("coin_id")
                .lean();
            // Generate cache key with correct format
            const cacheKey = `userFavorites:${userId}:cacheData`;
            // Try cache first
            const cachedData = yield redis_config_1.redisClient.get(cacheKey);
            if (cachedData) {
                const parsedCache = JSON.parse(cachedData);
                // logger.info("Cache hit for user favorites:", {
                //   userId,
                //   favoritedCount: parsedCache.favoritedCoinIds.length,
                // });
                res.status(http_config_1.HTTPSTATUS.OK).json({
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
                yield redis_config_1.redisClient.setex(cacheKey, 300, JSON.stringify(emptyCache));
                res.status(http_config_1.HTTPSTATUS.OK).json({
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
            const updatedCoins = yield coin_model_1.default.find({ _id: { $in: coinIds } })
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
            const coinsWithUpdatedFlags = yield (0, vote_service_1.fetchVotesToCoins)({
                coins: updatedCoins,
                favoritedCoinIds,
                ipAddress,
                coinIds,
                userId,
            });
            if (!coinsWithUpdatedFlags) {
                // logger.error("Failed to update coin flags");
                res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
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
            yield redis_config_1.redisClient.setex(cacheKey, 300, JSON.stringify(cacheData));
            // logger.info("Successfully fetched favorites for user:", {
            //   userId,
            //   coinCount: coinsWithUpdatedFlags.length,
            //   favoritedCount: favoritedCoinIds.length,
            // });
            res.status(http_config_1.HTTPSTATUS.OK).json({
                success: true,
                message: "Favorites fetched successfully",
                favorites: coinsWithUpdatedFlags,
                favoritedCoinIds,
            });
        }
        catch (error) {
            // logger.error("Error in getUserFavorites controller:", error);
            res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Failed to fetch favorites",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });
}
