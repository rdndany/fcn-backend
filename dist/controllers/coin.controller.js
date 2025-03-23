"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCoin = exports.create = exports.uploadImage = exports.getPromotedCoinsController = exports.getAllCoinsController = void 0;
const asyncHandler_middleware_1 = require("../middlewares/asyncHandler.middleware");
const coin_service_1 = require("../services/coin.service");
const http_config_1 = require("../config/http.config");
const vote_service_1 = require("../services/vote.service");
const express_1 = require("@clerk/express");
const user_model_1 = __importDefault(require("../models/user.model"));
const coin_model_1 = __importDefault(require("../models/coin.model"));
const slugify_1 = __importDefault(require("../utils/slugify"));
const uuid_1 = require("uuid");
const removeImageCloudinary_1 = require("../utils/removeImageCloudinary");
const cloudinary_config_1 = __importDefault(require("../config/cloudinary.config"));
const vote_model_1 = __importDefault(require("../models/vote.model"));
exports.getAllCoinsController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    let { pageSize = "25", pageNumber = "1", presale = "false", fairlaunch = "false", chain = [""], audit = "false", kyc = "false", sortColumn = "todayVotes", // Default to 'votes'
    sortDirection = "descending", // Default to 'descending'
    selectedKeys = ["Today_best"], } = req.query; // Default values
    const userId = req.query.userId || "";
    // Convert them to numbers
    let size = parseInt(pageSize, 10);
    let page = parseInt(pageNumber, 10);
    // Ensure valid page size and page number
    if (isNaN(size) || size <= 0)
        size = 25; // Default size
    if (isNaN(page) || page <= 0)
        page = 1; // Default page number
    // Convert filters from strings to booleans
    let isPresale = presale === "true"; // Convert "true" or "false" string to boolean
    let isFairlaunch = fairlaunch === "true"; // Convert "true" or "false" string to boolean
    let isAudit = audit === "true"; // Convert "true" or "false" string to boolean
    let isKyc = kyc === "true"; // Convert "true" or "false" string to boolean
    // Ensure sortColumn and sortDirection are strings
    if (Array.isArray(sortColumn)) {
        sortColumn = sortColumn[0]; // If it's an array, use the first value
    }
    // Make sure selectedKeys is always an array (can be a single value or an array)
    if (typeof selectedKeys === "string") {
        selectedKeys = [selectedKeys];
    }
    // Only override sortColumn if it's not provided in the query
    // If sortColumn is NOT something custom, override based on selectedKeys
    if (!req.query.sortColumn || // no manual sort column provided
        sortColumn === "votes" || // defaulting to votes
        sortColumn === "todayVotes" // defaulting to todayVotes
    ) {
        if (Array.isArray(selectedKeys) && !selectedKeys.includes("Today_best")) {
            sortColumn = "votes"; // All time best → votes
        }
        else {
            sortColumn = "todayVotes"; // Today best → todayVotes
        }
    }
    if (Array.isArray(sortDirection)) {
        sortDirection = sortDirection[0]; // If it's an array, use the first value
    }
    // Ensure they are strings, just in case the query parameters are parsed as other types.
    sortColumn = String(sortColumn);
    sortDirection = String(sortDirection);
    // Handle chain filtering with a type check to ensure we can call .split
    let chains = [];
    if (typeof chain === "string" && chain.trim() !== "") {
        chains = chain.split(",").map((item) => item.trim());
    }
    const rawIp = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress);
    const ipAddress = rawIp.split(",")[rawIp.split(",").length - 1].trim();
    // Step 1: Fetch filtered coins, already sorted and paginated
    const filteredCoins = await (0, coin_service_1.getCoinsFiltered)({
        pageSize: size,
        pageNumber: page,
        presale: isPresale,
        fairlaunch: isFairlaunch,
        chains,
        audit: isAudit,
        kyc: isKyc,
        sortColumn,
        sortDirection,
    });
    const coinIds = filteredCoins.coins.map((coin) => coin._id);
    // Step 2: Get the user's favorite coin IDs (don't refetch all coins!)
    let favoritedCoinIds = [];
    // Fix: Pass the filteredCoins.coins (promotedCoins) instead of allCoins
    const coinsWithUpdatedFlags = await (0, vote_service_1.fetchVotesToCoins)({
        coins: filteredCoins.coins,
        favoritedCoinIds,
        ipAddress,
        coinIds,
        userId,
    });
    // Step 5: Return sorted, paginated, and updated coins
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "All coins fetched and votes updated successfully",
        coins: coinsWithUpdatedFlags,
        totalCount: filteredCoins.totalCount,
        totalPages: filteredCoins.totalPages,
        skip: filteredCoins.skip,
    });
});
exports.getPromotedCoinsController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.query.userId || "";
    const rawIp = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress);
    const ipAddress = rawIp.split(",")[rawIp.split(",").length - 1].trim();
    const promotedCoins = await (0, coin_service_1.getCoinsPromoted)();
    const coinIds = promotedCoins.map((coin) => coin._id);
    // Step 2: Get the user's favorite coin IDs (don't refetch all coins!)
    let favoritedCoinIds = [];
    const coinsWithUpdatedFlags = await (0, vote_service_1.fetchVotesToCoins)({
        coins: promotedCoins,
        favoritedCoinIds,
        ipAddress,
        coinIds,
        userId,
    });
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "All coins promoted fetched successfully",
        promotedCoins: coinsWithUpdatedFlags,
    });
});
exports.uploadImage = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const { croppedLogo } = req.body;
    if (!croppedLogo) {
        return res.status(400).json({ message: "No image data provided." });
    }
    try {
        // Upload to Cloudinary directly using the Base64 string
        const uploadResponse = await cloudinary_config_1.default.uploader.upload(croppedLogo, {
            folder: "logos", // Optional, still helps organize
        });
        return res.status(200).json({
            message: "Image uploaded successfully!",
            logoUrl: uploadResponse.secure_url,
            public_id: uploadResponse.public_id, // You can use this to delete the image later
        });
    }
    catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return res.status(500).json({ message: "Image upload failed.", error });
    }
});
exports.create = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    try {
        const userId = (0, express_1.getAuth)(req).userId;
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            return res
                .status(http_config_1.HTTPSTATUS.BAD_REQUEST)
                .json({ message: "User not found" });
        }
        req.body.name = req.body.name.trim();
        let slug = (0, slugify_1.default)(req.body.name);
        const sameSlug = await coin_model_1.default.findOne({ slug });
        if (sameSlug) {
            slug = `${slug}-${(0, uuid_1.v4)().split("-")[0]}`;
        }
        delete req.body.logo;
        const croppedLogo = req.body.croppedLogo;
        // FETCH price data BEFORE creating the coin!
        let priceData = { price: 0, price24h: 0, mkap: 0 };
        const chain = req.body.chain;
        const address = req.body.address;
        // Only fetch price data if both address and chain exist
        if (address && chain) {
            if (chain === "sol") {
                priceData = await (0, coin_service_1.getSOLCoinPriceData)(address);
            }
            else {
                priceData = await (0, coin_service_1.getEVMCoinPriceData)(address, chain);
            }
        }
        const newCoin = new coin_model_1.default({
            author: user._id,
            slug,
            logo: croppedLogo,
            ...req.body,
            votes: 0,
            todayVotes: 0,
            price: priceData.price,
            price24h: priceData.price24h,
            mkap: priceData.mkap,
        });
        const coin = await newCoin.save();
        return res.status(http_config_1.HTTPSTATUS.OK).json(coin);
    }
    catch (error) {
        console.error("Error in create coin:", error);
        return res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            message: "An error occurred while creating the coin.",
            error: error.message || error,
        });
    }
});
exports.deleteCoin = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = (0, express_1.getAuth)(req).userId;
    const user = await user_model_1.default.findById(userId);
    if (!user) {
        return res
            .status(http_config_1.HTTPSTATUS.BAD_REQUEST)
            .json({ message: "User not found" });
    }
    // Find the coin to delete
    const deletedCoin = await coin_model_1.default.findOneAndDelete({
        _id: req.params.coinId,
        author: user._id,
    });
    if (!deletedCoin) {
        return res
            .status(http_config_1.HTTPSTATUS.FORBIDDEN)
            .json("You can delete only your coin");
    }
    // ✅ Delete votes associated with the coin
    try {
        await vote_model_1.default.deleteMany({ coin_id: deletedCoin._id });
        console.log(`Deleted votes for coin ${deletedCoin._id}`);
    }
    catch (error) {
        console.error("Error deleting votes for coin:", error);
        // Optional: Return an error if you want to block on this
        // return res.status(500).json("Failed to delete votes for coin");
    }
    // Check if croppedLogo exists and remove it from Cloudinary
    if (deletedCoin.croppedLogo) {
        const publicId = (0, removeImageCloudinary_1.getPublicIdFromUrl)(deletedCoin.croppedLogo);
        if (publicId) {
            try {
                // Call the remove function from the utility file
                await (0, removeImageCloudinary_1.removeImageFromCloudinary)(publicId);
            }
            catch (error) {
                return res.status(500).json("Failed to delete image from Cloudinary");
            }
        }
        else {
            console.error("Invalid public_id extracted from URL.");
        }
    }
    return res.status(http_config_1.HTTPSTATUS.OK).json("Coin has been deleted");
});
