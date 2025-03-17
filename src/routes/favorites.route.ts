import { Router } from "express";
import {
  favoriteCoinController,
  getUserFavorites,
} from "../controllers/favorites.controller";
import { checkAuth } from "../middlewares/clerkAuth.middleware";

const favoritesRoutes = Router();

favoritesRoutes.get("/:coinId", checkAuth, favoriteCoinController);
favoritesRoutes.get("/", checkAuth, getUserFavorites);

export default favoritesRoutes;
