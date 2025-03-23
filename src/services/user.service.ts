import { FilterQuery } from "mongoose";
import { GetUserCoinsFilteredType, UserCoinResult } from "../types/coin.types";
import { redisClient } from "../config/redis.config";
import CoinModel, { CoinDocument } from "../models/coin.model";
import { getLogger } from "log4js";
import UserModel from "../models/user.model";
import type { Types } from "mongoose";

const logger = getLogger("user-service");

interface UserResponse {
  _id: Types.ObjectId;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
}

export async function getUserCoinsPending({
  pageSize,
  pageNumber,
  userId,
}: GetUserCoinsFilteredType): Promise<UserCoinResult> {
  try {
    logger.info("Attempting to fetch user coins", {
      pageSize,
      pageNumber,
      userId,
    });

    // Build filter query with type safety
    const filterQuery: FilterQuery<CoinDocument> = {
      author: userId,
    };

    // Generate cache key
    const cacheKey = `userCoins:${userId}:${JSON.stringify({
      pageSize,
      pageNumber,
    })}`;

    // Try cache first
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info(`Cache hit for user coins query: ${cacheKey}`);
      return JSON.parse(cachedData);
    }

    // Calculate pagination
    const skip = (pageNumber - 1) * pageSize;
    const totalCount = await CoinModel.countDocuments(filterQuery);
    const totalPages = Math.ceil(totalCount / pageSize);

    // Define sort criteria with type safety
    const sortCriteria: Record<string, 1 | -1> = {
      createdAt: -1,
      _id: 1, // Secondary sort for consistent pagination
    };

    // Execute query with optimized field selection
    const coins = await CoinModel.find(filterQuery)
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

    const result: UserCoinResult = {
      coins,
      totalCount,
      totalPages,
      skip,
    };

    // Cache results
    await redisClient.setex(cacheKey, 300, JSON.stringify(result)); // 5 minutes cache
    logger.info(`Cached user coins result: ${cacheKey}`);

    if (!coins || coins.length === 0) {
      logger.warn(`No coins found for user: ${userId}`);
    } else {
      logger.info(`Found ${coins.length} coins for user: ${userId}`);
    }

    return result;
  } catch (error) {
    logger.error("Error in getUserCoinsPending:", error);
    throw new Error("Failed to fetch user coins");
  }
}

export async function userCoinById(
  coinId: string
): Promise<UserResponse | null> {
  try {
    logger.info("Attempting to fetch user by coin ID:", { coinId });

    // Generate cache key
    const cacheKey = `userByCoin:${coinId}`;

    // Try cache first
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info("Cache hit for user by coin query:", { coinId });
      return JSON.parse(cachedData);
    }

    // Fetch the coin by its coinId with lean() for better performance
    const coin = await CoinModel.findById(coinId).lean();

    if (!coin) {
      logger.warn("No coin found with ID:", { coinId });
      return null;
    }

    // Fetch the user using the coin's author field
    const user = (await UserModel.findById(coin.author)
      .select({
        _id: 1,
        email: 1,
        name: 1,
        role: 1,
        createdAt: 1,
      })
      .lean()) as UserResponse | null;

    if (!user) {
      logger.warn("No user found for coin author:", { authorId: coin.author });
      return null;
    }

    // Cache the user data for 5 minutes
    await redisClient.setex(cacheKey, 300, JSON.stringify(user));
    logger.info("Cached user data for coin:", { coinId });

    return user;
  } catch (error) {
    logger.error("Error in userCoinById service:", error);
    throw new Error("Failed to fetch user by coin ID");
  }
}
