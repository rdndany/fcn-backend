import { getLogger } from "log4js";
import CoinModel, { CoinDocument } from "../models/coin.model";
import Moralis from "moralis";
import { getSafeNumber } from "../utils/getSafeNumber";

const logger = getLogger("moralis");

export const updateSOLCoinPricesInBatches = async () => {
  try {
    // Fetch all coins that need their prices updated (e.g., presale and fairlaunch are false)
    const coinsToUpdate = await CoinModel.find({
      chain: "sol",
      "presale.enabled": false,
      "fairlaunch.enabled": false,
      price: { $exists: true }, // Only coins that have a price field
    });

    const BATCH_SIZE = 10;
    let currentIndex = 0;
    let updatedCount = 0; // Counter for updated coins

    // Function to process and update a batch of coins
    const processBatch = async (batch: CoinDocument[]) => {
      const tokenAddresses = batch
        .map((coin) => coin.address)
        .filter((address): address is string => typeof address === "string"); // Collect all valid token addresses

      if (tokenAddresses.length === 0) {
        logger.warn("No valid token addresses to process.");
        return;
      }

      try {
        // Fetch prices for all tokens in this batch using a single API request
        const apiKey = process.env.MORALIS_API_KEY || ""; // Use your actual API key
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

        const response = await fetch(
          "https://solana-gateway.moralis.io/token/mainnet/prices",
          options
        );
        const pricesData = await response.json();

        // Process metadata for each token
        const metadataPromises = tokenAddresses.map(async (address) => {
          const metadataResponse = await fetch(
            `https://solana-gateway.moralis.io/token/mainnet/${address}/metadata`,
            {
              method: "GET",
              headers: {
                accept: "application/json",
                "X-API-Key": apiKey, // Use your actual API key
              },
            }
          );

          const metadata = await metadataResponse.json();
          return metadata;
        });

        // Wait for all metadata fetches to complete
        const metadataData = await Promise.all(metadataPromises);

        // Update each coin with the fetched price and market cap
        batch.forEach((coin, index) => {
          const priceData = pricesData[index];
          const metadata = metadataData[index];

          if (priceData) {
            const usdPrice = getSafeNumber(priceData?.usdPrice); // Default to 0 if price is not found
            const price24hChange = getSafeNumber(
              priceData?.usdPrice24hrPercentChange
            ); // Default to 0 if 24hr price change is not found
            const fullyDilutedValue = getSafeNumber(
              metadata?.fullyDilutedValue
            ); // Default to 0 if market cap is not found

            // Update the coin's price and market cap (fullyDilutedValue)
            coin.price = usdPrice;
            coin.price24h = price24hChange;
            coin.mkap = fullyDilutedValue;

            coin.save(); // Save the updated coin
            updatedCount++; // Increment the updated coins counter
            // console.log(`Updated price and market cap for coin: ${coin.name}`);
          } else {
            logger.error(`No price data found for coin: ${coin.name}`);
          }
        });
      } catch (error) {
        logger.error("Error fetching prices and metadata for batch:", error);
      }
    };

    // Process the coins in batches
    const interval = setInterval(async () => {
      if (currentIndex < coinsToUpdate.length) {
        // Slice the next batch of coins (BATCH_SIZE is the number of coins per batch)
        const batch = coinsToUpdate.slice(
          currentIndex,
          currentIndex + BATCH_SIZE
        );
        await processBatch(batch); // Process this batch
        currentIndex += BATCH_SIZE; // Move to the next batch
      } else {
        clearInterval(interval); // Stop the interval when all coins have been processed
        logger.warn(`${updatedCount} coins for chain SOL have been updated.`);
      }
    }, 10000); // 10 seconds delay between batches
  } catch (error) {
    logger.error("Error in updating coin prices:", error);
  }
};

export const updateEVMCoinPricesInBatches = async () => {
  try {
    // Fetch all coins that need their prices updated
    const coinsToUpdate = await CoinModel.find({
      chain: { $in: ["bnb", "eth", "matic", "base"] },
      "presale.enabled": false,
      "fairlaunch.enabled": false,
      price: { $exists: true }, // Only coins that have a price field
    });

    const BATCH_SIZE = 10; // Adjust this to the number of coins you want to update at once

    // Mapping of chain names to chain IDs
    const chainNameToIdMap: Record<string, string> = {
      bnb: "0x38",
      eth: "0x1",
      matic: "0x89",
      base: "0x2105",
    };

    const processBatch = async (batch: CoinDocument[], tokenChain: string) => {
      // Move tokenAddresses **inside** this function to avoid shared state issues!
      const tokenAddresses = batch
        .map((coin) => coin.address)
        .filter((address): address is string => typeof address === "string");

      try {
        // Fetch prices for multiple tokens on the same chain
        const response = await Moralis.EvmApi.token.getMultipleTokenPrices(
          {
            chain: tokenChain, // Specify the chain
            include: "percent_change",
          },
          {
            tokens: tokenAddresses.map((address) => ({
              tokenAddress: address,
            })),
          }
        );

        // Fetch metadata (e.g., market cap) for all tokens in the batch on this chain
        const metadataResponse = await Moralis.EvmApi.token.getTokenMetadata({
          chain: tokenChain,
          addresses: tokenAddresses,
        });

        // Process the response and update each coin's price and market cap
        for (let i = 0; i < batch.length; i++) {
          const coin = batch[i];
          const priceData = response.raw[i];
          const tokenMetadata = metadataResponse.raw[i];

          // Update price data
          if (priceData) {
            coin.price = getSafeNumber(priceData.usdPrice);
            coin.price24h = getSafeNumber(priceData["24hrPercentChange"]);
          } else {
            logger.error(`No price data found for coin: ${coin.name}`);
          }

          // Update market cap data
          if (tokenMetadata) {
            coin.mkap = getSafeNumber(tokenMetadata.market_cap);
          } else {
            logger.error(`No market cap data found for coin: ${coin.name}`);
          }

          // Save the updated coin after both price and market cap updates
          try {
            await coin.save();
          } catch (error) {
            logger.error(`Error saving coin ${coin.name}:`, error);
          }
        }
      } catch (error) {
        logger.error(
          `Error fetching prices and market cap for batch on chain ${tokenChain}:`,
          error
        );
      }
    };

    // Group coins by their chain ID but preserve chain names
    const coinsGroupedByChain: {
      [chainId: string]: {
        coins: CoinDocument[];
        chainName: string;
      };
    } = {};

    // Group the coins based on their chain
    coinsToUpdate.forEach((coin) => {
      const chainName = coin.chain;
      const chainId = chainNameToIdMap[chainName] || "0x1"; // Default to Ethereum ID if unknown

      if (!coinsGroupedByChain[chainId]) {
        coinsGroupedByChain[chainId] = {
          coins: [],
          chainName: chainName || "eth", // Default to eth if not specified
        };
      }

      coinsGroupedByChain[chainId].coins.push(coin);
    });

    // Process each chain batch
    for (const tokenChainId in coinsGroupedByChain) {
      const { coins, chainName } = coinsGroupedByChain[tokenChainId];
      let currentChainIndex = 0;

      const interval = setInterval(async () => {
        if (currentChainIndex < coins.length) {
          const batch = coins.slice(
            currentChainIndex,
            currentChainIndex + BATCH_SIZE
          );
          await processBatch(batch, tokenChainId); // Pass the chain ID to Moralis
          currentChainIndex += BATCH_SIZE;
        } else {
          clearInterval(interval);
          logger.warn(
            `${
              coins.length
            } coins for chain ${chainName.toUpperCase()} have been updated.`
          );
        }
      }, 10000); // 10 seconds delay between batches
    }
  } catch (error) {
    logger.error("Error in updating coin prices and market caps:", error);
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
