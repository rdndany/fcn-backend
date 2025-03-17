import { FilterQuery } from "mongoose";
import { Coin, GetCoinsFilteredType } from "../@types/coin.types";
import CoinModel, { CoinDocument } from "../models/coin.model";
import { getLogger } from "log4js";
import Moralis from "moralis";
import { getSafeNumber } from "../utils/getSafeNumber";

const logger = getLogger("coins");

export const getCoinsFiltered = async ({
  pageSize,
  pageNumber,
  presale,
  fairlaunch,
  chains,
  audit,
  kyc,
  sortColumn,
  sortDirection,
}: GetCoinsFilteredType) => {
  // Dynamically build the filters based on the flags (presale, fairlaunch, etc.)
  let filterQuery: FilterQuery<CoinDocument> = {};

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
  const totalCount = await CoinModel.countDocuments(filterQuery);

  const skip = (pageNumber - 1) * pageSize;

  // Ensure secondary sort when sorting by votes or todayVotes to ensure consistency
  const sortCriteria: Record<string, 1 | -1> = {
    [sortColumn]: sortDirection === "ascending" ? 1 : -1,
    _id: 1, // Add secondary sorting by _id for consistent pagination
  };

  const coins = await CoinModel.find(filterQuery)
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

export const getCoinsPromoted = async (): Promise<Coin[]> => {
  // Aggregation pipeline to count votes for each promoted coin
  const promotedCoinsWithVotes = await CoinModel.find(
    { promoted: true },
    {
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
    }
  )
    .lean()
    .sort({ votes: -1 });

  if (!promotedCoinsWithVotes || promotedCoinsWithVotes.length === 0) {
    logger.warn("Promoted coins not found");
    return [];
  }

  return promotedCoinsWithVotes as Coin[];
};

export const getSOLCoinPriceData = async (address: string) => {
  try {
    const apiKey = process.env.MORALIS_API_KEY || "";

    const pricesRes = await fetch(
      "https://solana-gateway.moralis.io/token/mainnet/prices",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          addresses: [address],
        }),
      }
    );

    const pricesData = await pricesRes.json();
    const priceData = pricesData[0];

    const metadataRes = await fetch(
      `https://solana-gateway.moralis.io/token/mainnet/${address}/metadata`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          "X-API-Key": apiKey,
        },
      }
    );

    const metadata = await metadataRes.json();

    return {
      price: getSafeNumber(priceData?.usdPrice),
      price24h: getSafeNumber(priceData?.usdPrice24hrPercentChange),
      mkap: getSafeNumber(metadata?.fullyDilutedValue),
    };
  } catch (error) {
    logger.error(`Error fetching SOL coin data for address ${address}:`, error);
    return { price: 0, price24h: 0, mkap: 0 };
  }
};

export const getEVMCoinPriceData = async (address: string, chain: string) => {
  try {
    const chainNameToIdMap: Record<string, string> = {
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

    const response = await Moralis.EvmApi.token.getMultipleTokenPrices(
      {
        chain: chainId,
        include: "percent_change",
      },
      {
        tokens: [{ tokenAddress: address }],
      }
    );

    const priceData = response.raw[0];

    const metadataResponse = await Moralis.EvmApi.token.getTokenMetadata({
      chain: chainId,
      addresses: [address],
    });

    const tokenMetadata = metadataResponse.raw[0];

    return {
      price: getSafeNumber(priceData?.usdPrice),
      price24h: getSafeNumber(priceData?.["24hrPercentChange"]),
      mkap: getSafeNumber(tokenMetadata?.market_cap),
    };
  } catch (error) {
    logger.error(
      `Error fetching EVM coin data for address ${address} on chain ${chain}:`,
      error
    );
    return { price: 0, price24h: 0, mkap: 0 };
  }
};
