import { getLogger } from "log4js";
import CoinModel, { CoinDocument, CoinStatus } from "../models/coin.model";
import Moralis from "moralis";
import { getSafeNumber } from "../utils/getSafeNumber";
import FavoritesModel from "../models/favorites.model";

const logger = getLogger("moralis");

export const updateSOLCoinPricesInBatches = async () => {
  try {
    const coinsToUpdate = await CoinModel.find({
      chain: "sol",
      "presale.enabled": false,
      "fairlaunch.enabled": false,
      address: { $exists: true, $ne: "" },
      status: CoinStatus.APPROVED,
    });

    const BATCH_SIZE = 10;
    let currentIndex = 0;
    let updatedCount = 0;

    const processBatch = async (batch: CoinDocument[]) => {
      const tokenAddresses = batch
        .map((coin) => coin.address)
        .filter((address): address is string => typeof address === "string");

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
        const response = await fetch(
          "https://solana-gateway.moralis.io/token/mainnet/prices",
          options
        );
        const pricesArray = await response.json();

        // ✅ Create a price map by address (lowercase for consistency)
        const priceDataMap: Record<string, any> = {};
        pricesArray.forEach((priceData: any) => {
          if (priceData?.tokenAddress) {
            priceDataMap[priceData.tokenAddress.toLowerCase()] = priceData;
          }
        });

        // ✅ Fetch metadata for each token (separately, as you already do)
        const metadataPromises = tokenAddresses.map(async (address) => {
          const metadataResponse = await fetch(
            `https://deep-index.moralis.io/api/v2.2/tokens/${address}/analytics?chain=solana`,
            {
              method: "GET",
              headers: {
                accept: "application/json",
                "X-API-Key": apiKey,
              },
            }
          );

          const metadata = await metadataResponse.json();
          return { address: address.toLowerCase(), metadata };
        });

        const metadataResults = await Promise.all(metadataPromises);

        // ✅ Create a metadata map by address (lowercase)
        const metadataMap: Record<string, any> = {};
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
          coin.price = getSafeNumber(priceData.usdPrice);
          coin.price24h = getSafeNumber(priceData.usdPrice24hrPercentChange);

          if (metadata) {
            coin.mkap = getSafeNumber(metadata.totalFullyDilutedValuation);
            coin.liquidity = getSafeNumber(metadata.totalLiquidityUsd);
          } else {
            logger.error(`No metadata found for coin: ${coin.name}`);
          }

          try {
            await coin.save();
            updatedCount++;
          } catch (error) {
            logger.error(`Error saving coin ${coin.name}:`, error);
          }
        }
      } catch (error) {
        logger.error("Error fetching prices and metadata for batch:", error);
      }
    };

    // ✅ Process coins in batches with delay
    const interval = setInterval(async () => {
      if (currentIndex < coinsToUpdate.length) {
        const batch = coinsToUpdate.slice(
          currentIndex,
          currentIndex + BATCH_SIZE
        );
        logger.info(`Processing ${batch.length} coins for chain SOL`);
        await processBatch(batch);
        currentIndex += BATCH_SIZE;
      } else {
        clearInterval(interval);
        logger.warn(`${updatedCount} coins for chain SOL have been updated.`);
      }
    }, 10000);
  } catch (error) {
    logger.error("Error in updating SOL coin prices:", error);
  }
};

export const updateEVMCoinPricesInBatches = async () => {
  try {
    const coinsToUpdate = await CoinModel.find({
      chain: { $in: ["bnb", "eth", "matic", "base"] },
      "presale.enabled": false,
      "fairlaunch.enabled": false,
      address: { $exists: true, $ne: "" },
      status: CoinStatus.APPROVED,
    });

    const BATCH_SIZE = 10;

    const chainNameToIdMap: Record<string, string> = {
      bnb: "0x38",
      eth: "0x1",
      matic: "0x89",
      base: "0x2105",
    };

    const processBatch = async (batch: CoinDocument[], tokenChain: string) => {
      const tokenAddresses = batch
        .map((coin) => coin.address)
        .filter((address): address is string => typeof address === "string");

      if (!tokenAddresses.length) {
        logger.warn("No valid token addresses found in batch.");
        return;
      }

      try {
        const apiKey = process.env.MORALIS_API_KEY || "";

        // ✅ Fetch prices for multiple tokens
        const pricesResponse =
          await Moralis.EvmApi.token.getMultipleTokenPrices(
            {
              chain: tokenChain,
              include: "percent_change",
            },
            {
              tokens: tokenAddresses.map((address) => ({
                tokenAddress: address,
              })),
            }
          );

        if (
          !pricesResponse ||
          !pricesResponse.raw ||
          pricesResponse.raw.length === 0
        ) {
          logger.warn(
            `No price data returned for chain ${tokenChain}. Skipping batch.`
          );
          return;
        }

        // ✅ Create a map from tokenAddress to priceData for easy lookup
        const priceDataMap: Record<string, any> = {};
        pricesResponse.raw.forEach((priceData: any) => {
          if (priceData && priceData.tokenAddress) {
            priceDataMap[priceData.tokenAddress.toLowerCase()] = priceData;
          }
        });

        // ✅ Fetch metadata for each token
        const metadataPromises = batch.map(async (coin) => {
          const address = coin.address;

          if (!address) {
            logger.warn(
              `Coin ${coin.name} has no address, skipping metadata fetch.`
            );
            return { address: "", metadata: null };
          }

          const chainId = chainNameToIdMap[coin.chain];

          try {
            const metadataResponse = await fetch(
              `https://deep-index.moralis.io/api/v2.2/tokens/${address}/analytics?chain=${chainId}`,
              {
                method: "GET",
                headers: {
                  accept: "application/json",
                  "X-API-Key": apiKey,
                },
              }
            );

            if (!metadataResponse.ok) {
              logger.error(
                `Failed to fetch metadata for ${coin.name}: ${metadataResponse.statusText}`
              );
              return { address, metadata: null };
            }

            const metadata = await metadataResponse.json();

            return { address, metadata };
          } catch (error) {
            logger.error(`Error fetching metadata for ${coin.name}:`, error);
            return { address, metadata: null };
          }
        });

        const metadataResults = await Promise.all(metadataPromises);

        // ✅ Create a map from tokenAddress to metadata for easy lookup
        const metadataMap: Record<string, any> = {};
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
          coin.price = getSafeNumber(priceData.usdPrice);
          coin.price24h = getSafeNumber(priceData["24hrPercentChange"]);

          // ✅ Update market cap from metadata
          if (
            tokenMetadata &&
            tokenMetadata.totalFullyDilutedValuation !== undefined
          ) {
            coin.mkap = getSafeNumber(tokenMetadata.totalFullyDilutedValuation);
          } else {
            logger.error(`No market cap metadata for coin: ${coin.name}`);
          }

          // ✅ Update liquidity from metadata
          if (tokenMetadata && tokenMetadata.totalLiquidityUsd !== undefined) {
            coin.liquidity = getSafeNumber(tokenMetadata.totalLiquidityUsd);
          } else {
            logger.error(`No liquidity metadata for coin: ${coin.name}`);
          }

          try {
            await coin.save();
          } catch (error) {
            logger.error(`Error saving coin ${coin.name}:`, error);
          }
        }
      } catch (error) {
        logger.error(`Error processing batch on chain ${tokenChain}:`, error);
      }
    };

    // ✅ Group coins by chain
    const coinsGroupedByChain: {
      [chainId: string]: {
        coins: CoinDocument[];
        chainName: string;
      };
    } = {};

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
          logger.info(
            `Processing ${batch.length} coins for chain ${chainName}`
          );
          await processBatch(batch, tokenChainId);
          currentIndex += BATCH_SIZE;
        } else {
          clearInterval(interval);
          logger.warn(
            `${
              coins.length
            } coins for chain ${chainName.toUpperCase()} have been updated.`
          );
        }
      }, 10000); // 10 seconds between batches
    }
  } catch (error) {
    logger.error("Error updating EVM coin prices in batches:", error);
  }
};

export const resetTodayVotes = async () => {
  try {
    // Reset all todayVotes to 0 at midnight UTC
    await CoinModel.updateMany({}, { $set: { todayVotes: 0 } });
  } catch (error) {
    console.error("Error resetting today votes:", error);
  }
};

export const resetAllVotes = async () => {
  try {
    // Reset all todayVotes to 0 at midnight UTC
    await CoinModel.updateMany({}, { $set: { votes: 0 } });
  } catch (error) {
    console.error("Error resetting all votes:", error);
  }
};

export const deleteAllFavorites = async () => {
  try {
    // Reset all todayVotes to 0 at midnight UTC
    await FavoritesModel.deleteMany({});
  } catch (error) {
    console.error("Error deleting all favorites:", error);
  }
};

export const resetPriceMkapLiq = async () => {
  try {
    // Reset all todayVotes to 0 at midnight UTC
    await CoinModel.updateMany(
      {},
      {
        $set: {
          price: 0,
          mkap: 0,
          price24h: 0,
          liquidity: 0,
        },
      }
    );
  } catch (error) {
    console.error("Error resetting token price mkap and liquidity:", error);
  }
};
