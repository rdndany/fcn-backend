import { Router } from "express";

import { checkAuth } from "../middlewares/clerkAuth.middleware";
import multer from "multer";
import {
  create,
  deleteCoin,
  getAllCoinsController,
  getCoinBySlug,
  getPresaleCoinsController,
  getPromotedCoinsController,
  getRecentlyAddedCoinsController,
  getTopGainersCoinsController,
  update,
  uploadImage,
} from "../controllers/coin.controller";
import { rateLimiterMiddleware } from "../middlewares/rateLimiter";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const coinRoutes = Router();

coinRoutes.get("/all", rateLimiterMiddleware, getAllCoinsController);

coinRoutes.get("/promoted", rateLimiterMiddleware, getPromotedCoinsController);

coinRoutes.get(
  "/top-gainers",
  rateLimiterMiddleware,
  getTopGainersCoinsController
);

coinRoutes.get(
  "/recently-added",
  rateLimiterMiddleware,
  getRecentlyAddedCoinsController
);

coinRoutes.get("/presale", rateLimiterMiddleware, getPresaleCoinsController);

coinRoutes.get("/:slug", rateLimiterMiddleware, getCoinBySlug);

coinRoutes.post("/", checkAuth, rateLimiterMiddleware, create);

coinRoutes.patch("/:slug", rateLimiterMiddleware, update);

coinRoutes.delete("/:coinId", checkAuth, rateLimiterMiddleware, deleteCoin);

coinRoutes.post(
  "/upload-image",
  upload.single("logo"),
  rateLimiterMiddleware,
  uploadImage
);

export default coinRoutes;
