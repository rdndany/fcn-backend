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
exports.getUserByCoinId = exports.getUserCoinsController = void 0;
const http_config_1 = require("../config/http.config");
const user_service_1 = require("../services/user.service");
const express_1 = require("@clerk/express");
const user_model_1 = __importDefault(require("../models/user.model"));
const log4js_1 = require("log4js");
const query_params_service_1 = require("../services/query-params.service");
const logger = (0, log4js_1.getLogger)("user-controller");
const getUserCoinsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const params = (0, query_params_service_1.processQueryParams)(req.query);
        const userId = (0, express_1.getAuth)(req).userId;
        // logger.info("Fetching user coins with params:", {
        //   pageSize: params.pageSize,
        //   pageNumber: params.pageNumber,
        //   userId,
        // });
        if (!userId) {
            // logger.warn("User ID not found in request");
            res.status(http_config_1.HTTPSTATUS.BAD_REQUEST).json({
                success: false,
                message: "User ID is required",
            });
            return;
        }
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            // logger.warn(`User not found with ID: ${userId}`);
            res.status(http_config_1.HTTPSTATUS.NOT_FOUND).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        const userCoinsData = yield (0, user_service_1.getUserCoinsPending)({
            pageSize: params.pageSize,
            pageNumber: params.pageNumber,
            userId,
        });
        if (!userCoinsData || !userCoinsData.coins) {
            // logger.info(`No coins found for user: ${userId}`);
            res.status(http_config_1.HTTPSTATUS.OK).json({
                success: true,
                message: "No coins found for user",
                coins: [],
                totalCount: 0,
                totalPages: 0,
                skip: 0,
            });
            return;
        }
        // logger.info(
        //   `Successfully retrieved ${userCoinsData.coins.length} coins for user: ${userId}`
        // );
        res.status(http_config_1.HTTPSTATUS.OK).json({
            success: true,
            message: `Coins fetched successfully for ${user.name}`,
            coins: userCoinsData.coins,
            totalCount: userCoinsData.totalCount,
            totalPages: userCoinsData.totalPages,
            skip: userCoinsData.skip,
        });
    }
    catch (error) {
        // logger.error("Error in getUserCoinsController:", error);
        res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to fetch user coins",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getUserCoinsController = getUserCoinsController;
const getUserByCoinId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { coinId } = req.params;
        // logger.info("Attempting to fetch user by coin ID:", { coinId });
        if (!coinId) {
            logger.warn("No coin ID provided");
            res.status(http_config_1.HTTPSTATUS.BAD_REQUEST).json({
                success: false,
                message: "Coin ID is required",
            });
            return;
        }
        const userDetails = yield (0, user_service_1.userCoinById)(coinId);
        if (!userDetails) {
            // logger.warn("No user found for coin ID:", { coinId });
            res.status(http_config_1.HTTPSTATUS.NOT_FOUND).json({
                success: false,
                message: "No user found for this coin",
            });
            return;
        }
        // logger.info("Successfully retrieved user details for coin:", { coinId });
        res.status(http_config_1.HTTPSTATUS.OK).json({
            success: true,
            message: "User details retrieved successfully",
            user: {
                _id: userDetails._id,
                email: userDetails.email,
                name: userDetails.name,
                role: userDetails.role,
                createdAt: userDetails.createdAt,
            },
        });
    }
    catch (error) {
        // logger.error("Error in getUserByCoinId controller:", error);
        res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to fetch user details",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.getUserByCoinId = getUserByCoinId;
