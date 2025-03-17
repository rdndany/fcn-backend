import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import {
  getCoinsFiltered,
  getCoinsPromoted,
  getEVMCoinPriceData,
  getSOLCoinPriceData,
} from "../services/coin.service";
import { HTTPSTATUS } from "../config/http.config";
import { fetchVotesToCoins } from "../services/vote.service";
import { Types } from "mongoose";
import { getAuth } from "@clerk/express";
import UserModel from "../models/user.model";
import CoinModel from "../models/coin.model";
import slugify from "../utils/slugify";
import { v4 } from "uuid";
import {
  getPublicIdFromUrl,
  removeImageFromCloudinary,
} from "../utils/removeImageCloudinary";
import cloudinary from "../config/cloudinary.config";
import VoteModel from "../models/vote.model";

export const getAllCoinsController = asyncHandler(
  async (req: Request, res: Response) => {
    let {
      pageSize = "25",
      pageNumber = "1",
      presale = "false",
      fairlaunch = "false",
      chain = [""],
      audit = "false",
      kyc = "false",
      sortColumn = "todayVotes", // Default to 'votes'
      sortDirection = "descending", // Default to 'descending'
      selectedKeys = ["Today_best"],
    } = req.query; // Default values
    const userId: string = (req.query.userId as string) || "";
    // Convert them to numbers
    let size = parseInt(pageSize as string, 10);
    let page = parseInt(pageNumber as string, 10);

    // Ensure valid page size and page number
    if (isNaN(size) || size <= 0) size = 25; // Default size
    if (isNaN(page) || page <= 0) page = 1; // Default page number

    // Convert filters from strings to booleans
    let isPresale = presale === "true"; // Convert "true" or "false" string to boolean
    let isFairlaunch = fairlaunch === "true"; // Convert "true" or "false" string to boolean
    let isAudit = audit === "true"; // Convert "true" or "false" string to boolean
    let isKyc = kyc === "true"; // Convert "true" or "false" string to boolean

    // Ensure sortColumn and sortDirection are strings
    if (Array.isArray(sortColumn)) {
      sortColumn = sortColumn[0]; // If it's an array, use the first value
    }

    // Make sure selectedKeys is always an array (can be a single value or an array)
    if (typeof selectedKeys === "string") {
      selectedKeys = [selectedKeys];
    }

    // Only override sortColumn if it's not provided in the query

    // If sortColumn is NOT something custom, override based on selectedKeys
    if (
      !req.query.sortColumn || // no manual sort column provided
      sortColumn === "votes" || // defaulting to votes
      sortColumn === "todayVotes" // defaulting to todayVotes
    ) {
      if (Array.isArray(selectedKeys) && !selectedKeys.includes("Today_best")) {
        sortColumn = "votes"; // All time best → votes
      } else {
        sortColumn = "todayVotes"; // Today best → todayVotes
      }
    }

    if (Array.isArray(sortDirection)) {
      sortDirection = sortDirection[0]; // If it's an array, use the first value
    }

    // Ensure they are strings, just in case the query parameters are parsed as other types.
    sortColumn = String(sortColumn);
    sortDirection = String(sortDirection);
    // Handle chain filtering with a type check to ensure we can call .split
    let chains: string[] = [];
    if (typeof chain === "string" && chain.trim() !== "") {
      chains = chain.split(",").map((item) => item.trim());
    }

    const rawIp = String(
      req.headers["x-forwarded-for"] || req.socket.remoteAddress
    );

    const ipAddress = rawIp.split(",")[rawIp.split(",").length - 1].trim();

    // Step 1: Fetch filtered coins, already sorted and paginated
    const filteredCoins = await getCoinsFiltered({
      pageSize: size,
      pageNumber: page,
      presale: isPresale,
      fairlaunch: isFairlaunch,
      chains,
      audit: isAudit,
      kyc: isKyc,
      sortColumn,
      sortDirection,
    });

    const coinIds: Types.ObjectId[] = filteredCoins.coins.map(
      (coin) => coin._id as Types.ObjectId
    );

    // Step 2: Get the user's favorite coin IDs (don't refetch all coins!)
    let favoritedCoinIds: string[] = [];

    // Fix: Pass the filteredCoins.coins (promotedCoins) instead of allCoins
    const coinsWithUpdatedFlags = await fetchVotesToCoins({
      coins: filteredCoins.coins,
      favoritedCoinIds,
      ipAddress,
      coinIds,
      userId,
    });

    // Step 5: Return sorted, paginated, and updated coins
    return res.status(HTTPSTATUS.OK).json({
      message: "All coins fetched and votes updated successfully",
      coins: coinsWithUpdatedFlags,
      totalCount: filteredCoins.totalCount,
      totalPages: filteredCoins.totalPages,
      skip: filteredCoins.skip,
    });
  }
);

export const getPromotedCoinsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId: string = (req.query.userId as string) || "";

    const rawIp = String(
      req.headers["x-forwarded-for"] || req.socket.remoteAddress
    );

    const ipAddress = rawIp.split(",")[rawIp.split(",").length - 1].trim();
    const promotedCoins = await getCoinsPromoted();

    const coinIds: Types.ObjectId[] = promotedCoins.map(
      (coin) => coin._id as Types.ObjectId
    );

    // Step 2: Get the user's favorite coin IDs (don't refetch all coins!)
    let favoritedCoinIds: string[] = [];

    const coinsWithUpdatedFlags = await fetchVotesToCoins({
      coins: promotedCoins,
      favoritedCoinIds,
      ipAddress,
      coinIds,
      userId,
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "All coins promoted fetched successfully",
      promotedCoins: coinsWithUpdatedFlags,
    });
  }
);

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  const { croppedLogo } = req.body;

  if (!croppedLogo) {
    return res.status(400).json({ message: "No image data provided." });
  }

  try {
    // Upload to Cloudinary directly using the Base64 string
    const uploadResponse = await cloudinary.uploader.upload(croppedLogo, {
      folder: "logos", // Optional, still helps organize
    });

    return res.status(200).json({
      message: "Image uploaded successfully!",
      logoUrl: uploadResponse.secure_url,
      public_id: uploadResponse.public_id, // You can use this to delete the image later
    });
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return res.status(500).json({ message: "Image upload failed.", error });
  }
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = getAuth(req).userId;

    const user = await UserModel.findById(userId);

    if (!user) {
      return res
        .status(HTTPSTATUS.BAD_REQUEST)
        .json({ message: "User not found" });
    }

    req.body.name = req.body.name.trim();

    let slug = slugify(req.body.name);

    const sameSlug = await CoinModel.findOne({ slug });
    if (sameSlug) {
      slug = `${slug}-${v4().split("-")[0]}`;
    }

    delete req.body.logo;
    const croppedLogo = req.body.croppedLogo;

    // FETCH price data BEFORE creating the coin!
    let priceData = { price: 0, price24h: 0, mkap: 0 };

    const chain = req.body.chain;
    const address = req.body.address;

    // Only fetch price data if both address and chain exist
    if (address && chain) {
      if (chain === "sol") {
        priceData = await getSOLCoinPriceData(address);
      } else {
        priceData = await getEVMCoinPriceData(address, chain);
      }
    }

    const newCoin = new CoinModel({
      author: user._id,
      slug,
      logo: croppedLogo,
      ...req.body,
      votes: 0,
      todayVotes: 0,
      price: priceData.price,
      price24h: priceData.price24h,
      mkap: priceData.mkap,
    });

    const coin = await newCoin.save();

    return res.status(HTTPSTATUS.OK).json(coin);
  } catch (error: any) {
    console.error("Error in create coin:", error);
    return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred while creating the coin.",
      error: error.message || error,
    });
  }
});

export const deleteCoin = asyncHandler(async (req: Request, res: Response) => {
  const userId = getAuth(req).userId;

  const user = await UserModel.findById(userId);

  if (!user) {
    return res
      .status(HTTPSTATUS.BAD_REQUEST)
      .json({ message: "User not found" });
  }

  // Find the coin to delete
  const deletedCoin = await CoinModel.findOneAndDelete({
    _id: req.params.coinId,
    author: user._id,
  });

  if (!deletedCoin) {
    return res
      .status(HTTPSTATUS.FORBIDDEN)
      .json("You can delete only your coin");
  }

  // ✅ Delete votes associated with the coin
  try {
    await VoteModel.deleteMany({ coin_id: deletedCoin._id });
    console.log(`Deleted votes for coin ${deletedCoin._id}`);
  } catch (error) {
    console.error("Error deleting votes for coin:", error);
    // Optional: Return an error if you want to block on this
    // return res.status(500).json("Failed to delete votes for coin");
  }

  // Check if croppedLogo exists and remove it from Cloudinary
  if (deletedCoin.croppedLogo) {
    const publicId = getPublicIdFromUrl(deletedCoin.croppedLogo);

    if (publicId) {
      try {
        // Call the remove function from the utility file
        await removeImageFromCloudinary(publicId);
      } catch (error) {
        return res.status(500).json("Failed to delete image from Cloudinary");
      }
    } else {
      console.error("Invalid public_id extracted from URL.");
    }
  }

  return res.status(HTTPSTATUS.OK).json("Coin has been deleted");
});
