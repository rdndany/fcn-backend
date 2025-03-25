"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserCoinsPending = getUserCoinsPending;
exports.userCoinById = userCoinById;
const redis_config_1 = require("../config/redis.config");
const coin_model_1 = __importDefault(require("../models/coin.model"));
const log4js_1 = require("log4js");
const user_model_1 = __importDefault(require("../models/user.model"));
const logger = (0, log4js_1.getLogger)("user-service");
async function getUserCoinsPending({ pageSize, pageNumber, userId, }) {
    try {
        logger.info("Attempting to fetch user coins", {
            pageSize,
            pageNumber,
            userId,
        });
        // Build filter query with type safety
        const filterQuery = {
            author: userId,
        };
        // Generate cache key
        const cacheKey = `userCoins:${userId}:${JSON.stringify({
            pageSize,
            pageNumber,
        })}`;
        // Try cache first
        const cachedData = await redis_config_1.redisClient.get(cacheKey);
        if (cachedData) {
            logger.info(`Cache hit for user coins query: ${cacheKey}`);
            return JSON.parse(cachedData);
        }
        // Calculate pagination
        const skip = (pageNumber - 1) * pageSize;
        const totalCount = await coin_model_1.default.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalCount / pageSize);
        // Define sort criteria with type safety
        const sortCriteria = {
            createdAt: -1,
            _id: 1, // Secondary sort for consistent pagination
        };
        // Execute query with optimized field selection
        const coins = await coin_model_1.default.find(filterQuery)
            .select({
            name: 1,
            symbol: 1,
            slug: 1,
            logo: 1,
            chain: 1,
            presale: 1,
            fairlaunch: 1,
            audit: 1,
            kyc: 1,
            launchDate: 1,
            premium: 1,
            status: 1,
            createdAt: 1,
        })
            .sort(sortCriteria)
            .skip(skip)
            .limit(pageSize)
            .lean();
        const result = {
            coins,
            totalCount,
            totalPages,
            skip,
        };
        // Cache results
        await redis_config_1.redisClient.setex(cacheKey, 300, JSON.stringify(result)); // 5 minutes cache
        logger.info(`Cached user coins result: ${cacheKey}`);
        if (!coins || coins.length === 0) {
            logger.warn(`No coins found for user: ${userId}`);
        }
        else {
            logger.info(`Found ${coins.length} coins for user: ${userId}`);
        }
        return result;
    }
    catch (error) {
        logger.error("Error in getUserCoinsPending:", error);
        throw new Error("Failed to fetch user coins");
    }
}
async function userCoinById(coinId) {
    try {
        logger.info("Attempting to fetch user by coin ID:", { coinId });
        // Generate cache key
        const cacheKey = `userByCoin:${coinId}`;
        // Try cache first
        const cachedData = await redis_config_1.redisClient.get(cacheKey);
        if (cachedData) {
            logger.info("Cache hit for user by coin query:", { coinId });
            return JSON.parse(cachedData);
        }
        // Fetch the coin by its coinId with lean() for better performance
        const coin = await coin_model_1.default.findById(coinId).lean();
        if (!coin) {
            logger.warn("No coin found with ID:", { coinId });
            return null;
        }
        // Fetch the user using the coin's author field
        const user = (await user_model_1.default.findById(coin.author)
            .select({
            _id: 1,
            email: 1,
            name: 1,
            role: 1,
            createdAt: 1,
        })
            .lean());
        if (!user) {
            logger.warn("No user found for coin author:", { authorId: coin.author });
            return null;
        }
        // Cache the user data for 5 minutes
        await redis_config_1.redisClient.setex(cacheKey, 300, JSON.stringify(user));
        logger.info("Cached user data for coin:", { coinId });
        return user;
    }
    catch (error) {
        logger.error("Error in userCoinById service:", error);
        throw new Error("Failed to fetch user by coin ID");
    }
}
