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
exports.resetPriceMkapLiq = exports.deleteAllFavorites = exports.resetAllVotes = exports.resetTodayVotes = exports.updateEVMCoinPricesInBatches = exports.updateSOLCoinPricesInBatches = void 0;
const log4js_1 = require("log4js");
const coin_model_1 = __importStar(require("../models/coin.model"));
const moralis_1 = __importDefault(require("moralis"));
const getSafeNumber_1 = require("../utils/getSafeNumber");
const favorites_model_1 = __importDefault(require("../models/favorites.model"));
const logger = (0, log4js_1.getLogger)("moralis");
const updateSOLCoinPricesInBatches = async () => {
    try {
        const coinsToUpdate = await coin_model_1.default.find({
            chain: "sol",
            "presale.enabled": false,
            "fairlaunch.enabled": false,
            address: { $exists: true, $ne: "" },
            status: coin_model_1.CoinStatus.APPROVED,
        });
        const BATCH_SIZE = 10;
        let currentIndex = 0;
        let updatedCount = 0;
        const processBatch = async (batch) => {
            const tokenAddresses = batch
                .map((coin) => coin.address)
                .filter((address) => typeof address === "string");
            if (tokenAddresses.length === 0) {
                logger.warn("No valid token addresses to process.");
                return;
            }
            try {
                const apiKey = process.env.MORALIS_API_KEY || "";
                const options = {
                    method: "POST",
                    headers: {
                        accept: "application/json",
                        "content-type": "application/json",
                        "X-API-Key": apiKey,
                    },
                    body: JSON.stringify({
                        addresses: tokenAddresses,
                    }),
                };
                // ✅ Fetch price data for multiple tokens
                const response = await fetch("https://solana-gateway.moralis.io/token/mainnet/prices", options);
                const pricesArray = await response.json();
                // ✅ Create a price map by address (lowercase for consistency)
                const priceDataMap = {};
                pricesArray.forEach((priceData) => {
                    if (priceData?.tokenAddress) {
                        priceDataMap[priceData.tokenAddress.toLowerCase()] = priceData;
                    }
                });
                // ✅ Fetch metadata for each token (separately, as you already do)
                const metadataPromises = tokenAddresses.map(async (address) => {
                    const metadataResponse = await fetch(`https://deep-index.moralis.io/api/v2.2/tokens/${address}/analytics?chain=solana`, {
                        method: "GET",
                        headers: {
                            accept: "application/json",
                            "X-API-Key": apiKey,
                        },
                    });
                    const metadata = await metadataResponse.json();
                    return { address: address.toLowerCase(), metadata };
                });
                const metadataResults = await Promise.all(metadataPromises);
                // ✅ Create a metadata map by address (lowercase)
                const metadataMap = {};
                metadataResults.forEach(({ address, metadata }) => {
                    metadataMap[address] = metadata;
                });
                // ✅ Now iterate through the batch of coins and match by address
                for (const coin of batch) {
                    const tokenAddress = coin.address?.toLowerCase();
                    if (!tokenAddress) {
                        logger.error(`Coin ${coin.name} has an invalid address.`);
                        continue;
                    }
                    const priceData = priceDataMap[tokenAddress];
                    const metadata = metadataMap[tokenAddress];
                    if (!priceData) {
                        logger.error(`No price data found for coin: ${coin.name}`);
                        continue;
                    }
                    // ✅ Update coin values
                    coin.price = (0, getSafeNumber_1.getSafeNumber)(priceData.usdPrice);
                    coin.price24h = (0, getSafeNumber_1.getSafeNumber)(priceData.usdPrice24hrPercentChange);
                    if (metadata) {
                        coin.mkap = (0, getSafeNumber_1.getSafeNumber)(metadata.totalFullyDilutedValuation);
                        coin.liquidity = (0, getSafeNumber_1.getSafeNumber)(metadata.totalLiquidityUsd);
                    }
                    else {
                        logger.error(`No metadata found for coin: ${coin.name}`);
                    }
                    try {
                        await coin.save();
                        updatedCount++;
                    }
                    catch (error) {
                        logger.error(`Error saving coin ${coin.name}:`, error);
                    }
                }
            }
            catch (error) {
                logger.error("Error fetching prices and metadata for batch:", error);
            }
        };
        // ✅ Process coins in batches with delay
        const interval = setInterval(async () => {
            if (currentIndex < coinsToUpdate.length) {
                const batch = coinsToUpdate.slice(currentIndex, currentIndex + BATCH_SIZE);
                logger.info(`Processing ${batch.length} coins for chain SOL`);
                await processBatch(batch);
                currentIndex += BATCH_SIZE;
            }
            else {
                clearInterval(interval);
                logger.warn(`${updatedCount} coins for chain SOL have been updated.`);
            }
        }, 10000);
    }
    catch (error) {
        logger.error("Error in updating SOL coin prices:", error);
    }
};
exports.updateSOLCoinPricesInBatches = updateSOLCoinPricesInBatches;
const updateEVMCoinPricesInBatches = async () => {
    try {
        const coinsToUpdate = await coin_model_1.default.find({
            chain: { $in: ["bnb", "eth", "matic", "base"] },
            "presale.enabled": false,
            "fairlaunch.enabled": false,
            address: { $exists: true, $ne: "" },
            status: coin_model_1.CoinStatus.APPROVED,
        });
        const BATCH_SIZE = 10;
        const chainNameToIdMap = {
            bnb: "0x38",
            eth: "0x1",
            matic: "0x89",
            base: "0x2105",
        };
        const processBatch = async (batch, tokenChain) => {
            const tokenAddresses = batch
                .map((coin) => coin.address)
                .filter((address) => typeof address === "string");
            if (!tokenAddresses.length) {
                logger.warn("No valid token addresses found in batch.");
                return;
            }
            try {
                const apiKey = process.env.MORALIS_API_KEY || "";
                // ✅ Fetch prices for multiple tokens
                const pricesResponse = await moralis_1.default.EvmApi.token.getMultipleTokenPrices({
                    chain: tokenChain,
                    include: "percent_change",
                }, {
                    tokens: tokenAddresses.map((address) => ({
                        tokenAddress: address,
                    })),
                });
                if (!pricesResponse ||
                    !pricesResponse.raw ||
                    pricesResponse.raw.length === 0) {
                    logger.warn(`No price data returned for chain ${tokenChain}. Skipping batch.`);
                    return;
                }
                // ✅ Create a map from tokenAddress to priceData for easy lookup
                const priceDataMap = {};
                pricesResponse.raw.forEach((priceData) => {
                    if (priceData && priceData.tokenAddress) {
                        priceDataMap[priceData.tokenAddress.toLowerCase()] = priceData;
                    }
                });
                // ✅ Fetch metadata for each token
                const metadataPromises = batch.map(async (coin) => {
                    const address = coin.address;
                    if (!address) {
                        logger.warn(`Coin ${coin.name} has no address, skipping metadata fetch.`);
                        return { address: "", metadata: null };
                    }
                    const chainId = chainNameToIdMap[coin.chain];
                    try {
                        const metadataResponse = await fetch(`https://deep-index.moralis.io/api/v2.2/tokens/${address}/analytics?chain=${chainId}`, {
                            method: "GET",
                            headers: {
                                accept: "application/json",
                                "X-API-Key": apiKey,
                            },
                        });
                        if (!metadataResponse.ok) {
                            logger.error(`Failed to fetch metadata for ${coin.name}: ${metadataResponse.statusText}`);
                            return { address, metadata: null };
                        }
                        const metadata = await metadataResponse.json();
                        return { address, metadata };
                    }
                    catch (error) {
                        logger.error(`Error fetching metadata for ${coin.name}:`, error);
                        return { address, metadata: null };
                    }
                });
                const metadataResults = await Promise.all(metadataPromises);
                // ✅ Create a map from tokenAddress to metadata for easy lookup
                const metadataMap = {};
                metadataResults.forEach((result) => {
                    if (result.address && result.metadata) {
                        metadataMap[result.address.toLowerCase()] = result.metadata;
                    }
                });
                // ✅ Now process each coin using the maps
                for (const coin of batch) {
                    const tokenAddress = coin.address?.toLowerCase();
                    if (!tokenAddress) {
                        logger.error(`Coin ${coin.name} has an invalid address.`);
                        continue; // Skip this coin if it doesn't have a valid address
                    }
                    const priceData = priceDataMap[tokenAddress];
                    const tokenMetadata = metadataMap[tokenAddress];
                    if (!priceData) {
                        logger.error(`No price data found for coin: ${coin.name}`);
                        continue;
                    }
                    // ✅ Update price data
                    coin.price = (0, getSafeNumber_1.getSafeNumber)(priceData.usdPrice);
                    coin.price24h = (0, getSafeNumber_1.getSafeNumber)(priceData["24hrPercentChange"]);
                    // ✅ Update market cap from metadata
                    if (tokenMetadata &&
                        tokenMetadata.totalFullyDilutedValuation !== undefined) {
                        coin.mkap = (0, getSafeNumber_1.getSafeNumber)(tokenMetadata.totalFullyDilutedValuation);
                    }
                    else {
                        logger.error(`No market cap metadata for coin: ${coin.name}`);
                    }
                    // ✅ Update liquidity from metadata
                    if (tokenMetadata && tokenMetadata.totalLiquidityUsd !== undefined) {
                        coin.liquidity = (0, getSafeNumber_1.getSafeNumber)(tokenMetadata.totalLiquidityUsd);
                    }
                    else {
                        logger.error(`No liquidity metadata for coin: ${coin.name}`);
                    }
                    try {
                        await coin.save();
                    }
                    catch (error) {
                        logger.error(`Error saving coin ${coin.name}:`, error);
                    }
                }
            }
            catch (error) {
                logger.error(`Error processing batch on chain ${tokenChain}:`, error);
            }
        };
        // ✅ Group coins by chain
        const coinsGroupedByChain = {};
        coinsToUpdate.forEach((coin) => {
            const chainName = coin.chain;
            const chainId = chainNameToIdMap[chainName] || "0x1";
            if (!coinsGroupedByChain[chainId]) {
                coinsGroupedByChain[chainId] = {
                    coins: [],
                    chainName: chainName || "eth",
                };
            }
            coinsGroupedByChain[chainId].coins.push(coin);
        });
        // ✅ Process each chain's coins in batches
        for (const tokenChainId in coinsGroupedByChain) {
            const { coins, chainName } = coinsGroupedByChain[tokenChainId];
            let currentIndex = 0;
            const interval = setInterval(async () => {
                if (currentIndex < coins.length) {
                    const batch = coins.slice(currentIndex, currentIndex + BATCH_SIZE);
                    logger.info(`Processing ${batch.length} coins for chain ${chainName}`);
                    await processBatch(batch, tokenChainId);
                    currentIndex += BATCH_SIZE;
                }
                else {
                    clearInterval(interval);
                    logger.warn(`${coins.length} coins for chain ${chainName.toUpperCase()} have been updated.`);
                }
            }, 10000); // 10 seconds between batches
        }
    }
    catch (error) {
        logger.error("Error updating EVM coin prices in batches:", error);
    }
};
exports.updateEVMCoinPricesInBatches = updateEVMCoinPricesInBatches;
const resetTodayVotes = async () => {
    try {
        // Reset all todayVotes to 0 at midnight UTC
        await coin_model_1.default.updateMany({}, { $set: { todayVotes: 0 } });
    }
    catch (error) {
        console.error("Error resetting today votes:", error);
    }
};
exports.resetTodayVotes = resetTodayVotes;
const resetAllVotes = async () => {
    try {
        // Reset all todayVotes to 0 at midnight UTC
        await coin_model_1.default.updateMany({}, { $set: { votes: 0 } });
    }
    catch (error) {
        console.error("Error resetting all votes:", error);
    }
};
exports.resetAllVotes = resetAllVotes;
const deleteAllFavorites = async () => {
    try {
        // Reset all todayVotes to 0 at midnight UTC
        await favorites_model_1.default.deleteMany({});
    }
    catch (error) {
        console.error("Error deleting all favorites:", error);
    }
};
exports.deleteAllFavorites = deleteAllFavorites;
const resetPriceMkapLiq = async () => {
    try {
        // Reset all todayVotes to 0 at midnight UTC
        await coin_model_1.default.updateMany({}, {
            $set: {
                price: 0,
                mkap: 0,
                price24h: 0,
                liquidity: 0,
            },
        });
    }
    catch (error) {
        console.error("Error resetting token price mkap and liquidity:", error);
    }
};
exports.resetPriceMkapLiq = resetPriceMkapLiq;
