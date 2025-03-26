"use strict";
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
exports.promoteCoinToTrendingRank = exports.deleteUser = exports.updateUserRole = exports.getAllUsersController = exports.updateCoinPrices = exports.promoteCoin = exports.declineCoin = exports.approveCoin = exports.getFairlaunchCoinsController = exports.getPresaleCoinsController = exports.getAdminPromotedCoinsController = exports.getApprovedCoinsController = exports.getPendingCoinsController = void 0;
const http_config_1 = require("../config/http.config");
const coin_model_1 = __importDefault(require("../models/coin.model"));
const query_params_service_1 = require("../services/query-params.service");
const coin_utils_1 = require("../utils/coin.utils");
const log4js_1 = require("log4js");
const admin_service_1 = require("../services/admin.service");
const coin_service_1 = require("../services/coin.service");
const email_service_1 = require("../services/email.service");
const user_model_1 = __importDefault(require("../models/user.model"));
const logger = (0, log4js_1.getLogger)("admin-controller");
const getPendingCoinsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const params = (0, query_params_service_1.processQueryParams)(req.query);
        // logger.info("Fetching pending coins with params:", {
        //   pageSize: params.pageSize,
        //   pageNumber: params.pageNumber,
        // });
        const pendingCoinsData = yield (0, admin_service_1.getCoinsPending)({
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
});
exports.getPendingCoinsController = getPendingCoinsController;
const getApprovedCoinsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const params = (0, query_params_service_1.processQueryParams)(req.query);
        const searchValue = ((_a = req.query.searchValue) === null || _a === void 0 ? void 0 : _a.toString()) || "";
        // logger.info("Fetching approved coins with params:", {
        //   pageSize: params.pageSize,
        //   pageNumber: params.pageNumber,
        //   chains: params.chains,
        //   sortColumn: params.sortColumn,
        //   sortDirection: params.sortDirection,
        //   searchValue: searchValue,
        // });
        const approvedCoinsData = yield (0, admin_service_1.getCoinsApproved)({
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
});
exports.getApprovedCoinsController = getApprovedCoinsController;
const getAdminPromotedCoinsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const params = (0, query_params_service_1.processQueryParams)(req.query);
        // logger.info("Fetching admin promoted coins with params:", {
        //   pageSize: params.pageSize,
        //   pageNumber: params.pageNumber,
        // });
        const promotedCoinsData = yield (0, admin_service_1.getCoinsAdminPromoted)({
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
});
exports.getAdminPromotedCoinsController = getAdminPromotedCoinsController;
const getPresaleCoinsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const params = (0, query_params_service_1.processQueryParams)(req.query);
        // logger.info("Fetching presale coins with params:", {
        //   pageSize: params.pageSize,
        //   pageNumber: params.pageNumber,
        // });
        const presaleCoinsData = yield (0, admin_service_1.getCoinsPresale)({
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
});
exports.getPresaleCoinsController = getPresaleCoinsController;
const getFairlaunchCoinsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const params = (0, query_params_service_1.processQueryParams)(req.query);
        // logger.info("Fetching fairlaunch coins with params:", {
        //   pageSize: params.pageSize,
        //   pageNumber: params.pageNumber,
        // });
        const fairlaunchCoinsData = yield (0, admin_service_1.getCoinsFairlaunch)({
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
});
exports.getFairlaunchCoinsController = getFairlaunchCoinsController;
const approveCoin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { coinId } = req.params;
        if (!coinId) {
            res
                .status(http_config_1.HTTPSTATUS.BAD_REQUEST)
                .json({ message: "Coin ID is required" });
            return;
        }
        // Fetch the approved coin
        const approvedCoin = yield (0, admin_service_1.approveCoinById)(coinId);
        if (!approvedCoin) {
            res.status(http_config_1.HTTPSTATUS.NOT_FOUND).json({ message: "Coin not found" });
            return;
        }
        // Fetch user by coin.author (assuming coin.author is userId)
        const user = yield user_model_1.default.findById(approvedCoin.author);
        if (!user) {
            res.status(http_config_1.HTTPSTATUS.NOT_FOUND).json({ message: "User not found" });
            return;
        }
        // Send the approval email to the user
        const emailResult = yield (0, email_service_1.sendCoinApprovedMail)(user.email, user.name, approvedCoin.name, approvedCoin.slug);
        if (!emailResult.success) {
            console.error("Failed to send approval email:", emailResult.error);
            // Log the error but continue with the coin approval process
        }
        // Invalidate relevant caches
        yield (0, coin_utils_1.invalidateCoinCaches)(coin_utils_1.CacheInvalidationScope.APPROVAL);
        res.status(http_config_1.HTTPSTATUS.OK).json({ message: "Coin approved successfully" });
    }
    catch (error) {
        console.error("Error in approveCoin controller:", error);
        res
            .status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR)
            .json({ message: "Failed to approve coin" });
    }
});
exports.approveCoin = approveCoin;
const declineCoin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { coinId } = req.params;
        if (!coinId) {
            res
                .status(http_config_1.HTTPSTATUS.BAD_REQUEST)
                .json({ message: "Coin ID is required" });
            return;
        }
        const deniedCoin = yield (0, admin_service_1.declineCoinById)(coinId);
        if (!deniedCoin) {
            res.status(http_config_1.HTTPSTATUS.NOT_FOUND).json({ message: "Coin not found" });
            return;
        }
        // Fetch user by coin.author (assuming coin.author is userId)
        const user = yield user_model_1.default.findById(deniedCoin.author);
        if (!user) {
            res.status(http_config_1.HTTPSTATUS.NOT_FOUND).json({ message: "User not found" });
            return;
        }
        // Send the approval email to the user
        const emailResult = yield (0, email_service_1.sendCoinDeniedMail)(user.email, user.name, deniedCoin.name);
        if (!emailResult.success) {
            console.error("Failed to send approval email:", emailResult.error);
            // Log the error but continue with the coin approval process
        }
        // Invalidate relevant caches
        yield (0, coin_utils_1.invalidateCoinCaches)(coin_utils_1.CacheInvalidationScope.DECLINE);
        res.status(http_config_1.HTTPSTATUS.OK).json({ message: "Coin declined successfully" });
    }
    catch (error) {
        // logger.error("Error in declineCoin controller:", error);
        res
            .status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR)
            .json({ message: "Failed to decline coin" });
    }
});
exports.declineCoin = declineCoin;
const promoteCoin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { coinId } = req.params;
        if (!coinId) {
            res
                .status(http_config_1.HTTPSTATUS.BAD_REQUEST)
                .json({ message: "Coin ID is required" });
            return;
        }
        const result = yield (0, admin_service_1.promoteCoinById)(coinId);
        if (!result) {
            res.status(http_config_1.HTTPSTATUS.NOT_FOUND).json({ message: "Coin not found" });
            return;
        }
        // Invalidate only relevant caches
        yield (0, coin_utils_1.invalidateCoinCaches)(coin_utils_1.CacheInvalidationScope.PROMOTION);
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
});
exports.promoteCoin = promoteCoin;
const updateCoinPrices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { coinId } = req.params;
        if (!coinId) {
            res
                .status(http_config_1.HTTPSTATUS.BAD_REQUEST)
                .json({ message: "Coin ID is required" });
            return;
        }
        // Find the coin by ID
        const coin = yield coin_model_1.default.findById(coinId);
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
            ? yield (0, coin_service_1.getSOLCoinPriceData)(address)
            : yield (0, coin_service_1.getEVMCoinPriceData)(address, chain);
        // Update the coin's price-related fields
        Object.assign(coin, priceData);
        yield coin.save();
        logger.info(`Price update completed for ${coin.name}:`, {
            coinId,
            oldPrice: coin.price,
            newPrice: priceData.price,
            chain,
            address,
        });
        // Invalidate relevant caches
        yield (0, coin_utils_1.invalidateCoinCaches)(coin_utils_1.CacheInvalidationScope.UPDATE_PRICE);
        res.status(http_config_1.HTTPSTATUS.OK).json({
            message: `Prices updated successfully for ${coin.name}`,
        });
    }
    catch (error) {
        logger.error("Error in updateCoinPrices controller:", error);
        res.status(500).json({ message: "Failed to update coin prices" });
    }
});
exports.updateCoinPrices = updateCoinPrices;
const getAllUsersController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const params = (0, query_params_service_1.processUserQueryParams)(req.query);
        const searchValue = ((_a = req.query.searchValue) === null || _a === void 0 ? void 0 : _a.toString()) || "";
        // logger.info("Fetching fairlaunch coins with params:", {
        //   pageSize: params.pageSize,
        //   pageNumber: params.pageNumber,
        // });
        const usersCoinsData = yield (0, admin_service_1.getUsers)({
            pageSize: params.pageSize,
            pageNumber: params.pageNumber,
            searchValue: searchValue,
        });
        if (!usersCoinsData || !usersCoinsData.users) {
            // logger.warn("No fairlaunch coins found");
            res.status(http_config_1.HTTPSTATUS.OK).json({
                success: true,
                message: "No fairlaunch coins found",
                users: [],
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
            message: "Users fetched successfully",
            users: usersCoinsData.users,
            totalCount: usersCoinsData.totalCount,
            totalPages: usersCoinsData.totalPages,
            skip: usersCoinsData.skip,
        });
    }
    catch (error) {
        // logger.error("Error in getFairlaunchCoinsController:", error);
        res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to fetch users",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getAllUsersController = getAllUsersController;
const updateUserRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        // Validate input
        if (!userId) {
            res
                .status(http_config_1.HTTPSTATUS.BAD_REQUEST)
                .json({ message: "User ID is required" });
            return;
        }
        if (!role || !["user", "admin"].includes(role)) {
            res.status(http_config_1.HTTPSTATUS.BAD_REQUEST).json({
                message: "Valid role is required (user or admin)",
            });
            return;
        }
        // Update in both systems
        const updatedUser = yield (0, admin_service_1.updateUserRoleById)(userId, role);
        if (!updatedUser) {
            res.status(http_config_1.HTTPSTATUS.NOT_FOUND).json({ message: "User not found" });
            return;
        }
        // Invalidate relevant caches
        yield (0, coin_utils_1.invalidateCoinCaches)(coin_utils_1.CacheInvalidationScope.UPDATE_ROLE);
        res.status(http_config_1.HTTPSTATUS.OK).json({
            success: true,
            message: "User role updated successfully in both systems",
            user: updatedUser,
        });
    }
    catch (error) {
        logger.error("Error in updateUserRole controller:", error);
        res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to update user role",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.updateUserRole = updateUserRole;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        if (!userId) {
            res
                .status(http_config_1.HTTPSTATUS.BAD_REQUEST)
                .json({ message: "User ID is required" });
            return;
        }
        // Only delete from Clerk
        const deletionSuccess = yield (0, admin_service_1.deleteUserFromClerkOnly)(userId);
        if (!deletionSuccess) {
            res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
                message: "Failed to delete user from Clerk",
            });
            return;
        }
        // Invalidate relevant caches
        yield (0, coin_utils_1.invalidateCoinCaches)(coin_utils_1.CacheInvalidationScope.DELETE_USER);
        res.status(http_config_1.HTTPSTATUS.OK).json({
            success: true,
            message: "User deleted successfully",
        });
    }
    catch (error) {
        logger.error("Error in deleteUser controller:", error);
        res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to delete user",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.deleteUser = deleteUser;
const promoteCoinToTrendingRank = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { coinId, rank } = req.params;
        // Ensure both coinId and rank are provided
        if (!coinId || !rank) {
            res
                .status(http_config_1.HTTPSTATUS.BAD_REQUEST)
                .json({ message: "Coin ID and rank are required" });
            return;
        }
        // Ensure the rank is valid (between 1 and 10)
        const rankNum = parseInt(rank, 10);
        if (isNaN(rankNum) || rankNum < 1 || rankNum > 10) {
            res
                .status(http_config_1.HTTPSTATUS.BAD_REQUEST)
                .json({ message: "Rank must be between 1 and 10" });
            return;
        }
        // Fetch the coin by coinId
        const coin = yield coin_model_1.default.findById(coinId);
        if (!coin) {
            res.status(http_config_1.HTTPSTATUS.NOT_FOUND).json({ message: "Coin not found" });
            return;
        }
        // Set the rank and expiration (24 hours from now)
        const expirationTime = new Date();
        expirationTime.setHours(expirationTime.getHours() + 24); // Add 24 hours
        const updatedCoin = yield coin_model_1.default.findByIdAndUpdate(coinId, {
            $set: {
                paidTrendingRank: rankNum,
                paidTrendingExpiry: expirationTime,
            },
        }, { new: true } // Return the updated coin
        );
        if (!updatedCoin) {
            res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
                message: "Failed to update coin's rank",
            });
            return;
        }
        // Invalidate the cache for trending
        yield (0, coin_utils_1.invalidateCoinCaches)(coin_utils_1.CacheInvalidationScope.PROMOTION);
        // Send success response
        res.status(http_config_1.HTTPSTATUS.OK).json({
            success: true,
            message: `Coin has been promoted to rank ${rankNum} for 24 hours`,
        });
    }
    catch (error) {
        console.error("Error promoting coin to rank:", error);
        res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to promote coin to specified rank",
        });
    }
});
exports.promoteCoinToTrendingRank = promoteCoinToTrendingRank;
