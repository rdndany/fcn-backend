// src/routes/coinViewRoutes.ts
import { Router } from "express";
import {
  getAllTrendingCoinsController,
  trackViewController,
} from "../controllers/coinView.controller";

const coinViewRoutes = Router();

coinViewRoutes.post("/:coinId/track-view", trackViewController);
// Route to fetch all coins ordered by total views
coinViewRoutes.get("/coins/sorted-by-views", getAllTrendingCoinsController);

export default coinViewRoutes;
