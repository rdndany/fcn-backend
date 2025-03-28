import { FilterQuery } from "mongoose";
import {
  ApprovedCoinResult,
  FairlaunchCoinResult,
  GetAdminPromotedCoinsFilteredType,
  GetApprovedCoinsFilteredType,
  GetFairlaunchCoinsFilteredType,
  GetPendingCoinsFilteredType,
  GetPresaleCoinsFilteredType,
  GetUsersFilteredType,
  PendingCoinResult,
  PresaleCoinResult,
  PromotedCoinResult,
  UsersResult,
} from "../types/coin.types";
import CoinModel, { CoinDocument, CoinStatus } from "../models/coin.model";
import { getLogger } from "log4js";
import { redisClient, setCache, getCache } from "../config/redis.config";
import UserModel, { UserDocument } from "../models/user.model";

const logger = getLogger("admin-service");

export const getCoinsPending = async ({
  pageSize,
  pageNumber,
}: GetPendingCoinsFilteredType): Promise<PendingCoinResult> => {
  try {
    logger.info("Attempting to fetch pending coins");
    const filterQuery: FilterQuery<CoinDocument> = {
      status: CoinStatus.PENDING,
    };

    // Generate cache key
    const cacheKey = `coinsPending:${JSON.stringify({
      pageSize,
      pageNumber,
    })}`;

    // Try cache first
    const cachedData = await getCache<PendingCoinResult>(redisClient, cacheKey);
    if (cachedData) {
      logger.info(`Cache hit for pending coins query: ${cacheKey}`);
      return cachedData;
    }

    // Calculate pagination
    const skip = (pageNumber - 1) * pageSize;
    const totalCount = await CoinModel.countDocuments(filterQuery);
    const totalPages = Math.ceil(totalCount / pageSize);

    // Execute query with optimized field selection
    const coins = await CoinModel.find(filterQuery)
      .select({
        logo: 1,
        name: 1,
        symbol: 1,
        slug: 1,
        chain: 1,
        address: 1,
        description: 1,
        categories: 1,
        dexProvider: 1,
        launchDate: 1,
        presale: 1,
        fairlaunch: 1,
        audit: 1,
        kyc: 1,
        socials: 1,
        status: 1,
        createdAt: 1,
        price: 1,
        price24h: 1,
        mkap: 1,
        liquidity: 1,
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const result: PendingCoinResult = {
      coins,
      totalCount,
      totalPages,
      skip,
    };

    // Cache results
    await setCache(redisClient, cacheKey, result, "ex", 60 * 5); // 5 minutes cache
    logger.info(`Cached pending coins result: ${cacheKey}`);

    if (!coins || coins.length === 0) {
      logger.warn("No pending coins found");
    } else {
      logger.info(`Found ${coins.length} pending coins`);
    }

    return result;
  } catch (error) {
    logger.error("Error in getCoinsPending:", error);
    throw new Error("Failed to fetch pending coins");
  }
};

export const getCoinsApproved = async ({
  pageSize,
  pageNumber,
  chains,
  sortColumn,
  sortDirection,
  searchValue,
}: GetApprovedCoinsFilteredType): Promise<ApprovedCoinResult> => {
  try {
    logger.info("Attempting to fetch approved coins");

    // Build filter query with type safety
    const filterQuery: FilterQuery<CoinDocument> = {
      status: CoinStatus.APPROVED,
    };

    // Apply chain filter if specified
    if (chains.length > 0) {
      filterQuery.chain = { $in: chains };
      logger.info(`Applying chain filter for: ${chains.join(", ")}`);
    }

    // Handle special sort cases
    if (sortColumn === "liquidity") {
      filterQuery.$and = [
        { "presale.enabled": { $ne: true } },
        { "fairlaunch.enabled": { $ne: true } },
        { liquidity: { $ne: 0 } },
      ];
      logger.info(
        "Applying liquidity filter - excluding presale and fairlaunch coins"
      );
    }

    // Apply search filter if provided
    if (searchValue) {
      const regex = new RegExp(searchValue, "i");
      filterQuery.$or = [{ name: regex }, { symbol: regex }];

      // Check for address-like search
      const isProbableAddress =
        (searchValue.startsWith("0x") && searchValue.length === 42) ||
        /^[a-zA-Z0-9]{32,}$/.test(searchValue);

      if (isProbableAddress) {
        logger.info(`Address search detected: ${searchValue}`);
        filterQuery.$or.push({
          address: new RegExp(`^${searchValue}$`, "i"),
        });
      }
    }

    // Generate cache key
    const cacheKey = `coinsApproved:${JSON.stringify({
      filterQuery,
      pageSize,
      pageNumber,
      sortColumn,
      sortDirection,
      searchValue,
    })}`;

    // Try cache first
    const cachedData = await getCache<ApprovedCoinResult>(
      redisClient,
      cacheKey
    );
    if (cachedData) {
      logger.info(`Cache hit for approved coins query: ${cacheKey}`);
      return cachedData;
    }

    // Calculate pagination
    const skip = (pageNumber - 1) * pageSize;
    const totalCount = await CoinModel.countDocuments(filterQuery);
    const totalPages = Math.ceil(totalCount / pageSize);

    // Define sort criteria with type safety
    const sortCriteria: Record<string, 1 | -1> = {
      [sortColumn]: sortDirection === "ascending" ? 1 : -1,
      _id: 1, // Secondary sort for consistent pagination
    };

    // Execute query with optimized field selection
    const coins = await CoinModel.find(filterQuery)
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
        liquidity: 1,
        createdAt: 1,
        promoted: 1,
      })
      .sort(sortCriteria)
      .skip(skip)
      .limit(pageSize)
      .lean();

    const result: ApprovedCoinResult = {
      coins,
      totalCount,
      totalPages,
      skip,
    };

    // Cache results
    await setCache(redisClient, cacheKey, result, "ex", 60 * 5); // 5 minutes cache
    logger.info(`Cached approved coins result: ${cacheKey}`);

    if (!coins || coins.length === 0) {
      logger.warn("No approved coins found");
    } else {
      logger.info(`Found ${coins.length} approved coins`);
    }

    return result;
  } catch (error) {
    logger.error("Error in getCoinsApproved:", error);
    throw new Error("Failed to fetch approved coins");
  }
};

export const getCoinsAdminPromoted = async ({
  pageSize,
  pageNumber,
}: GetAdminPromotedCoinsFilteredType): Promise<PromotedCoinResult> => {
  try {
    logger.info("Attempting to fetch admin promoted coins");

    // Build filter query with type safety
    const filterQuery: FilterQuery<CoinDocument> = {
      promoted: true,
      status: CoinStatus.APPROVED,
    };

    // Generate cache key
    const cacheKey = `coinsAdminPromoted:${JSON.stringify({
      pageSize,
      pageNumber,
    })}`;

    // Try cache first
    const cachedData = await getCache<PromotedCoinResult>(
      redisClient,
      cacheKey
    );
    if (cachedData) {
      logger.info(`Cache hit for admin promoted coins query: ${cacheKey}`);
      return cachedData;
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
        logo: 1,
        name: 1,
        symbol: 1,
        slug: 1,
        price: 1,
        price24h: 1,
        mkap: 1,
        liquidity: 1,
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
        promoted: 1,
        createdAt: 1,
      })
      .sort(sortCriteria)
      .skip(skip)
      .limit(pageSize)
      .lean();

    const result: PromotedCoinResult = {
      coins,
      totalCount,
      totalPages,
      skip,
    };

    // Cache results
    await setCache(redisClient, cacheKey, result, "ex", 60 * 5); // 5 minutes cache
    logger.info(`Cached admin promoted coins result: ${cacheKey}`);

    if (!coins || coins.length === 0) {
      logger.warn("No admin promoted coins found");
    } else {
      logger.info(`Found ${coins.length} admin promoted coins`);
    }

    return result;
  } catch (error) {
    logger.error("Error in getCoinsAdminPromoted:", error);
    throw new Error("Failed to fetch admin promoted coins");
  }
};

export const getCoinsPresale = async ({
  pageSize,
  pageNumber,
}: GetPresaleCoinsFilteredType): Promise<PresaleCoinResult> => {
  try {
    logger.info("Attempting to fetch presale coins");

    // Build filter query with type safety
    const filterQuery: FilterQuery<CoinDocument> = {
      status: CoinStatus.APPROVED,
      "presale.enabled": true,
    };

    // Generate cache key
    const cacheKey = `coinsPresale:${JSON.stringify({
      pageSize,
      pageNumber,
    })}`;

    // Try cache first
    const cachedData = await getCache<PresaleCoinResult>(redisClient, cacheKey);
    if (cachedData) {
      logger.info(`Cache hit for presale coins query: ${cacheKey}`);
      return cachedData;
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
        logo: 1,
        name: 1,
        symbol: 1,
        slug: 1,
        liquidity: 1,
        chain: 1,
        address: 1,
        presale: 1,
        audit: 1,
        kyc: 1,
        launchDate: 1,
        socials: 1,
        status: 1,
        createdAt: 1,
        todayVotes: 1,
        votes: 1,
        userVoted: 1,
        isFavorited: 1,
      })
      .sort(sortCriteria)
      .skip(skip)
      .limit(pageSize)
      .lean();

    const result: PresaleCoinResult = {
      coins,
      totalCount,
      totalPages,
      skip,
    };

    // Cache results
    await setCache(redisClient, cacheKey, result, "ex", 60 * 5); // 5 minutes cache
    logger.info(`Cached presale coins result: ${cacheKey}`);

    if (!coins || coins.length === 0) {
      logger.warn("No presale coins found");
    } else {
      logger.info(`Found ${coins.length} presale coins`);
    }

    return result;
  } catch (error) {
    logger.error("Error in getCoinsPresale:", error);
    throw new Error("Failed to fetch presale coins");
  }
};

export const getCoinsFairlaunch = async ({
  pageSize,
  pageNumber,
}: GetFairlaunchCoinsFilteredType): Promise<FairlaunchCoinResult> => {
  try {
    logger.info("Attempting to fetch fairlaunch coins");

    // Build filter query with type safety
    const filterQuery: FilterQuery<CoinDocument> = {
      status: CoinStatus.APPROVED,
      "fairlaunch.enabled": true,
    };

    // Generate cache key
    const cacheKey = `coinsFairlaunch:${JSON.stringify({
      pageSize,
      pageNumber,
    })}`;

    // Try cache first
    const cachedData = await getCache<FairlaunchCoinResult>(
      redisClient,
      cacheKey
    );
    if (cachedData) {
      logger.info(`Cache hit for fairlaunch coins query: ${cacheKey}`);
      return cachedData;
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
        logo: 1,
        name: 1,
        symbol: 1,
        slug: 1,
        liquidity: 1,
        chain: 1,
        address: 1,
        fairlaunch: 1,
        audit: 1,
        kyc: 1,
        launchDate: 1,
        socials: 1,
        status: 1,
        createdAt: 1,
        todayVotes: 1,
        votes: 1,
        userVoted: 1,
        isFavorited: 1,
      })
      .sort(sortCriteria)
      .skip(skip)
      .limit(pageSize)
      .lean();

    const result: FairlaunchCoinResult = {
      coins,
      totalCount,
      totalPages,
      skip,
    };

    // Cache results
    await setCache(redisClient, cacheKey, result, "ex", 60 * 5); // 5 minutes cache
    logger.info(`Cached fairlaunch coins result: ${cacheKey}`);

    if (!coins || coins.length === 0) {
      logger.warn("No fairlaunch coins found");
    } else {
      logger.info(`Found ${coins.length} fairlaunch coins`);
    }

    return result;
  } catch (error) {
    logger.error("Error in getCoinsFairlaunch:", error);
    throw new Error("Failed to fetch fairlaunch coins");
  }
};

export async function approveCoinById(coinId: string): Promise<any> {
  try {
    // Update coin status to approved
    const approvedCoin = await CoinModel.findByIdAndUpdate(
      coinId,
      {
        status: CoinStatus.APPROVED,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!approvedCoin) {
      logger.error(`Failed to approve coin ${coinId}: Coin not found`);
      return null; // Returning null if the coin is not found
    }

    logger.info(`Successfully approved coin ${coinId}`);
    return approvedCoin; // Return the approved coin with author details
  } catch (error) {
    logger.error("Error in approveCoinById:", error);
    return null;
  }
}

export async function promoteCoinById(
  coinId: string
): Promise<{ promoted: boolean } | null> {
  try {
    const coin = await CoinModel.findByIdAndUpdate(
      coinId,
      [{ $set: { promoted: { $not: "$promoted" }, updatedAt: new Date() } }],
      { new: true }
    );

    if (!coin) {
      logger.warn(`Coin not found for promotion with ID: ${coinId}`);
      return null;
    }

    logger.info(
      `Successfully ${
        coin.promoted ? "promoted" : "unpromoted"
      } coin with ID: ${coinId}`
    );
    return { promoted: coin.promoted };
  } catch (error) {
    logger.error("Error in promoteCoinById:", error);
    throw new Error("Failed to promote coin");
  }
}

export async function declineCoinById(coinId: string): Promise<any> {
  try {
    const declinedCoin = await CoinModel.findByIdAndUpdate(
      coinId,
      {
        status: CoinStatus.DENIED,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!declinedCoin) {
      logger.warn(`Coin not found for declining with ID: ${coinId}`);
      return null;
    }

    logger.info(`Successfully declined coin with ID: ${coinId}`);
    return declinedCoin;
  } catch (error) {
    logger.error("Error in declineCoinById:", error);
    return null;
  }
}

export const getUsers = async ({
  pageSize,
  pageNumber,
  searchValue,
}: GetUsersFilteredType): Promise<UsersResult> => {
  try {
    logger.info("Attempting to fetch fairlaunch coins");

    // Build filter query with type safety
    const filterQuery: FilterQuery<UserDocument> = {};

    // Generate cache key
    const cacheKey = `users:${JSON.stringify({
      pageSize,
      pageNumber,
      searchValue,
    })}`;

    // Try cache first
    const cachedData = await getCache<UsersResult>(redisClient, cacheKey);
    if (cachedData) {
      logger.info(`Cache hit for users query: ${cacheKey}`);
      return cachedData;
    }

    if (searchValue) {
      filterQuery.$or = [
        { name: { $regex: searchValue, $options: "i" } },
        { email: { $regex: searchValue, $options: "i" } },
      ];
    }
    // Calculate pagination
    const skip = (pageNumber - 1) * pageSize;
    const totalCount = await UserModel.countDocuments(filterQuery);
    const totalPages = Math.ceil(totalCount / pageSize);

    // Execute query with optimized field selection
    const users = await UserModel.find(filterQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const result: UsersResult = {
      users,
      totalCount,
      totalPages,
      skip,
    };

    // Cache results
    await setCache(redisClient, cacheKey, result, "ex", 60 * 5); // 5 minutes cache
    logger.info(`Cached users result: ${cacheKey}`);

    if (!users || users.length === 0) {
      logger.warn("No users found");
    } else {
      logger.info(`Found ${users.length} users`);
    }

    return result;
  } catch (error) {
    logger.error("Error in getUsers:", error);
    throw new Error("Failed to fetch users");
  }
};

import { clerkClient } from "@clerk/clerk-sdk-node";

export const updateUserRoleById = async (
  userId: string,
  role: string
): Promise<any> => {
  try {
    // Update in your database
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { role } },
      { new: true }
    );

    if (!updatedUser) {
      logger.warn(`User not found for role update with ID: ${userId}`);
      return null;
    }

    // Update in Clerk
    await clerkClient.users.updateUser(updatedUser._id, {
      publicMetadata: {
        role: role,
      },
    });

    logger.info(
      `Successfully updated user role for ID: ${userId} in both DB and Clerk`
    );
    return updatedUser;
  } catch (error) {
    logger.error("Error in updateUserRoleById:", error);
    throw new Error("Failed to update user role");
  }
};

export const deleteUserFromClerkOnly = async (
  userId: string
): Promise<boolean> => {
  try {
    // Only delete from Clerk, not from database
    await clerkClient.users.deleteUser(userId);
    logger.info(`Successfully deleted user from Clerk with ID: ${userId}`);
    return true;
  } catch (error) {
    logger.error("Error deleting user from Clerk:", error);
    throw new Error("Failed to delete user from Clerk");
  }
};
