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
exports.getAllTrendingCoinsController = exports.trackViewController = void 0;
const coinView_service_1 = require("../services/coinView.service");
const mongoose_1 = __importDefault(require("mongoose"));
const trackViewController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { coinId } = req.params;
        const ipAddress = req.ip || req.headers["x-forwarded-for"] || "unknown";
        const userAgent = req.headers["user-agent"];
        // Convert coinId to ObjectId
        const coinIdObjectId = new mongoose_1.default.Types.ObjectId(coinId);
        yield (0, coinView_service_1.trackView)(coinIdObjectId, ipAddress, userAgent);
        res.status(200).json({ success: true, message: "View tracked" });
        res.status(200).json({ success: false, message: "Duplicate view" });
    }
    catch (error) {
        console.error("Error tracking view:", error);
        res.status(500).json({ success: false, message: "Failed to track view" });
    }
});
exports.trackViewController = trackViewController;
const getAllTrendingCoinsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get limit from query parameter (default to 10 if not provided)
        const limit = parseInt(req.query.limit) || 10;
        // Fetch the coins ordered by trending score (based on views and votes)
        const coins = yield (0, coinView_service_1.getAllCoinsTrending)(limit);
        res
            .status(200)
            .json({
            success: true,
            message: "Trending coins fetched successfully",
            trendingCoins: coins,
        });
    }
    catch (error) {
        console.error("Error fetching all trending coins:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch all trending coins",
        });
    }
});
exports.getAllTrendingCoinsController = getAllTrendingCoinsController;
