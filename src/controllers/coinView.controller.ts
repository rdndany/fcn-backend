// src/controllers/coinViewController.ts
import { Request, Response } from "express";
import { getAllCoinsTrending, trackView } from "../services/coinView.service";
import mongoose from "mongoose";

export const trackViewController = async (
  req: Request<{ coinId: string }>,
  res: Response
): Promise<void> => {
  try {
    const { coinId } = req.params;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const userAgent = req.headers["user-agent"];

    if (userAgent && userAgent.toLowerCase().includes("node")) {
      res.status(403).json({
        success: false,
        message: "Server-side tracking not allowed",
      });
      return;
    }

    // Convert coinId to ObjectId
    const coinIdObjectId = new mongoose.Types.ObjectId(coinId);
    await trackView(coinIdObjectId, ipAddress as string, userAgent);

    res.status(200).json({ success: true, message: "View tracked" });
    res.status(200).json({ success: false, message: "Duplicate view" });
  } catch (error) {
    console.error("Error tracking view:", error);
    res.status(500).json({ success: false, message: "Failed to track view" });
  }
};

export const getAllTrendingCoinsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get limit from query parameter (default to 10 if not provided)
    const limit = parseInt(req.query.limit as string) || 10;

    // Fetch the coins ordered by trending score (based on views and votes)
    const coins = await getAllCoinsTrending(limit);

    res.status(200).json({
      success: true,
      message: "Trending coins fetched successfully",
      trendingCoins: coins,
    });
  } catch (error) {
    console.error("Error fetching all trending coins:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch all trending coins",
    });
  }
};
