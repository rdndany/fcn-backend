// src/config/redis.config.ts

import Redis from "ioredis";
import { getLogger } from "log4js";
import { config } from "./app.config";

const logger = getLogger("cache");

export const redisConfig = {
  host: config.REDIS_HOST || "127.0.0.1",
  port: Number(config.REDIS_PORT) || 6379,
  password: config.REDIS_PASSWORD || undefined,
  db: Number(config.REDIS_DB) || 0,
  connectTimeout: 10000, // 10 seconds timeout
  retryStrategy: (times: number) => Math.min(times * 50, 2000), // Retry on connection failure
};

// Create the Redis client
export const redisClient = new Redis(redisConfig); // Exporting the Redis client

// Function to set data in Redis cache
export const setCache = async (
  client: any,
  key: string,
  value: any,
  expireMode: string = "ex",
  expireTime: string | number = 2 * 60
): Promise<void> => {
  if (client.ignore) {
    logger.info("setCache: skipped due to CACHE_IGNORE policy");
    return;
  }

  try {
    await client.set(key, JSON.stringify(value), expireMode, expireTime);
    logger.info(`setCache: ${key}`);
  } catch (error) {
    logger.error(error);
  }
};

// Function to get data from Redis cache
export const getCache = async <T>(
  client: any,
  key: string
): Promise<T | null> => {
  if (client.ignore) {
    logger.info("getCache: skipped due to CACHE_IGNORE policy");
    return null;
  }

  try {
    const value = await client.get(key);
    if (!value) {
      return null;
    }
    logger.info(`retrieved: ${key}`);
    return JSON.parse(value) as T;
  } catch (error) {
    logger.error(error);
    return null;
  }
};

// Function to delete a cache key
export const deleteCache = async (client: any, key: string): Promise<void> => {
  logger.info(`deleted: ${key}`);
  await client.del(key);
};

// Function to delete cache keys with a specific prefix
export const deleteAllThatStartsWithPrefix = async (
  client: any,
  prefix: string
): Promise<void> => {
  try {
    logger.info(`deleted prefix: ${prefix}`);

    const keys = await client.keys(`${prefix}:*`);

    const pipeline = client.pipeline();

    keys.forEach((key: string) => {
      pipeline.del(key);
    });

    await pipeline.exec();
  } catch (error) {
    logger.error(error);
  }
};
