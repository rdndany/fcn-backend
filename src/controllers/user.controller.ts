import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import { getUserCoinsPending, userCoinById } from "../services/user.service";
import { getAuth } from "@clerk/express";
import UserModel from "../models/user.model";
import { getLogger } from "log4js";
import { processQueryParams } from "../services/query-params.service";

const logger = getLogger("user-controller");

export const getUserCoinsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const params = processQueryParams(req.query);
    const userId = getAuth(req).userId;

    // logger.info("Fetching user coins with params:", {
    //   pageSize: params.pageSize,
    //   pageNumber: params.pageNumber,
    //   userId,
    // });

    if (!userId) {
      // logger.warn("User ID not found in request");
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "User ID is required",
      });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      // logger.warn(`User not found with ID: ${userId}`);
      res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const userCoinsData = await getUserCoinsPending({
      pageSize: params.pageSize,
      pageNumber: params.pageNumber,
      userId,
    });

    if (!userCoinsData || !userCoinsData.coins) {
      // logger.info(`No coins found for user: ${userId}`);
      res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "No coins found for user",
        coins: [],
        totalCount: 0,
        totalPages: 0,
        skip: 0,
      });
      return;
    }

    // logger.info(
    //   `Successfully retrieved ${userCoinsData.coins.length} coins for user: ${userId}`
    // );
    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: `Coins fetched successfully for ${user.name}`,
      coins: userCoinsData.coins,
      totalCount: userCoinsData.totalCount,
      totalPages: userCoinsData.totalPages,
      skip: userCoinsData.skip,
    });
  } catch (error) {
    // logger.error("Error in getUserCoinsController:", error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch user coins",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getUserByCoinId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { coinId } = req.params;

    // logger.info("Attempting to fetch user by coin ID:", { coinId });

    if (!coinId) {
      logger.warn("No coin ID provided");
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        success: false,
        message: "Coin ID is required",
      });
      return;
    }

    const userDetails = await userCoinById(coinId);

    if (!userDetails) {
      // logger.warn("No user found for coin ID:", { coinId });
      res.status(HTTPSTATUS.NOT_FOUND).json({
        success: false,
        message: "No user found for this coin",
      });
      return;
    }

    // logger.info("Successfully retrieved user details for coin:", { coinId });
    res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "User details retrieved successfully",
      user: {
        _id: userDetails._id,
        email: userDetails.email,
        name: userDetails.name,
        role: userDetails.role,
        createdAt: userDetails.createdAt,
      },
    });
  } catch (error) {
    // logger.error("Error in getUserByCoinId controller:", error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch user details",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
