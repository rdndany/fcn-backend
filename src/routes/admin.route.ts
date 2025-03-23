import { Router } from "express";

import { checkAdminAuth } from "../middlewares/adminAuth.middleware";
import {
  approveCoin,
  declineCoin,
  getAdminPromotedCoinsController,
  getApprovedCoinsController,
  getFairlaunchCoinsController,
  getPendingCoinsController,
  getPresaleCoinsController,
  promoteCoin,
  updateCoinPrices,
} from "../controllers/admin.controller";
import { getUserByCoinId } from "../controllers/user.controller";

const adminRoutes = Router();

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
