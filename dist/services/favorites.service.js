"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFavoritedCoinIds = exports.updateIsFavoritedFlag = void 0;
const coin_model_1 = __importDefault(require("../models/coin.model"));
const favorites_model_1 = __importDefault(require("../models/favorites.model"));
const updateIsFavoritedFlag = async (coinIds, // Coin IDs to check for favorites
userId // User ID to check if they favorited the coins
) => {
    try {
        /** -------------------------------
         * STEP 1: Get user's favorite coins
         --------------------------------*/
        const userFavorites = await favorites_model_1.default.find({
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
            const result = await coin_model_1.default.bulkWrite(isFavoritedBulkOps);
        }
        else {
            console.log("No updates needed for isFavorited.");
        }
    }
    catch (error) {
        console.error("Error updating isFavorited flags:", error);
        throw new Error("Failed to update isFavorited flags.");
    }
};
exports.updateIsFavoritedFlag = updateIsFavoritedFlag;
const getFavoritedCoinIds = async (userId, coinIds) => {
    const favorites = await favorites_model_1.default.find({
        user_id: userId,
        coin_id: { $in: coinIds },
    }).select("coin_id");
    return favorites.map((fav) => fav.coin_id.toString());
};
exports.getFavoritedCoinIds = getFavoritedCoinIds;
