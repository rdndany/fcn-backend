import { Router } from "express";
import {
  create,
  deleteCoin,
  getAllCoinsController,
  getPromotedCoinsController,
  uploadImage,
} from "../controllers/coin.controller";
import { checkAuth } from "../middlewares/clerkAuth.middleware";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const coinRoutes = Router();

coinRoutes.get("/all", getAllCoinsController);

coinRoutes.get("/promoted", getPromotedCoinsController);

coinRoutes.post("/", checkAuth, create);

coinRoutes.delete("/:coinId", checkAuth, deleteCoin);

coinRoutes.post("/upload-image", upload.single("logo"), uploadImage);

export default coinRoutes;
