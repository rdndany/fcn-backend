"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vote_controller_1 = require("../controllers/vote.controller");
const voteRoutes = (0, express_1.Router)();
voteRoutes.get("/:coin_id", vote_controller_1.getByCoinId);
voteRoutes.post("/:coin_id", vote_controller_1.voteByCoinId);
voteRoutes.get("/hasVoted/:coin_id", vote_controller_1.hasVotedToday);
exports.default = voteRoutes;
