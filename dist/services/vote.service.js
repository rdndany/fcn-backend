"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVoteByCoinId = exports.getVotesByCoinId = void 0;
exports.fetchVotesToCoins = fetchVotesToCoins;
const vote_model_1 = __importDefault(require("../models/vote.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const coin_model_1 = __importDefault(require("../models/coin.model"));
const log4js_1 = require("log4js");
const favorites_service_1 = require("./favorites.service");
const logger = (0, log4js_1.getLogger)("votes");
const getVotesByCoinId = async (coin_id) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(coin_id)) {
        throw new Error("Invalid coin_id format");
    }
    // Find all votes where coin_id matches
    const votes = await vote_model_1.default.countDocuments({ coin_id: coin_id });
    return votes;
};
exports.getVotesByCoinId = getVotesByCoinId;
const createVoteByCoinId = async (coin_id, userIp) => {
    if (!coin_id || !userIp) {
        throw new Error("coin_id and ip_address are required");
    }
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    // Check if the user has already voted today for this coin
    const existingVote = await vote_model_1.default.findOne({
        coin_id,
        ip_address: userIp,
        created_at: { $gte: todayStart },
    });
    const coin = await coin_model_1.default.findById(coin_id);
    if (!coin) {
        throw new Error("Coin not found");
    }
    if (existingVote) {
        throw new Error(`You have already voted today for ${coin.name}.`);
    }
    // 1. Create the vote record
    const vote = await vote_model_1.default.create({
        coin_id,
        ip_address: userIp,
        organic: true,
        created_at: new Date(),
    });
    // 2. Increment the votes & todayVotes counters atomically
    const updatedCoin = await coin_model_1.default.findOneAndUpdate({ _id: coin_id }, {
        $inc: {
            votes: 1,
            todayVotes: 1,
        },
    }, { new: true });
    if (!updatedCoin) {
        throw new Error("Failed to update the coin vote count");
    }
    logger.warn(`${userIp} successfully voted for ${coin_id}`);
    return { vote, updatedCoin };
};
exports.createVoteByCoinId = createVoteByCoinId;
async function fetchVotesToCoins({ coins, favoritedCoinIds, ipAddress, coinIds, userId, }) {
    // Step 1: Calculate start of today (UTC)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    if (userId) {
        favoritedCoinIds = await (0, favorites_service_1.getFavoritedCoinIds)(userId, coinIds);
    }
    // Step 2: Get all user votes for today
    const userVotes = await vote_model_1.default.find({
        ip_address: ipAddress,
        coin_id: { $in: coinIds },
        created_at: { $gte: todayStart },
    }).select("coin_id");
    // Step 3: Convert votes into a Set for quick lookup
    const userVotedCoins = new Set(userVotes.map((vote) => vote.coin_id.toString()));
    // Step 4: Map promoted coins and add the flags
    const coinsWithUpdatedFlags = coins.map((coinDoc) => {
        const coin = coinDoc; // Assert coinDoc as a Coin type
        const coinId = coin._id.toString();
        return {
            ...coin,
            isFavorited: favoritedCoinIds.includes(coinId),
            userVoted: userVotedCoins.has(coinId),
        };
    });
    return coinsWithUpdatedFlags;
}
