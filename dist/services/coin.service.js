"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEVMCoinPriceData = exports.getSOLCoinPriceData = exports.getCoinsPromoted = exports.getCoinsFiltered = void 0;
const coin_model_1 = __importDefault(require("../models/coin.model"));
const log4js_1 = require("log4js");
const moralis_1 = __importDefault(require("moralis"));
const getSafeNumber_1 = require("../utils/getSafeNumber");
const logger = (0, log4js_1.getLogger)("coins");
const getCoinsFiltered = async ({ pageSize, pageNumber, presale, fairlaunch, chains, audit, kyc, sortColumn, sortDirection, }) => {
    // Dynamically build the filters based on the flags (presale, fairlaunch, etc.)
    let filterQuery = {};
    if (chains.length > 0) {
        filterQuery = { ...filterQuery, chain: { $in: chains } }; // Apply the chain filter
    }
    if (presale) {
        filterQuery = { ...filterQuery, "presale.enabled": true }; // Apply presale filter
    }
    if (fairlaunch) {
        filterQuery = { ...filterQuery, "fairlaunch.enabled": true }; // Apply fairlaunch filter
    }
    if (audit) {
        filterQuery = { ...filterQuery, "audit.exist": true }; // Apply audit filter
    }
    if (kyc) {
        filterQuery = { ...filterQuery, "kyc.exist": true }; // Apply kyc filter
    }
    // 👉 If sorting by launchDate, exclude coins without a launchDate
    if (sortColumn === "launchDate") {
        filterQuery.launchDate = { $ne: null };
    }
    // 👉 If sorting by price24h, exclude coins in presale or fairlaunch
    if (sortColumn === "price24h") {
        filterQuery["presale.enabled"] = { $ne: true };
        filterQuery["fairlaunch.enabled"] = { $ne: true };
        filterQuery.price24h = { $ne: 0 };
    }
    // Count documents based on all active filters
    const totalCount = await coin_model_1.default.countDocuments(filterQuery);
    const skip = (pageNumber - 1) * pageSize;
    // Ensure secondary sort when sorting by votes or todayVotes to ensure consistency
    const sortCriteria = {
        [sortColumn]: sortDirection === "ascending" ? 1 : -1,
        _id: 1, // Add secondary sorting by _id for consistent pagination
    };
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
    })
        .sort(sortCriteria) // Apply sorting with secondary criterion
        .skip(skip)
        .limit(pageSize)
        .lean();
    const totalPages = Math.ceil(totalCount / pageSize);
    return { coins, totalCount, totalPages, skip };
};
exports.getCoinsFiltered = getCoinsFiltered;
const getCoinsPromoted = async () => {
    // Aggregation pipeline to count votes for each promoted coin
    const promotedCoinsWithVotes = await coin_model_1.default.find({ promoted: true }, {
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
    })
        .lean()
        .sort({ votes: -1 });
    if (!promotedCoinsWithVotes || promotedCoinsWithVotes.length === 0) {
        logger.warn("Promoted coins not found");
        return [];
    }
    return promotedCoinsWithVotes;
};
exports.getCoinsPromoted = getCoinsPromoted;
const getSOLCoinPriceData = async (address) => {
    try {
        const apiKey = process.env.MORALIS_API_KEY || "";
        const pricesRes = await fetch("https://solana-gateway.moralis.io/token/mainnet/prices", {
            method: "POST",
            headers: {
                accept: "application/json",
                "content-type": "application/json",
                "X-API-Key": apiKey,
            },
            body: JSON.stringify({
                addresses: [address],
            }),
        });
        const pricesData = await pricesRes.json();
        const priceData = pricesData[0];
        const metadataRes = await fetch(`https://solana-gateway.moralis.io/token/mainnet/${address}/metadata`, {
            method: "GET",
            headers: {
                accept: "application/json",
                "X-API-Key": apiKey,
            },
        });
        const metadata = await metadataRes.json();
        return {
            price: (0, getSafeNumber_1.getSafeNumber)(priceData?.usdPrice),
            price24h: (0, getSafeNumber_1.getSafeNumber)(priceData?.usdPrice24hrPercentChange),
            mkap: (0, getSafeNumber_1.getSafeNumber)(metadata?.fullyDilutedValue),
        };
    }
    catch (error) {
        logger.error(`Error fetching SOL coin data for address ${address}:`, error);
        return { price: 0, price24h: 0, mkap: 0 };
    }
};
exports.getSOLCoinPriceData = getSOLCoinPriceData;
const getEVMCoinPriceData = async (address, chain) => {
    try {
        const chainNameToIdMap = {
            bnb: "0x38",
            eth: "0x1",
            matic: "0x89",
            base: "0x2105",
        };
        const chainId = chainNameToIdMap[chain];
        if (!chainId) {
            logger.error(`Unsupported EVM chain: ${chain}`);
            return { price: 0, price24h: 0, mkap: 0 };
        }
        const response = await moralis_1.default.EvmApi.token.getMultipleTokenPrices({
            chain: chainId,
            include: "percent_change",
        }, {
            tokens: [{ tokenAddress: address }],
        });
        const priceData = response.raw[0];
        const metadataResponse = await moralis_1.default.EvmApi.token.getTokenMetadata({
            chain: chainId,
            addresses: [address],
        });
        const tokenMetadata = metadataResponse.raw[0];
        return {
            price: (0, getSafeNumber_1.getSafeNumber)(priceData?.usdPrice),
            price24h: (0, getSafeNumber_1.getSafeNumber)(priceData?.["24hrPercentChange"]),
            mkap: (0, getSafeNumber_1.getSafeNumber)(tokenMetadata?.market_cap),
        };
    }
    catch (error) {
        logger.error(`Error fetching EVM coin data for address ${address} on chain ${chain}:`, error);
        return { price: 0, price24h: 0, mkap: 0 };
    }
};
exports.getEVMCoinPriceData = getEVMCoinPriceData;
