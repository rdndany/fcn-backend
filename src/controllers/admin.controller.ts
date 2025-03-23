import { Request, Response } from "express";

import { HTTPSTATUS } from "../config/http.config";
import CoinModel from "../models/coin.model";
import { CoinQueryParams } from "../types/coin.types";
import { processQueryParams } from "../services/query-params.service";
import {
  invalidateCoinCaches,
  CacheInvalidationScope,
} from "../utils/coin.utils";
import { getLogger } from "log4js";
import {
  approveCoinById,
  declineCoinById,
  getCoinsAdminPromoted,
  getCoinsApproved,
  getCoinsFairlaunch,
  getCoinsPending,
  getCoinsPresale,
  promoteCoinById,
} from "../services/admin.service";
import {
  getEVMCoinPriceData,
  getSOLCoinPriceData,
} from "../services/coin.service";

const logger = getLogger("admin-controller");

export const getPendingCoinsController = async (
  req: CoinQueryParams,
  res: Response
): Promise<void> => {
  try {
    const params = processQueryParams(req.query);
    // logger.info("Fetching pending coins with params:", {
    //   pageSize: params.pageSize,
    //   pageNumber: params.pageNumber,
    // });

    const pendingCoinsData = await getCoinsPending({
      pageSize: params.pageSize,
      pageNumber: params.pageNumber,
    });

    if (!pendingCoinsData || !pendingCoinsData.coins) {
      // logger.warn("No pending coins found");
      res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "No pending coins found",
        coins: [],
        totalCount: 0,
        totalPages: 0,
        skip: 0,
      });
      return;
    }

    // logger.info(
    //   `Successfully retrieved ${pendingCoinsData.coins.length} pending coins`
    // );
    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Pending coins fetched successfully",
      coins: pendingCoinsData.coins,
      totalCount: pendingCoinsData.totalCount,
      totalPages: pendingCoinsData.totalPages,
      skip: pendingCoinsData.skip,
    });
  } catch (error) {
    // logger.error("Error in getPendingCoinsController:", error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch pending coins",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getApprovedCoinsController = async (
  req: CoinQueryParams,
  res: Response
): Promise<void> => {
  try {
    const params = processQueryParams(req.query);
    const searchValue = req.query.searchValue?.toString() || "";

    // logger.info("Fetching approved coins with params:", {
    //   pageSize: params.pageSize,
    //   pageNumber: params.pageNumber,
    //   chains: params.chains,
    //   sortColumn: params.sortColumn,
    //   sortDirection: params.sortDirection,
    //   searchValue: searchValue,
    // });

    const approvedCoinsData = await getCoinsApproved({
      pageSize: params.pageSize,
      pageNumber: params.pageNumber,
      chains: params.chains,
      sortColumn: params.sortColumn,
      sortDirection: params.sortDirection,
      searchValue: searchValue,
    });

    if (!approvedCoinsData || !approvedCoinsData.coins) {
      // logger.warn("No approved coins found");
      res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "No approved coins found",
        coins: [],
        totalCount: 0,
        totalPages: 0,
        skip: 0,
      });
      return;
    }

    // logger.info(
    //   `Successfully retrieved ${approvedCoinsData.coins.length} approved coins`
    // );
    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Approved coins fetched successfully",
      coins: approvedCoinsData.coins,
      totalCount: approvedCoinsData.totalCount,
      totalPages: approvedCoinsData.totalPages,
      skip: approvedCoinsData.skip,
    });
  } catch (error) {
    logger.error("Error in getApprovedCoinsController:", error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch approved coins",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getAdminPromotedCoinsController = async (
  req: CoinQueryParams,
  res: Response
): Promise<void> => {
  try {
    const params = processQueryParams(req.query);
    // logger.info("Fetching admin promoted coins with params:", {
    //   pageSize: params.pageSize,
    //   pageNumber: params.pageNumber,
    // });

    const promotedCoinsData = await getCoinsAdminPromoted({
      pageSize: params.pageSize,
      pageNumber: params.pageNumber,
    });

    if (!promotedCoinsData || !promotedCoinsData.coins) {
      // logger.warn("No admin promoted coins found");
      res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "No admin promoted coins found",
        coins: [],
        totalCount: 0,
        totalPages: 0,
        skip: 0,
      });
      return;
    }

    // logger.info(
    //   `Successfully retrieved ${promotedCoinsData.coins.length} admin promoted coins`
    // );
    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Admin promoted coins fetched successfully",
      coins: promotedCoinsData.coins,
      totalCount: promotedCoinsData.totalCount,
      totalPages: promotedCoinsData.totalPages,
      skip: promotedCoinsData.skip,
    });
  } catch (error) {
    // logger.error("Error in getAdminPromotedCoinsController:", error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch admin promoted coins",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getPresaleCoinsController = async (
  req: CoinQueryParams,
  res: Response
): Promise<void> => {
  try {
    const params = processQueryParams(req.query);
    // logger.info("Fetching presale coins with params:", {
    //   pageSize: params.pageSize,
    //   pageNumber: params.pageNumber,
    // });

    const presaleCoinsData = await getCoinsPresale({
      pageSize: params.pageSize,
      pageNumber: params.pageNumber,
    });

    if (!presaleCoinsData || !presaleCoinsData.coins) {
      // logger.warn("No presale coins found");
      res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "No presale coins found",
        coins: [],
        totalCount: 0,
        totalPages: 0,
        skip: 0,
      });
      return;
    }

    // logger.info(
    //   `Successfully retrieved ${presaleCoinsData.coins.length} presale coins`
    // );
    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Presale coins fetched successfully",
      coins: presaleCoinsData.coins,
      totalCount: presaleCoinsData.totalCount,
      totalPages: presaleCoinsData.totalPages,
      skip: presaleCoinsData.skip,
    });
  } catch (error) {
    // logger.error("Error in getPresaleCoinsController:", error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch presale coins",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getFairlaunchCoinsController = async (
  req: CoinQueryParams,
  res: Response
): Promise<void> => {
  try {
    const params = processQueryParams(req.query);
    // logger.info("Fetching fairlaunch coins with params:", {
    //   pageSize: params.pageSize,
    //   pageNumber: params.pageNumber,
    // });

    const fairlaunchCoinsData = await getCoinsFairlaunch({
      pageSize: params.pageSize,
      pageNumber: params.pageNumber,
    });

    if (!fairlaunchCoinsData || !fairlaunchCoinsData.coins) {
      // logger.warn("No fairlaunch coins found");
      res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "No fairlaunch coins found",
        coins: [],
        totalCount: 0,
        totalPages: 0,
        skip: 0,
      });
      return;
    }

    // logger.info(
    //   `Successfully retrieved ${fairlaunchCoinsData.coins.length} fairlaunch coins`
    // );
    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Fairlaunch coins fetched successfully",
      coins: fairlaunchCoinsData.coins,
      totalCount: fairlaunchCoinsData.totalCount,
      totalPages: fairlaunchCoinsData.totalPages,
      skip: fairlaunchCoinsData.skip,
    });
  } catch (error) {
    // logger.error("Error in getFairlaunchCoinsController:", error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch fairlaunch coins",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const approveCoin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { coinId } = req.params;

    if (!coinId) {
      res
        .status(HTTPSTATUS.BAD_REQUEST)
        .json({ message: "Coin ID is required" });
      return;
    }

    const success = await approveCoinById(coinId);

    if (!success) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ message: "Coin not found" });
      return;
    }

    // Invalidate relevant caches
    await invalidateCoinCaches(CacheInvalidationScope.APPROVAL);

    res.status(HTTPSTATUS.OK).json({ message: "Coin approved successfully" });
  } catch (error) {
    // logger.error("Error in approveCoin controller:", error);
    res
      .status(HTTPSTATUS.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to approve coin" });
  }
};

export const declineCoin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { coinId } = req.params;

    if (!coinId) {
      res
        .status(HTTPSTATUS.BAD_REQUEST)
        .json({ message: "Coin ID is required" });
      return;
    }

    const coin = await declineCoinById(coinId);

    if (!coin) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ message: "Coin not found" });
      return;
    }

    // Invalidate relevant caches
    await invalidateCoinCaches(CacheInvalidationScope.DECLINE);

    res.status(HTTPSTATUS.OK).json({ message: "Coin declined successfully" });
  } catch (error) {
    // logger.error("Error in declineCoin controller:", error);
    res
      .status(HTTPSTATUS.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to decline coin" });
  }
};

export const promoteCoin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { coinId } = req.params;

    if (!coinId) {
      res
        .status(HTTPSTATUS.BAD_REQUEST)
        .json({ message: "Coin ID is required" });
      return;
    }

    const result = await promoteCoinById(coinId);

    if (!result) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ message: "Coin not found" });
      return;
    }

    // Invalidate only relevant caches
    await invalidateCoinCaches(CacheInvalidationScope.PROMOTION);

    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: result.promoted
        ? "Coin has been promoted"
        : "Coin has been unpromoted",
    });
  } catch (error) {
    // logger.error("Error in promoteCoin controller:", error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to promote coin",
    });
  }
};

export const updateCoinPrices = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { coinId } = req.params;

    if (!coinId) {
      res
        .status(HTTPSTATUS.BAD_REQUEST)
        .json({ message: "Coin ID is required" });
      return;
    }

    // Find the coin by ID
    const coin = await CoinModel.findById(coinId);
    if (!coin) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ message: "Coin not found" });
      return;
    }

    const { address, chain } = coin;
    if (!address) {
      res
        .status(HTTPSTATUS.BAD_REQUEST)
        .json({ message: "Coin address is missing" });
      return;
    }

    // Fetch new price data based on the coin's chain
    const priceData =
      chain === "sol"
        ? await getSOLCoinPriceData(address)
        : await getEVMCoinPriceData(address, chain);

    // Update the coin's price-related fields
    Object.assign(coin, priceData);
    await coin.save();

    logger.info(`Price update completed for ${coin.name}:`, {
      coinId,
      oldPrice: coin.price,
      newPrice: priceData.price,
      chain,
      address,
    });

    // Invalidate relevant caches
    await invalidateCoinCaches(CacheInvalidationScope.UPDATE_PRICE);

    res.status(HTTPSTATUS.OK).json({
      message: `Prices updated successfully for ${coin.name}`,
    });
  } catch (error) {
    logger.error("Error in updateCoinPrices controller:", error);
    res.status(500).json({ message: "Failed to update coin prices" });
  }
};
