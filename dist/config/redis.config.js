"use strict";
// src/config/redis.config.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllThatStartsWithPrefix = exports.deleteCache = exports.getCache = exports.setCache = exports.redisClient = exports.redisConfig = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const log4js_1 = require("log4js");
const logger = (0, log4js_1.getLogger)("cache");
exports.redisConfig = {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB) || 0,
    connectTimeout: 10000, // 10 seconds timeout
    retryStrategy: (times) => Math.min(times * 50, 2000), // Retry on connection failure
};
// Create the Redis client
exports.redisClient = new ioredis_1.default(exports.redisConfig); // Exporting the Redis client
// Function to set data in Redis cache
const setCache = async (client, key, value, expireMode = "ex", expireTime = 2 * 60) => {
    if (client.ignore) {
        logger.info("setCache: skipped due to CACHE_IGNORE policy");
        return;
    }
    try {
        await client.set(key, JSON.stringify(value), expireMode, expireTime);
        logger.info(`setCache: ${key}`);
    }
    catch (error) {
        logger.error(error);
    }
};
exports.setCache = setCache;
// Function to get data from Redis cache
const getCache = async (client, key) => {
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
        return JSON.parse(value);
    }
    catch (error) {
        logger.error(error);
        return null;
    }
};
exports.getCache = getCache;
// Function to delete a cache key
const deleteCache = async (client, key) => {
    logger.info(`deleted: ${key}`);
    await client.del(key);
};
exports.deleteCache = deleteCache;
// Function to delete cache keys with a specific prefix
const deleteAllThatStartsWithPrefix = async (client, prefix) => {
    try {
        logger.info(`deleted prefix: ${prefix}`);
        const keys = await client.keys(`${prefix}:*`);
        const pipeline = client.pipeline();
        keys.forEach((key) => {
            pipeline.del(key);
        });
        await pipeline.exec();
    }
    catch (error) {
        logger.error(error);
    }
};
exports.deleteAllThatStartsWithPrefix = deleteAllThatStartsWithPrefix;
