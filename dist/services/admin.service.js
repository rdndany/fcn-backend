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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCoinsFairlaunch = exports.getCoinsPresale = exports.getCoinsAdminPromoted = exports.getCoinsApproved = exports.getCoinsPending = void 0;
exports.approveCoinById = approveCoinById;
exports.promoteCoinById = promoteCoinById;
exports.declineCoinById = declineCoinById;
const coin_model_1 = __importStar(require("../models/coin.model"));
const log4js_1 = require("log4js");
const redis_config_1 = require("../config/redis.config");
const logger = (0, log4js_1.getLogger)("admin-service");
const getCoinsPending = async ({ pageSize, pageNumber, }) => {
    try {
        logger.info("Attempting to fetch pending coins");
        const filterQuery = {
            status: coin_model_1.CoinStatus.PENDING,
        };
        // Generate cache key
        const cacheKey = `coinsPending:${JSON.stringify({
            pageSize,
            pageNumber,
        })}`;
        // Try cache first
        const cachedData = await (0, redis_config_1.getCache)(redis_config_1.redisClient, cacheKey);
        if (cachedData) {
            logger.info(`Cache hit for pending coins query: ${cacheKey}`);
            return cachedData;
        }
        // Calculate pagination
        const skip = (pageNumber - 1) * pageSize;
        const totalCount = await coin_model_1.default.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalCount / pageSize);
        // Define sort criteria with type safety
        const sortCriteria = {
            createdAt: -1,
            _id: 1, // Secondary sort for consistent pagination
        };
        // Execute query with optimized field selection
        const coins = await coin_model_1.default.find(filterQuery)
            .select({
            logo: 1,
            name: 1,
            symbol: 1,
            slug: 1,
            chain: 1,
            address: 1,
            description: 1,
            categories: 1,
            dexProvider: 1,
            launchDate: 1,
            presale: 1,
            fairlaunch: 1,
            audit: 1,
            kyc: 1,
            socials: 1,
            status: 1,
            createdAt: 1,
            price: 1,
            price24h: 1,
            mkap: 1,
            liquidity: 1,
        })
            .sort(sortCriteria)
            .skip(skip)
            .limit(pageSize)
            .lean();
        const result = {
            coins,
            totalCount,
            totalPages,
            skip,
        };
        // Cache results
        await (0, redis_config_1.setCache)(redis_config_1.redisClient, cacheKey, result, "ex", 60 * 5); // 5 minutes cache
        logger.info(`Cached pending coins result: ${cacheKey}`);
        if (!coins || coins.length === 0) {
            logger.warn("No pending coins found");
        }
        else {
            logger.info(`Found ${coins.length} pending coins`);
        }
        return result;
    }
    catch (error) {
        logger.error("Error in getCoinsPending:", error);
        throw new Error("Failed to fetch pending coins");
    }
};
exports.getCoinsPending = getCoinsPending;
const getCoinsApproved = async ({ pageSize, pageNumber, chains, sortColumn, sortDirection, searchValue, }) => {
    try {
        logger.info("Attempting to fetch approved coins");
        // Build filter query with type safety
        const filterQuery = {
            status: coin_model_1.CoinStatus.APPROVED,
        };
        // Apply chain filter if specified
        if (chains.length > 0) {
            filterQuery.chain = { $in: chains };
            logger.info(`Applying chain filter for: ${chains.join(", ")}`);
        }
        // Handle special sort cases
        if (sortColumn === "liquidity") {
            filterQuery.$and = [
                { "presale.enabled": { $ne: true } },
                { "fairlaunch.enabled": { $ne: true } },
                { liquidity: { $ne: 0 } },
            ];
            logger.info("Applying liquidity filter - excluding presale and fairlaunch coins");
        }
        // Apply search filter if provided
        if (searchValue) {
            const regex = new RegExp(searchValue, "i");
            filterQuery.$or = [{ name: regex }, { symbol: regex }];
            // Check for address-like search
            const isProbableAddress = (searchValue.startsWith("0x") && searchValue.length === 42) ||
                /^[a-zA-Z0-9]{32,}$/.test(searchValue);
            if (isProbableAddress) {
                logger.info(`Address search detected: ${searchValue}`);
                filterQuery.$or.push({
                    address: new RegExp(`^${searchValue}$`, "i"),
                });
            }
        }
        // Generate cache key
        const cacheKey = `coinsApproved:${JSON.stringify({
            filterQuery,
            pageSize,
            pageNumber,
            sortColumn,
            sortDirection,
            searchValue,
        })}`;
        // Try cache first
        const cachedData = await (0, redis_config_1.getCache)(redis_config_1.redisClient, cacheKey);
        if (cachedData) {
            logger.info(`Cache hit for approved coins query: ${cacheKey}`);
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
            liquidity: 1,
            createdAt: 1,
            promoted: 1,
        })
            .sort(sortCriteria)
            .skip(skip)
            .limit(pageSize)
            .lean();
        const result = {
            coins,
            totalCount,
            totalPages,
            skip,
        };
        // Cache results
        await (0, redis_config_1.setCache)(redis_config_1.redisClient, cacheKey, result, "ex", 60 * 5); // 5 minutes cache
        logger.info(`Cached approved coins result: ${cacheKey}`);
        if (!coins || coins.length === 0) {
            logger.warn("No approved coins found");
        }
        else {
            logger.info(`Found ${coins.length} approved coins`);
        }
        return result;
    }
    catch (error) {
        logger.error("Error in getCoinsApproved:", error);
        throw new Error("Failed to fetch approved coins");
    }
};
exports.getCoinsApproved = getCoinsApproved;
const getCoinsAdminPromoted = async ({ pageSize, pageNumber, }) => {
    try {
        logger.info("Attempting to fetch admin promoted coins");
        // Build filter query with type safety
        const filterQuery = {
            promoted: true,
            status: coin_model_1.CoinStatus.APPROVED,
        };
        // Generate cache key
        const cacheKey = `coinsAdminPromoted:${JSON.stringify({
            pageSize,
            pageNumber,
        })}`;
        // Try cache first
        const cachedData = await (0, redis_config_1.getCache)(redis_config_1.redisClient, cacheKey);
        if (cachedData) {
            logger.info(`Cache hit for admin promoted coins query: ${cacheKey}`);
            return cachedData;
        }
        // Calculate pagination
        const skip = (pageNumber - 1) * pageSize;
        const totalCount = await coin_model_1.default.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalCount / pageSize);
        // Define sort criteria with type safety
        const sortCriteria = {
            createdAt: -1,
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
            liquidity: 1,
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
            promoted: 1,
            createdAt: 1,
        })
            .sort(sortCriteria)
            .skip(skip)
            .limit(pageSize)
            .lean();
        const result = {
            coins,
            totalCount,
            totalPages,
            skip,
        };
        // Cache results
        await (0, redis_config_1.setCache)(redis_config_1.redisClient, cacheKey, result, "ex", 60 * 5); // 5 minutes cache
        logger.info(`Cached admin promoted coins result: ${cacheKey}`);
        if (!coins || coins.length === 0) {
            logger.warn("No admin promoted coins found");
        }
        else {
            logger.info(`Found ${coins.length} admin promoted coins`);
        }
        return result;
    }
    catch (error) {
        logger.error("Error in getCoinsAdminPromoted:", error);
        throw new Error("Failed to fetch admin promoted coins");
    }
};
exports.getCoinsAdminPromoted = getCoinsAdminPromoted;
const getCoinsPresale = async ({ pageSize, pageNumber, }) => {
    try {
        logger.info("Attempting to fetch presale coins");
        // Build filter query with type safety
        const filterQuery = {
            status: coin_model_1.CoinStatus.APPROVED,
            "presale.enabled": true,
        };
        // Generate cache key
        const cacheKey = `coinsPresale:${JSON.stringify({
            pageSize,
            pageNumber,
        })}`;
        // Try cache first
        const cachedData = await (0, redis_config_1.getCache)(redis_config_1.redisClient, cacheKey);
        if (cachedData) {
            logger.info(`Cache hit for presale coins query: ${cacheKey}`);
            return cachedData;
        }
        // Calculate pagination
        const skip = (pageNumber - 1) * pageSize;
        const totalCount = await coin_model_1.default.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalCount / pageSize);
        // Define sort criteria with type safety
        const sortCriteria = {
            createdAt: -1,
            _id: 1, // Secondary sort for consistent pagination
        };
        // Execute query with optimized field selection
        const coins = await coin_model_1.default.find(filterQuery)
            .select({
            logo: 1,
            name: 1,
            symbol: 1,
            slug: 1,
            liquidity: 1,
            chain: 1,
            address: 1,
            presale: 1,
            audit: 1,
            kyc: 1,
            launchDate: 1,
            socials: 1,
            status: 1,
            createdAt: 1,
            todayVotes: 1,
            votes: 1,
            userVoted: 1,
            isFavorited: 1,
        })
            .sort(sortCriteria)
            .skip(skip)
            .limit(pageSize)
            .lean();
        const result = {
            coins,
            totalCount,
            totalPages,
            skip,
        };
        // Cache results
        await (0, redis_config_1.setCache)(redis_config_1.redisClient, cacheKey, result, "ex", 60 * 5); // 5 minutes cache
        logger.info(`Cached presale coins result: ${cacheKey}`);
        if (!coins || coins.length === 0) {
            logger.warn("No presale coins found");
        }
        else {
            logger.info(`Found ${coins.length} presale coins`);
        }
        return result;
    }
    catch (error) {
        logger.error("Error in getCoinsPresale:", error);
        throw new Error("Failed to fetch presale coins");
    }
};
exports.getCoinsPresale = getCoinsPresale;
const getCoinsFairlaunch = async ({ pageSize, pageNumber, }) => {
    try {
        logger.info("Attempting to fetch fairlaunch coins");
        // Build filter query with type safety
        const filterQuery = {
            status: coin_model_1.CoinStatus.APPROVED,
            "fairlaunch.enabled": true,
        };
        // Generate cache key
        const cacheKey = `coinsFairlaunch:${JSON.stringify({
            pageSize,
            pageNumber,
        })}`;
        // Try cache first
        const cachedData = await (0, redis_config_1.getCache)(redis_config_1.redisClient, cacheKey);
        if (cachedData) {
            logger.info(`Cache hit for fairlaunch coins query: ${cacheKey}`);
            return cachedData;
        }
        // Calculate pagination
        const skip = (pageNumber - 1) * pageSize;
        const totalCount = await coin_model_1.default.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalCount / pageSize);
        // Define sort criteria with type safety
        const sortCriteria = {
            createdAt: -1,
            _id: 1, // Secondary sort for consistent pagination
        };
        // Execute query with optimized field selection
        const coins = await coin_model_1.default.find(filterQuery)
            .select({
            logo: 1,
            name: 1,
            symbol: 1,
            slug: 1,
            liquidity: 1,
            chain: 1,
            address: 1,
            fairlaunch: 1,
            audit: 1,
            kyc: 1,
            launchDate: 1,
            socials: 1,
            status: 1,
            createdAt: 1,
            todayVotes: 1,
            votes: 1,
            userVoted: 1,
            isFavorited: 1,
        })
            .sort(sortCriteria)
            .skip(skip)
            .limit(pageSize)
            .lean();
        const result = {
            coins,
            totalCount,
            totalPages,
            skip,
        };
        // Cache results
        await (0, redis_config_1.setCache)(redis_config_1.redisClient, cacheKey, result, "ex", 60 * 5); // 5 minutes cache
        logger.info(`Cached fairlaunch coins result: ${cacheKey}`);
        if (!coins || coins.length === 0) {
            logger.warn("No fairlaunch coins found");
        }
        else {
            logger.info(`Found ${coins.length} fairlaunch coins`);
        }
        return result;
    }
    catch (error) {
        logger.error("Error in getCoinsFairlaunch:", error);
        throw new Error("Failed to fetch fairlaunch coins");
    }
};
exports.getCoinsFairlaunch = getCoinsFairlaunch;
async function approveCoinById(coinId) {
    try {
        // Update coin status to approved
        const approvedCoin = await coin_model_1.default.findByIdAndUpdate(coinId, {
            status: coin_model_1.CoinStatus.APPROVED,
            updatedAt: new Date(),
        }, { new: true });
        if (!approvedCoin) {
            logger.error(`Failed to approve coin ${coinId}: Coin not found`);
            return false;
        }
        logger.info(`Successfully approved coin ${coinId}`);
        return true;
    }
    catch (error) {
        logger.error("Error in approveCoinById:", error);
        return false;
    }
}
async function promoteCoinById(coinId) {
    try {
        const coin = await coin_model_1.default.findByIdAndUpdate(coinId, [{ $set: { promoted: { $not: "$promoted" }, updatedAt: new Date() } }], { new: true });
        if (!coin) {
            logger.warn(`Coin not found for promotion with ID: ${coinId}`);
            return null;
        }
        logger.info(`Successfully ${coin.promoted ? "promoted" : "unpromoted"} coin with ID: ${coinId}`);
        return { promoted: coin.promoted };
    }
    catch (error) {
        logger.error("Error in promoteCoinById:", error);
        throw new Error("Failed to promote coin");
    }
}
async function declineCoinById(coinId) {
    try {
        const declinedCoin = await coin_model_1.default.findByIdAndUpdate(coinId, {
            status: coin_model_1.CoinStatus.DENIED,
            updatedAt: new Date(),
        }, { new: true });
        if (!declinedCoin) {
            logger.warn(`Coin not found for declining with ID: ${coinId}`);
            return false;
        }
        logger.info(`Successfully declined coin with ID: ${coinId}`);
        return true;
    }
    catch (error) {
        logger.error("Error in declineCoinById:", error);
        throw new Error("Failed to decline coin");
    }
}
