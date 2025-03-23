import { CoinResponse, CoinResponseData } from "../types/coin.types";

export function buildCoinResponse(data: CoinResponseData): CoinResponse {
  return {
    message: "All coins fetched and votes updated successfully",
    coins: data.coinsWithUpdatedFlags,
    totalCount: data.totalCount,
    totalPages: data.totalPages,
    skip: data.skip,
  };
}
