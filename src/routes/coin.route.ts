import { Router } from "express";

import { checkAuth } from "../middlewares/clerkAuth.middleware";
import multer from "multer";
import { checkAdminAuth } from "../middlewares/adminAuth.middleware";
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

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const coinRoutes = Router();

coinRoutes.get("/all", getAllCoinsController);

coinRoutes.get("/promoted", getPromotedCoinsController);

coinRoutes.get("/top-gainers", getTopGainersCoinsController);

coinRoutes.get("/recently-added", getRecentlyAddedCoinsController);

coinRoutes.get("/presale", getPresaleCoinsController);

coinRoutes.get("/:slug", getCoinBySlug);

coinRoutes.post("/", checkAuth, create);

coinRoutes.patch("/:slug", update);

coinRoutes.delete("/:coinId", checkAuth, deleteCoin);

coinRoutes.post("/upload-image", upload.single("logo"), uploadImage);

export default coinRoutes;
