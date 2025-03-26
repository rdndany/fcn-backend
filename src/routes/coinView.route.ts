// src/routes/coinViewRoutes.ts
import { Router } from "express";
import {
  getAllTrendingCoinsController,
  trackViewController,
} from "../controllers/coinView.controller";
import { rateLimiterMiddleware } from "../middlewares/rateLimiter";
const coinViewRoutes = Router();

coinViewRoutes.post(
  "/:coinId/track-view",
  rateLimiterMiddleware,
  trackViewController
);
// Route to fetch all coins ordered by total views
coinViewRoutes.get(
  "/coins/sorted-by-views",
  rateLimiterMiddleware,
  getAllTrendingCoinsController
);
export default coinViewRoutes;
