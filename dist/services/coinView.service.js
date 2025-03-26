"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getAllCoinsTrending = exports.getViewStats = exports.trackView = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const coinView_model_1 = __importDefault(require("../models/coinView.model"));
const coin_model_1 = __importStar(require("../models/coin.model"));
const log4js_1 = require("log4js");
const redis_config_1 = require("../config/redis.config");
const logger = (0, log4js_1.getLogger)("trending-coins");
const trackView = (coinId, // coinId should always be an ObjectId
ipAddress, userAgent) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Ensure that coinId is valid before proceeding
        if (!coinId) {
            console.error("Invalid coinId provided:", coinId);
            throw new Error("Invalid coinId");
        }
        // Create or update the CoinView document
        const existingView = yield coinView_model_1.default.findOne({
            coinId: coinId,
            ip_address: ipAddress,
        });
        if (existingView) {
            console.log("User has already viewed this coin within the last 24 hours.");
            return; // Skip creating a duplicate view entry
        }
        // Track the view by creating a new entry
        const newCoinView = new coinView_model_1.default({
            coinId: coinId,
            ip_address: ipAddress,
            user_agent: userAgent,
        });
        yield newCoinView.save();
        console.log("Coin view tracked successfully.");
    }
    catch (error) {
        console.error("Error tracking coin view:", error);
        throw new Error("Failed to track coin view");
    }
});
exports.trackView = trackView;
const getViewStats = (coinId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Ensure Mongoose handles ObjectId conversion
        const stats = yield coinView_model_1.default.aggregate([
            {
                $match: {
                    coinId: new mongoose_1.default.Types.ObjectId(coinId), // Mongoose handles conversion
                },
            },
            {
                $group: {
                    _id: null,
                    total_views: { $sum: 1 },
                    last_24h: {
                        $sum: {
                            $cond: [
                                {
                                    $gte: [
                                        "$created_at",
                                        new Date(Date.now() - 24 * 60 * 60 * 1000),
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]);
        return stats[0] || { total_views: 0, last_24h: 0 };
    }
    catch (error) {
        console.error("Error in getViewStats:", error);
        throw new Error("Failed to retrieve view stats");
    }
});
exports.getViewStats = getViewStats;
// Define weights for views, votes, and price24h
const viewWeight = 0.5; // Adjust weight for views
const voteWeight = 0.3; // Adjust weight for votes
const priceWeight = 0.2; // Weight for price24h change influence
// Define a threshold for price24h change to apply a boost
const priceChangeThreshold = 10; // +10% price increase threshold
const liquidityThreshold = 10000; // Liquidity threshold (10k)
// Fetch all coins and sort them by their trending score (views + votes + price change)
const getAllCoinsTrending = (limit) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cacheKey = "trending-coins";
        logger.info("Attempting to fetch trending coins");
        const cacheData = yield (0, redis_config_1.getCache)(redis_config_1.redisClient, cacheKey);
        if (cacheData) {
            logger.info(`Cache hit for trending coins, found ${cacheData.length} coins`);
            return cacheData;
        }
        // Aggregate view counts for each coin
        const viewStats = yield coinView_model_1.default.aggregate([
            {
                $group: {
                    _id: "$coinId", // Group by coinId
                    totalViews: { $sum: 1 }, // Count total views
                },
            },
            {
                $sort: { totalViews: -1 }, // Sort by total views in descending order
            },
            {
                $lookup: {
                    from: "coins", // Assuming the Coin collection is called "coins"
                    localField: "_id",
                    foreignField: "_id",
                    as: "coinDetails",
                },
            },
            {
                $unwind: "$coinDetails", // Unwind the coinDetails to merge with view data
            },
            {
                $project: {
                    _id: 0,
                    coinId: "$_id",
                    totalViews: 1,
                    coinDetails: 1,
                },
            },
        ]);
        // For all coins in the database, ensure they are included even if they have no views
        const allCoins = yield coin_model_1.default.find({
            status: coin_model_1.CoinStatus.APPROVED,
        });
        // Merge viewStats with allCoins to include coins with no views
        const coinsWithViewCount = allCoins.map((coin) => {
            const coinStats = viewStats.find((stat) => stat.coinId.toString() === coin._id.toString());
            return Object.assign(Object.assign({}, coin.toObject()), { totalViews: coinStats ? coinStats.totalViews : 0 });
        });
        // Fetch vote count for each coin (e.g., todayVotes or allTimeVotes)
        const voteStats = yield coin_model_1.default.aggregate([
            {
                $group: {
                    _id: "$_id", // Group by coinId
                    totalVotes: { $sum: "$todayVotes" }, // Use the votes you need (e.g., todayVotes or allTimeVotes)
                },
            },
        ]);
        // Merge votes with coins
        const coinsWithVotes = coinsWithViewCount.map((coin) => {
            const voteStat = voteStats.find((stat) => stat._id.toString() === coin._id.toString());
            return Object.assign(Object.assign({}, coin), { totalVotes: voteStat ? voteStat.totalVotes : 0 });
        });
        // Calculate trending score for each coin
        const coinsWithTrendingScore = coinsWithVotes.map((coin) => {
            // Calculate base trending score using views and votes
            let trendingScore = viewWeight * coin.totalViews + voteWeight * coin.totalVotes;
            // Check if price24h has increased and apply a boost if needed, but ignore if liquidity is less than 10k
            if (coin.liquidity >= liquidityThreshold) {
                const priceChange = coin.price24h || 0;
                if (priceChange > priceChangeThreshold) {
                    // Apply a boost to the trending score if the price increased significantly
                    trendingScore += priceWeight * priceChange; // Boost by priceChange weight
                }
            }
            return Object.assign(Object.assign({}, coin), { trendingScore });
        });
        // Sort coins by the trending score in descending order
        const sortedCoins = coinsWithTrendingScore.sort((a, b) => b.trendingScore - a.trendingScore);
        // Slice the array to only include the top `limit` number of coins
        const topCoins = sortedCoins.slice(0, limit);
        // Cache the results
        yield (0, redis_config_1.setCache)(redis_config_1.redisClient, cacheKey, topCoins, "ex", 60 * 10); // 10 minutes cache
        logger.info(`Cached ${topCoins.length} trending coins`);
        // Return only the required fields: name, symbol, votes, todayVotes, totalViews, price24h
        return topCoins.map((coin) => ({
            name: coin.name,
            symbol: coin.symbol,
            slug: coin.slug,
            logo: coin.logo,
            chain: coin.chain,
            presale: coin.presale,
            fairlaunch: coin.fairlaunch,
            audit: coin.audit,
            kyc: coin.kyc,
            totalViews: coin.totalViews,
            price: coin.price,
            launchDate: coin.launchDate,
            price24h: coin.price24h,
        }));
    }
    catch (error) {
        console.error("Error getting all coins trending:", error);
        throw new Error("Failed to fetch all coins trending");
    }
});
exports.getAllCoinsTrending = getAllCoinsTrending;
