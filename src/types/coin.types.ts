import { Request } from "express";
import { Types } from "mongoose";
import { CoinStatus } from "../models/coin.model";

export interface FilterParams {
  pageSize: number;
  pageNumber: number;
  isPresale: boolean;
  isFairlaunch: boolean;
  chains: string[];
  isAudit: boolean;
  isKyc: boolean;
  sortColumn: string;
  sortDirection: string;
  selectedKeys: string[];
  userId: string;
}

export interface UserFilterParams {
  pageSize: number;
  pageNumber: number;
}

export interface CoinQuery {
  pageSize?: string;
  pageNumber?: string;
  presale?: string;
  fairlaunch?: string;
  chain?: string | string[];
  audit?: string;
  kyc?: string;
  sortColumn?: string | string[];
  sortDirection?: string | string[];
  selectedKeys?: string | string[];
  userId?: string;
  searchValue?: string;
  [key: string]: string | string[] | undefined;
}

// Use Request with generic type parameter
export type CoinQueryParams = Request<{}, any, any, CoinQuery>;

export interface CoinResponse {
  message: string;
  coins: any[]; // Replace 'any' with proper coin type
  totalCount: number;
  totalPages: number;
  skip: number;
}

export interface CoinResponseData {
  coinsWithUpdatedFlags: any[]; // This should match the coin type from your model
  totalCount: number;
  totalPages: number;
  skip: number;
}

export interface CreateCoinBody {
  name: string;
  symbol: string;
  description: string;
  categories: string[];
  logo?: File;
  croppedLogo: string;
  chain: string;
  dexProvider: string;
  address?: string;
  launchDate?: number | null;
  socials: {
    website: string;
    telegram?: string;
    x?: string;
    discord?: string;
    youtube?: string;
    whitepaper?: string;
  };
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
  author: string;
  status?: CoinStatus;
}

export interface PriceData {
  price: number;
  price24h: number;
  mkap: number;
  liquidity: number;
}

export interface CoinDetails {
  _id: string;
  name: string;
  symbol: string;
  slug: string;
  description?: string;
  categories?: string[];
  address?: string;
  chain: string;
  dexProvider?: string;
  logo?: string | null;
  croppedLogo?: string;
  launchDate?: Date;
  socials?: Record<string, string>;
  presale?: Record<string, any>;
  fairlaunch?: Record<string, any>;
  price: number;
  price24h: number;
  mkap: number;
  liquidity: number;
  status: string;
}

export type GetCoinsFilteredType = {
  pageSize: number;
  pageNumber: number;
  presale: boolean;
  fairlaunch: boolean;
  chains: string[];
  audit: boolean;
  kyc: boolean;
  sortColumn: string;
  sortDirection: string;
  launchDate?: number | null;
};

export type GetPendingCoinsFilteredType = {
  pageSize: number;
  pageNumber: number;
};

export type GetApprovedCoinsFilteredType = {
  pageSize: number;
  pageNumber: number;
  chains: string[];
  sortColumn: string;
  sortDirection: string;
  searchValue?: string;
};
export type GetAdminPromotedCoinsFilteredType = {
  pageSize: number;
  pageNumber: number;
};

export type GetPresaleCoinsFilteredType = {
  pageSize: number;
  pageNumber: number;
};
export type GetFairlaunchCoinsFilteredType = {
  pageSize: number;
  pageNumber: number;
};
export type GetUsersFilteredType = {
  pageSize: number;
  pageNumber: number;
  searchValue?: string;
};
export type GetUserCoinsFilteredType = {
  pageSize: number;
  pageNumber: number;
  userId: string | null;
};
export interface PresaleInfo {
  enabled: boolean;
  link?: string;
  softcap?: string | null;
  hardcap?: string | null;
  coin?: string;
  timeStart?: number | null;
  timeEnd?: number | null;
}

export interface FairlaunchInfo {
  enabled: boolean;
  link?: string;
}

export interface AuditInfo {
  exist: boolean;
  auditId?: string;
}

export interface KycInfo {
  exist: boolean;
  kycId?: string;
}

export interface Coin {
  _id: Types.ObjectId | string;
  name: string;
  symbol: string;
  slug: string;
  logo?: string;
  chain: string;

  presale: PresaleInfo;
  fairlaunch: FairlaunchInfo;
  audit: AuditInfo;
  kyc: KycInfo;

  launchDate?: number | null;
  price: number;
  mkap: number;
  price24h: number;

  premium: boolean;
  todayVotes: number;
  votes: number;
  userVoted?: boolean; // Optional until flags are added
  isFavorited?: boolean; // Optional until flags are added
}

export interface PendingCoin {
  _id: Types.ObjectId | string;
  name: string;
  symbol: string;
  slug: string;
  logo?: string;
  chain: string;

  presale: PresaleInfo;
  fairlaunch: FairlaunchInfo;
  audit: AuditInfo;
  kyc: KycInfo;

  launchDate?: number | null;

  premium: boolean;
}

export interface ApprovedCoin {
  _id: Types.ObjectId | string;
  name: string;
  symbol: string;
  slug: string;
  logo?: string;
  chain: string;

  presale: PresaleInfo;
  fairlaunch: FairlaunchInfo;
  audit: AuditInfo;
  kyc: KycInfo;

  launchDate?: number | null;

  premium: boolean;
}

export interface PromotedCoin {
  _id: Types.ObjectId | string;
  name: string;
  symbol: string;
  slug: string;
  logo?: string;
  chain: string;

  presale: PresaleInfo;
  fairlaunch: FairlaunchInfo;
  audit: AuditInfo;
  kyc: KycInfo;

  launchDate?: number | null;

  premium: boolean;
}

export interface PresaleCoin {
  _id: Types.ObjectId | string;
  name: string;
  symbol: string;
  slug: string;
  logo?: string;
  chain: string;

  presale: PresaleInfo;
  fairlaunch: FairlaunchInfo;
  audit: AuditInfo;
  kyc: KycInfo;

  launchDate?: number | null;

  premium: boolean;
}

export interface FairlaunchCoin {
  _id: Types.ObjectId | string;
  name: string;
  symbol: string;
  slug: string;
  logo?: string;
  chain: string;

  presale: PresaleInfo;
  fairlaunch: FairlaunchInfo;
  audit: AuditInfo;
  kyc: KycInfo;

  launchDate?: number | null;

  premium: boolean;
}

export interface User {
  _id: Types.ObjectId | string;
  name: string;
  email: string;
  image: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPendingCoin {
  _id: Types.ObjectId | string;
  name: string;
  symbol: string;
  slug: string;
  logo?: string;
  chain: string;

  presale: PresaleInfo;
  fairlaunch: FairlaunchInfo;
  audit: AuditInfo;
  kyc: KycInfo;

  launchDate?: number | null;

  premium: boolean;
  status: CoinStatus;
}

export interface UpdatedCoin extends Coin {
  userVoted: boolean;
}

export interface AddVoteAFlagsParams {
  coins: Coin[];
  favoritedCoinIds: string[];
  ipAddress: string;
  coinIds: Types.ObjectId[];
  userId?: string;
}

export interface VoteCount {
  _id: Types.ObjectId;
  count: number;
}

export interface PendingCoinResult {
  coins: PendingCoin[]; // Array of PendingCoin
  totalCount: number; // Total number of coins matching the filter
  totalPages: number; // Total number of pages
  skip: number; // Number of documents skipped for pagination
}

export interface ApprovedCoinResult {
  coins: ApprovedCoin[]; // Array of PendingCoin
  totalCount: number; // Total number of coins matching the filter
  totalPages: number; // Total number of pages
  skip: number; // Number of documents skipped for pagination
}

export interface PromotedCoinResult {
  coins: PromotedCoin[]; // Array of PendingCoin
  totalCount: number; // Total number of coins matching the filter
  totalPages: number; // Total number of pages
  skip: number; // Number of documents skipped for pagination
}

export interface PresaleCoinResult {
  coins: PresaleCoin[]; // Array of PendingCoin
  totalCount: number; // Total number of coins matching the filter
  totalPages: number; // Total number of pages
  skip: number; // Number of documents skipped for pagination
}

export interface FairlaunchCoinResult {
  coins: FairlaunchCoin[]; // Array of PendingCoin
  totalCount: number; // Total number of coins matching the filter
  totalPages: number; // Total number of pages
  skip: number; // Number of documents skipped for pagination
}

export interface UsersResult {
  users: User[]; // Array of PendingCoin
  totalCount: number; // Total number of coins matching the filter
  totalPages: number; // Total number of pages
  skip: number; // Number of documents skipped for pagination
}
export interface UserCoinResult {
  coins: UserPendingCoin[]; // Array of PendingCoin
  totalCount: number; // Total number of coins matching the filter
  totalPages: number; // Total number of pages
  skip: number; // Number of documents skipped for pagination
}
export interface UserDetailsSuccessResponse {
  user: {
    _id: string;
    email: string;
    name: string;
    createdAt: string; // or Date if you prefer to handle as Date object

    role: string;
  };
}

export interface UserQuery {
  pageSize?: string;
  pageNumber?: string;
  searchValue?: string;
  [key: string]: string | string[] | undefined;
}

// Use Request with generic type parameter
export type UserQueryParams = Request<{}, any, any, UserQuery>;
