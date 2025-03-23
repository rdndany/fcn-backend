"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vote_controler_1 = require("../controllers/vote.controler");
const voteRoutes = (0, express_1.Router)();
voteRoutes.get("/:coin_id", vote_controler_1.getByCoinId);
voteRoutes.post("/:coin_id", vote_controler_1.voteByCoinId);
voteRoutes.get("/hasVoted/:coin_id", vote_controler_1.hasVotedToday);
exports.default = voteRoutes;
