"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/coinViewRoutes.ts
const express_1 = require("express");
const coinView_controller_1 = require("../controllers/coinView.controller");
const coinViewRoutes = (0, express_1.Router)();
coinViewRoutes.post("/:coinId/track-view", coinView_controller_1.trackViewController);
// Route to fetch all coins ordered by total views
coinViewRoutes.get("/coins/sorted-by-views", coinView_controller_1.getAllTrendingCoinsController);
exports.default = coinViewRoutes;
