import { Router } from "express";
import {
  getByCoinId,
  hasVotedToday,
  voteByCoinId,
} from "../controllers/vote.controller";
import { rateLimiterMiddleware } from "../middlewares/rateLimiter";

const voteRoutes = Router();

voteRoutes.get("/:coin_id", rateLimiterMiddleware, getByCoinId);

voteRoutes.post("/:coin_id", rateLimiterMiddleware, voteByCoinId);

voteRoutes.get("/hasVoted/:coin_id", rateLimiterMiddleware, hasVotedToday);

export default voteRoutes;
