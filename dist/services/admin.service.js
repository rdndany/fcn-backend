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
exports.deleteUserFromClerkOnly = exports.updateUserRoleById = exports.getUsers = exports.getCoinsFairlaunch = exports.getCoinsPresale = exports.getCoinsAdminPromoted = exports.getCoinsApproved = exports.getCoinsPending = void 0;
exports.approveCoinById = approveCoinById;
exports.promoteCoinById = promoteCoinById;
exports.declineCoinById = declineCoinById;
const coin_model_1 = __importStar(require("../models/coin.model"));
const log4js_1 = require("log4js");
const redis_config_1 = require("../config/redis.config");
const user_model_1 = __importDefault(require("../models/user.model"));
const logger = (0, log4js_1.getLogger)("admin-service");
const getCoinsPending = (_a) => __awaiter(void 0, [_a], void 0, function* ({ pageSize, pageNumber, }) {
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
        const cachedData = yield (0, redis_config_1.getCache)(redis_config_1.redisClient, cacheKey);
        if (cachedData) {
            logger.info(`Cache hit for pending coins query: ${cacheKey}`);
            return cachedData;
        }
        // Calculate pagination
        const skip = (pageNumber - 1) * pageSize;
        const totalCount = yield coin_model_1.default.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalCount / pageSize);
        // Define sort criteria with type safety
        const sortCriteria = {
            createdAt: -1,
            _id: 1, // Secondary sort for consistent pagination
        };
        // Execute query with optimized field selection
        const coins = yield coin_model_1.default.find(filterQuery)
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
        yield (0, redis_config_1.setCache)(redis_config_1.redisClient, cacheKey, result, "ex", 60 * 5); // 5 minutes cache
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
});
exports.getCoinsPending = getCoinsPending;
const getCoinsApproved = (_a) => __awaiter(void 0, [_a], void 0, function* ({ pageSize, pageNumber, chains, sortColumn, sortDirection, searchValue, }) {
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
        const cachedData = yield (0, redis_config_1.getCache)(redis_config_1.redisClient, cacheKey);
        if (cachedData) {
            logger.info(`Cache hit for approved coins query: ${cacheKey}`);
            return cachedData;
        }
        // Calculate pagination
        const skip = (pageNumber - 1) * pageSize;
        const totalCount = yield coin_model_1.default.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalCount / pageSize);
        // Define sort criteria with type safety
        const sortCriteria = {
            [sortColumn]: sortDirection === "ascending" ? 1 : -1,
            _id: 1, // Secondary sort for consistent pagination
        };
        // Execute query with optimized field selection
        const coins = yield coin_model_1.default.find(filterQuery)
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
        yield (0, redis_config_1.setCache)(redis_config_1.redisClient, cacheKey, result, "ex", 60 * 5); // 5 minutes cache
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
});
exports.getCoinsApproved = getCoinsApproved;
const getCoinsAdminPromoted = (_a) => __awaiter(void 0, [_a], void 0, function* ({ pageSize, pageNumber, }) {
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
        const cachedData = yield (0, redis_config_1.getCache)(redis_config_1.redisClient, cacheKey);
        if (cachedData) {
            logger.info(`Cache hit for admin promoted coins query: ${cacheKey}`);
            return cachedData;
        }
        // Calculate pagination
        const skip = (pageNumber - 1) * pageSize;
        const totalCount = yield coin_model_1.default.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalCount / pageSize);
        // Define sort criteria with type safety
        const sortCriteria = {
            createdAt: -1,
            _id: 1, // Secondary sort for consistent pagination
        };
        // Execute query with optimized field selection
        const coins = yield coin_model_1.default.find(filterQuery)
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
        yield (0, redis_config_1.setCache)(redis_config_1.redisClient, cacheKey, result, "ex", 60 * 5); // 5 minutes cache
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
});
exports.getCoinsAdminPromoted = getCoinsAdminPromoted;
const getCoinsPresale = (_a) => __awaiter(void 0, [_a], void 0, function* ({ pageSize, pageNumber, }) {
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
        const cachedData = yield (0, redis_config_1.getCache)(redis_config_1.redisClient, cacheKey);
        if (cachedData) {
            logger.info(`Cache hit for presale coins query: ${cacheKey}`);
            return cachedData;
        }
        // Calculate pagination
        const skip = (pageNumber - 1) * pageSize;
        const totalCount = yield coin_model_1.default.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalCount / pageSize);
        // Define sort criteria with type safety
        const sortCriteria = {
            createdAt: -1,
            _id: 1, // Secondary sort for consistent pagination
        };
        // Execute query with optimized field selection
        const coins = yield coin_model_1.default.find(filterQuery)
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
        yield (0, redis_config_1.setCache)(redis_config_1.redisClient, cacheKey, result, "ex", 60 * 5); // 5 minutes cache
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
});
exports.getCoinsPresale = getCoinsPresale;
const getCoinsFairlaunch = (_a) => __awaiter(void 0, [_a], void 0, function* ({ pageSize, pageNumber, }) {
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
        const cachedData = yield (0, redis_config_1.getCache)(redis_config_1.redisClient, cacheKey);
        if (cachedData) {
            logger.info(`Cache hit for fairlaunch coins query: ${cacheKey}`);
            return cachedData;
        }
        // Calculate pagination
        const skip = (pageNumber - 1) * pageSize;
        const totalCount = yield coin_model_1.default.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalCount / pageSize);
        // Define sort criteria with type safety
        const sortCriteria = {
            createdAt: -1,
            _id: 1, // Secondary sort for consistent pagination
        };
        // Execute query with optimized field selection
        const coins = yield coin_model_1.default.find(filterQuery)
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
        yield (0, redis_config_1.setCache)(redis_config_1.redisClient, cacheKey, result, "ex", 60 * 5); // 5 minutes cache
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
});
exports.getCoinsFairlaunch = getCoinsFairlaunch;
function approveCoinById(coinId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Update coin status to approved
            const approvedCoin = yield coin_model_1.default.findByIdAndUpdate(coinId, {
                status: coin_model_1.CoinStatus.APPROVED,
                updatedAt: new Date(),
            }, { new: true });
            if (!approvedCoin) {
                logger.error(`Failed to approve coin ${coinId}: Coin not found`);
                return null; // Returning null if the coin is not found
            }
            logger.info(`Successfully approved coin ${coinId}`);
            return approvedCoin; // Return the approved coin with author details
        }
        catch (error) {
            logger.error("Error in approveCoinById:", error);
            return null;
        }
    });
}
function promoteCoinById(coinId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const coin = yield coin_model_1.default.findByIdAndUpdate(coinId, [{ $set: { promoted: { $not: "$promoted" }, updatedAt: new Date() } }], { new: true });
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
    });
}
function declineCoinById(coinId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const declinedCoin = yield coin_model_1.default.findByIdAndUpdate(coinId, {
                status: coin_model_1.CoinStatus.DENIED,
                updatedAt: new Date(),
            }, { new: true });
            if (!declinedCoin) {
                logger.warn(`Coin not found for declining with ID: ${coinId}`);
                return null;
            }
            logger.info(`Successfully declined coin with ID: ${coinId}`);
            return declinedCoin;
        }
        catch (error) {
            logger.error("Error in declineCoinById:", error);
            return null;
        }
    });
}
const getUsers = (_a) => __awaiter(void 0, [_a], void 0, function* ({ pageSize, pageNumber, searchValue, }) {
    try {
        logger.info("Attempting to fetch fairlaunch coins");
        // Build filter query with type safety
        const filterQuery = {};
        // Generate cache key
        const cacheKey = `users:${JSON.stringify({
            pageSize,
            pageNumber,
            searchValue,
        })}`;
        // Try cache first
        const cachedData = yield (0, redis_config_1.getCache)(redis_config_1.redisClient, cacheKey);
        if (cachedData) {
            logger.info(`Cache hit for users query: ${cacheKey}`);
            return cachedData;
        }
        if (searchValue) {
            filterQuery.$or = [
                { name: { $regex: searchValue, $options: "i" } },
                { email: { $regex: searchValue, $options: "i" } },
            ];
        }
        // Calculate pagination
        const skip = (pageNumber - 1) * pageSize;
        const totalCount = yield user_model_1.default.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalCount / pageSize);
        // Execute query with optimized field selection
        const users = yield user_model_1.default.find(filterQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .lean();
        const result = {
            users,
            totalCount,
            totalPages,
            skip,
        };
        // Cache results
        yield (0, redis_config_1.setCache)(redis_config_1.redisClient, cacheKey, result, "ex", 60 * 5); // 5 minutes cache
        logger.info(`Cached users result: ${cacheKey}`);
        if (!users || users.length === 0) {
            logger.warn("No users found");
        }
        else {
            logger.info(`Found ${users.length} users`);
        }
        return result;
    }
    catch (error) {
        logger.error("Error in getUsers:", error);
        throw new Error("Failed to fetch users");
    }
});
exports.getUsers = getUsers;
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
const updateUserRoleById = (userId, role) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Update in your database
        const updatedUser = yield user_model_1.default.findByIdAndUpdate(userId, { $set: { role } }, { new: true });
        if (!updatedUser) {
            logger.warn(`User not found for role update with ID: ${userId}`);
            return null;
        }
        // Update in Clerk
        yield clerk_sdk_node_1.clerkClient.users.updateUser(updatedUser._id, {
            publicMetadata: {
                role: role,
            },
        });
        logger.info(`Successfully updated user role for ID: ${userId} in both DB and Clerk`);
        return updatedUser;
    }
    catch (error) {
        logger.error("Error in updateUserRoleById:", error);
        throw new Error("Failed to update user role");
    }
});
exports.updateUserRoleById = updateUserRoleById;
const deleteUserFromClerkOnly = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Only delete from Clerk, not from database
        yield clerk_sdk_node_1.clerkClient.users.deleteUser(userId);
        logger.info(`Successfully deleted user from Clerk with ID: ${userId}`);
        return true;
    }
    catch (error) {
        logger.error("Error deleting user from Clerk:", error);
        throw new Error("Failed to delete user from Clerk");
    }
});
exports.deleteUserFromClerkOnly = deleteUserFromClerkOnly;
