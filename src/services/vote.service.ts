import VoteModel, { VoteDocument } from "../models/vote.model";
import mongoose, { Types } from "mongoose";
import CoinModel, { CoinDocument } from "../models/coin.model";
import { getLogger } from "log4js";
import { getFavoritedCoinIds } from "./favorites.service";
import { AddVoteAFlagsParams, Coin, UpdatedCoin } from "../@types/coin.types";

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

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  // Check if the user has already voted today for this coin
  const existingVote = await VoteModel.findOne({
    coin_id,
    ip_address: userIp,
    created_at: { $gte: todayStart },
  });

  const coin = await CoinModel.findById(coin_id);
  if (!coin) {
    throw new Error("Coin not found");
  }

  if (existingVote) {
    throw new Error(`You have already voted today for ${coin.name}.`);
  }

  // 1. Create the vote record
  const vote = await VoteModel.create({
    coin_id,
    ip_address: userIp,
    organic: true,
    created_at: new Date(),
  });

  // 2. Increment the votes & todayVotes counters atomically
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
    throw new Error("Failed to update the coin vote count");
  }

  logger.warn(`${userIp} successfully voted for ${coin_id}`);

  return { vote, updatedCoin };
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
