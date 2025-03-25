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
exports.getCoinBySlug = exports.deleteCoin = exports.update = exports.create = exports.uploadImage = exports.getPromotedCoinsController = exports.getAllCoinsController = void 0;
const asyncHandler_middleware_1 = require("../middlewares/asyncHandler.middleware");
const coin_service_1 = require("../services/coin.service");
const http_config_1 = require("../config/http.config");
const vote_service_1 = require("../services/vote.service");
const express_1 = require("@clerk/express");
const coin_model_1 = __importStar(require("../models/coin.model"));
const cloudinary_config_1 = __importDefault(require("../config/cloudinary.config"));
const query_params_service_1 = require("../services/query-params.service");
const response_builders_1 = require("../utils/response-builders");
const coin_utils_1 = require("../utils/coin.utils");
const log4js_1 = require("log4js");
const request_ip_1 = require("request-ip");
const logger = (0, log4js_1.getLogger)("coin-controller");
const getAllCoinsController = async (req, res) => {
    try {
        // Process and validate query parameters
        const params = (0, query_params_service_1.processQueryParams)(req.query);
        const ipAddress = (0, request_ip_1.getClientIp)(req);
        if (!ipAddress) {
            // logger.warn("Failed to extract client IP address");
            res.status(http_config_1.HTTPSTATUS.BAD_REQUEST).json({
                success: false,
                message: "Invalid request: Could not determine client IP",
            });
            return;
        }
        // Log incoming filter parameters
        // logger.info("Incoming filter parameters:", {
        //   presale: params.isPresale,
        //   fairlaunch: params.isFairlaunch,
        //   chains: params.chains,
        //   audit: params.isAudit,
        //   kyc: params.isKyc,
        // });
        // Fetch filtered coins with explicit boolean flags
        const filteredCoins = await (0, coin_service_1.getCoinsFiltered)({
            ...params,
            presale: Boolean(params.isPresale),
            fairlaunch: Boolean(params.isFairlaunch),
            audit: Boolean(params.isAudit),
            kyc: Boolean(params.isKyc),
        });
        if (!filteredCoins || !filteredCoins.coins) {
            // logger.warn("No coins found or invalid filter result");
            res.status(http_config_1.HTTPSTATUS.NOT_FOUND).json({
                success: false,
                message: "No coins found",
            });
            return;
        }
        // Extract coin IDs for vote processing
        const coinIds = filteredCoins.coins.map((coin) => coin._id);
        // Update coins with vote and favorite flags
        const coinsWithUpdatedFlags = await (0, vote_service_1.fetchVotesToCoins)({
            coins: filteredCoins.coins,
            favoritedCoinIds: [],
            ipAddress,
            coinIds,
            userId: params.userId,
        });
        if (!coinsWithUpdatedFlags) {
            // logger.error("Failed to update coin flags");
            res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Failed to process coin data",
            });
            return;
        }
        // Build final response
        const response = (0, response_builders_1.buildCoinResponse)({
            coinsWithUpdatedFlags,
            ...filteredCoins,
        });
        // logger.info(
        //   `Successfully retrieved ${coinsWithUpdatedFlags.length} coins with filters:`,
        //   {
        //     presale: params.isPresale,
        //     fairlaunch: params.isFairlaunch,
        //   }
        // );
        res.status(http_config_1.HTTPSTATUS.OK).json(response);
    }
    catch (error) {
        // logger.error("Error in getAllCoinsController:", error);
        res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to fetch coins",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getAllCoinsController = getAllCoinsController;
const getPromotedCoinsController = async (req, res) => {
    try {
        // Process and validate query parameters
        const params = (0, query_params_service_1.processQueryParams)(req.query);
        const ipAddress = (0, request_ip_1.getClientIp)(req);
        if (!ipAddress) {
            // logger.warn("Failed to extract client IP address");
            res.status(http_config_1.HTTPSTATUS.BAD_REQUEST).json({
                success: false,
                message: "Invalid request: Could not determine client IP",
            });
            return;
        }
        // Fetch promoted coins
        const promotedCoins = await (0, coin_service_1.getCoinsPromoted)();
        if (!promotedCoins || promotedCoins.length === 0) {
            // logger.info("No promoted coins found");
            res.status(http_config_1.HTTPSTATUS.OK).json({
                success: true,
                message: "No promoted coins found",
                promotedCoins: [],
                totalCount: 0,
            });
            return;
        }
        // Extract coin IDs for vote processing
        const coinIds = promotedCoins.map((coin) => coin._id);
        // Update coins with vote and favorite flags
        const coinsWithUpdatedFlags = await (0, vote_service_1.fetchVotesToCoins)({
            coins: promotedCoins,
            favoritedCoinIds: [],
            ipAddress,
            coinIds,
            userId: params.userId,
        });
        if (!coinsWithUpdatedFlags) {
            // logger.error("Failed to update coin flags");
            res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Failed to process coin data",
            });
            return;
        }
        // logger.info(
        //   `Successfully retrieved ${coinsWithUpdatedFlags.length} promoted coins`
        // );
        res.status(http_config_1.HTTPSTATUS.OK).json({
            success: true,
            message: "Promoted coins fetched successfully",
            promotedCoins: coinsWithUpdatedFlags,
            totalCount: coinsWithUpdatedFlags.length,
        });
    }
    catch (error) {
        // logger.error("Error in getPromotedCoinsController:", error);
        res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to fetch promoted coins",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getPromotedCoinsController = getPromotedCoinsController;
exports.uploadImage = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { croppedLogo } = req.body;
    if (!croppedLogo) {
        return res
            .status(http_config_1.HTTPSTATUS.BAD_REQUEST)
            .json({ message: "No image data provided." });
    }
    try {
        // Upload to Cloudinary directly using the Base64 string
        const uploadResponse = await cloudinary_config_1.default.uploader.upload(croppedLogo, {
            folder: "logos", // Optional, still helps organize
        });
        return res.status(http_config_1.HTTPSTATUS.OK).json({
            message: "Image uploaded successfully!",
            logoUrl: uploadResponse.secure_url,
            public_id: uploadResponse.public_id, // You can use this to delete the image later
        });
    }
    catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return res
            .status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR)
            .json({ message: "Image upload failed.", error });
    }
});
const create = async (req, res) => {
    try {
        const userId = (0, express_1.getAuth)(req).userId;
        const { name, symbol, description, categories, address, chain, dexProvider, croppedLogo, launchDate, socials, presale, fairlaunch, } = req.body;
        // Validate required fields
        if (!name || !symbol || !chain || !dexProvider) {
            res
                .status(http_config_1.HTTPSTATUS.BAD_REQUEST)
                .json({ message: "Missing required fields" });
            return;
        }
        // Validate address uniqueness if provided
        if (address) {
            await (0, coin_utils_1.validateAddressUniqueness)(address);
        }
        // Generate unique slug
        const slug = await (0, coin_utils_1.generateUniqueSlug)(name);
        // Fetch price data if address is provided
        const priceData = address
            ? await (0, coin_utils_1.fetchCoinPriceData)(chain, address)
            : {
                price: 0,
                price24h: 0,
                mkap: 0,
                liquidity: 0,
            };
        // Create new coin
        const newCoin = await coin_model_1.default.create({
            name,
            symbol,
            description,
            categories,
            address: address?.trim(),
            chain,
            dexProvider,
            slug,
            logo: croppedLogo,
            croppedLogo,
            launchDate,
            socials,
            presale,
            fairlaunch,
            author: userId, // Set author to userId from auth
            ...priceData,
            votes: 0,
            todayVotes: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: "pending",
        });
        // Invalidate caches
        await (0, coin_utils_1.invalidateCoinCaches)(coin_utils_1.CacheInvalidationScope.CREATE);
        res.status(http_config_1.HTTPSTATUS.CREATED).json(newCoin);
    }
    catch (error) {
        console.error("Error in create coin:", error);
        res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};
exports.create = create;
const update = async (req, res) => {
    try {
        const userId = (0, express_1.getAuth)(req).userId;
        const role = (0, express_1.getAuth)(req).sessionClaims?.role;
        const isAdmin = role === "admin";
        const updates = req.body;
        // Find coin
        const slug = req.params.slug;
        const coin = await coin_model_1.default.findOne({ slug });
        if (!coin) {
            res.status(http_config_1.HTTPSTATUS.NOT_FOUND).json({
                success: false,
                message: "Coin not found",
            });
            return;
        }
        // Check if user has permission to edit this coin
        if (!isAdmin && coin.author !== userId) {
            res.status(http_config_1.HTTPSTATUS.FORBIDDEN).json({
                success: false,
                message: "You are not authorized to edit this coin",
            });
            return;
        }
        // Validate address uniqueness if changed
        if (updates.address && updates.address !== coin.address) {
            const existingCoin = await coin_model_1.default.findOne({
                address: updates.address.trim(),
                _id: { $ne: coin._id },
            });
            if (existingCoin) {
                res.status(http_config_1.HTTPSTATUS.BAD_REQUEST).json({
                    success: false,
                    message: "Coin with this address already exists",
                });
                return;
            }
        }
        // Generate new slug if name changed
        const newSlug = updates.name
            ? await (0, coin_utils_1.generateUniqueSlug)(updates.name, coin._id.toString())
            : coin.slug;
        // Fetch updated price data if address or chain changed
        const shouldUpdatePriceData = (updates.address && updates.address !== coin.address) ||
            (updates.chain && updates.chain !== coin.chain);
        const priceData = shouldUpdatePriceData
            ? await (0, coin_utils_1.fetchCoinPriceData)(updates.chain || coin.chain, updates.address || coin.address)
            : {
                price: coin.price,
                price24h: coin.price24h,
                mkap: coin.mkap,
                liquidity: coin.liquidity,
            };
        // Prepare update fields
        const updatedFields = {
            ...updates,
            name: updates.name,
            symbol: updates.symbol,
            description: updates.description,
            address: updates.address?.trim(),
            slug: newSlug,
            logo: updates.croppedLogo || coin.logo,
            ...priceData,
            // Only allow status change if user is admin
            status: coin_model_1.CoinStatus.PENDING,
            updatedAt: new Date(),
        };
        // Update coin
        const updatedCoin = await coin_model_1.default.findOneAndUpdate({ slug }, updatedFields, {
            new: true,
            runValidators: true,
        });
        // Invalidate caches
        await (0, coin_utils_1.invalidateCoinCaches)(coin_utils_1.CacheInvalidationScope.UPDATE);
        res.status(http_config_1.HTTPSTATUS.OK).json({
            success: true,
            message: "Coin updated successfully",
            coin: updatedCoin,
        });
    }
    catch (error) {
        console.error("Error in update coin:", error);
        res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};
exports.update = update;
const deleteCoin = async (req, res) => {
    try {
        const userId = (0, express_1.getAuth)(req).userId;
        const role = (0, express_1.getAuth)(req).sessionClaims?.role;
        // Validate user
        if (!userId) {
            res.status(http_config_1.HTTPSTATUS.BAD_REQUEST).json({ message: "User not found" });
            return;
        }
        // Check if user is admin
        const isAdmin = role === "admin";
        // Find the coin first to verify ownership
        const coin = await coin_model_1.default.findById(req.params.coinId);
        if (!coin) {
            res.status(http_config_1.HTTPSTATUS.NOT_FOUND).json({ message: "Coin not found" });
            return;
        }
        // If not admin, verify ownership
        if (!isAdmin && coin.author !== userId) {
            res.status(http_config_1.HTTPSTATUS.FORBIDDEN).json({
                message: "You are not authorized to delete this coin",
            });
            return;
        }
        // Delete coin and associated resources
        const success = await (0, coin_service_1.deleteCoinById)(req.params.coinId);
        if (!success) {
            res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
                message: "Failed to delete coin",
            });
            return;
        }
        // Invalidate caches
        await (0, coin_utils_1.invalidateCoinCaches)(coin_utils_1.CacheInvalidationScope.DELETE);
        res.status(http_config_1.HTTPSTATUS.OK).json({
            message: "Coin has been deleted successfully",
        });
    }
    catch (error) {
        console.error("Error in delete coin:", error);
        res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};
exports.deleteCoin = deleteCoin;
const getCoinBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        if (!slug) {
            res.status(http_config_1.HTTPSTATUS.BAD_REQUEST).json({ message: "Slug is required" });
            return;
        }
        const coinDetails = await (0, coin_service_1.coinBySlug)(slug);
        if (!coinDetails) {
            res.status(http_config_1.HTTPSTATUS.NOT_FOUND).json({ message: "Coin not found" });
            return;
        }
        res.status(http_config_1.HTTPSTATUS.OK).json(coinDetails);
    }
    catch (error) {
        // logger.error("Error in getCoinBySlug controller:", error);
        res
            .status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR)
            .json({ message: "Failed to retrieve coin details" });
    }
};
exports.getCoinBySlug = getCoinBySlug;
