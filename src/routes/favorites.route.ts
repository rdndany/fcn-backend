import { Router } from "express";
import {
  favoriteCoinController,
  favoriteCoinControllerBySlug,
  getUserFavorites,
} from "../controllers/favorites.controller";
import { checkAuth } from "../middlewares/clerkAuth.middleware";
import { rateLimiterMiddleware } from "../middlewares/rateLimiter";
const favoritesRoutes = Router();

favoritesRoutes.get(
  "/:coinId",
  checkAuth,
  rateLimiterMiddleware,
  favoriteCoinController
);

favoritesRoutes.get(
  "/slug/:slug",
  checkAuth,
  rateLimiterMiddleware,
  favoriteCoinControllerBySlug
);

favoritesRoutes.get("/", checkAuth, rateLimiterMiddleware, getUserFavorites);

export default favoritesRoutes;
