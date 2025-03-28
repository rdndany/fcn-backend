import VoteModel, { VoteDocument } from "../models/vote.model";
import mongoose from "mongoose";
import CoinModel, { CoinDocument, CoinStatus } from "../models/coin.model";
import { getLogger } from "log4js";
import { getFavoritedCoinIds } from "./favorites.service";
import { AddVoteAFlagsParams, Coin, UpdatedCoin } from "../types/coin.types";
import {
  CacheInvalidationScope,
  invalidateCoinCaches,
} from "../utils/coin.utils";
import { deleteCache, redisClient } from "../config/redis.config";

const logger = getLogger("votes");

export const getVotesByCoinId = async (coin_id: string) => {
  if (!mongoose.Types.ObjectId.isValid(coin_id)) {
    throw new Error("Invalid coin_id format");
  }

  // Find all votes where coin_id matches
  const votes = await VoteModel.countDocuments({ coin_id: coin_id });
  return votes;
};

export const createVoteByCoinId = async (
  coin_id: string,
  userIp: string
): Promise<{ vote: VoteDocument; updatedCoin: CoinDocument }> => {
  if (!coin_id || !userIp) {
    throw new Error("coin_id and ip_address are required");
  }

  if (!mongoose.Types.ObjectId.isValid(coin_id)) {
    throw new Error("Invalid coin_id format");
  }

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  logger.info("Processing vote request:", { coin_id, userIp });

  try {
    // First, check if the coin exists and is approved
    const coin = await CoinModel.findById(coin_id);
    if (!coin) {
      throw new Error("Coin not found");
    }

    // Check if the coin's status is APPROVED before allowing the vote
    if (coin.status !== CoinStatus.APPROVED) {
      throw new Error(`Cannot vote for ${coin.name} as it is not approved.`);
    }

    // Check if the user has already voted today for this coin
    const existingVote = await VoteModel.findOne({
      coin_id,
      ip_address: userIp,
      created_at: { $gte: todayStart },
    });

    if (existingVote) {
      throw new Error(`You have already voted today for ${coin.name}.`);
    }

    // Create the vote record first
    const vote = await VoteModel.create({
      coin_id,
      ip_address: userIp,
      organic: true,
      created_at: new Date(),
    });

    // Then update the coin's vote counts
    const updatedCoin = await CoinModel.findOneAndUpdate(
      { _id: coin_id },
      {
        $inc: {
          votes: 1,
          todayVotes: 1,
        },
      },
      { new: true }
    );

    if (!updatedCoin) {
      // If coin update fails, we should clean up the vote record
      await VoteModel.deleteOne({ _id: vote._id });
      throw new Error("Failed to update the coin vote count");
    }

    // Invalidate caches
    await invalidateCoinCaches(CacheInvalidationScope.VOTE);
    // invalidate the coin details cache
    await deleteCache(redisClient, `coin-details-${coin.slug}`);
    logger.info("Successfully recorded vote:", {
      coin_id,
      coinName: coin.name,
      userIp,
      updatedVotes: {
        total: updatedCoin.votes,
        today: updatedCoin.todayVotes,
      },
    });

    return { vote, updatedCoin };
  } catch (error) {
    logger.error("Error in createVoteByCoinId:", error);
    throw error;
  }
};

export async function fetchVotesToCoins({
  coins,
  favoritedCoinIds,
  ipAddress,
  coinIds,
  userId,
}: AddVoteAFlagsParams): Promise<UpdatedCoin[]> {
  // Step 1: Calculate start of today (UTC)
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  if (userId) {
    favoritedCoinIds = await getFavoritedCoinIds(userId, coinIds);
  }

  // Step 2: Get all user votes for today
  const userVotes = await VoteModel.find({
    ip_address: ipAddress,
    coin_id: { $in: coinIds },
    created_at: { $gte: todayStart },
  }).select("coin_id");

  // Step 3: Convert votes into a Set for quick lookup
  const userVotedCoins = new Set<string>(
    userVotes.map((vote) => vote.coin_id.toString())
  );

  // Step 4: Map promoted coins and add the flags
  const coinsWithUpdatedFlags: UpdatedCoin[] = coins.map((coinDoc) => {
    const coin = coinDoc as Coin; // Assert coinDoc as a Coin type

    const coinId = coin._id.toString();

    return {
      ...coin,
      isFavorited: favoritedCoinIds.includes(coinId),
      userVoted: userVotedCoins.has(coinId),
    };
  });

  return coinsWithUpdatedFlags;
}

export const getVotesByCoinIdToday = async (coin_id: string) => {
  if (!mongoose.Types.ObjectId.isValid(coin_id)) {
    throw new Error("Invalid coin_id format");
  }
  // count only today votes , if is > 0 then return true
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const votes = await VoteModel.countDocuments({
    coin_id: coin_id,
    created_at: { $gte: todayStart },
  });
  return votes > 0;
};
