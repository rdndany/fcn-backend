import { Router } from "express";

import { checkAuth } from "../middlewares/clerkAuth.middleware";
import { getUserCoinsController } from "../controllers/user.controller";
import { checkAdminAuth } from "../middlewares/adminAuth.middleware";

const userRoutes = Router();

userRoutes.get("/coins", checkAuth, getUserCoinsController);

export default userRoutes;
