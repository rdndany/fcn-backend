import mongoose, { Document, Types, Schema } from "mongoose";
import { UserDocument } from "./user.model";

export enum CoinStatus {
  PENDING = "pending",
  APPROVED = "approved",
  DENIED = "denied",
}

export interface CoinDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  symbol: string;
  slug: string;
  description: string;
  logo?: string; // URL or file path
  croppedLogo?: string;
  categories: string[];
  socials: {
    website?: string;
    telegram?: string;
    x?: string;
    discord?: string;
    youtube?: string;
    whitepaper?: string;
  };
  chain: string;
  dexProvider: string;
  presale: {
    enabled: boolean;
    link?: string;
    softcap?: string;
    hardcap?: string;
    coin: string;
    timeStart?: number | null;
    timeEnd?: number | null;
  };
  fairlaunch: {
    enabled: boolean;
    link?: string;
  };
  address?: string;
  audit: {
    exist: boolean;
    auditId: string;
  };
  kyc: {
    exist: boolean;
    auditId: string;
  };
  author: UserDocument | mongoose.Types.ObjectId | string;
  launchDate?: number | null;
  votes: number;
  userVoted: boolean;
  todayVotes: number;
  price: number;
  mkap: number;
  liquidity: number;
  price24h: number;
  premium: boolean;
  status: CoinStatus;
  promoted: boolean;
  isFavorited: boolean;
}

const coinSchema = new Schema<CoinDocument>(
  {
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
          validator: function (value: string | null) {
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
          validator: function (value: string | null) {
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
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);
const CoinModel = mongoose.model<CoinDocument>("Coin", coinSchema);
export default CoinModel;
