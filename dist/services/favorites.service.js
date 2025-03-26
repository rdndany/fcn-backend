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
exports.updateIsFavoritedFlag = updateIsFavoritedFlag;
exports.getFavoritedCoinIds = getFavoritedCoinIds;
const coin_model_1 = __importDefault(require("../models/coin.model"));
const favorites_model_1 = __importDefault(require("../models/favorites.model"));
const log4js_1 = require("log4js");
const logger = (0, log4js_1.getLogger)("favorites-service");
function updateIsFavoritedFlag(coinIds, userId) {
    return __awaiter(this, void 0, void 0, function* () {
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
            const favorites = yield favorites_model_1.default.find({
                user_id: userId,
                coin_id: { $in: coinIds },
            })
                .select("coin_id")
                .lean();
            // Create a Set for O(1) lookup of favorited coin IDs
            const favoritedCoinIds = new Set(favorites.map((f) => f.coin_id.toString()));
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
            const result = yield coin_model_1.default.bulkWrite(bulkOps);
            logger.info("Successfully updated favorite flags:", {
                totalCoins: coinIds.length,
                updatedCoins: result.modifiedCount,
                favoritedCount: favoritedCoinIds.size,
            });
            return true;
        }
        catch (error) {
            logger.error("Error updating favorite flags:", {
                error: error instanceof Error ? error.message : "Unknown error",
                coinCount: coinIds.length,
                userId,
            });
            return false;
        }
    });
}
function getFavoritedCoinIds(userId, coinIds) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            logger.info("Fetching favorited coin IDs:", {
                userId,
                coinCount: coinIds.length,
            });
            const favorites = yield favorites_model_1.default.find({
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
        }
        catch (error) {
            logger.error("Error fetching favorited coin IDs:", {
                error: error instanceof Error ? error.message : "Unknown error",
                userId,
            });
            return [];
        }
    });
}
