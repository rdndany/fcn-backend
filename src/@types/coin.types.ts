import { Types } from "mongoose";

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

export interface PresaleInfo {
  enabled: boolean;
  link?: string;
  softcap?: number | null;
  hardcap?: number | null;
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
