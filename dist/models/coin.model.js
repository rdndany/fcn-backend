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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoinStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var CoinStatus;
(function (CoinStatus) {
    CoinStatus["PENDING"] = "pending";
    CoinStatus["APPROVED"] = "approved";
    CoinStatus["DENIED"] = "denied";
})(CoinStatus || (exports.CoinStatus = CoinStatus = {}));
const coinSchema = new mongoose_1.Schema({
    name: { type: String, required: true, maxlength: 40 },
    symbol: { type: String, required: true, maxlength: 40 },
    slug: { type: String, required: true },
    description: {
        type: String,
        required: true,
        minlength: 25,
        maxlength: 2000,
    },
    logo: { type: String }, // Store as URL or file path
    croppedLogo: { type: String, required: true },
    categories: { type: [String], required: true },
    socials: {
        website: {
            type: String,
            required: true,
        },
        telegram: {
            type: String,
            default: "",
        },
        x: {
            type: String,
            default: "",
        },
        discord: {
            type: String,
            default: "",
        },
        youtube: {
            type: String,
            default: "",
        },
        whitepaper: {
            type: String,
            default: "",
        },
    },
    chain: { type: String, required: true },
    dexProvider: { type: String, required: true },
    presale: {
        enabled: { type: Boolean, default: false },
        link: {
            type: String,
            validate: {
                validator: function (value) {
                    if (value) {
                        return /^(https?:\/\/)[\w\-]+(\.[\w\-]+)+[/#?]?.*$/.test(value);
                    }
                    return true; // Allow null value
                },
            },
            default: null, // Set default to null
        },
        softcap: { type: String, min: 0, default: null },
        hardcap: { type: String, min: 0, default: null },
        coin: { type: String, required: true, default: "usdt" },
        timeStart: { type: Number, default: null },
        timeEnd: { type: Number, default: null },
    },
    fairlaunch: {
        enabled: { type: Boolean, default: false },
        link: {
            type: String,
            validate: {
                validator: function (value) {
                    if (value) {
                        return /^(https?:\/\/)[\w\-]+(\.[\w\-]+)+[/#?]?.*$/.test(value);
                    }
                    return true; // Allow null value
                },
            },
            default: null, // Set default to null
        },
    },
    address: { type: String, maxlength: 90, default: "" },
    audit: {
        exist: { type: Boolean, default: false },
        auditId: { type: String, default: "" },
    },
    kyc: {
        exist: { type: Boolean, default: false },
        kycId: { type: String, default: "" },
    },
    author: {
        type: String, // Change to String instead of ObjectId
        ref: "User",
        required: true,
    },
    launchDate: { type: Number, required: false, default: null },
    votes: { type: Number },
    userVoted: { type: Boolean },
    todayVotes: { type: Number },
    price: { type: Number, default: 0 },
    liquidity: { type: Number, default: 0 },
    mkap: { type: Number, default: 0 },
    price24h: {
        type: Number,
        default: 0,
    },
    premium: { type: Boolean, default: false },
    status: {
        type: String, // Use type: String for enums
        enum: Object.values(CoinStatus), // Enforce enum values in the schema
        default: CoinStatus.PENDING, // Default status if not specified
    },
    promoted: { type: Boolean, default: false },
    isFavorited: { type: Boolean },
}, { timestamps: true } // Automatically adds createdAt and updatedAt fields
);
const CoinModel = mongoose_1.default.model("Coin", coinSchema);
exports.default = CoinModel;
