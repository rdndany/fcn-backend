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
exports.hasVotedToday = exports.getByCoinId = void 0;
exports.voteByCoinId = voteByCoinId;
const asyncHandler_middleware_1 = require("../middlewares/asyncHandler.middleware");
const vote_service_1 = require("../services/vote.service");
const http_config_1 = require("../config/http.config");
const request_ip_1 = require("request-ip");
const appError_1 = require("../utils/appError");
const vote_model_1 = __importDefault(require("../models/vote.model"));
const log4js_1 = require("log4js");
const coin_utils_1 = require("../utils/coin.utils");
const logger = (0, log4js_1.getLogger)("vote-controller");
exports.getByCoinId = (0, asyncHandler_middleware_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { coin_id } = req.params;
    const rawIp = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress);
    const ip = rawIp.split(",")[rawIp.split(",").length - 1].trim();
    const [todayDate] = new Date().toISOString().split("T");
    const countVotesByCoinId = yield (0, vote_service_1.getVotesByCoinId)(coin_id);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Votes by coin fetched successfully",
        countVotesByCoinId,
    });
}));
function voteByCoinId(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { coin_id } = req.params;
            const userIp = (0, request_ip_1.getClientIp)(req);
            // logger.info("Attempting to record vote:", { coin_id });
            if (!userIp) {
                // logger.warn("IP address not found");
                res.status(http_config_1.HTTPSTATUS.BAD_REQUEST).json({
                    success: false,
                    message: "IP address not found",
                });
                return;
            }
            if (!coin_id) {
                // logger.warn("Coin ID not provided");
                res.status(http_config_1.HTTPSTATUS.BAD_REQUEST).json({
                    success: false,
                    message: "Coin ID is required",
                });
                return;
            }
            const { vote, updatedCoin } = yield (0, vote_service_1.createVoteByCoinId)(coin_id, userIp);
            // Invalidate relevant caches
            yield (0, coin_utils_1.invalidateCoinCaches)(coin_utils_1.CacheInvalidationScope.UPDATE);
            // logger.info("Successfully recorded vote:", {
            //   coin_id,
            //   updatedVotes: {
            //     total: updatedCoin.votes,
            //     today: updatedCoin.todayVotes,
            //   },
            // });
            res.status(http_config_1.HTTPSTATUS.CREATED).json({
                success: true,
                message: "Vote successfully recorded",
                vote,
                updatedVotes: {
                    votes: updatedCoin.votes,
                    todayVotes: updatedCoin.todayVotes,
                },
            });
        }
        catch (error) {
            // logger.error("Error in voteByCoinId controller:", error);
            const statusCode = error instanceof Error && error.message.includes("already voted")
                ? http_config_1.HTTPSTATUS.BAD_REQUEST
                : http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR;
            res.status(statusCode).json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to record vote",
            });
        }
    });
}
exports.hasVotedToday = (0, asyncHandler_middleware_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { coin_id } = req.params;
    const userIp = (0, request_ip_1.getClientIp)(req);
    if (!userIp) {
        throw new appError_1.BadRequestException("IP address not found");
    }
    try {
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);
        // Check if the user has already voted today for this coin
        const existingVote = yield vote_model_1.default.findOne({
            coin_id,
            ip_address: userIp,
            created_at: { $gte: todayStart },
        });
        if (existingVote) {
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "User has already voted today",
                hasVoted: true,
            });
        }
        return res.status(http_config_1.HTTPSTATUS.OK).json({
            message: "User has not voted today",
            hasVoted: false,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(400).json({
                message: error.message,
            });
        }
        return res.status(500).json({
            message: "An unexpected error occurred.",
        });
    }
}));
