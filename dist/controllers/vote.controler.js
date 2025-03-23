"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasVotedToday = exports.voteByCoinId = exports.getByCoinId = void 0;
const asyncHandler_middleware_1 = require("../middlewares/asyncHandler.middleware");
const vote_service_1 = require("../services/vote.service");
const http_config_1 = require("../config/http.config");
const request_ip_1 = require("request-ip");
const appError_1 = require("../utils/appError");
const vote_model_1 = __importDefault(require("../models/vote.model"));
exports.getByCoinId = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { coin_id } = req.params;
    const rawIp = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress);
    const ip = rawIp.split(",")[rawIp.split(",").length - 1].trim();
    const [todayDate] = new Date().toISOString().split("T");
    const countVotesByCoinId = await (0, vote_service_1.getVotesByCoinId)(coin_id);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Votes by coin fetched successfully",
        countVotesByCoinId,
    });
});
exports.voteByCoinId = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { coin_id } = req.params;
    const userIp = (0, request_ip_1.getClientIp)(req);
    if (!userIp) {
        throw new appError_1.BadRequestException("IP address not found");
    }
    try {
        const { vote, updatedCoin } = await (0, vote_service_1.createVoteByCoinId)(coin_id, userIp);
        return res.status(201).json({
            message: "Vote successfully recorded",
            vote,
            updatedVotes: {
                votes: updatedCoin.votes,
                todayVotes: updatedCoin.todayVotes,
            },
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
});
exports.hasVotedToday = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { coin_id } = req.params;
    const userIp = (0, request_ip_1.getClientIp)(req);
    if (!userIp) {
        throw new appError_1.BadRequestException("IP address not found");
    }
    try {
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);
        // Check if the user has already voted today for this coin
        const existingVote = await vote_model_1.default.findOne({
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
});
