import { Router } from "express";
import {
  voteByCoinId,
  getByCoinId,
  hasVotedToday,
} from "../controllers/vote.controler";

const voteRoutes = Router();

voteRoutes.get("/:coin_id", getByCoinId);

voteRoutes.post("/:coin_id", voteByCoinId);

voteRoutes.get("/hasVoted/:coin_id", hasVotedToday);

export default voteRoutes;
