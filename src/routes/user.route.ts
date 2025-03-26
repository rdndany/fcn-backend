import { Router } from "express";

import { checkAuth } from "../middlewares/clerkAuth.middleware";
import { getUserCoinsController } from "../controllers/user.controller";
import { checkAdminAuth } from "../middlewares/adminAuth.middleware";
import { rateLimiterMiddleware } from "../middlewares/rateLimiter";

const userRoutes = Router();

userRoutes.get(
  "/coins",
  checkAuth,
  rateLimiterMiddleware,
  getUserCoinsController
);

export default userRoutes;
