"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheInvalidationScope = void 0;
exports.fetchCoinPriceData = fetchCoinPriceData;
exports.generateUniqueSlug = generateUniqueSlug;
exports.validateAddressUniqueness = validateAddressUniqueness;
exports.invalidateCoinCaches = invalidateCoinCaches;
const uuid_1 = require("uuid");
const coin_service_1 = require("../services/coin.service");
const coin_model_1 = __importDefault(require("../models/coin.model"));
const slugify_1 = __importDefault(require("./slugify"));
const redis_config_1 = require("../config/redis.config");
const log4js_1 = require("log4js");
const logger = (0, log4js_1.getLogger)("coin-utils");
async function fetchCoinPriceData(chain, address) {
    const defaultPriceData = {
        price: 0,
        price24h: 0,
        mkap: 0,
        liquidity: 0,
    };
    if (!address || !chain)
        return defaultPriceData;
    return chain === "sol"
        ? await (0, coin_service_1.getSOLCoinPriceData)(address)
        : await (0, coin_service_1.getEVMCoinPriceData)(address, chain);
}
async function generateUniqueSlug(name, excludeId) {
    const baseSlug = (0, slugify_1.default)(name.trim());
    const existingSlug = await coin_model_1.default.findOne({
        slug: baseSlug,
        ...(excludeId && { _id: { $ne: excludeId } }),
    });
    return existingSlug ? `${baseSlug}-${(0, uuid_1.v4)().split("-")[0]}` : baseSlug;
}
async function validateAddressUniqueness(address) {
    if (!address || address.trim() === "")
        return;
    const existingCoin = await coin_model_1.default.findOne({ address: address.trim() });
    if (existingCoin) {
        throw new Error("Coin with this address already exists");
    }
}
var CacheInvalidationScope;
(function (CacheInvalidationScope) {
    CacheInvalidationScope["PROMOTION"] = "promotion";
    CacheInvalidationScope["APPROVAL"] = "approval";
    CacheInvalidationScope["DECLINE"] = "decline";
    CacheInvalidationScope["UPDATE"] = "update";
    CacheInvalidationScope["DELETE"] = "delete";
    CacheInvalidationScope["CREATE"] = "create";
    CacheInvalidationScope["PRESALE"] = "presale";
    CacheInvalidationScope["FAIRLAUNCH"] = "fairlaunch";
    CacheInvalidationScope["FAVORITE"] = "favorite";
    CacheInvalidationScope["VOTE"] = "vote";
    CacheInvalidationScope["UPDATE_PRICE"] = "update-price";
})(CacheInvalidationScope || (exports.CacheInvalidationScope = CacheInvalidationScope = {}));
async function invalidateCoinCaches(scope) {
    try {
        const keysToInvalidate = [];
        switch (scope) {
            case CacheInvalidationScope.PROMOTION:
                // When promoting/unpromoting a coin
                keysToInvalidate.push("coinsPromoted", "coinsApproved", "coinsAdminPromoted");
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
                keysToInvalidate.push("coinsFiltered", "userCoins", "userFavorites", "coinsPromoted");
                break;
            case CacheInvalidationScope.UPDATE:
                // When updating a coin's details
                keysToInvalidate.push("coinsPending", "coinsFiltered", "userCoins", "coinsApproved");
                break;
            case CacheInvalidationScope.UPDATE_PRICE:
                // When updating a coin's details
                keysToInvalidate.push("coinsPending", "coinsApproved", "coinsPresale", "coinsFairlaunch", "coinsAdminPromoted", "coinsFiltered", "coinsPromoted", "userCoins");
                break;
            case CacheInvalidationScope.VOTE:
                // When updating a coin's details
                keysToInvalidate.push("coinsFiltered", "userFavorites", "coinsPromoted");
                break;
            case CacheInvalidationScope.DELETE:
                // When deleting a coin
                keysToInvalidate.push("coinsApproved", "coinsFiltered", "coinsPromoted", "coinsPending", "coinsPresale", "coinsFairlaunch", "coinsAdminPromoted", "userCoins");
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
        // Handle invalidations
        const invalidationPromises = keysToInvalidate.map((key) => {
            if (key === "coinsPromoted") {
                // Exact match for these keys
                return (0, redis_config_1.deleteCache)(redis_config_1.redisClient, key);
            }
            else {
                // Prefix match for other keys
                return (0, redis_config_1.deleteAllThatStartsWithPrefix)(redis_config_1.redisClient, key);
            }
        });
        await Promise.all(invalidationPromises);
        logger.info(`Successfully invalidated caches for scope: ${scope}`, {
            invalidatedKeys: keysToInvalidate,
        });
    }
    catch (error) {
        logger.error(`Error invalidating coin caches for scope ${scope}:`, error);
        throw new Error(`Failed to invalidate coin caches for scope: ${scope}`);
    }
}
