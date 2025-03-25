import { Router } from "express";

import { checkAdminAuth } from "../middlewares/adminAuth.middleware";
import {
  approveCoin,
  declineCoin,
  deleteUser,
  getAdminPromotedCoinsController,
  getAllUsersController,
  getApprovedCoinsController,
  getFairlaunchCoinsController,
  getPendingCoinsController,
  getPresaleCoinsController,
  promoteCoin,
  updateCoinPrices,
  updateUserRole,
} from "../controllers/admin.controller";
import { getUserByCoinId } from "../controllers/user.controller";

const adminRoutes = Router();

adminRoutes.get("/users", checkAdminAuth, getAllUsersController);

adminRoutes.patch("/users/:userId", checkAdminAuth, updateUserRole);

adminRoutes.delete("/users/:userId", checkAdminAuth, deleteUser);

adminRoutes.get("/pending", checkAdminAuth, getPendingCoinsController);

adminRoutes.get("/approved", checkAdminAuth, getApprovedCoinsController);

adminRoutes.get("/promoted", checkAdminAuth, getAdminPromotedCoinsController);

adminRoutes.get("/presale", checkAdminAuth, getPresaleCoinsController);

adminRoutes.get("/fairlaunch", checkAdminAuth, getFairlaunchCoinsController);

adminRoutes.post("/promote/:coinId", checkAdminAuth, promoteCoin);

adminRoutes.post("/approve/:coinId", checkAdminAuth, approveCoin);

adminRoutes.post("/decline/:coinId", checkAdminAuth, declineCoin);

adminRoutes.patch("/:coinId/price", checkAdminAuth, updateCoinPrices);

adminRoutes.get("/:coinId", checkAdminAuth, getUserByCoinId);

export default adminRoutes;
