"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCoinPrices = exports.promoteCoin = exports.declineCoin = exports.approveCoin = exports.getFairlaunchCoinsController = exports.getPresaleCoinsController = exports.getAdminPromotedCoinsController = exports.getApprovedCoinsController = exports.getPendingCoinsController = void 0;
const http_config_1 = require("../config/http.config");
const coin_model_1 = __importDefault(require("../models/coin.model"));
const query_params_service_1 = require("../services/query-params.service");
const coin_utils_1 = require("../utils/coin.utils");
const log4js_1 = require("log4js");
const admin_service_1 = require("../services/admin.service");
const coin_service_1 = require("../services/coin.service");
const logger = (0, log4js_1.getLogger)("admin-controller");
const getPendingCoinsController = async (req, res) => {
    try {
        const params = (0, query_params_service_1.processQueryParams)(req.query);
        // logger.info("Fetching pending coins with params:", {
        //   pageSize: params.pageSize,
        //   pageNumber: params.pageNumber,
        // });
        const pendingCoinsData = await (0, admin_service_1.getCoinsPending)({
            pageSize: params.pageSize,
            pageNumber: params.pageNumber,
        });
        if (!pendingCoinsData || !pendingCoinsData.coins) {
            // logger.warn("No pending coins found");
            res.status(http_config_1.HTTPSTATUS.OK).json({
                success: true,
                message: "No pending coins found",
                coins: [],
                totalCount: 0,
                totalPages: 0,
                skip: 0,
            });
            return;
        }
        // logger.info(
        //   `Successfully retrieved ${pendingCoinsData.coins.length} pending coins`
        // );
        res.status(http_config_1.HTTPSTATUS.OK).json({
            success: true,
            message: "Pending coins fetched successfully",
            coins: pendingCoinsData.coins,
            totalCount: pendingCoinsData.totalCount,
            totalPages: pendingCoinsData.totalPages,
            skip: pendingCoinsData.skip,
        });
    }
    catch (error) {
        // logger.error("Error in getPendingCoinsController:", error);
        res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to fetch pending coins",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getPendingCoinsController = getPendingCoinsController;
const getApprovedCoinsController = async (req, res) => {
    try {
        const params = (0, query_params_service_1.processQueryParams)(req.query);
        const searchValue = req.query.searchValue?.toString() || "";
        // logger.info("Fetching approved coins with params:", {
        //   pageSize: params.pageSize,
        //   pageNumber: params.pageNumber,
        //   chains: params.chains,
        //   sortColumn: params.sortColumn,
        //   sortDirection: params.sortDirection,
        //   searchValue: searchValue,
        // });
        const approvedCoinsData = await (0, admin_service_1.getCoinsApproved)({
            pageSize: params.pageSize,
            pageNumber: params.pageNumber,
            chains: params.chains,
            sortColumn: params.sortColumn,
            sortDirection: params.sortDirection,
            searchValue: searchValue,
        });
        if (!approvedCoinsData || !approvedCoinsData.coins) {
            // logger.warn("No approved coins found");
            res.status(http_config_1.HTTPSTATUS.OK).json({
                success: true,
                message: "No approved coins found",
                coins: [],
                totalCount: 0,
                totalPages: 0,
                skip: 0,
            });
            return;
        }
        // logger.info(
        //   `Successfully retrieved ${approvedCoinsData.coins.length} approved coins`
        // );
        res.status(http_config_1.HTTPSTATUS.OK).json({
            success: true,
            message: "Approved coins fetched successfully",
            coins: approvedCoinsData.coins,
            totalCount: approvedCoinsData.totalCount,
            totalPages: approvedCoinsData.totalPages,
            skip: approvedCoinsData.skip,
        });
    }
    catch (error) {
        logger.error("Error in getApprovedCoinsController:", error);
        res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to fetch approved coins",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getApprovedCoinsController = getApprovedCoinsController;
const getAdminPromotedCoinsController = async (req, res) => {
    try {
        const params = (0, query_params_service_1.processQueryParams)(req.query);
        // logger.info("Fetching admin promoted coins with params:", {
        //   pageSize: params.pageSize,
        //   pageNumber: params.pageNumber,
        // });
        const promotedCoinsData = await (0, admin_service_1.getCoinsAdminPromoted)({
            pageSize: params.pageSize,
            pageNumber: params.pageNumber,
        });
        if (!promotedCoinsData || !promotedCoinsData.coins) {
            // logger.warn("No admin promoted coins found");
            res.status(http_config_1.HTTPSTATUS.OK).json({
                success: true,
                message: "No admin promoted coins found",
                coins: [],
                totalCount: 0,
                totalPages: 0,
                skip: 0,
            });
            return;
        }
        // logger.info(
        //   `Successfully retrieved ${promotedCoinsData.coins.length} admin promoted coins`
        // );
        res.status(http_config_1.HTTPSTATUS.OK).json({
            success: true,
            message: "Admin promoted coins fetched successfully",
            coins: promotedCoinsData.coins,
            totalCount: promotedCoinsData.totalCount,
            totalPages: promotedCoinsData.totalPages,
            skip: promotedCoinsData.skip,
        });
    }
    catch (error) {
        // logger.error("Error in getAdminPromotedCoinsController:", error);
        res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to fetch admin promoted coins",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getAdminPromotedCoinsController = getAdminPromotedCoinsController;
const getPresaleCoinsController = async (req, res) => {
    try {
        const params = (0, query_params_service_1.processQueryParams)(req.query);
        // logger.info("Fetching presale coins with params:", {
        //   pageSize: params.pageSize,
        //   pageNumber: params.pageNumber,
        // });
        const presaleCoinsData = await (0, admin_service_1.getCoinsPresale)({
            pageSize: params.pageSize,
            pageNumber: params.pageNumber,
        });
        if (!presaleCoinsData || !presaleCoinsData.coins) {
            // logger.warn("No presale coins found");
            res.status(http_config_1.HTTPSTATUS.OK).json({
                success: true,
                message: "No presale coins found",
                coins: [],
                totalCount: 0,
                totalPages: 0,
                skip: 0,
            });
            return;
        }
        // logger.info(
        //   `Successfully retrieved ${presaleCoinsData.coins.length} presale coins`
        // );
        res.status(http_config_1.HTTPSTATUS.OK).json({
            success: true,
            message: "Presale coins fetched successfully",
            coins: presaleCoinsData.coins,
            totalCount: presaleCoinsData.totalCount,
            totalPages: presaleCoinsData.totalPages,
            skip: presaleCoinsData.skip,
        });
    }
    catch (error) {
        // logger.error("Error in getPresaleCoinsController:", error);
        res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to fetch presale coins",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getPresaleCoinsController = getPresaleCoinsController;
const getFairlaunchCoinsController = async (req, res) => {
    try {
        const params = (0, query_params_service_1.processQueryParams)(req.query);
        // logger.info("Fetching fairlaunch coins with params:", {
        //   pageSize: params.pageSize,
        //   pageNumber: params.pageNumber,
        // });
        const fairlaunchCoinsData = await (0, admin_service_1.getCoinsFairlaunch)({
            pageSize: params.pageSize,
            pageNumber: params.pageNumber,
        });
        if (!fairlaunchCoinsData || !fairlaunchCoinsData.coins) {
            // logger.warn("No fairlaunch coins found");
            res.status(http_config_1.HTTPSTATUS.OK).json({
                success: true,
                message: "No fairlaunch coins found",
                coins: [],
                totalCount: 0,
                totalPages: 0,
                skip: 0,
            });
            return;
        }
        // logger.info(
        //   `Successfully retrieved ${fairlaunchCoinsData.coins.length} fairlaunch coins`
        // );
        res.status(http_config_1.HTTPSTATUS.OK).json({
            success: true,
            message: "Fairlaunch coins fetched successfully",
            coins: fairlaunchCoinsData.coins,
            totalCount: fairlaunchCoinsData.totalCount,
            totalPages: fairlaunchCoinsData.totalPages,
            skip: fairlaunchCoinsData.skip,
        });
    }
    catch (error) {
        // logger.error("Error in getFairlaunchCoinsController:", error);
        res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to fetch fairlaunch coins",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getFairlaunchCoinsController = getFairlaunchCoinsController;
const approveCoin = async (req, res) => {
    try {
        const { coinId } = req.params;
        if (!coinId) {
            res
                .status(http_config_1.HTTPSTATUS.BAD_REQUEST)
                .json({ message: "Coin ID is required" });
            return;
        }
        const success = await (0, admin_service_1.approveCoinById)(coinId);
        if (!success) {
            res.status(http_config_1.HTTPSTATUS.NOT_FOUND).json({ message: "Coin not found" });
            return;
        }
        // Invalidate relevant caches
        await (0, coin_utils_1.invalidateCoinCaches)(coin_utils_1.CacheInvalidationScope.APPROVAL);
        res.status(http_config_1.HTTPSTATUS.OK).json({ message: "Coin approved successfully" });
    }
    catch (error) {
        // logger.error("Error in approveCoin controller:", error);
        res
            .status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR)
            .json({ message: "Failed to approve coin" });
    }
};
exports.approveCoin = approveCoin;
const declineCoin = async (req, res) => {
    try {
        const { coinId } = req.params;
        if (!coinId) {
            res
                .status(http_config_1.HTTPSTATUS.BAD_REQUEST)
                .json({ message: "Coin ID is required" });
            return;
        }
        const coin = await (0, admin_service_1.declineCoinById)(coinId);
        if (!coin) {
            res.status(http_config_1.HTTPSTATUS.NOT_FOUND).json({ message: "Coin not found" });
            return;
        }
        // Invalidate relevant caches
        await (0, coin_utils_1.invalidateCoinCaches)(coin_utils_1.CacheInvalidationScope.DECLINE);
        res.status(http_config_1.HTTPSTATUS.OK).json({ message: "Coin declined successfully" });
    }
    catch (error) {
        // logger.error("Error in declineCoin controller:", error);
        res
            .status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR)
            .json({ message: "Failed to decline coin" });
    }
};
exports.declineCoin = declineCoin;
const promoteCoin = async (req, res) => {
    try {
        const { coinId } = req.params;
        if (!coinId) {
            res
                .status(http_config_1.HTTPSTATUS.BAD_REQUEST)
                .json({ message: "Coin ID is required" });
            return;
        }
        const result = await (0, admin_service_1.promoteCoinById)(coinId);
        if (!result) {
            res.status(http_config_1.HTTPSTATUS.NOT_FOUND).json({ message: "Coin not found" });
            return;
        }
        // Invalidate only relevant caches
        await (0, coin_utils_1.invalidateCoinCaches)(coin_utils_1.CacheInvalidationScope.PROMOTION);
        res.status(http_config_1.HTTPSTATUS.OK).json({
            success: true,
            message: result.promoted
                ? "Coin has been promoted"
                : "Coin has been unpromoted",
        });
    }
    catch (error) {
        // logger.error("Error in promoteCoin controller:", error);
        res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to promote coin",
        });
    }
};
exports.promoteCoin = promoteCoin;
const updateCoinPrices = async (req, res) => {
    try {
        const { coinId } = req.params;
        if (!coinId) {
            res
                .status(http_config_1.HTTPSTATUS.BAD_REQUEST)
                .json({ message: "Coin ID is required" });
            return;
        }
        // Find the coin by ID
        const coin = await coin_model_1.default.findById(coinId);
        if (!coin) {
            res.status(http_config_1.HTTPSTATUS.NOT_FOUND).json({ message: "Coin not found" });
            return;
        }
        const { address, chain } = coin;
        if (!address) {
            res
                .status(http_config_1.HTTPSTATUS.BAD_REQUEST)
                .json({ message: "Coin address is missing" });
            return;
        }
        // Fetch new price data based on the coin's chain
        const priceData = chain === "sol"
            ? await (0, coin_service_1.getSOLCoinPriceData)(address)
            : await (0, coin_service_1.getEVMCoinPriceData)(address, chain);
        // Update the coin's price-related fields
        Object.assign(coin, priceData);
        await coin.save();
        logger.info(`Price update completed for ${coin.name}:`, {
            coinId,
            oldPrice: coin.price,
            newPrice: priceData.price,
            chain,
            address,
        });
        // Invalidate relevant caches
        await (0, coin_utils_1.invalidateCoinCaches)(coin_utils_1.CacheInvalidationScope.UPDATE_PRICE);
        res.status(http_config_1.HTTPSTATUS.OK).json({
            message: `Prices updated successfully for ${coin.name}`,
        });
    }
    catch (error) {
        logger.error("Error in updateCoinPrices controller:", error);
        res.status(500).json({ message: "Failed to update coin prices" });
    }
};
exports.updateCoinPrices = updateCoinPrices;
