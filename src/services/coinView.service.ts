import mongoose from "mongoose";
import CoinViewModel from "../models/coinView.model";
import CoinModel, { CoinStatus } from "../models/coin.model";
import { getLogger } from "log4js";
import { TrendingCoin } from "../types/coin.types";
import { getCache, redisClient, setCache } from "../config/redis.config";

const logger = getLogger("trending-coins");

export const trackView = async (
  coinId: mongoose.Types.ObjectId, // coinId should always be an ObjectId
  ipAddress: string,
  userAgent?: string
): Promise<void> => {
  try {
    // Ensure that coinId is valid before proceeding
    if (!coinId) {
      console.error("Invalid coinId provided:", coinId);
      throw new Error("Invalid coinId");
    }

    // Create or update the CoinView document
    const existingView = await CoinViewModel.findOne({
      coinId: coinId,
      ip_address: ipAddress,
    });

    if (existingView) {
      console.log(
        "User has already viewed this coin within the last 24 hours."
      );
      return; // Skip creating a duplicate view entry
    }

    // Track the view by creating a new entry
    const newCoinView = new CoinViewModel({
      coinId: coinId,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    await newCoinView.save();
    console.log("Coin view tracked successfully.");
  } catch (error) {
    console.error("Error tracking coin view:", error);
    throw new Error("Failed to track coin view");
  }
};

export const getViewStats = async (
  coinId: string
): Promise<{ total_views: number; last_24h: number }> => {
  try {
    // Ensure Mongoose handles ObjectId conversion
    const stats = await CoinViewModel.aggregate([
      {
        $match: {
          coinId: new mongoose.Types.ObjectId(coinId), // Mongoose handles conversion
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
  } catch (error) {
    console.error("Error in getViewStats:", error);
    throw new Error("Failed to retrieve view stats");
  }
};

// Define weights for views, votes, and price24h
const viewWeight = 0.5; // Adjust weight for views
const voteWeight = 0.3; // Adjust weight for votes

const priceThreshold = 100; // +100 todayVotes increase threshold
const priceWeight = 0.2; // Weight for price24h change influence

// Define a threshold for price24h change to apply a boost
const priceChangeThreshold = 10; // +10% price increase threshold
const liquidityThreshold = 10000; // Liquidity threshold (10k)

// Fetch all coins and sort them by their trending score (views + votes + price change)
export const getAllCoinsTrending = async (limit: number): Promise<any[]> => {
  try {
    const cacheKey = "trending-coins";
    logger.info("Attempting to fetch trending coins");

    const cacheData = await getCache<TrendingCoin[]>(redisClient, cacheKey);
    if (cacheData) {
      logger.info(
        `Cache hit for trending coins, found ${cacheData.length} coins`
      );
      return cacheData;
    }

    // Aggregate view counts for each coin
    const viewStats = await CoinViewModel.aggregate([
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
    const allCoins = await CoinModel.find({
      status: CoinStatus.APPROVED,
    });

    // Merge viewStats with allCoins to include coins with no views
    const coinsWithViewCount = allCoins.map((coin) => {
      const coinStats = viewStats.find(
        (stat: any) => stat.coinId.toString() === coin._id.toString()
      );
      return {
        ...coin.toObject(),
        totalViews: coinStats ? coinStats.totalViews : 0, // Default to 0 views if no viewStats
      };
    });

    // Fetch vote count for each coin (e.g., todayVotes or allTimeVotes)
    const voteStats = await CoinModel.aggregate([
      {
        $group: {
          _id: "$_id", // Group by coinId
          totalVotes: { $sum: "$todayVotes" }, // Use the votes you need (e.g., todayVotes or allTimeVotes)
        },
      },
    ]);

    // Merge votes with coins
    const coinsWithVotes = coinsWithViewCount.map((coin) => {
      const voteStat = voteStats.find(
        (stat: any) => stat._id.toString() === coin._id.toString()
      );
      return {
        ...coin,
        totalVotes: voteStat ? voteStat.totalVotes : 0, // Default to 0 votes if no voteStats
      };
    });

    // Calculate trending score for each coin
    const coinsWithTrendingScore = coinsWithVotes.map((coin) => {
      // Calculate base trending score using views and votes
      let trendingScore = viewWeight * coin.totalViews;

      // Check if todayVotes is over 100 and count on trending score
      if (coin.todayVotes > priceThreshold) {
        trendingScore += voteWeight * coin.todayVotes;
      }

      // Check if price24h has increased and apply a boost if needed, but ignore if liquidity is less than 10k
      if (coin.liquidity >= liquidityThreshold) {
        const priceChange = coin.price24h || 0;
        if (priceChange > priceChangeThreshold) {
          // Apply a boost to the trending score if the price increased significantly
          trendingScore += priceWeight * priceChange; // Boost by priceChange weight
        }
      }

      return {
        ...coin,
        trendingScore, // Add the trending score to the coin data
      };
    });

    // Sort coins by the trending score in descending order
    const sortedCoins = coinsWithTrendingScore.sort(
      (a, b) => b.trendingScore - a.trendingScore
    );

    // Slice the array to only include the top `limit` number of coins
    const topCoins = sortedCoins.slice(0, limit);

    // Cache the results
    await setCache(redisClient, cacheKey, topCoins, "ex", 60 * 10); // 10 minutes cache
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
  } catch (error) {
    console.error("Error getting all coins trending:", error);
    throw new Error("Failed to fetch all coins trending");
  }
};
