import { v4 } from "uuid";
import { PriceData } from "../types/coin.types";
import {
  getEVMCoinPriceData,
  getSOLCoinPriceData,
} from "../services/coin.service";
import CoinModel from "../models/coin.model";
import slugify from "./slugify";
import {
  deleteAllThatStartsWithPrefix,
  deleteCache,
  redisClient,
} from "../config/redis.config";
import { getLogger } from "log4js";

const logger = getLogger("coin-utils");

export async function fetchCoinPriceData(
  chain?: string,
  address?: string
): Promise<PriceData> {
  const defaultPriceData: PriceData = {
    price: 0,
    price24h: 0,
    mkap: 0,
    liquidity: 0,
  };

  if (!address || !chain) return defaultPriceData;

  return chain === "sol"
    ? await getSOLCoinPriceData(address)
    : await getEVMCoinPriceData(address, chain);
}

export async function generateUniqueSlug(
  name: string,
  excludeId?: string
): Promise<string> {
  const baseSlug = slugify(name.trim());

  const existingSlug = await CoinModel.findOne({
    slug: baseSlug,
    ...(excludeId && { _id: { $ne: excludeId } }),
  });

  return existingSlug ? `${baseSlug}-${v4().split("-")[0]}` : baseSlug;
}

export async function validateAddressUniqueness(
  address?: string
): Promise<void> {
  if (!address || address.trim() === "") return;

  const existingCoin = await CoinModel.findOne({ address: address.trim() });
  if (existingCoin) {
    throw new Error("Coin with this address already exists");
  }
}

export enum CacheInvalidationScope {
  PROMOTION = "promotion",
  APPROVAL = "approval",
  DECLINE = "decline",
  UPDATE = "update",
  DELETE = "delete",
  CREATE = "create",
  PRESALE = "presale",
  FAIRLAUNCH = "fairlaunch",
  FAVORITE = "favorite",
  VOTE = "vote",
  UPDATE_PRICE = "update-price",
  UPDATE_ROLE = "update-role",
  DELETE_USER = "delete-user",
}

export async function invalidateCoinCaches(
  scope: CacheInvalidationScope
): Promise<void> {
  try {
    const keysToInvalidate: string[] = [];

    switch (scope) {
      case CacheInvalidationScope.PROMOTION:
        // When promoting/unpromoting a coin
        keysToInvalidate.push(
          "coinsPromoted",
          "coinsApproved",
          "coinsAdminPromoted"
        );
        break;

      case CacheInvalidationScope.APPROVAL:
        // When approving a coin
        keysToInvalidate.push("coinsPending", "coinsApproved", "userCoins");
        break;

      case CacheInvalidationScope.DECLINE:
        // When declining a coin
        keysToInvalidate.push("coinsPending", "userCoins");
        break;

      case CacheInvalidationScope.FAVORITE:
        // When favorite a coin
        keysToInvalidate.push(
          "coinsFiltered",
          "userCoins",
          "userFavorites",
          "coinsPromoted"
        );
        break;

      case CacheInvalidationScope.UPDATE:
        // When updating a coin's details
        keysToInvalidate.push(
          "coinsPending",
          "coinsFiltered",
          "userCoins",
          "coinsApproved",
          "coin-details"
        );
        break;

      case CacheInvalidationScope.UPDATE_ROLE:
        // When updating a user's role
        keysToInvalidate.push("users");
        break;

      case CacheInvalidationScope.DELETE_USER:
        // When deleting a user
        keysToInvalidate.push("users");
        break;

      case CacheInvalidationScope.UPDATE_PRICE:
        // When updating a coin's details
        keysToInvalidate.push(
          "coinsPending",
          "coinsApproved",
          "coinsPresale",
          "coinsFairlaunch",
          "coinsAdminPromoted",
          "coinsFiltered",
          "coinsPromoted",
          "userCoins",
          "coin-details"
        );
        break;

      case CacheInvalidationScope.VOTE:
        // When updating a coin's details
        keysToInvalidate.push(
          "coinsFiltered",
          "userFavorites",
          "coinsPromoted"
        );
        break;

      case CacheInvalidationScope.DELETE:
        // When deleting a coin
        keysToInvalidate.push(
          "coinsApproved",
          "coinsFiltered",
          "coinsPromoted",
          "coinsPending",
          "coinsPresale",
          "coinsFairlaunch",
          "coinsAdminPromoted",
          "userCoins"
        );
        break;

      case CacheInvalidationScope.CREATE:
        // When creating a new coin
        keysToInvalidate.push("coinsPending", "userCoins", "coinsFiltered");
        break;

      case CacheInvalidationScope.PRESALE:
        // When updating presale status
        keysToInvalidate.push("coinsPresale", "coinsFiltered");
        break;

      case CacheInvalidationScope.FAIRLAUNCH:
        // When updating fairlaunch status
        keysToInvalidate.push("coinsFairlaunch", "coinsFiltered");
        break;

      default:
        logger.warn(`Unknown cache invalidation scope: ${scope}`);
        return;
    }

    // Create a pipeline for bulk operations
    const pipeline = redisClient.pipeline();

    keysToInvalidate.forEach((key) => {
      if (key === "coinsPromoted") {
        // Exact match deletion
        pipeline.del(key);
      } else {
        // Prefix-based deletion (using UNLINK instead of DEL for non-blocking)
        pipeline.eval(
          `local keys = redis.call('keys', ARGV[1]..'*')
           if #keys > 0 then
             return redis.call('unlink', unpack(keys))
           end
           return 0`,
          0, // No keys are passed, only ARGV
          key
        );
      }
    });

    // Execute all commands in a single roundtrip
    await pipeline.exec();

    logger.warn(`Successfully invalidated caches for scope: ${scope}`, {
      invalidatedKeys: keysToInvalidate,
    });
  } catch (error) {
    logger.error(`Error invalidating coin caches for scope ${scope}:`, error);
    throw error; // Re-throw to let caller handle
  }
}
