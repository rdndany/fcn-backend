import mongoose, { FilterQuery } from "mongoose";
import { Coin, GetCoinsFilteredType } from "../types/coin.types";
import CoinModel, { CoinDocument, CoinStatus } from "../models/coin.model";
import { getLogger } from "log4js";
import Moralis from "moralis";
import { getSafeNumber } from "../utils/getSafeNumber";
import { redisClient, setCache, getCache } from "../config/redis.config";
import VoteModel from "../models/vote.model";
import {
  getPublicIdFromUrl,
  removeImageFromCloudinary,
} from "../utils/removeImageCloudinary";
import FavoritesModel from "../models/favorites.model";
import { CoinDetails } from "../types/coin.types";

const logger = getLogger("coins-service");

export const getCoinsFiltered = async ({
  pageSize,
  pageNumber,
  presale,
  fairlaunch,
  chains,
  audit,
  kyc,
  sortColumn,
  sortDirection,
}: GetCoinsFilteredType) => {
  try {
    // Build filter query with type safety
    const filterQuery: FilterQuery<CoinDocument> = {
      status: CoinStatus.APPROVED,
    };

    // Apply chain filter if specified
    if (chains.length > 0) {
      filterQuery.chain = { $in: chains };
    }

    // Handle presale and fairlaunch filters
    if (presale === true) {
      // Show only presale coins
      filterQuery["presale.enabled"] = true;
      logger.info("Filtering to show only presale coins");
    } else if (fairlaunch === true) {
      // Show only fairlaunch coins
      filterQuery["fairlaunch.enabled"] = true;
      logger.info("Filtering to show only fairlaunch coins");
    } else if (sortColumn === "price24h") {
      // When sorting by price24h, exclude presale and fairlaunch coins
      filterQuery.$and = [
        { "presale.enabled": { $ne: true } },
        { "fairlaunch.enabled": { $ne: true } },
        { price24h: { $ne: 0 } },
      ];
      logger.info(
        "Sorting by price24h - excluding presale and fairlaunch coins"
      );
    }

    if (audit) filterQuery["audit.exist"] = true;
    if (kyc) filterQuery["kyc.exist"] = true;

    // Log the constructed filter query for debugging
    logger.info("Filter query:", JSON.stringify(filterQuery, null, 2));

    // Handle special sort cases
    if (sortColumn === "launchDate") {
      filterQuery.launchDate = { $ne: null };
    }

    // Generate cache key
    const cacheKey = `coinsFiltered:${JSON.stringify({
      filterQuery,
      pageSize,
      pageNumber,
      sortColumn,
      sortDirection,
    })}`;

    // Try cache first
    const cachedData = await getCache<{
      coins: CoinDocument[];
      totalCount: number;
      totalPages: number;
      skip: number;
    }>(redisClient, cacheKey);

    if (cachedData) {
      logger.info(`Cache hit for filtered coins query: ${cacheKey}`);
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
      })
      .sort(sortCriteria)
      .skip(skip)
      .limit(pageSize)
      .lean();

    // Log the query results for debugging
    logger.info(`Found ${coins.length} coins matching the filter criteria`);

    const result = {
      coins,
      totalCount,
      totalPages,
      skip,
    };

    // Cache results
    await setCache(redisClient, cacheKey, result, "ex", 60 * 10); // 10 minutes cache
    logger.info(`Cached filtered coins result: ${cacheKey}`);

    return result;
  } catch (error) {
    logger.error("Error in getCoinsFiltered:", error);
    throw new Error("Failed to fetch filtered coins");
  }
};

export const getCoinsPromoted = async (): Promise<Coin[]> => {
  try {
    const cacheKey = "coinsPromoted";
    logger.info("Attempting to fetch promoted coins");

    // Try cache first
    const cacheData = await getCache<Coin[]>(redisClient, cacheKey);
    if (cacheData) {
      logger.info(
        `Cache hit for promoted coins, found ${cacheData.length} coins`
      );
      return cacheData;
    }

    // Build query with proper type safety
    const filterQuery: FilterQuery<CoinDocument> = {
      promoted: true,
      status: CoinStatus.APPROVED,
    };

    // Execute query with optimized field selection
    const promotedCoins = await CoinModel.find(filterQuery)
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
        totalViews: 1,
      })
      .sort({ votes: -1, _id: 1 }) // Consistent sorting with secondary key
      .lean();

    if (!promotedCoins || promotedCoins.length === 0) {
      logger.warn("No promoted coins found");
      return [];
    }

    // Cache the results
    await setCache(redisClient, cacheKey, promotedCoins, "ex", 60 * 10); // 10 minutes cache
    logger.info(`Cached ${promotedCoins.length} promoted coins`);

    return promotedCoins as Coin[];
  } catch (error) {
    logger.error("Error in getCoinsPromoted:", error);
    throw new Error("Failed to fetch promoted coins");
  }
};

export const getTopGainersCoins = async (): Promise<Coin[]> => {
  try {
    const cacheKey = "top-gainers-coins";
    const cacheData = await getCache<Coin[]>(redisClient, cacheKey);
    if (cacheData) {
      logger.info(
        `Cache hit for top gainers coins, found ${cacheData.length} coins`
      );
      return cacheData;
    }

    const topGainers = await CoinModel.find({
      price24h: { $gt: 0 },
      status: CoinStatus.APPROVED,
    })
      .select({
        logo: 1,
        name: 1,
        chain: 1,
        slug: 1,
        price24h: 1,
      })
      .sort({ price24h: -1 })
      .limit(9)
      .lean();

    await setCache(redisClient, cacheKey, topGainers, "ex", 60 * 10); // 10 minutes cache
    logger.info(`Cached ${topGainers.length} top gainers coins`);

    return topGainers as Coin[];
  } catch (error) {
    logger.error("Error in getTopGainersCoins:", error);
    throw new Error("Failed to fetch top gainers coins");
  }
};

export const getRecentlyAddedCoins = async (): Promise<Coin[]> => {
  try {
    const cacheKey = "recently-added-coins";
    const cacheData = await getCache<Coin[]>(redisClient, cacheKey);
    if (cacheData) {
      logger.info(
        `Cache hit for recently added coins, found ${cacheData.length} coins`
      );
      return cacheData;
    }

    const recentlyAdded = await CoinModel.find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      status: CoinStatus.APPROVED,
    })
      .select({
        logo: 1,
        name: 1,
        chain: 1,
        slug: 1,
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .limit(9)
      .lean();

    await setCache(redisClient, cacheKey, recentlyAdded, "ex", 60 * 10); // 10 minutes cache
    logger.info(`Cached ${recentlyAdded.length} recently added coins`);

    return recentlyAdded as Coin[];
  } catch (error) {
    logger.error("Error in getRecentlyAdded:", error);
    throw new Error("Failed to fetch recently added coins");
  }
};

export const getPresaleCoins = async (): Promise<Coin[]> => {
  try {
    const cacheKey = "presale-coins";
    const cacheData = await getCache<Coin[]>(redisClient, cacheKey);
    if (cacheData) {
      logger.info(
        `Cache hit for presale coins, found ${cacheData.length} coins`
      );
      return cacheData;
    }

    const presaleCoins = await CoinModel.find({
      "presale.enabled": true,
      status: CoinStatus.APPROVED,
    })
      .select({
        logo: 1,
        name: 1,
        symbol: 1,
        chain: 1,
        slug: 1,
        presale: 1,
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .limit(9)
      .lean();

    await setCache(redisClient, cacheKey, presaleCoins, "ex", 60 * 10); // 10 minutes cache
    logger.info(`Cached ${presaleCoins.length} presale coins`);

    return presaleCoins as Coin[];
  } catch (error) {
    logger.error("Error in getPresaleCoins:", error);
    throw new Error("Failed to fetch presale coins");
  }
};

export const getSOLCoinPriceData = async (address: string) => {
  try {
    const apiKey = process.env.MORALIS_API_KEY || "";

    const pricesRes = await fetch(
      "https://solana-gateway.moralis.io/token/mainnet/prices",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          addresses: [address],
        }),
      }
    );

    const pricesData = await pricesRes.json();
    const priceData = pricesData[0];

    const metadataRes = await fetch(
      `https://deep-index.moralis.io/api/v2.2/tokens/${address}/analytics?chain=solana`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          "X-API-Key": apiKey,
        },
      }
    );

    const metadata = await metadataRes.json();
    logger.warn(`Price, Price24h, Mkap and Liquidity updated for ${address}`);
    return {
      price: getSafeNumber(priceData?.usdPrice),
      price24h: getSafeNumber(priceData?.usdPrice24hrPercentChange),
      mkap: getSafeNumber(metadata?.totalFullyDilutedValuation),
      liquidity: getSafeNumber(metadata?.totalLiquidityUsd),
    };
  } catch (error) {
    logger.error(`Error fetching SOL coin data for address ${address}:`, error);
    return { price: 0, price24h: 0, mkap: 0, liquidity: 0 };
  }
};

export const getEVMCoinPriceData = async (address: string, chain: string) => {
  try {
    const apiKey = process.env.MORALIS_API_KEY || "";
    const chainNameToIdMap: Record<string, string> = {
      bnb: "0x38",
      eth: "0x1",
      matic: "0x89",
      base: "0x2105",
    };

    const chainId = chainNameToIdMap[chain];
    if (!chainId) {
      logger.error(`Unsupported EVM chain: ${chain}`);
      return { price: 0, price24h: 0, mkap: 0, liquidity: 0 };
    }

    const response = await Moralis.EvmApi.token.getMultipleTokenPrices(
      {
        chain: chainId,
        include: "percent_change",
      },
      {
        tokens: [{ tokenAddress: address }],
      }
    );
    const priceData = response.raw[0];
    console.log(chainId, chain, address);
    const metadataRes = await fetch(
      `https://deep-index.moralis.io/api/v2.2/tokens/${address}/analytics?chain=${chainId}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          "X-API-Key": apiKey,
        },
      }
    );
    const metadata = await metadataRes.json();

    logger.warn(`Price, Price24h, Mkap and Liquidity updated for ${address}`);
    return {
      price: getSafeNumber(priceData?.usdPrice),
      price24h: getSafeNumber(priceData?.["24hrPercentChange"]),
      mkap: Number(metadata?.totalFullyDilutedValuation) || 0,
      liquidity: Number(metadata?.totalLiquidityUsd) || 0,
    };
  } catch (error) {
    logger.error(
      `Error fetching EVM coin data for address ${address} on chain ${chain}:`,
      error
    );
    return { price: 0, price24h: 0, mkap: 0, liquidity: 0 };
  }
};

export async function deleteCoinById(coinId: string): Promise<boolean> {
  try {
    // Find the coin first
    const coin = await CoinModel.findById(coinId);
    if (!coin) {
      return false;
    }

    // Delete associated votes
    try {
      await VoteModel.deleteMany({ coin_id: coin._id });
      logger.info(`Deleted votes for coin ${coin._id}`);
    } catch (error) {
      logger.error("Error deleting votes for coin:", error);
      throw new Error("Failed to delete votes for coin");
    }

    // Delete from FavoritesModel
    try {
      await FavoritesModel.deleteMany({ coin_id: coin._id });
      logger.info(`Deleted from favorites for coin ${coin._id}`);
    } catch (error) {
      logger.error("Error deleting from FavoritesModel:", error);
      throw new Error("Failed to delete coin from favorites");
    }

    // Delete the cropped logo from Cloudinary if exists
    if (coin.croppedLogo) {
      const publicId = getPublicIdFromUrl(coin.croppedLogo);
      if (publicId) {
        try {
          await removeImageFromCloudinary(publicId);
          logger.info(`Deleted image from Cloudinary for coin ${coin._id}`);
        } catch (error) {
          logger.error("Failed to delete image from Cloudinary:", error);
          throw new Error("Failed to delete image from Cloudinary");
        }
      }
    }

    // Delete the coin
    await CoinModel.findByIdAndDelete(coinId);
    logger.info(`Successfully deleted coin ${coinId}`);
    return true;
  } catch (error) {
    logger.error("Error in deleteCoinById:", error);
    return false;
  }
}

export async function coinBySlug(slug: string): Promise<CoinDetails | null> {
  try {
    const coin = await CoinModel.findOne(
      { slug },
      {
        promoted: 0,
        createdAt: 0,
        updatedAt: 0,
      }
    ).lean();

    if (!coin) {
      logger.warn(`Coin not found with slug: ${slug}`);
      return null;
    }

    logger.info(`Successfully retrieved coin with slug: ${slug}`);
    return {
      ...coin,
      _id: coin._id.toString(),
      logo: null,
    } as CoinDetails;
  } catch (error) {
    logger.error("Error in coinBySlug:", error);
    throw new Error("Failed to retrieve coin details");
  }
}

export async function coinBySlugDetails(
  slug: string
): Promise<CoinDetails | null> {
  try {
    const coin = await CoinModel.findOne({ slug }).lean();

    const cacheKey = `coin-details-${slug}`;
    const cacheData = await getCache<CoinDetails>(redisClient, cacheKey);
    if (cacheData) {
      logger.info(`Cache hit for coin details: ${slug}`);
      return cacheData;
    }

    if (!coin) {
      logger.warn(`Coin not found with slug: ${slug}`);
      return null;
    }

    // Find the coin position based on todayVotes if there are multiple coins with the same vote count (for example 1) then the rank will be different. Expl: BITCOIN 1 VOTE rank 1 ETHEREUM 1 VOTE rank 2

    logger.info(`Successfully retrieved coin with slug: ${slug}`);
    const result = {
      ...coin,
      _id: coin._id.toString(),
    } as CoinDetails;

    await setCache(redisClient, cacheKey, result, "ex", 60 * 2); // 2 minutes cache
    logger.info(`Cached coin details for ${slug}`);

    return result;
  } catch (error) {
    logger.error("Error in coinBySlug:", error);
    throw new Error("Failed to retrieve coin details");
  }
}
