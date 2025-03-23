import { Router } from "express";
import {
  getByCoinId,
  hasVotedToday,
  voteByCoinId,
} from "../controllers/vote.controller";

const voteRoutes = Router();

voteRoutes.get("/:coin_id", getByCoinId);

voteRoutes.post("/:coin_id", voteByCoinId);

voteRoutes.get("/hasVoted/:coin_id", hasVotedToday);

export default voteRoutes;
