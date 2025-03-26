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
exports.createVoteByCoinId = exports.getVotesByCoinId = void 0;
exports.fetchVotesToCoins = fetchVotesToCoins;
const vote_model_1 = __importDefault(require("../models/vote.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const coin_model_1 = __importStar(require("../models/coin.model"));
const log4js_1 = require("log4js");
const favorites_service_1 = require("./favorites.service");
const coin_utils_1 = require("../utils/coin.utils");
const logger = (0, log4js_1.getLogger)("votes");
const getVotesByCoinId = (coin_id) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(coin_id)) {
        throw new Error("Invalid coin_id format");
    }
    // Find all votes where coin_id matches
    const votes = yield vote_model_1.default.countDocuments({ coin_id: coin_id });
    return votes;
});
exports.getVotesByCoinId = getVotesByCoinId;
const createVoteByCoinId = (coin_id, userIp) => __awaiter(void 0, void 0, void 0, function* () {
    if (!coin_id || !userIp) {
        throw new Error("coin_id and ip_address are required");
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(coin_id)) {
        throw new Error("Invalid coin_id format");
    }
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    logger.info("Processing vote request:", { coin_id, userIp });
    try {
        // First, check if the coin exists and is approved
        const coin = yield coin_model_1.default.findById(coin_id);
        if (!coin) {
            throw new Error("Coin not found");
        }
        // Check if the coin's status is APPROVED before allowing the vote
        if (coin.status !== coin_model_1.CoinStatus.APPROVED) {
            throw new Error(`Cannot vote for ${coin.name} as it is not approved.`);
        }
        // Check if the user has already voted today for this coin
        const existingVote = yield vote_model_1.default.findOne({
            coin_id,
            ip_address: userIp,
            created_at: { $gte: todayStart },
        });
        if (existingVote) {
            throw new Error(`You have already voted today for ${coin.name}.`);
        }
        // Create the vote record first
        const vote = yield vote_model_1.default.create({
            coin_id,
            ip_address: userIp,
            organic: true,
            created_at: new Date(),
        });
        // Then update the coin's vote counts
        const updatedCoin = yield coin_model_1.default.findOneAndUpdate({ _id: coin_id }, {
            $inc: {
                votes: 1,
                todayVotes: 1,
            },
        }, { new: true });
        if (!updatedCoin) {
            // If coin update fails, we should clean up the vote record
            yield vote_model_1.default.deleteOne({ _id: vote._id });
            throw new Error("Failed to update the coin vote count");
        }
        // Invalidate caches
        yield (0, coin_utils_1.invalidateCoinCaches)(coin_utils_1.CacheInvalidationScope.VOTE);
        logger.info("Successfully recorded vote:", {
            coin_id,
            coinName: coin.name,
            userIp,
            updatedVotes: {
                total: updatedCoin.votes,
                today: updatedCoin.todayVotes,
            },
        });
        return { vote, updatedCoin };
    }
    catch (error) {
        logger.error("Error in createVoteByCoinId:", error);
        throw error;
    }
});
exports.createVoteByCoinId = createVoteByCoinId;
function fetchVotesToCoins(_a) {
    return __awaiter(this, arguments, void 0, function* ({ coins, favoritedCoinIds, ipAddress, coinIds, userId, }) {
        // Step 1: Calculate start of today (UTC)
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);
        if (userId) {
            favoritedCoinIds = yield (0, favorites_service_1.getFavoritedCoinIds)(userId, coinIds);
        }
        // Step 2: Get all user votes for today
        const userVotes = yield vote_model_1.default.find({
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
            return Object.assign(Object.assign({}, coin), { isFavorited: favoritedCoinIds.includes(coinId), userVoted: userVotedCoins.has(coinId) });
        });
        return coinsWithUpdatedFlags;
    });
}
