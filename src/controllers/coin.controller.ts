import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import {
  coinBySlug,
  coinBySlugDetails,
  deleteCoinById,
  getCoinsFiltered,
  getCoinsPromoted,
  getPresaleCoins,
  getRecentlyAddedCoins,
  getTopGainersCoins,
} from "../services/coin.service";
import { HTTPSTATUS } from "../config/http.config";
import {
  fetchVotesToCoins,
  hasUserVotedForCoinToday,
} from "../services/vote.service";
import mongoose, { Types } from "mongoose";
import { getAuth } from "@clerk/express";
import CoinModel, { CoinStatus } from "../models/coin.model";
import cloudinary from "../config/cloudinary.config";
import { CoinQueryParams, CreateCoinBody } from "../types/coin.types";
import { processQueryParams } from "../services/query-params.service";
import { buildCoinResponse } from "../utils/response-builders";
import {
  fetchCoinPriceData,
  generateUniqueSlug,
  validateAddressUniqueness,
  invalidateCoinCaches,
  CacheInvalidationScope,
} from "../utils/coin.utils";
import { getClientIp } from "request-ip";
import UserModel from "../models/user.model";
import { getViewStats, trackView } from "../services/coinView.service";
import { getFavoritedCoinBySlug } from "../services/favorites.service";

export const getAllCoinsController = async (
  req: CoinQueryParams,
  res: Response
): Promise<void> => {
  try {
    // Process and validate query parameters
    const params = processQueryParams(req.query);
    const ipAddress = getClientIp(req);

    if (!ipAddress) {
      // logger.warn("Failed to extract client IP address");
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid request: Could not determine client IP",
      });
      return;
    }

    // Fetch filtered coins with explicit boolean flags
    const filteredCoins = await getCoinsFiltered({
      ...params,
      presale: Boolean(params.isPresale),
      fairlaunch: Boolean(params.isFairlaunch),
      audit: Boolean(params.isAudit),
      kyc: Boolean(params.isKyc),
    });

    if (!filteredCoins || !filteredCoins.coins) {
      // logger.warn("No coins found or invalid filter result");
      res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "No coins found",
      });
      return;
    }

    // Extract coin IDs for vote processing
    const coinIds = filteredCoins.coins.map((coin) => coin._id);

    // Update coins with vote and favorite flags
    const coinsWithUpdatedFlags = await fetchVotesToCoins({
      coins: filteredCoins.coins,
      favoritedCoinIds: [],
      ipAddress,
      coinIds,
      userId: params.userId,
    });

    if (!coinsWithUpdatedFlags) {
      // logger.error("Failed to update coin flags");
      res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to process coin data",
      });
      return;
    }

    // Build final response
    const response = buildCoinResponse({
      coinsWithUpdatedFlags,
      ...filteredCoins,
    });

    res.status(HTTPSTATUS.OK).json(response);
  } catch (error) {
    // logger.error("Error in getAllCoinsController:", error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch coins",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getPromotedCoinsController = async (
  req: CoinQueryParams,
  res: Response
): Promise<void> => {
  try {
    // Process and validate query parameters
    const params = processQueryParams(req.query);
    const ipAddress = getClientIp(req);

    if (!ipAddress) {
      // logger.warn("Failed to extract client IP address");
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid request: Could not determine client IP",
      });
      return;
    }

    // Fetch promoted coins
    const promotedCoins = await getCoinsPromoted();

    if (!promotedCoins || promotedCoins.length === 0) {
      // logger.info("No promoted coins found");
      res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "No promoted coins found",
        promotedCoins: [],
        totalCount: 0,
      });
      return;
    }

    // Extract coin IDs for vote processing
    const coinIds = promotedCoins.map((coin) => coin._id as Types.ObjectId);

    // Update coins with vote and favorite flags
    const coinsWithUpdatedFlags = await fetchVotesToCoins({
      coins: promotedCoins,
      favoritedCoinIds: [],
      ipAddress,
      coinIds,
      userId: params.userId,
    });

    if (!coinsWithUpdatedFlags) {
      // logger.error("Failed to update coin flags");
      res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to process coin data",
      });
      return;
    }

    // logger.info(
    //   `Successfully retrieved ${coinsWithUpdatedFlags.length} promoted coins`
    // );
    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Promoted coins fetched successfully",
      promotedCoins: coinsWithUpdatedFlags,
      totalCount: coinsWithUpdatedFlags.length,
    });
  } catch (error) {
    // logger.error("Error in getPromotedCoinsController:", error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch promoted coins",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getTopGainersCoinsController = async (
  req: CoinQueryParams,
  res: Response
): Promise<void> => {
  try {
    const topGainers = await getTopGainersCoins();

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Top gainers coins fetched successfully",
      topGainersCoins: topGainers,
    });
  } catch (error) {
    console.error("Error in getTopGainersCoinsController:", error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch top gainers coins",
    });
  }
};

export const getRecentlyAddedCoinsController = async (
  req: CoinQueryParams,
  res: Response
): Promise<void> => {
  try {
    const recentlyAdded = await getRecentlyAddedCoins();

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Recently added coins fetched successfully",
      recentlyAddedCoins: recentlyAdded,
    });
  } catch (error) {
    console.error("Error in getRecentlyAddedCoinsController:", error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch recently added coins",
    });
  }
};

export const getPresaleCoinsController = async (
  req: CoinQueryParams,
  res: Response
): Promise<void> => {
  try {
    const presaleCoins = await getPresaleCoins();

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Presale coins fetched successfully",
      presaleCoins: presaleCoins,
    });
  } catch (error) {
    console.error("Error in getPresaleCoinsController:", error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch presale coins",
    });
  }
};

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  const { croppedLogo } = req.body;

  if (!croppedLogo) {
    return res
      .status(HTTPSTATUS.BAD_REQUEST)
      .json({ message: "No image data provided." });
  }

  try {
    // Upload to Cloudinary directly using the Base64 string
    const uploadResponse = await cloudinary.uploader.upload(croppedLogo, {
      folder: "logos", // Optional, still helps organize
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "Image uploaded successfully!",
      logoUrl: uploadResponse.secure_url,
      public_id: uploadResponse.public_id, // You can use this to delete the image later
    });
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return res
      .status(HTTPSTATUS.INTERNAL_SERVER_ERROR)
      .json({ message: "Image upload failed.", error });
  }
});

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuth(req).userId;

    const user = await UserModel.findById(userId);

    if (!user) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const {
      name,
      symbol,
      description,
      categories,
      address,
      chain,
      dexProvider,
      croppedLogo,
      launchDate,
      socials,
      presale,
      fairlaunch,
    } = req.body as CreateCoinBody;

    // Validate required fields
    if (!name || !symbol || !chain || !dexProvider) {
      res
        .status(HTTPSTATUS.BAD_REQUEST)
        .json({ message: "Missing required fields" });
      return;
    }

    // Validate address uniqueness if provided
    if (address) {
      await validateAddressUniqueness(address);
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(name);

    // Fetch price data if address is provided
    const priceData = address
      ? await fetchCoinPriceData(chain, address)
      : {
          price: 0,
          price24h: 0,
          mkap: 0,
          liquidity: 0,
        };

    // Create new coin
    const newCoin = await CoinModel.create({
      name,
      symbol,
      description,
      categories,
      address: address?.trim(),
      chain,
      dexProvider,
      slug,
      logo: croppedLogo,
      croppedLogo,
      launchDate,
      socials,
      presale,
      fairlaunch,
      author: userId, // Set author to userId from auth
      ...priceData,
      votes: 0,
      todayVotes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "pending",
    });

    // Invalidate caches
    await invalidateCoinCaches(CacheInvalidationScope.CREATE);

    res.status(HTTPSTATUS.CREATED).json(newCoin);
  } catch (error) {
    console.error("Error in create coin:", error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuth(req).userId;
    const role = getAuth(req).sessionClaims?.role;
    const isAdmin = role === "admin";
    const updates = req.body as Partial<CreateCoinBody>;

    // Find coin
    const slug = req.params.slug;
    const coin = await CoinModel.findOne({ slug });
    if (!coin) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "Coin not found",
      });
      return;
    }

    // Check if user has permission to edit this coin
    if (!isAdmin && coin.author !== userId) {
      res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "You are not authorized to edit this coin",
      });
      return;
    }

    // Validate address uniqueness if changed
    if (updates.address && updates.address !== coin.address) {
      const existingCoin = await CoinModel.findOne({
        address: updates.address.trim(),
        _id: { $ne: coin._id },
      });
      if (existingCoin) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({
          success: false,
          message: "Coin with this address already exists",
        });
        return;
      }
    }

    // Generate new slug if name changed
    const newSlug = updates.name
      ? await generateUniqueSlug(updates.name, coin._id.toString())
      : coin.slug;

    // Fetch updated price data if address or chain changed
    const shouldUpdatePriceData =
      (updates.address && updates.address !== coin.address) ||
      (updates.chain && updates.chain !== coin.chain);

    const priceData = shouldUpdatePriceData
      ? await fetchCoinPriceData(
          updates.chain || coin.chain,
          updates.address || coin.address
        )
      : {
          price: coin.price,
          price24h: coin.price24h,
          mkap: coin.mkap,
          liquidity: coin.liquidity,
        };

    // Prepare update fields
    const updatedFields = {
      ...updates,
      name: updates.name,
      symbol: updates.symbol,
      description: updates.description,
      address: updates.address?.trim(),
      slug: newSlug,
      logo: updates.croppedLogo || coin.logo,
      ...priceData,
      // Only allow status change if user is admin
      status: CoinStatus.PENDING,
      updatedAt: new Date(),
    };

    // Update coin
    const updatedCoin = await CoinModel.findOneAndUpdate(
      { slug },
      updatedFields,
      {
        new: true,
        runValidators: true,
      }
    );

    // Invalidate caches
    await invalidateCoinCaches(CacheInvalidationScope.UPDATE);

    res.status(HTTPSTATUS.OK).json(updatedCoin);
  } catch (error) {
    console.error("Error in update coin:", error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const deleteCoin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = getAuth(req).userId;
    const role = getAuth(req).sessionClaims?.role;

    // Validate user
    if (!userId) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "User not found" });
      return;
    }

    // Check if user is admin
    const isAdmin = role === "admin";

    // Find the coin first to verify ownership
    const coin = await CoinModel.findById(req.params.coinId);
    if (!coin) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ message: "Coin not found" });
      return;
    }

    // If not admin, verify ownership
    if (!isAdmin && coin.author !== userId) {
      res.status(HTTPSTATUS.FORBIDDEN).json({
        message: "You are not authorized to delete this coin",
      });
      return;
    }

    // Delete coin and associated resources
    const success = await deleteCoinById(req.params.coinId);

    if (!success) {
      res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        message: "Failed to delete coin",
      });
      return;
    }

    // Invalidate caches
    await invalidateCoinCaches(CacheInvalidationScope.DELETE);

    res.status(HTTPSTATUS.OK).json({
      message: "Coin has been deleted successfully",
    });
  } catch (error) {
    console.error("Error in delete coin:", error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const getCoinBySlug = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { slug } = req.params;

    if (!slug) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "Slug is required" });
      return;
    }

    const coinDetails = await coinBySlug(slug);

    if (!coinDetails) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ message: "Coin not found" });
      return;
    }

    // Track view
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    if (!ipAddress) {
      res
        .status(HTTPSTATUS.BAD_REQUEST)
        .json({ message: "IP address not found" });
      return;
    }
    // Convert coinDetails._id to ObjectId
    const coinId = new mongoose.Types.ObjectId(coinDetails._id);
    await trackView(coinId, ipAddress as string, userAgent);

    let stats;
    try {
      stats = await getViewStats(coinDetails._id);
      console.log(stats);
    } catch (error) {
      console.error("Failed to fetch view stats:", error);
      stats = { total_views: 0, last_24h: 0 };
    }

    res.status(HTTPSTATUS.OK).json({ ...coinDetails, stats });
  } catch (error) {
    console.error("Error in getCoinBySlug:", error);
    res
      .status(HTTPSTATUS.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to retrieve coin details" });
  }
};

export const getCoinBSlugDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { slug } = req.params;
    const userId = getAuth(req).userId;
    const ipAddress = getClientIp(req);

    if (!slug) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Slug is required",
      });
      return;
    }

    const coinDetails = await coinBySlugDetails(slug); // You'll need to implement coinById
    if (!coinDetails) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ message: "Coin not found" });
      return;
    }
    const coinId = coinDetails?._id;

    if (userId) {
      // check if the coin is favorited
      const isFavorited = await getFavoritedCoinBySlug(slug, userId);
      coinDetails.isFavorited = isFavorited;

      const hasVoted = await hasUserVotedForCoinToday(
        coinId,
        ipAddress as string
      );
      coinDetails.userVoted = hasVoted;
    }

    if (!coinDetails) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ message: "Coin not found" });
      return;
    }

    res.status(HTTPSTATUS.OK).json({ ...coinDetails });
  } catch (error) {
    console.error("Error in coinBySlugDetails:", error);
    res
      .status(HTTPSTATUS.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to retrieve coin details" });
  }
};
