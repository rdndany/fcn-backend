"use strict";
// src/config/redis.config.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllThatStartsWithPrefix = exports.deleteCache = exports.getCache = exports.setCache = exports.redisClient = exports.redisConfig = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const log4js_1 = require("log4js");
const app_config_1 = require("./app.config");
const logger = (0, log4js_1.getLogger)("cache");
exports.redisConfig = {
    host: app_config_1.config.REDIS_HOST || "127.0.0.1",
    port: Number(app_config_1.config.REDIS_PORT) || 6379,
    password: app_config_1.config.REDIS_PASSWORD || undefined,
    db: Number(app_config_1.config.REDIS_DB) || 0,
    connectTimeout: 10000, // 10 seconds timeout
    retryStrategy: (times) => Math.min(times * 50, 2000), // Retry on connection failure
};
// Create the Redis client
exports.redisClient = new ioredis_1.default(exports.redisConfig); // Exporting the Redis client
// Function to set data in Redis cache
const setCache = (client_1, key_1, value_1, ...args_1) => __awaiter(void 0, [client_1, key_1, value_1, ...args_1], void 0, function* (client, key, value, expireMode = "ex", expireTime = 2 * 60) {
    if (client.ignore) {
        logger.info("setCache: skipped due to CACHE_IGNORE policy");
        return;
    }
    try {
        yield client.set(key, JSON.stringify(value), expireMode, expireTime);
        logger.info(`setCache: ${key}`);
    }
    catch (error) {
        logger.error(error);
    }
});
exports.setCache = setCache;
// Function to get data from Redis cache
const getCache = (client, key) => __awaiter(void 0, void 0, void 0, function* () {
    if (client.ignore) {
        logger.info("getCache: skipped due to CACHE_IGNORE policy");
        return null;
    }
    try {
        const value = yield client.get(key);
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
});
exports.getCache = getCache;
// Function to delete a cache key
const deleteCache = (client, key) => __awaiter(void 0, void 0, void 0, function* () {
    logger.info(`deleted: ${key}`);
    yield client.del(key);
});
exports.deleteCache = deleteCache;
// Function to delete cache keys with a specific prefix
const deleteAllThatStartsWithPrefix = (client, prefix) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger.info(`deleted prefix: ${prefix}`);
        const keys = yield client.keys(`${prefix}:*`);
        const pipeline = client.pipeline();
        keys.forEach((key) => {
            pipeline.del(key);
        });
        yield pipeline.exec();
    }
    catch (error) {
        logger.error(error);
    }
});
exports.deleteAllThatStartsWithPrefix = deleteAllThatStartsWithPrefix;
