"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEVMCoinPriceData = exports.getSOLCoinPriceData = exports.getCoinsPromoted = exports.getCoinsFiltered = void 0;
exports.deleteCoinById = deleteCoinById;
exports.coinBySlug = coinBySlug;
const coin_model_1 = __importStar(require("../models/coin.model"));
const log4js_1 = require("log4js");
const moralis_1 = __importDefault(require("moralis"));
const getSafeNumber_1 = require("../utils/getSafeNumber");
const redis_config_1 = require("../config/redis.config");
const vote_model_1 = __importDefault(require("../models/vote.model"));
const removeImageCloudinary_1 = require("../utils/removeImageCloudinary");
const favorites_model_1 = __importDefault(require("../models/favorites.model"));
const logger = (0, log4js_1.getLogger)("coins-service");
const getCoinsFiltered = async ({ pageSize, pageNumber, presale, fairlaunch, chains, audit, kyc, sortColumn, sortDirection, }) => {
    try {
        // Build filter query with type safety
        const filterQuery = {
            status: coin_model_1.CoinStatus.APPROVED,
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
        }
        else if (fairlaunch === true) {
            // Show only fairlaunch coins
            filterQuery["fairlaunch.enabled"] = true;
            logger.info("Filtering to show only fairlaunch coins");
        }
        else if (sortColumn === "price24h") {
            // When sorting by price24h, exclude presale and fairlaunch coins
            filterQuery.$and = [
                { "presale.enabled": { $ne: true } },
                { "fairlaunch.enabled": { $ne: true } },
                { price24h: { $ne: 0 } },
            ];
            logger.info("Sorting by price24h - excluding presale and fairlaunch coins");
        }
        if (audit)
            filterQuery["audit.exist"] = true;
        if (kyc)
            filterQuery["kyc.exist"] = true;
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
        const cachedData = await (0, redis_config_1.getCache)(redis_config_1.redisClient, cacheKey);
        if (cachedData) {
            logger.info(`Cache hit for filtered coins query: ${cacheKey}`);
            return cachedData;
        }
        // Calculate pagination
        const skip = (pageNumber - 1) * pageSize;
        const totalCount = await coin_model_1.default.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalCount / pageSize);
        // Define sort criteria with type safety
        const sortCriteria = {
            [sortColumn]: sortDirection === "ascending" ? 1 : -1,
            _id: 1, // Secondary sort for consistent pagination
        };
        // Execute query with optimized field selection
        const coins = await coin_model_1.default.find(filterQuery)
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
        await (0, redis_config_1.setCache)(redis_config_1.redisClient, cacheKey, result, "ex", 60 * 10); // 10 minutes cache
        logger.info(`Cached filtered coins result: ${cacheKey}`);
        return result;
    }
    catch (error) {
        logger.error("Error in getCoinsFiltered:", error);
        throw new Error("Failed to fetch filtered coins");
    }
};
exports.getCoinsFiltered = getCoinsFiltered;
const getCoinsPromoted = async () => {
    try {
        const cacheKey = "coinsPromoted";
        logger.info("Attempting to fetch promoted coins");
        // Try cache first
        const cacheData = await (0, redis_config_1.getCache)(redis_config_1.redisClient, cacheKey);
        if (cacheData) {
            logger.info(`Cache hit for promoted coins, found ${cacheData.length} coins`);
            return cacheData;
        }
        // Build query with proper type safety
        const filterQuery = {
            promoted: true,
            status: coin_model_1.CoinStatus.APPROVED,
        };
        // Execute query with optimized field selection
        const promotedCoins = await coin_model_1.default.find(filterQuery)
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
            .sort({ votes: -1, _id: 1 }) // Consistent sorting with secondary key
            .lean();
        if (!promotedCoins || promotedCoins.length === 0) {
            logger.warn("No promoted coins found");
            return [];
        }
        // Cache the results
        await (0, redis_config_1.setCache)(redis_config_1.redisClient, cacheKey, promotedCoins, "ex", 60 * 10); // 10 minutes cache
        logger.info(`Cached ${promotedCoins.length} promoted coins`);
        return promotedCoins;
    }
    catch (error) {
        logger.error("Error in getCoinsPromoted:", error);
        throw new Error("Failed to fetch promoted coins");
    }
};
exports.getCoinsPromoted = getCoinsPromoted;
const getSOLCoinPriceData = async (address) => {
    try {
        const apiKey = process.env.MORALIS_API_KEY || "";
        const pricesRes = await fetch("https://solana-gateway.moralis.io/token/mainnet/prices", {
            method: "POST",
            headers: {
                accept: "application/json",
                "content-type": "application/json",
                "X-API-Key": apiKey,
            },
            body: JSON.stringify({
                addresses: [address],
            }),
        });
        const pricesData = await pricesRes.json();
        const priceData = pricesData[0];
        const metadataRes = await fetch(`https://deep-index.moralis.io/api/v2.2/tokens/${address}/analytics?chain=solana`, {
            method: "GET",
            headers: {
                accept: "application/json",
                "X-API-Key": apiKey,
            },
        });
        const metadata = await metadataRes.json();
        logger.warn(`Price, Price24h, Mkap and Liquidity updated for ${address}`);
        return {
            price: (0, getSafeNumber_1.getSafeNumber)(priceData?.usdPrice),
            price24h: (0, getSafeNumber_1.getSafeNumber)(priceData?.usdPrice24hrPercentChange),
            mkap: (0, getSafeNumber_1.getSafeNumber)(metadata?.totalFullyDilutedValuation),
            liquidity: (0, getSafeNumber_1.getSafeNumber)(metadata?.totalLiquidityUsd),
        };
    }
    catch (error) {
        logger.error(`Error fetching SOL coin data for address ${address}:`, error);
        return { price: 0, price24h: 0, mkap: 0, liquidity: 0 };
    }
};
exports.getSOLCoinPriceData = getSOLCoinPriceData;
const getEVMCoinPriceData = async (address, chain) => {
    try {
        const apiKey = process.env.MORALIS_API_KEY || "";
        const chainNameToIdMap = {
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
        const response = await moralis_1.default.EvmApi.token.getMultipleTokenPrices({
            chain: chainId,
            include: "percent_change",
        }, {
            tokens: [{ tokenAddress: address }],
        });
        const priceData = response.raw[0];
        console.log(chainId, chain, address);
        const metadataRes = await fetch(`https://deep-index.moralis.io/api/v2.2/tokens/${address}/analytics?chain=${chainId}`, {
            method: "GET",
            headers: {
                accept: "application/json",
                "X-API-Key": apiKey,
            },
        });
        const metadata = await metadataRes.json();
        logger.warn(`Price, Price24h, Mkap and Liquidity updated for ${address}`);
        return {
            price: (0, getSafeNumber_1.getSafeNumber)(priceData?.usdPrice),
            price24h: (0, getSafeNumber_1.getSafeNumber)(priceData?.["24hrPercentChange"]),
            mkap: Number(metadata?.totalFullyDilutedValuation) || 0,
            liquidity: Number(metadata?.totalLiquidityUsd) || 0,
        };
    }
    catch (error) {
        logger.error(`Error fetching EVM coin data for address ${address} on chain ${chain}:`, error);
        return { price: 0, price24h: 0, mkap: 0, liquidity: 0 };
    }
};
exports.getEVMCoinPriceData = getEVMCoinPriceData;
async function deleteCoinById(coinId) {
    try {
        // Find the coin first
        const coin = await coin_model_1.default.findById(coinId);
        if (!coin) {
            return false;
        }
        // Delete associated votes
        try {
            await vote_model_1.default.deleteMany({ coin_id: coin._id });
            logger.info(`Deleted votes for coin ${coin._id}`);
        }
        catch (error) {
            logger.error("Error deleting votes for coin:", error);
            throw new Error("Failed to delete votes for coin");
        }
        // Delete from FavoritesModel
        try {
            await favorites_model_1.default.deleteMany({ coin_id: coin._id });
            logger.info(`Deleted from favorites for coin ${coin._id}`);
        }
        catch (error) {
            logger.error("Error deleting from FavoritesModel:", error);
            throw new Error("Failed to delete coin from favorites");
        }
        // Delete the cropped logo from Cloudinary if exists
        if (coin.croppedLogo) {
            const publicId = (0, removeImageCloudinary_1.getPublicIdFromUrl)(coin.croppedLogo);
            if (publicId) {
                try {
                    await (0, removeImageCloudinary_1.removeImageFromCloudinary)(publicId);
                    logger.info(`Deleted image from Cloudinary for coin ${coin._id}`);
                }
                catch (error) {
                    logger.error("Failed to delete image from Cloudinary:", error);
                    throw new Error("Failed to delete image from Cloudinary");
                }
            }
        }
        // Delete the coin
        await coin_model_1.default.findByIdAndDelete(coinId);
        logger.info(`Successfully deleted coin ${coinId}`);
        return true;
    }
    catch (error) {
        logger.error("Error in deleteCoinById:", error);
        return false;
    }
}
async function coinBySlug(slug) {
    try {
        const coin = await coin_model_1.default.findOne({ slug }, {
            promoted: 0,
            premium: 0,
            createdAt: 0,
            updatedAt: 0,
            isFavorited: 0,
        }).lean();
        if (!coin) {
            logger.warn(`Coin not found with slug: ${slug}`);
            return null;
        }
        logger.info(`Successfully retrieved coin with slug: ${slug}`);
        return {
            ...coin,
            _id: coin._id.toString(),
            logo: null,
        };
    }
    catch (error) {
        logger.error("Error in coinBySlug:", error);
        throw new Error("Failed to retrieve coin details");
    }
}
